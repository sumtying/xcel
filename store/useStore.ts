import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Masuk' | 'Keluar';
  category: string;
  nota?: string;
};

type StoreState = {
  companyName: string; // Menyimpan nama syarikat
  setCompanyName: (name: string) => void; // Fungsi menukar nama syarikat
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      companyName: 'XYZ Enterprise', // Nama lalai (default)
      setCompanyName: (name) => set({ companyName: name }),
      transactions: [],
      
      addTransaction: (tx) => set((state) => ({
        transactions: [...state.transactions, { ...tx, id: crypto.randomUUID() }]
      })),
      
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),
    }),
    { 
      name: 'akaun-storage' 
    } 
  )
);