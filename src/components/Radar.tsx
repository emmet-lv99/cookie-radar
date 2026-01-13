import { useRef, useState } from 'react';
import storeDataRaw from '../data.json';
import { useCookieCompass } from '../hooks/useCookieCompass';
import { useAppStore } from '../store';
import type { StoreData } from '../types';
import { getBearing, getDistance } from '../utils/geo';
const storeData = storeDataRaw as StoreData[];

export default function RadarView() {
  const { location, heading } = useCookieCompass();
  const { setSelectedStore } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 탐지 범위 상태 (기본 1000m)
  const [maxRange, setMaxRange] = useState(1000);
  const mapScale = [300, 500, 1000];

  // 레이더 점 계산
  const visibleDots = location ? storeData.map(store => {
    // 좌표가 없으면 제외 (지오코딩 전 데이터 방어)
    if (typeof store.lat !== 'number' || typeof store.lng !== 'number') return null;

    const dist = getDistance(
      location.latitude,
      location.longitude,
      store.lat,
      store.lng
    );

    if (dist > maxRange) return null; // 범위 밖 제외

    const bearing = getBearing(
      location.latitude,
      location.longitude,
      store.lat,
      store.lng
    );

    const relativeAngle = bearing - heading;

    return { ...store, dist, angle: relativeAngle };
  }).filter(Boolean) as any[] : [];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center" ref={containerRef}>
      {/* 4. 범위 조절 버튼 (Range Selector) - 인라인 스타일로 위치 강제 */}
      <div className="absolute flex gap-2 z-50" style={{ top: '120px' }}>
        {mapScale.map(range => (
          <button
            key={range}
            onClick={() => setMaxRange(range)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
              maxRange === range 
                ? 'bg-neon text-black border-neon' 
                : 'bg-black/50 text-gray-400 border-gray-600 hover:border-gray-400'
            }`}
          >
            {range >= 1000 ? `${range/1000}km` : `${range}m`}
          </button>
        ))}
      </div>
      {/* 1. 레이더 배경 (동심원) */}
      <div className="absolute w-[300px] h-[300px] border border-neon/20 rounded-full animate-pulse" />
      <div className="absolute w-[600px] h-[600px] border border-neon/10 rounded-full" />
      
      {/* 2. 나 (중심) */}
      <div className="z-10 w-4 h-4 bg-neon rounded-full shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
      <div className="absolute w-0 h-10 bg-gradient-to-t from-neon/50 to-transparent -translate-y-5" /> 

      {/* 3. 가게들 (Dots) */}
      {visibleDots.map((store) => {
        // 화면 반지름 (레이더 크기 300px 기준, 반지름 150px)
        const radius = (store.dist / maxRange) * 150; 
        const rad = (store.angle * Math.PI) / 180;
        const x = radius * Math.sin(rad);
        const y = -radius * Math.cos(rad);

        return (
          <div
            key={store.id}
            className="absolute flex flex-col items-center group cursor-pointer left-1/2 top-1/2 z-20"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' // 범위 변경 시 부드럽게 이동
            }}
            onClick={() => setSelectedStore(store)}
          >
            {/* 점 (Dot) - 16px로 조정 */}
            <div 
              style={{ width: '16px', height: '16px' }} 
              className="bg-black border-2 border-white rounded-full shadow-lg group-hover:scale-125 transition-transform" 
            />
            <span className="mt-1 text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1 rounded">
              {Math.round(store.dist)}m
            </span>
          </div>
        );
      })}

 

      {/* 정보 표시 */}
      <div className='absolute bottom-10 text-center'>
         <p className='text-gray-500 text-xs'>탐지된 쿠키: {visibleDots.length}개</p>
         {!location && <p className='text-red-500 text-xs animate-pulse'>GPS 신호 수신 중...</p>}
      </div>

    </div>
  )
}