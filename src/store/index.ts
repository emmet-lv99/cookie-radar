import { create } from 'zustand';
import type { StoreData } from '../types';

type ViewMode = 'RADAR' | 'COMPASS' | 'MAP';

interface AppState {
  // 상태 (State)
  viewMode: ViewMode;
  selectedStore: StoreData | null;

  // 액션 (Actions)
  setViewMode: (mode: ViewMode) => void;
  setSelectedStore: (store: StoreData | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'RADAR', // 초기값
  selectedStore: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedStore: (store) => set({ selectedStore: store, viewMode: 'COMPASS' }), // 가게 선택 시 자동으로 나침반 모드로 이동!
}));
