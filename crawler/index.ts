import * as fs from 'fs';
import { chromium, Frame, Page } from 'playwright';
import { StoreData } from './types.ts';

// 1. 브라우저 초기화
async function initBrowser() {
    console.log('🚀 크롤러 시작...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    return { browser, page };
}

// 2. 검색 및 목록 Iframe 획득
async function searchTarget(page: Page, keyword: string) {
    const targetUrl = `https://map.naver.com/p/search/${encodeURIComponent(keyword)}`;
    console.log(`🔍 접속: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    
    // searchIframe 대기
    try {
        await page.waitForFunction(() => !!window.frames['searchIframe' as any], null, { timeout: 10000 });
    } catch (e) {
        throw new Error('❌ searchIframe 로딩 시간 초과');
    }

    // 1. 이름으로 찾기
    let searchIframe = page.frame({ name: 'searchIframe' });

    // 2. 실패 시, URL로 찾기 (최대 10초 대기)
    if (!searchIframe) {
        console.log(`⚠️ 프레임 이름 매칭 실패. URL('restaurant/list') 검색 시도...`);
        for (let i = 0; i < 10; i++) {
            const frames = page.frames();
            searchIframe = frames.find(f => f.url().includes('restaurant/list')) || null;
            
            if (searchIframe) {
                console.log(`✅ URL로 searchIframe 발견! (시도: ${i + 1})`);
                break;
            }
            
            console.log(`   ⏳ 프레임 로딩 대기 중... (${i + 1}/10)`);
            await page.waitForTimeout(1000);
        }
    }

    if (!searchIframe) {
        // 디버깅용 로그
        console.log('   [Debug] 현재 로드된 프레임 URL들:');
        page.frames().forEach(f => console.log('   - ', f.url().slice(0, 50) + '...'));
        throw new Error('❌ searchIframe 접근 불가');
    }

    return searchIframe;
}

// 3. 상세 페이지 Iframe 획득 (대기 로직 포함)
async function waitForEntryIframe(page: Page) {
    await page.waitForTimeout(2000); // 1차 대기
    try {
        await page.waitForFunction(() => !!window.frames['entryIframe' as any], null, { timeout: 5000 });
        return page.frame({ name: 'entryIframe' });
    } catch (e) {
        return null; // 타임아웃 시 null 반환 (광고 등)
    }
}

// 4. 기본 정보 파싱 (이름, 주소)
async function parseStoreInfo(entryIframe: Frame) {
    const titleSelector = '.GHAhO';
    await entryIframe.waitForSelector(titleSelector, { timeout: 3000 }).catch(()=>null);
    const title = await entryIframe.$eval(titleSelector, el => el.textContent).catch(() => null);

    const addressSelector = '.LDgIH';
    const address = await entryIframe.$eval(addressSelector, el => el.textContent).catch(() => '');

    return { title, address };
}

// 5. 메뉴 파싱 (탭 클릭 -> 리스트 추출 -> 정규화 + 가격)
async function parseMenu(entryIframe: Frame, page: Page) {
    let menuList: string[] = [];
    try {
        const tabs = await entryIframe.$$('a[role="tab"]');
        let menuTab = null;
        
        for (const tab of tabs) {
            const text = await tab.textContent();
            if (text?.includes('메뉴')) {
                menuTab = tab;
                break;
            }
        }

        if (menuTab) {
            await menuTab.click();
            await page.waitForTimeout(1000); 
            
            // 1) 구형 리스트 (.O8qbU > .lPzHi + .GXS1X)
            const oldItems = await entryIframe.$$('.O8qbU li, .mnower li');
            
            // 2) 신형 리스트 (MenuContent__item 등)
            // 보통 a 태그나 li 태그로 감싸져 있음. 이름 클래스: MenuContent__tit, 가격: MenuContent__price
            // 구체적인 상위 컨테이너를 잡기 어려우므로, 이름 요소를 기준으로 부모를 탐색하거나 형제를 찾음
            const newNameEls = await entryIframe.$$('[class*="MenuContent__tit"]');

            // --- 1. 구형 파싱 ---
            for (const item of oldItems) {
                try {
                    const nameEl = await item.$('.lPzHi');
                    const priceEl = await item.$('.GXS1X');
                    if (nameEl) {
                        let name = await nameEl.textContent();
                        let price = priceEl ? await priceEl.textContent() : '';
                        if (name) {
                            name = name.replace(/\s+/g, ''); // 공백 제거
                            const fullText = price ? `${name}(${price})` : name;
                            menuList.push(fullText);
                        }
                    }
                } catch(e) {}
            }

            // --- 2. 신형 파싱 ---
            // (구형에서 못 잡았을 경우를 대비해 추가 수집)
            if (menuList.length === 0 && newNameEls.length > 0) {
                 for (const nameEl of newNameEls) {
                    try {
                        const name = await nameEl.textContent();
                        // 형제나 부모를 통해 가격 찾기 (구조가 복잡하여 textContent로 대략 유추하거나)
                        // 보통 MenuContent__price 클래스가 있음
                        // Playwright의 locator evaluation 활용
                        const price = await nameEl.evaluate(el => {
                            // 부모 위주로 타고 올라가서 price 클래스 찾기
                            const container = el.closest('li') || el.closest('div'); // 적당한 컨테이너
                            const priceNode = container?.querySelector('[class*="MenuContent__price"]');
                            return priceNode ? priceNode.textContent : '';
                        });

                        if (name) {
                            const cleanName = name.replace(/\s+/g, '');
                            const fullText = price ? `${cleanName}(${price})` : cleanName;
                            menuList.push(fullText);
                        }
                    } catch(e) {}
                }
            }

            // --- 3. 텍스트형 메뉴 (.E2jtL - 이것도 구형의 일종) ---
            if (menuList.length === 0) {
                const altItems = await entryIframe.$$('.E2jtL');
                for (const item of altItems) {
                    const name = await item.textContent();
                    if(name) menuList.push(name.replace(/\s+/g, ''));
                }
            }
        }
    } catch (err) {
        // 메뉴 없으면 패스
    }
    // 중복 제거
    return [...new Set(menuList)];
}

// 6. 메인 실행 함수
async function main() {
    const { browser, page } = await initBrowser();
    // 대한민국 전국일주 리스트 (구/동 단위 핫플 + 전국 시/군 커버리지 Hybrid)
    const regions = [
        // 1. 서울특별시 (구 단위 + 핵심 동 단위)
        '강남구', '강남구 신사동', '강남구 압구정동', '강남구 청담동', '강남구 역삼동', '강남구 대치동', '강남구 논현동', '강남구 삼성동',
        '마포구', '마포구 서교동', '마포구 동교동', '마포구 연남동', '마포구 망원동', '마포구 합정동', '마포구 상수동', '마포구 상암동',
        '서초구', '서초구 반포동', '서초구 방배동', '서초구 양재동',
        '용산구', '용산구 이태원동', '용산구 한남동', '용산구 용산동', '용산구 이촌동',
        '성동구', '성동구 성수동', '성동구 옥수동',
        '송파구', '송파구 잠실동', '송파구 송파동', '송파구 문정동',
        '종로구', '종로구 삼청동', '종로구 익선동', '종로구 혜화동',
        '중구', '중구 명동', '중구 을지로', '중구 신당동',
        '서대문구', '서대문구 신촌동', '서대문구 연희동',
        '영등포구', '영등포구 여의도동', '영등포구 문래동',
        '관악구', '동작구', '광진구', '성북구', '강북구', '도봉구', '노원구', '은평구', '양천구', '강서구', '구로구', '금천구', '강동구', '중랑구', '동대문구',

        // 2. 경기도 (시 단위 + 성남/수원/고양 등 주요 도시 상세)
        '성남시 분당구', '성남시 분당구 정자동', '성남시 분당구 판교동', '성남시 수정구', '성남시 중원구',
        '수원시', '수원시 팔달구 행궁동', '수원시 영통구', '수원시 장안구', '수원시 권선구',
        '고양시', '고양시 일산동구', '고양시 일산서구', '고양시 덕양구',
        '용인시', '용인시 수지구', '용인시 기흥구', '용인시 처인구',
        '부천시', '안양시', '안산시', '화성시', '동탄', '평택시', '시흥시', '파주시', '김포시', '광명시', '광주시', '하남시', '구리시', '남양주시', '의정부시', 
        '오산시', '군포시', '의왕시', '이천시', '안성시', '포천시', '양주시', '여주시', '동두천시', '과천시', '가평군', '양평군', '연천군',

        // 3. 인천광역시
        '인천 부평구', '인천 남동구 구월동', '인천 연수구 송도동', '인천 서구 청라동', '인천 중구', '인천 미추홀구', '인천 계양구', '인천 동구', '강화군', '옹진군',

        // 4. 부산광역시
        '부산 부산진구 서면', '부산 부산진구 전포동',
        '부산 해운대구', '부산 해운대구 우동', '부산 수영구 광안동', 
        '부산 중구', '부산 서구', '부산 동구', '부산 영도구', '부산 동래구', '부산 남구', '부산 북구', '부산 사하구', '부산 금정구', '부산 강서구', '부산 연제구', '부산 사상구', '기장군',

        // 5. 대구광역시
        '대구 중구 동성로', '대구 수성구', '대구 남구', '대구 서구', '대구 동구', '대구 북구', '대구 달서구', '대구 달성군',

        // 6. 대전광역시
        '대전 서구 둔산동', '대전 유성구', '대전 중구', '대전 동구', '대전 대덕구',

        // 7. 광주광역시
        '광주 동구', '광주 서구', '광주 남구', '광주 북구', '광주 광산구',

        // 8. 울산광역시
        '울산 남구', '울산 중구', '울산 동구', '울산 북구', '울주군',

        // 9. 세종특별자치시
        '세종시',

        // 10. 강원도
        '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군',

        // 11. 충청북도
        '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군',

        // 12. 충청남도
        '천안시', '천안시 서북구 불당동', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군',

        // 13. 전라북도 (전북특별자치도)
        '전주시', '전주시 완산구', '전주시 덕진구', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군',

        // 14. 전라남도
        '목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군',

        // 15. 경상북도
        '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군',

        // 16. 경상남도
        '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군',

        // 17. 제주특별자치도
        '제주시', '제주시 애월읍', '서귀포시'
    ];
    
    // 중복 제거를 위한 Map (이름 -> 데이터)
    const uniqueResults = new Map<string, StoreData>();

    try {
        for (const region of regions) {
            const keyword = `${region} 카페`;
            console.log(`\n🌆 지역 검색 시작: ${keyword}`);
            
            try {
                // 1. 검색
                const searchIframe = await searchTarget(page, keyword);
                if (!searchIframe) continue; 

                // 페이지 루프 (최대 3페이지)
                let pageNum = 1;
                while (pageNum <= 3) {
                    console.log(`   📄 [Page ${pageNum}] 탐색 중...`);

                    const itemSelector = '.UEzoS';
                    try {
                        await searchIframe.waitForSelector(itemSelector, { timeout: 5000 });
                    } catch (e) {
                         console.log(`   ⚠️ 결과 없음 (또는 로딩 실패)`);
                         break;
                    }
                    
                    const items = await searchIframe.$$(itemSelector);
                    console.log(`      📦 ${items.length}개 후보 발견`);

                    // 리스트 순회
                    for (let i = 0; i < items.length; i++) {
                        // Stale Element 방지
                        const currentItems = await searchIframe.$$(itemSelector);
                        const item = currentItems[i];
                        if(!item) continue;
                        
                        const nameBox = await item.$('.place_bluelink');
                        if (nameBox) await nameBox.click();
                        else await item.click();
                        
                        await page.waitForTimeout(1500); // 딜레이

                        const entryIframe = await waitForEntryIframe(page);
                        if (!entryIframe) continue;

                        const { title, address } = await parseStoreInfo(entryIframe);
                        if (!title) continue;

                        // 🚫 프랜차이즈 제외 필터 (속도 및 퀄리티 향상)
                        const excludeKeywords = [
                            '스타벅스', '투썸', '이디야', '메가커피', '컴포즈', '할리스', 
                            '빽다방', '커피빈', '매머드', '파리바게뜨', '뚜레쥬르', '폴바셋',
                            '공차', '엔제리너스', '탐앤탐스', '파스쿠찌', '더벤티', '크리스피크림',
                            '베스킨', '배스킨', '마호가니', '롯데리아', '맥도날드', '텐퍼센트', '하삼동', '블루샥',
                            '하이오', '바나프레소', '카페베네', '드롭탑', '달콤커피', '커피베이', '커피스미스', '커피명가',
                            '만랩', '셀렉토', '토프레소', '요거프레소', '더리터', '카페051', '카페게이트', '매스커피',
                            '감성커피', '읍천리'
                        ];

                        if (excludeKeywords.some(k => title.includes(k))) {
                            // console.log(`      🚫 [Skip] ${title} (프랜차이즈)`);
                            continue;
                        }

                        // 중복이면 패스 (시간 절약)
                        if (uniqueResults.has(title)) {
                            // console.log(`      💧 [Skip] ${title}`);
                            continue;
                        }

                        const menuList = await parseMenu(entryIframe, page);
                        const filterKewords = ['두바이쫀득쿠키', '두쫀쿠', '두바이'];
                        const hasKeyword = menuList.some(menu => filterKewords.some(k => menu.includes(k)));

                        if(hasKeyword) {
                            uniqueResults.set(title, {
                                id: `store_${Date.now()}_${i}`,
                                name: title,
                                address: address || '',
                                menuInfo: menuList,
                                crawledAt: new Date().toISOString()
                            });
                            console.log(`      ✨ [Get] ${title} 본거지 발견!`);
                        }
                    }

                    // 다음 페이지 버튼 찾기 및 클릭
                    // 네이버 지도 페이지네이션 버튼 Selector (가변적일 수 있음, 보통 .eUTV2 또는 role="button" 등)
                    // 현재 구조: 하단에 1, 2, 3... 번호와 '다음' 화살표가 있음.
                    // '다음' 버튼은 보통 svg 아이콘이거나 '다음페이지' 텍스트를 가진 버튼
                    const nextBtn = await searchIframe.$('a:has-text("다음페이지")'); // 접근성 텍스트 활용 시도
                    // 또는 화살표 아이콘 클래스: .eUTV2 (오른쪽 화살표) - 상황에 따라 다름.
                    // 간단히: 현재 페이지 번호 + 1 인 <a> 태그를 찾아서 클릭하는 방식이 안정적
                    
                    const nextPageLink = await searchIframe.$(`a.mBN2s:text-is("${pageNum + 1}")`); // 페이지 번호 직접 클릭
                    
                    if (nextPageLink) {
                        console.log(`   ➡️ ${pageNum + 1}페이지로 이동`);
                        await nextPageLink.click();
                        await page.waitForTimeout(3000); // 페이지 로딩 대기
                        pageNum++;
                    } else {
                        // 더 이상 다음 페이지가 없으면
                        break;
                    }
                }

                console.log(`   ✅ ${region} 검색 완료`);
                
            } catch (err) {
                console.error(`   ❌ ${region} 에러:`, err);
            }
        }

        // Map -> Array 변환
        const finalResults = Array.from(uniqueResults.values());
        
        // 파일 저장 (src/data.json 으로 바로 저장!)
        const outputPath = 'src/data.json'; 
        fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
        console.log(`\n💾 최종 저장 완료: 총 ${finalResults.length}개 업체 (${outputPath})`);

    } catch (e) {
        console.error('❌ 치명적 에러:', e);
    } finally {
        await browser.close();
    }
}

main();