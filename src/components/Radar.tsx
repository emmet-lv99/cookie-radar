import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import storeDataRaw from '../data.json';
import { useCookieCompass } from '../hooks/useCookieCompass';
import { useAppStore } from '../store';
import type { StoreData } from '../types';
import { getBearing, getDistance } from '../utils/geo';

const storeData = storeDataRaw as StoreData[];

export default function RadarView() {
  const { location, heading } = useCookieCompass();
  const { selectedStore, setSelectedStore, setViewMode } = useAppStore();

  const [maxRange, setMaxRange] = useState(1000);
  const mapScale = [1000, 500, 300];

  // 레이더 점 계산
  const visibleDots = location ? storeData.map(store => {
    if (typeof store.lat !== 'number' || typeof store.lng !== 'number') return null;

    const dist = getDistance(
      location.latitude,
      location.longitude,
      store.lat,
      store.lng
    );

    if (dist > maxRange) return null;

    const bearing = getBearing(
      location.latitude,
      location.longitude,
      store.lat,
      store.lng
    );

    const relativeAngle = bearing - heading;
    return { ...store, dist, angle: relativeAngle };
  }).filter(Boolean) as (StoreData & { dist: number; angle: number })[] : [];

  // 햅틱 피드백
  const handleRangeChange = (range: number) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setMaxRange(range);
  };

  return (
    <div className="relative w-full h-full bg-neon overflow-hidden flex items-center justify-center">

      {/* 범위 조절 버튼 */}
      <div className="absolute flex z-50" style={{ top: '100px', gap: '10px' }}>
        {mapScale.map(range => (
          <button
            key={range}
            onClick={() => handleRangeChange(range)}
            className={`relative px-4 py-2 rounded-full text-xs ${
              maxRange === range
                ? 'text-neon'
                : 'text-gray-400'
            }`}
            style={{ background: 'none', border: 'none', fontWeight: 700 }}
          >
            {range >= 1000 ? `${range/1000}km` : `${range}m`}
            {maxRange === range && (
              <motion.div
                layoutId="scale-underline"
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  left: '12.5%',
                  width: '75%',
                  height: '2px',
                  backgroundColor: 'var(--color-black)',
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 동심원 배경 */}
      <div className="absolute rounded-full" style={{ width: '33%', height: '33%', maxWidth: 120, maxHeight: 120, border: '1px dotted #90ac1f' }} />
      <div className="absolute rounded-full" style={{ width: '66%', height: '66%', maxWidth: 240, maxHeight: 240, border: '1px dotted #90ac1f' }} />
      <div className="absolute rounded-full" style={{ width: '100%', height: '100%', maxWidth: 360, maxHeight: 360, border: '1px dotted #90ac1f' }} />

      {/* 십자선 */}
      <div className="absolute w-[300px] h-[1px] bg-gradient-to-r from-transparent via-black/20 to-transparent" />
      <div className="absolute w-[1px] h-[300px] bg-gradient-to-b from-transparent via-black/20 to-transparent" />

      {/* 중심점 (나) */}
      <motion.div
        className="z-30 w-5 h-5 bg-black rounded-full"
        animate={{
          boxShadow: [
            '0 0 10px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)',
            '0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
            '0 0 10px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* 가게들 (쿠키 아이콘) */}
      {visibleDots.map((store, idx) => {
        const radius = (store.dist / maxRange) * 150;
        const rad = (store.angle * Math.PI) / 180;
        const x = radius * Math.sin(rad);
        const y = -radius * Math.cos(rad);

        return (
          <motion.div
            key={store.id || idx}
            className="absolute flex flex-col items-center group cursor-pointer z-20"
            style={{
              left: '50%',
              top: '50%',
              x, y,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
            onClick={() => setSelectedStore(store)}
            whileTap={{ scale: 1.3 }}
          >
            {/* 검정 원 마커 */}
            <div
              style={{
                position: 'relative',
                width: 12,
                height: 12,
                backgroundColor: '#000',
                borderRadius: '50%',
                zIndex: 1,
              }}
            >
              {/* 펄스 효과 */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '80%',
                  height: '80%',
                  backgroundColor: '#000',
                  borderRadius: '50%',
                  x: '-50%',
                  y: '-50%',
                }}
                animate={{
                  scale: [1, 2.2, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: idx * 0.3 % 2,
                }}
              />
            </div>
            {/* 거리 라벨 */}
            <span className="mt-1 text-[10px] text-neon/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded-full border border-neon/30">
              {Math.round(store.dist)}m
            </span>
          </motion.div>
        );
      })}

      {/* 하단 정보 배지 (Glassmorphism) */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2">
        <motion.div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50px',
            padding: '10px 24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <p style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#000' }}>
            {visibleDots.length}
            <span style={{ fontWeight: 400, fontSize: '14px', marginLeft: '6px', color: 'rgba(0,0,0,0.6)' }}>개 감지</span>
          </p>
        </motion.div>

        {!location && (
          <motion.p
            className="text-amber-500 text-xs flex items-center gap-2"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            GPS 신호 수신 중...
          </motion.p>
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedStore && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStore(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 60,
              }}
            />
            {/* 바텀 시트 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 70,
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderBottom: 'none',
                borderRadius: '24px 24px 0 0',
                padding: '20px',
                paddingBottom: '40px',
              }}
            >
              {/* 핸들 바 */}
              <div style={{
                width: 40,
                height: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
                margin: '0 auto 16px',
              }} />

              {/* 매장 정보 */}
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#000' }}>
                {selectedStore.name}
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
                {selectedStore.address}
              </p>

              {/* 메뉴 정보 */}
              {selectedStore.menuInfo && selectedStore.menuInfo.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>메뉴</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedStore.menuInfo.slice(0, 3).map((menu, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 20,
                          color: '#000',
                        }}
                      >
                        {menu}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 길 안내 버튼 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  onClick={() => setViewMode('COMPASS')}
                  style={{
                    flex: 1,
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
                  나침반으로 안내
                </button>
                <button
                  onClick={() => {
                    setViewMode('MAP');
                  }}
                  style={{
                    flex: 1,
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
                  길찾기
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
