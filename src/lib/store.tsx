'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Seller, Grade, DailyEntry, WeightEntry } from '@/models/types';
import { calcEntryTotals } from '@/lib/utils';

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  sellers: Seller[];
  grades: Grade[];
  entries: DailyEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  sellers: [],
  grades: [],
  entries: [],
  isLoading: true,
  error: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  // Bootstrap
  | { type: 'SET_SELLERS'; payload: Seller[] }
  | { type: 'SET_GRADES'; payload: Grade[] }
  | { type: 'SET_ENTRIES'; payload: DailyEntry[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  // Sellers (optimistic)
  | { type: 'ADD_SELLER'; payload: Seller }
  | { type: 'UPDATE_SELLER'; payload: Seller }
  | { type: 'DELETE_SELLER'; payload: string }
  // Grades
  | { type: 'UPDATE_GRADES'; payload: Grade[] }
  // Entries (optimistic)
  | { type: 'ADD_ENTRY'; payload: DailyEntry }
  | { type: 'UPDATE_ENTRY'; payload: DailyEntry }
  | { type: 'DELETE_ENTRY'; payload: string };

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // Bootstrap
    case 'SET_SELLERS':   return { ...state, sellers: action.payload };
    case 'SET_GRADES':    return { ...state, grades: action.payload };
    case 'SET_ENTRIES':   return { ...state, entries: action.payload };
    case 'SET_LOADING':   return { ...state, isLoading: action.payload };
    case 'SET_ERROR':     return { ...state, error: action.payload };

    // Sellers
    case 'ADD_SELLER':
      return { ...state, sellers: [...state.sellers, action.payload] };
    case 'UPDATE_SELLER':
      return { ...state, sellers: state.sellers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SELLER':
      return { ...state, sellers: state.sellers.filter(s => s.id !== action.payload) };

    // Grades
    case 'UPDATE_GRADES':
      return { ...state, grades: action.payload };

    // Entries
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'UPDATE_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.id !== action.payload) };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Query helpers
  getEntriesByDate: (date: string) => DailyEntry[];
  getEntriesInWeek: (weekDates: string[]) => DailyEntry[];
  // Async actions
  addSeller: (data: Omit<Seller, 'id'>) => Promise<void>;
  updateSeller: (seller: Seller) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  updateGrades: (grades: Grade[]) => Promise<void>;
  addEntry: (data: {
    date: string;
    sellerId: string;
    sellerName: string;
    entries: WeightEntry[];
    note?: string;
  }) => Promise<DailyEntry>;
  updateEntry: (id: string, data: { entries: WeightEntry[]; note?: string }) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  fetchEntriesByDate: (date: string) => Promise<void>;
  fetchEntriesInWeek: (weekDates: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // โหลด sellers และ grades ตอน mount
  useEffect(() => {
    async function bootstrap() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [sellersRes, gradesRes] = await Promise.all([
          fetch('/api/sellers'),
          fetch('/api/grades'),
        ]);

        if (!sellersRes.ok || !gradesRes.ok) throw new Error('โหลดข้อมูลเริ่มต้นล้มเหลว');

        const sellers: Seller[] = await sellersRes.json();
        const grades: Grade[] = await gradesRes.json();

        dispatch({ type: 'SET_SELLERS', payload: sellers });
        dispatch({ type: 'SET_GRADES', payload: grades });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (err) {
        console.error('[bootstrap]', err);
        dispatch({ type: 'SET_ERROR', payload: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    bootstrap();
  }, []);

  // ── Query helpers ──────────────────────────────────────────────────────────
  const getEntriesByDate = useCallback(
    (date: string) => state.entries.filter(e => e.date === date),
    [state.entries]
  );

  const getEntriesInWeek = useCallback(
    (weekDates: string[]) => state.entries.filter(e => weekDates.includes(e.date)),
    [state.entries]
  );

  // ── Sellers ────────────────────────────────────────────────────────────────
  const addSeller = useCallback(async (data: Omit<Seller, 'id'>) => {
    const res = await fetch('/api/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const seller: Seller = await res.json();
    dispatch({ type: 'ADD_SELLER', payload: seller });
  }, []);

  const updateSeller = useCallback(async (seller: Seller) => {
    const res = await fetch(`/api/sellers/${seller.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seller),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const updated: Seller = await res.json();
    dispatch({ type: 'UPDATE_SELLER', payload: updated });
  }, []);

  const deleteSeller = useCallback(async (id: string) => {
    const res = await fetch(`/api/sellers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    dispatch({ type: 'DELETE_SELLER', payload: id });
  }, []);

  // ── Grades ─────────────────────────────────────────────────────────────────
  const updateGrades = useCallback(async (grades: Grade[]) => {
    const res = await fetch('/api/grades', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grades),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const updated: Grade[] = await res.json();
    dispatch({ type: 'UPDATE_GRADES', payload: updated });
  }, []);

  // ── Entries ────────────────────────────────────────────────────────────────
  const addEntry = useCallback(
    async (data: {
      date: string;
      sellerId: string;
      sellerName: string;
      entries: WeightEntry[];
      note?: string;
    }): Promise<DailyEntry> => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const entry: DailyEntry = await res.json();
      dispatch({ type: 'ADD_ENTRY', payload: entry });
      return entry;
    },
    []
  );

  const updateEntry = useCallback(
    async (id: string, data: { entries: WeightEntry[]; note?: string }) => {
      const res = await fetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: DailyEntry = await res.json();
      dispatch({ type: 'UPDATE_ENTRY', payload: updated });
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  }, []);

  // ── Fetch entries (lazy — เรียกตอนหน้าต้องการ) ───────────────────────────
  const fetchEntriesByDate = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      if (!res.ok) return;
      const data: DailyEntry[] = await res.json();
      // Merge entries ที่โหลดมาใหม่เข้า state (ไม่ทับ entries วันอื่น)
      dispatch({
        type: 'SET_ENTRIES',
        payload: [
          ...state.entries.filter(e => e.date !== date),
          ...data,
        ],
      });
    } catch (err) {
      console.error('[fetchEntriesByDate]', err);
    }
  }, [state.entries]);

  const fetchEntriesInWeek = useCallback(async (weekDates: string[]) => {
    try {
      const res = await fetch(`/api/entries?weekDates=${weekDates.join(',')}`);
      if (!res.ok) return;
      const data: DailyEntry[] = await res.json();
      // Merge entries ของสัปดาห์ เข้า state
      dispatch({
        type: 'SET_ENTRIES',
        payload: [
          ...state.entries.filter(e => !weekDates.includes(e.date)),
          ...data,
        ],
      });
    } catch (err) {
      console.error('[fetchEntriesInWeek]', err);
    }
  }, [state.entries]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        getEntriesByDate,
        getEntriesInWeek,
        addSeller,
        updateSeller,
        deleteSeller,
        updateGrades,
        addEntry,
        updateEntry,
        deleteEntry,
        fetchEntriesByDate,
        fetchEntriesInWeek,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export helper ที่ยังใช้งานอยู่
export { calcEntryTotals };
