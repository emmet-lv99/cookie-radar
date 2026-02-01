import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface SearchModalProps {
    activeSearchType: 'START' | 'END' | null;
    onClose: () => void;
    onSelectPlace: (place: any) => void;
    onSelectMyLocation: () => void;
}

export default function SearchModal({ 
    activeSearchType, 
    onClose, 
    onSelectPlace, 
    onSelectMyLocation 
}: SearchModalProps) {
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleKeywordSearch = (keyword: string) => {
        if (!keyword.replace(/^\s+|\s+$/g, '')) return;

        const ps = new kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                setSearchResults(data);
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                setSearchResults([]);
            } else if (status === kakao.maps.services.Status.ERROR) {
                alert('검색 결과 중 오류가 발생했습니다.');
            }
        }); 
    };

    return (
        <AnimatePresence>
            {activeSearchType && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 z-50"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute inset-0 z-60 bg-neutral-900 flex flex-col p-6"
                        style={{
                            top: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.92)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                        }}
                    >
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-black text-2xl font-bold tracking-tight">
                                {activeSearchType === 'START' ? '출발지 검색' : '도착지 검색'}
                            </h3>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors text-black"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4 shrink-0">
                            <div className="relative flex-1">
                                <input 
                                    className="w-full h-14 bg-gray-100 text-black rounded-2xl px-4 pl-12 outline-none text-lg font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-black transition-all shadow-sm"
                                    placeholder="장소명 검색"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch(searchKeyword)}
                                    autoFocus
                                />
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <button 
                                onClick={() => handleKeywordSearch(searchKeyword)}
                                className="h-14 bg-black text-[#CCFF00] font-bold text-lg px-6 rounded-2xl hover:bg-gray-800 transition-transform active:scale-95 shadow-lg"
                            >
                                검색
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* 내 위치 선택 옵션 */}
                            <div 
                                onClick={onSelectMyLocation}
                                className="flex items-center gap-4 p-4 hover:bg-gray-100 rounded-2xl cursor-pointer border-b border-gray-100 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-black font-semibold text-lg">내 위치</span>
                                    <span className="text-gray-500 text-xs font-medium">현재 위치로 설정</span>
                                </div>
                            </div>

                            {searchResults.map((place) => (
                                <div 
                                    key={place.id}
                                    onClick={() => onSelectPlace(place)}
                                    className="flex flex-col gap-1 p-4 hover:bg-gray-100 rounded-2xl cursor-pointer border-b border-gray-100 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-black font-semibold text-lg group-hover:text-blue-600 transition-colors">{place.place_name}</span>
                                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded">장소</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                        <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                        <span className="truncate">{place.address_name}</span>
                                    </div>
                                </div>
                            ))}
                            
                            {searchResults.length === 0 && searchKeyword && (
                                <div className="text-center text-gray-500 mt-10">
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
