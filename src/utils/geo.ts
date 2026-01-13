// 1. 지구 반지름 (km)
const R = 6371e3; // meters

/**
 * 도(degree)를 라디안(radian)으로 변환
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 두 지점 간의 거리 계산 (Haversine Formula) return meters
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 반환
}

/**
 * 두 지점 간의 방위각 계산 (Bearing) return 0~360 
 * (북:0, 동:90, 남:180, 서:270)
 */
export function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
            
  const θ = Math.atan2(y, x);
  
  // rad -> deg 변환 + 360도 정규화
  return (θ * 180 / Math.PI + 360) % 360; 
}
