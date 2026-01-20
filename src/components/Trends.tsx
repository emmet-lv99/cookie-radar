import { useMemo } from 'react';
import storeDataRaw from '../data.json';
import type { StoreData } from '../types';

const storeData = storeDataRaw as StoreData[];

// 주소에서 대분류 지역 추출 (서울, 경기, 인천 등)
function getRegion(address: string): string {
  if (address.startsWith('서울')) return '서울';
  if (address.startsWith('경기')) return '경기';
  if (address.startsWith('인천')) return '인천';
  if (address.startsWith('부산')) return '부산';
  if (address.startsWith('대구')) return '대구';
  if (address.startsWith('대전')) return '대전';
  if (address.startsWith('광주')) return '광주';
  if (address.startsWith('울산')) return '울산';
  if (address.startsWith('세종')) return '세종';
  if (address.startsWith('강원')) return '강원';
  if (address.startsWith('충북') || address.startsWith('충청북')) return '충북';
  if (address.startsWith('충남') || address.startsWith('충청남')) return '충남';
  if (address.startsWith('전북') || address.startsWith('전라북')) return '전북';
  if (address.startsWith('전남') || address.startsWith('전라남')) return '전남';
  if (address.startsWith('경북') || address.startsWith('경상북')) return '경북';
  if (address.startsWith('경남') || address.startsWith('경상남')) return '경남';
  if (address.startsWith('제주')) return '제주';
  return '기타';
}

// 메뉴에서 두바이쫀득쿠키 가격 추출
function extractPrice(menuInfo: string[]): number | null {
  for (const menu of menuInfo) {
    if (menu.includes('두바이') && menu.includes('쿠키')) {
      const match = menu.match(/(\d{1,2},?\d{3})원/);
      if (match) {
        return parseInt(match[1].replace(',', ''), 10);
      }
    }
  }
  return null;
}

export default function TrendsView() {
  // 지역별 평균 가격 계산
  const regionData = useMemo(() => {
    const regionPrices: Record<string, number[]> = {};

    storeData.forEach(store => {
      if (!store.address || !store.menuInfo) return;
      const region = getRegion(store.address);
      const price = extractPrice(store.menuInfo);
      if (price) {
        if (!regionPrices[region]) regionPrices[region] = [];
        regionPrices[region].push(price);
      }
    });

    // 평균 계산 및 정렬
    const result = Object.entries(regionPrices)
      .map(([region, prices]) => ({
        region,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        count: prices.length,
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);

    return result;
  }, []);

  const maxPrice = Math.max(...regionData.map(d => d.avgPrice), 10000);

  return (
    <div className="relative w-full h-full bg-neon overflow-hidden flex flex-col">
      {/* 상단 헤더 */}
      <div style={{ padding: '100px 20px 20px' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 24,
            padding: 20,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#000' }}>
            지역별 평균 가격
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>
            두바이 쫀득 쿠키 기준
          </p>
        </div>
      </div>

      {/* 그래프 영역 */}
      <div
        style={{
          flex: 1,
          margin: '0 20px 40px',
          background: 'rgba(0, 0, 0, 0.9)',
          borderRadius: 24,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Y축 레이블 + 바 차트 */}
        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
          {/* Y축 레이블 */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 30 }}>
            {[maxPrice, Math.round(maxPrice * 0.75), Math.round(maxPrice * 0.5), Math.round(maxPrice * 0.25), 0].map((val, i) => (
              <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right', minWidth: 35 }}>
                {(val / 1000).toFixed(0)}k
              </span>
            ))}
          </div>

          {/* 바 차트 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 8, paddingBottom: 30, position: 'relative' }}>
            {/* 가로 그리드 라인 */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `calc(${percent}% + 30px)`,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              />
            ))}

            {regionData.map((data, idx) => {
              const heightPercent = (data.avgPrice / maxPrice) * 100;
              return (
                <div
                  key={data.region}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    maxWidth: 40,
                  }}
                >
                  {/* 바 */}
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      minHeight: 4,
                      background: 'linear-gradient(180deg, #CCFF00 0%, #90ac1f 100%)',
                      borderRadius: 20,
                      position: 'relative',
                    }}
                  >
                    {/* 가격 툴팁 */}
                    <span
                      style={{
                        position: 'absolute',
                        top: -20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 9,
                        color: '#CCFF00',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {data.avgPrice.toLocaleString()}
                    </span>
                  </div>
                  {/* X축 레이블 */}
                  <span
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.6)',
                      position: 'absolute',
                      bottom: 8,
                    }}
                  >
                    {data.region}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
