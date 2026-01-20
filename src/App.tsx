import { motion } from "framer-motion";
import CompassView from "./components/Compass";
import KakaoMap from "./components/Map";
import RadarView from "./components/Radar";
import TrendsView from "./components/Trends";
import { useAppStore } from "./store";

const tabs = [
  { id: 'RADAR', label: 'Radar' },
  { id: 'COMPASS', label: 'Compass' },
  { id: 'MAP', label: 'Map' },
  { id: 'TRENDS', label: 'Trends' },
] as const;

function App() {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 상단 Pill 탭 */}
      <nav
        className="absolute top-0 left-0 z-50 scrollbar-hide"
        style={{
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
          overflowX: 'scroll',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            width: 'max-content',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '50px',
            padding: '6px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className="relative rounded-full overflow-hidden flex-shrink-0"
              style={{
                fontWeight: 700,
                fontSize: '18px',
                padding: '10px 20px',
                color: viewMode === tab.id ? '#fff' : 'rgba(0,0,0,0.6)',
                border: 'none',
                background: 'transparent',
              }}
            >
              {viewMode === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#000',
                    borderRadius: '9999px',
                    zIndex: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {viewMode === 'RADAR' && <RadarView/>}
      {viewMode === 'COMPASS' && <CompassView/>}
      {viewMode === 'MAP' && <KakaoMap/>}
      {viewMode === 'TRENDS' && <TrendsView/>}
    </div>
  );
}

export default App;
