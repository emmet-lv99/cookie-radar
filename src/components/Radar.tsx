import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCookieCompass } from '../hooks/useCookieCompass';

export default function Radar() {
  // 1. 엔진 시동 걸기
  const {location, heading} = useCookieCompass()
  const [smoothHeading, setSmoothHeading] = useState(0);

  // 2. 디버깅용으로 화면에 찍어보기 (나중에 지움)
  console.log('내 위치', location)
  console.log('나침반 각도', heading) 
  
  useEffect(() => {
  // 현재 보고 있는 방향과 새로운 방향의 차이 계산
  let delta = heading - smoothHeading;
  
  // 차이가 너무 크면(180도 이상), 반대편으로 돌리는 게 더 빠름
  while (delta < -180) delta += 360;
  while (delta > 180) delta -= 360;
  // 부드러운 각도 업데이트
  setSmoothHeading(prev => prev + delta);
}, [heading]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-black text-neon">
      
      {/* 1. 레이더 파동 (Scanner Effect) */}
      <motion.div
        className="absolute w-64 h-64 border-2 rounded-full border-neon/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute w-48 h-48 border rounded-full border-neon/50" />
      <div className="absolute w-32 h-32 border rounded-full border-neon/80" />

      {/* 2. 중앙 화살표 (Compass Arrow) */}
      <motion.div
        className="z-10"
        animate={{ rotate: smoothHeading }} // 45도 회전 테스트
        transition={{ type: "spring", stiffness: 100 }}
      >
        <ArrowUp size={120} strokeWidth={2.5} className="text-neon drop-shadow-[0_0_15px_rgba(204,255,0,0.6)]" />
      </motion.div>

      {/* 3. 거리 정보 (Distance) */}
      <div className="z-10 mt-12 text-center animate-pulse">
        <h2 className="text-4xl font-black font-sans tracking-tighter shadow-neon drop-shadow-md">350m</h2>
        <p className="text-sm font-bold opacity-80 mt-1">레이지레이디케이크</p>
      </div>

    </div>
  );
}