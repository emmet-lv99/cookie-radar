import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCookieCompass } from '../hooks/useCookieCompass';
import { useAppStore } from '../store';
import { getBearing, getDistance } from '../utils/geo';

export default function CompassView() {
  const { heading, location } = useCookieCompass();
  const { selectedStore, setViewMode } = useAppStore();
  const [smoothHeading, setSmoothHeading] = useState(0);

  // 타겟 정보 계산
  const targetInfo = (location && selectedStore && selectedStore.lat && selectedStore.lng) ? {
    distance: Math.round(getDistance(location.latitude, location.longitude, selectedStore.lat, selectedStore.lng)),
    bearing: getBearing(location.latitude, location.longitude, selectedStore.lat, selectedStore.lng)
  } : null;

  // 나침반 회전 스무딩 & 타겟 지향 로직
  useEffect(() => {
    if (heading === null) return;
    
    // 타겟이 있으면: (타겟 방향 - 내 헤딩) 만큼 돌려서 화살표가 타겟을 가리키게 함
    // 타겟이 없으면: 그냥 북쪽(0) 기준으로 내 헤딩 반대 방향으로 돌려서 북쪽을 가리키게 함 (N극)
    let targetAngle;
    
    if (targetInfo) {
       // 목표 지점이 12시 방향(0도)에 오도록 회전
       targetAngle = targetInfo.bearing - heading;
    } else {
       // 기본 모드: 북쪽(N)을 가리킴
       targetAngle = -heading;
    }

    // 360도 경계 처리 (스무딩)
    let diff = targetAngle - smoothHeading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    
    setSmoothHeading(prev => prev + diff);

  }, [heading, targetInfo?.bearing]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-neon">
      
      {/* 거리 표시 */}
      {targetInfo && (
        <h1 className="text-6xl font-black mb-10 tracking-tighter" style={{ textShadow: '0 0 20px rgba(204,255,0,0.5)' }}>
          {targetInfo.distance}m
        </h1>
      )}

      {/* 나침반 메인 */}
      <div className="relative flex items-center justify-center" style={{ width: '100%', height: '100%', maxWidth: 360, maxHeight: 360 }}>
        {/* 동심원 배경 */}
        <div className="absolute rounded-full" style={{ width: '33%', height: '33%', maxWidth: 120, maxHeight: 120, border: '1px dotted #90ac1f' }} />
        <div className="absolute rounded-full" style={{ width: '66%', height: '66%', maxWidth: 240, maxHeight: 240, border: '1px dotted #90ac1f' }} />
        <div className="absolute rounded-full" style={{ width: '100%', height: '100%', maxWidth: 360, maxHeight: 360, border: '1px dotted #90ac1f' }} />

        {/* 화살표 (스무딩 적용된 각도로 회전) */}
        <motion.div
          animate={{ rotate: smoothHeading }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <ArrowUp size={120} strokeWidth={3} className="drop-shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
        </motion.div>
      </div>

      {/* 하단 정보 박스 (Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          padding: 20,
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        {selectedStore ? (
          <>
            {/* 목적지 있음 */}
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#000' }}>
              {selectedStore.name}
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
              남은 거리: {targetInfo ? `${targetInfo.distance}m` : '계산 중...'}
            </p>
            <button
              onClick={() => setViewMode('RADAR')}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                color: '#000',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              목적지 변경
            </button>
          </>
        ) : (
          <>
            {/* 목적지 없음 */}
            <p style={{ margin: 0, fontSize: 16, color: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
              목적지가 없습니다.
            </p>
            <button
              onClick={() => setViewMode('RADAR')}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '14px',
                backgroundColor: '#000',
                color: '#CCFF00',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              목적지 선택
            </button>
          </>
        )}
      </div>

    </div>
  )
}