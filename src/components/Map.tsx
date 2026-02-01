import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CustomOverlayMap, Map } from "react-kakao-maps-sdk";
import storeData from "../data.json";
import { useCookieCompass } from "../hooks/useCookieCompass";
import { useAppStore } from "../store";

export default function KakaoMap() {
    const { selectedStore, setSelectedStore } = useAppStore();
    const { location } = useCookieCompass();
    
    const [center, setCenter] = useState({ lat: 37.498095, lng: 127.027610 });
    const hasCentered = useRef(false);
    
    const [startInput, setStartInput] = useState("내 위치");
    const [endInput, setEndInput] = useState("");
    
    const [startPos, setStartPos] = useState<{lat: number, lng: number} | null>(null);
    const [endPos, setEndPos] = useState<{lat: number, lng: number} | null>(null);

    const moveToMyLocation = () => {
        if (location) {
            setCenter({ lat: location.latitude, lng: location.longitude });
            setStartPos({ lat: location.latitude, lng: location.longitude });
            setStartInput("내 위치");
        } else {
            alert("위치 정보를 불러오는 중입니다...");
        }
    };

    useEffect(() => {
        if (selectedStore) {
            setEndInput(selectedStore.name);
            if (selectedStore.lat && selectedStore.lng) {
                setEndPos({ lat: selectedStore.lat, lng: selectedStore.lng });
            }
        }
    }, [selectedStore]);

    useEffect(() => {
        if (location && !hasCentered.current) {
            setCenter({ lat: location.latitude, lng: location.longitude });
            hasCentered.current = true;
        }
    }, [location]);

    return (
     <div className="relative w-full h-full"> 
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <Map
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={3}
        isPanto={true}
      >
        {storeData.map((store) => (
          <CustomOverlayMap
            key={store.id}
            position={{ lat: store.lat!, lng: store.lng! }}
            yAnchor={0.5}
            zIndex={1}
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStore(store)}
              className="cursor-pointer"
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
            </motion.div>
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
                backgroundColor: '#2563EB',
                borderRadius: '50%', 
                border: '2px solid white', 
                boxShadow: '0 0 8px rgba(0,0,0,0.3)',
                animation: 'pulse 2s infinite'
            }} />
          </CustomOverlayMap>
        )}
      </Map>

      {/* 상단 정보 UI */}
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
        <div className="flex items-center gap-4">
            <span className="text-[14px] font-bold text-gray-500 whitespace-nowrap min-w-[32px]">출발</span>
            <input 
                readOnly
                value={startInput}
                placeholder="출발지 입력"
                className="flex-1 bg-transparent text-white text-[18px] outline-none border-none placeholder-gray-400"
            />
        </div>

        <div className="flex items-center gap-4">
             <span className="text-[14px] font-bold text-gray-500 whitespace-nowrap min-w-[32px]">도착</span>
            <input 
                readOnly
                value={endInput}
                placeholder="도착지 입력"
                className="flex-1 bg-transparent text-white text-[18px] outline-none border-none placeholder-gray-400"
            />
        </div>
      </div>

      <AnimatePresence>
        {endPos && (
            <motion.button
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                  let url = `https://map.kakao.com/link/to/${endInput},${endPos.lat},${endPos.lng}`;
                  if (startPos) {
                      url += `/from/${startInput},${startPos.lat},${startPos.lng}`;
                  } else if (location) {
                      url += `/from/내 위치,${location.latitude},${location.longitude}`;
                  }
                  window.open(url, '_blank');
              }}
              style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  zIndex: 20,
                  backgroundColor: '#000',
                  color: '#CCFF00',
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
              }}
            >
              <span>카카오맵에서 경로 보기</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </motion.button>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={moveToMyLocation}
        style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            backgroundColor: '#000',
            color: '#CCFF00',
            border: '2px solid #CCFF00',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3"></circle>
            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            <line x1="12" y1="2" x2="12" y2="5"></line>
            <line x1="12" y1="19" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="5" y2="12"></line>
            <line x1="19" y1="12" x2="22" y2="12"></line>
        </svg> 
      </motion.button>
     </div>
    )
}