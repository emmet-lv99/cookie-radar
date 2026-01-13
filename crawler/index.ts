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

// 5. 메뉴 파싱 (탭 클릭 -> 리스트 추출 -> 정규화)
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
            // console.log('   🍽️ 메뉴 탭 진입');
            await menuTab.click();
            await page.waitForTimeout(1500); 
            
            const menuItems = await entryIframe.$$('.lPzHi'); // 구형 텍스트형
            const altMenuItems = await entryIframe.$$('.E2jtL'); // 구형 이미지형
            const newMenuItems = await entryIframe.$$('[class*="MenuContent__tit"]'); // 신형 (React 클래스 등)
            
            const allItems = [...menuItems, ...altMenuItems, ...newMenuItems];

            for (const mItem of allItems) {
                // .lPzHi를 직접 갖고 있거나, 자식으로 가질 수 있음
                const mName = await mItem.textContent(); 
                if(mName) {
                    menuList.push(mName.replace(/\s+/g, '')); // 공백 제거
                }
            }
        }
    } catch (err) {
        // 메뉴 없으면 패스
    }
    return menuList;
}

// 6. 메인 실행 함수
async function main() {
    const { browser, page } = await initBrowser();
    const results: StoreData[] = [];

    try {
        const keyword = '영등포 카페';
        const searchIframe = await searchTarget(page, keyword);

        const itemSelector = '.UEzoS';
        try {
            await searchIframe.waitForSelector(itemSelector, { timeout: 5000 });
        } catch (e) {
            console.log('⚠️ 검색 결과 목록(.UEzoS)을 찾을 수 없습니다. (결과 없음 또는 선택자 변경)');
            return;
        }
        const items = await searchIframe.$$(itemSelector);
        
        console.log(`📦 목록 개수: ${items.length}개`);

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            console.log(`\n--- [${i+1}]번째 탐색 ---`);
            
            // Stale Element 방지 (다시 찾기)
            const currentItems = await searchIframe.$$(itemSelector);
            const item = currentItems[i];
            const nameBox = await item.$('.place_bluelink');
            
            if (nameBox) await nameBox.click();
            else await item.click();

            // 상세 페이지 진입
            const entryIframe = await waitForEntryIframe(page);
            if (!entryIframe) {
                console.log('   💨 [Pass] 상세 페이지 진입 실패 (광고/로딩)');
                continue;
            }

            // 정보 수집
            const { title, address } = await parseStoreInfo(entryIframe);
            if (!title) continue;

            console.log(`   🏠 ${title}`);
            
            // 메뉴 수집
            const menuList = await parseMenu(entryIframe, page);
            console.log(`      (수집된 메뉴: ${menuList.slice(0, 5).join(', ')}${menuList.length > 5 ? '...' : ''})`);

            // 필터링
            const filterKewords = ['두바이쫀득쿠키', '두쫀쿠'];
            const hasKeyword = menuList.some(menu => filterKewords.some(k => menu.includes(k)));

            if(hasKeyword) {
                console.log(`   ✨ [적합] 키워드 발견! 저장합니다.`);
                results.push({
                    id: `store_${i}_${Date.now()}`,
                    name: title,
                    address: address || '',
                    menuInfo: menuList,
                    crawledAt: new Date().toISOString()
                });
            } else {
                console.log(`   💨 [Pass] 키워드 불일치`);
            }
        }

        fs.writeFileSync('crawler/data_sample.json', JSON.stringify(results, null, 2));
        console.log(`\n💾 총 ${results.length}개 저장 완료`);

    } catch (e) {
        console.error('❌ 에러:', e);
    } finally {
        // 디버깅을 위해 브라우저 종료 안 함
        await browser.close();
    }
}

main();