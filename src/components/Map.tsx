import { Map, MapMarker } from "react-kakao-maps-sdk";
import storeData from "../data.json";
import { useAppStore } from "../store";

export default function KakaoMap() {
    const { setSelectedStore } = useAppStore();

    return (
     <Map
        center={{ lat: 37.498095, lng: 127.027610 }} // 강남역 초기 좌표
        style={{ width: '100%', height: '100%' }}
        level={3} // 확대 레벨 (작을수록 확대)
      >
        {/* 데이터 순회하며 마커 찍기 */}
        {storeData.map((store) => (
          <MapMarker
            key={store.id}
            position={{ lat: store.lat!, lng: store.lng! }} // lat/lng이 있다고 확신(!)
            title={store.name} // 마우스 올리면 이름 뜸
            onClick={() => setSelectedStore(store)} // 클릭 시 메뉴 팝업 대신 나침반 모드!
          />
        ))}
      </Map>
    )
}