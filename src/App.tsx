import { Map, Navigation, Zap } from "lucide-react";
import { useState } from "react";
import CompassView from "./components/Compass";
import KakaoMap from "./components/Map";
import RadarView from "./components/Radar";

type ViewMode = 'RADAR' | 'COMPASS' | 'MAP'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('RADAR')

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 1. 상단 네비게이션 바 (Floating) */}
    <nav className="absolute top-4 left-0 right-0 z-50 flex justify-center gap-4">
      
      <button 
        onClick={() => setViewMode('RADAR')}
        className={`p-3 rounded-full transition-all ${viewMode === 'RADAR' ? 'bg-neon text-black scale-110' : 'bg-gray-800 text-gray-400'}`}
      >
        <Zap size={24} /> {/* Radar 아이콘 대용 */}
      </button>
      <button 
        onClick={() => setViewMode('COMPASS')} 
        className={`p-3 rounded-full transition-all ${viewMode === 'COMPASS' ? 'bg-neon text-black scale-110' : 'bg-gray-800 text-gray-400'}`}
      >
        <Navigation size={24} />
      </button>
      <button 
        onClick={() => setViewMode('MAP')}
        className={`p-3 rounded-full transition-all ${viewMode === 'MAP' ? 'bg-neon text-black scale-110' : 'bg-gray-800 text-gray-400'}`}
      >
        <Map size={24} />
      </button>
    </nav>
      {viewMode === 'RADAR' && <RadarView/>}
      {viewMode === 'COMPASS' && <CompassView/>}
      {viewMode === 'MAP' && <KakaoMap/>}
    </div>
  );
}

export default App;


     