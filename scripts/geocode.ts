import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { StoreData } from '../crawler/types';
// ESM 환경에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
dotenv.config();

const KAKAO_API_KEY = process.env.VITE_KAKAO_API_KEY; // .env 파일 확인 필수!
const DATA_FILE_PATH = path.join(__dirname, '../src/data.json'); // 읽을 파일 (크롤러 출력과 동일)
const OUTPUT_FILE_PATH = path.join(__dirname, '../src/data.json'); // 최종 저장 경로

async function main() {
  if (!KAKAO_API_KEY) {
    console.error('❌ .env 파일에 VITE_KAKAO_API_KEY가 없습니다.');
    process.exit(1);
  }

  // 1. 데이터 읽기
  console.log('📖 데이터 파일 로딩 중...');
  const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  const stores: StoreData[] = JSON.parse(rawData);

  console.log(`📦 총 ${stores.length}개의 가게 처리 시작...`);
  const resultStores: StoreData[] = [];

  // 2. 루프 돌면서 API 호출
  for (const store of stores) {
    // 이미 좌표가 있으면 패스
    if (store.lat && store.lng) {
        resultStores.push(store);
        continue;
    }

    try {
        console.log(`📍 변환 중: ${store.name} (${store.address})`);
        
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
            params: { query: store.address }
        });

        const documents = response.data.documents;
        if (documents.length > 0) {
            const { x, y } = documents[0]; // x: 경도(lng), y: 위도(lat)
            store.lat = parseFloat(y);
            store.lng = parseFloat(x);
            console.log(`   ✅ 성공! (${store.lat}, ${store.lng})`);
        } else {
            console.log('   ⚠️ 검색 결과 없음');
        }
    } catch (e) {
        console.error('   ❌ API 에러:', e);
    }
    
    resultStores.push(store);
    
    // API 과부하 방지용 딜레이
    await new Promise(r => setTimeout(r, 100)); 
  }

  // 3. 저장
  // src/data.json 에 저장해야 리액트에서 import해서 쓸 수 있음
  const outputDir = path.dirname(OUTPUT_FILE_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(resultStores, null, 2));
  console.log(`\n🎉 변환 완료! 저장 경로: ${OUTPUT_FILE_PATH}`);
}

main();