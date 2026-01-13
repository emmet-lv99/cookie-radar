import * as fs from 'fs';
import { chromium, Browser, Page, Frame } from 'playwright';
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

    const searchIframe = page.frame({ name: 'searchIframe' });
    if (!searchIframe) throw new Error('❌ searchIframe 접근 불가');

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
            
            const menuItems = await entryIframe.$$('.lPzHi'); // 텍스트형 메뉴
            const altMenuItems = await entryIframe.$$('.E2jtL'); // 이미지형 메뉴 텍스트
            
            const allItems = [...menuItems, ...altMenuItems];

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
        const keyword = '강남역 두바이 쫀득 쿠키';
        const searchIframe = await searchTarget(page, keyword);

        const itemSelector = '.UEzoS';
        await searchIframe.waitForSelector(itemSelector, { timeout: 10000 });
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

            // 필터링
            const filterKewords = ['두바이', '두쫀쿠'];
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
        await browser.close();
    }
}

main();