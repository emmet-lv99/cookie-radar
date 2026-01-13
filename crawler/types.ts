export interface StoreData {
  id: string;          // 고유 ID (네이버 플레이스 ID 등)
  name: string;        // 가게명
  address: string;     // 도로명 주소
  lat?: number;        // 위도 (옵션, 추후 변환)
  lng?: number;        // 경도 (옵션, 추후 변환)
  phone?: string;      // 전화번호
  menuInfo: string[];  // 발견된 관련 메뉴 ("두바이 초코 - 5500원")
  url?: string;        // 네이버 플레이스 링크
  crawledAt: string;   // 수집 일시
}