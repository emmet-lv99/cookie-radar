import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCookieCompass } from '../hooks/useCookieCompass';
import { useAppStore } from '../store';
import { getBearing, getDistance } from '../utils/geo';

export default function CompassView() {
  const { heading, location } = useCookieCompass();
  const { selectedStore } = useAppStore();
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
      
      {/* 거리 표시 (타겟 없으면 안내 문구) */}
      <h1 className="text-6xl font-black mb-10 tracking-tighter" style={{ textShadow: '0 0 20px rgba(204,255,0,0.5)' }}>
        {targetInfo ? `${targetInfo.distance}m` : 'Compass'}
      </h1>

      {/* 나침반 메인 */}
      <div className="relative mb-20">
        {/* 외부 링 1 */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-40px] border border-neon/30 rounded-full border-dashed"
        />
        {/* 외부 링 2 (반대 회전) */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-80px] border border-neon/10 rounded-full"
        />

        {/* 화살표 (스무딩 적용된 각도로 회전) */}
         <motion.div 
          animate={{ rotate: smoothHeading }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }} // 부드러운 스프링 효과
        >
          <ArrowUp size={120} strokeWidth={3} className="drop-shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
        </motion.div>
      </div>

      {/* 가게 이름 표시 */}
      <div className="text-center space-y-2">
        <p className="text-neon/70 text-sm tracking-widest">{targetInfo ? 'TARGET LOCKED' : 'NO TARGET'}</p>
        <h2 className="text-2xl font-bold">
          {selectedStore ? selectedStore.name : '목적지를 선택하세요'}
        </h2>
      </div>

    </div>
  )
}