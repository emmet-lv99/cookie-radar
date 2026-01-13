
import { useRef } from 'react';
import storeData from '../data.json';
import { useCookieCompass } from '../hooks/useCookieCompass';
import { getBearing, getDistance } from '../utils/geo';

export default function RadarView() {
  const { location, heading } = useCookieCompass();
  const containerRef = useRef<HTMLDivElement>(null);

  // 최대 탐지 거리 (5km - 테스트용 확장)
  const MAX_RANGE = 5000; 

  // 레이더 점 계산
  const visibleDots = location ? storeData.map(store => {
    // 1. 거리 계산
    const dist = getDistance(
      location.latitude,
      location.longitude,
      store.lat!,
      store.lng!
    );

    // 2. 사거리를 벗어나면 null
    if (dist > MAX_RANGE) return null;

    // 3. 방위각 계산 (북쪽 기준 0~360)
    const bearing = getBearing(
      location.latitude,
      location.longitude,
      store.lat!,
      store.lng!
    );

    // 4. 상대 각도 (가게 방위 - 내 폰 방향)
    // 폰을 오른쪽(90도)으로 돌리면, 가게는 상대적으로 왼쪽(-90도)으로 이동해야 함
    const relativeAngle = bearing - heading;

    return { ...store, dist, angle: relativeAngle };
  }).filter(Boolean) as any[] : []; // null 제거

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center" ref={containerRef}>
      
      {/* 1. 레이더 배경 (동심원) */}
      <div className="absolute w-[300px] h-[300px] border border-neon/20 rounded-full animate-pulse" />
      <div className="absolute w-[600px] h-[600px] border border-neon/10 rounded-full" />
      
      {/* 2. 나 (중심) */}
      <div className="z-10 w-4 h-4 bg-neon rounded-full shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
      <div className="absolute w-0 h-10 bg-gradient-to-t from-neon/50 to-transparent -translate-y-5" /> {/* 시야 방향 */}

      {/* 3. 가게들 (Dots) */}
      {visibleDots.map((store) => {
        // 화면 반지름 (반응형 대응을 위해 vmin 등 사용하거나 고정값 사용)
        // 여기서는 간단히 150px = 1km로 매핑해봅니다. (화면 크기에 따라 조절 필요)
        const radius = (store.dist / MAX_RANGE) * 160; // 1km면 중심에서 160px 떨어짐
        
        // 각도를 라디안으로 변환
        const rad = (store.angle * Math.PI) / 180;
        
        // 삼각함수로 x, y 좌표 구하기 (12시 방향이 0도)
        const x = radius * Math.sin(rad);
        const y = -radius * Math.cos(rad);

        // 디버깅: 좌표가 잘 나오는지 확인
        console.log(`🎯 ${store.name}: 거리=${Math.round(store.dist)}m, 좌표=(${Math.round(x)}, ${Math.round(y)})`);

        return (
          <div
            key={store.id}
            className="absolute flex flex-col items-center group cursor-pointer left-1/2 top-1/2 z-20"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' // 부드러운 움직임
            }}
            onClick={() => alert(`${store.name} (${Math.round(store.dist)}m)`)}
          >
            {/* 점 (Dot) - 매우 크게! */}
            <div className="w-8 h-8 bg-black border-2 border-white rounded-full shadow-lg group-hover:scale-110 transition-transform" />
            
            {/* 라벨 (평소엔 숨김, 가까우면 보임?) */}
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