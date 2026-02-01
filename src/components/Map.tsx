import { useEffect, useRef, useState } from "react";
import { CustomOverlayMap, Map } from "react-kakao-maps-sdk";
import storeData from "../data.json";
import { useCookieCompass } from "../hooks/useCookieCompass";
import { useAppStore } from "../store";
import SearchModal from "./SearchModal";

export default function KakaoMap() {
    const { selectedStore, setSelectedStore } = useAppStore();
    const { location } = useCookieCompass();
    
    // 기본값: 강남역
    const [center, setCenter] = useState({ lat: 37.498095, lng: 127.027610 });
    const hasCentered = useRef(false);
    
    // 검색창 상태
    const [startInput, setStartInput] = useState("내 위치");
    const [endInput, setEndInput] = useState("");
    
    // 경로 좌표 상태
    const [startPos, setStartPos] = useState<{lat: number, lng: number} | null>(null);
    const [endPos, setEndPos] = useState<{lat: number, lng: number} | null>(null);
    
    // 바텀시트 검색 상태
    const [activeSearchType, setActiveSearchType] = useState<'START' | 'END' | null>(null);


    // 내 위치로 이동 핸들러
    const moveToMyLocation = () => {
        if (location) {
            setCenter({ lat: location.latitude, lng: location.longitude });
            setStartPos({ lat: location.latitude, lng: location.longitude });
            setStartInput("내 위치");
        } else {
            alert("위치 정보를 불러오는 중입니다...");
        }
    };

    // 장소 선택 핸들러
    const handleSelectPlace = (place: any) => {
        const coords = { lat: parseFloat(place.y), lng: parseFloat(place.x) };
        
        if (activeSearchType === 'START') {
            setStartPos(coords);
            setStartInput(place.place_name);
        } else {
            setEndPos(coords);
            setEndInput(place.place_name);
        }
        setCenter(coords);
        setActiveSearchType(null); // 닫기
    };

    // '내 위치' 선택 핸들러
    const selectMyLocation = () => {
        if (location) {
             const coords = { lat: location.latitude, lng: location.longitude };
             if (activeSearchType === 'START') {
                setStartPos(coords);
                setStartInput("내 위치");
             } else {
                setEndPos(coords);
                setEndInput("내 위치");
             }
             setCenter(coords);
             setActiveSearchType(null);
        } else {
            alert("위치 정보를 가져올 수 없습니다.");
        }
    };

    // 진입 시(혹은 경로 탐색 시) 내 위치 중심으로 시작 & 도착지 텍스트 설정
    useEffect(() => {
        if (selectedStore) {
            setEndInput(selectedStore.name);
            if (selectedStore.lat && selectedStore.lng) {
                setEndPos({ lat: selectedStore.lat, lng: selectedStore.lng });
            }
        }
    }, [selectedStore]);

    // 내 위치 로드 시 최초 1회 중심 이동
    useEffect(() => {
        if (location && !hasCentered.current) {
            setCenter({ lat: location.latitude, lng: location.longitude });
            hasCentered.current = true;
        }
    }, [location]);

    return (
     <div className="relative w-full h-full"> 
      <Map
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={3} 
      >
        {/* 데이터 순회하며 마커 찍기 */}
        {/* 데이터 순회하며 마커 찍기 (커스텀 오버레이) */}
        {storeData.map((store) => (
          <CustomOverlayMap
            key={store.id}
            position={{ lat: store.lat!, lng: store.lng! }}
            yAnchor={0.5}
            zIndex={1}
          >
            <div 
              onClick={() => setSelectedStore(store)}
              className="group cursor-pointer hover:scale-110 transition-transform duration-200 ease-spring"
              style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                  fontSize: '24px',
              }}
            >
                🧆
            </div>
          </CustomOverlayMap>
        ))}
        {location && (
          <CustomOverlayMap 
            position={{ lat: location.latitude, lng: location.longitude }} 
            yAnchor={0.5} 
            zIndex={100}
          >
            <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#2563EB', // blue-600
                borderRadius: '50%', 
                border: '2px solid white', 
                boxShadow: '0 0 8px rgba(0,0,0,0.4)',
                animation: 'pulse 2s infinite'
            }} />
          </CustomOverlayMap>
        )}
        

      </Map>
      

      {/* 상단 검색 UI */}
      <div 
        style={{
            position: 'absolute',
            top: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '400px',
            backgroundColor: 'rgba(25, 25, 25, 0.45)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '16px',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
        {/* 출발지 */}
        <div className="flex items-center gap-4">
            <span className="text-[14px] font-bold text-gray-500 whitespace-nowrap min-w-[32px]">출발</span>
            <input 
                readOnly
                value={startInput}
                onClick={() => {
                    setActiveSearchType('START');
                }}
                placeholder="출발지 입력"
                className="flex-1 bg-transparent text-white text-[18px] outline-none border-none placeholder-gray-400"
            />
        </div>

        {/* 도착지 */}
        <div className="flex items-center gap-4">
             <span className="text-[14px] font-bold text-gray-500 whitespace-nowrap min-w-[32px]">도착</span>
            <input 
                readOnly
                value={endInput}
                onClick={() => {
                    setActiveSearchType('END');
                }}
                placeholder="도착지 입력"
                className="flex-1 bg-transparent text-white text-[18px] outline-none border-none placeholder-gray-400"
            />
        </div>
      </div>

      {/* 카카오맵 앱 연동 버튼 */}
      {endPos && (
          <button
            onClick={() => {
                let url = `https://map.kakao.com/link/to/${endInput},${endPos.lat},${endPos.lng}`;
                
                // 출발지가 설정되어 있으면 from 추가
                if (startPos) {
                    url += `/from/${startInput},${startPos.lat},${startPos.lng}`;
                } 
                // 출발지가 없지만 내 위치 정보가 있으면 내 위치를 출발지로 사용
                else if (location) {
                    url += `/from/내 위치,${location.latitude},${location.longitude}`;
                }

                window.open(url, '_blank');
            }}
            style={{
                position: 'absolute',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                backgroundColor: '#000',
                color: '#CCFF00',
                padding: '12px 24px',
                borderRadius: '9999px',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
            }}
          >
            <span>카카오맵에서 경로 보기</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </button>
      )}

      {/* 내 위치 이동 버튼 */}
      <button 
        onClick={moveToMyLocation}
        style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            backgroundColor: '#000',
            color: '#CCFF00',
            border: '1px solid #CCFF00',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg> 
      </button>

      {/* 검색 바텀 시트 (Component) */}
      <SearchModal 
        activeSearchType={activeSearchType}
        onClose={() => setActiveSearchType(null)}
        onSelectPlace={handleSelectPlace}
        onSelectMyLocation={selectMyLocation}
      />

     </div>
    )
}