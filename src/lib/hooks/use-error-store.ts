import { create } from 'zustand';
import { ContainerError, ErrorAction } from '@/types/error';

interface ErrorState {
  errors: ContainerError[];
  addError: (error: ContainerError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  getErrorsByContainer: (containerId: string) => ContainerError[];
  getErrorsByAction: (action: ErrorAction) => ContainerError[];
  getRecentErrors: (hours?: number) => ContainerError[];
  hasRecentErrors: (containerId: string, hours?: number) => boolean;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  
  addError: (error) => set((state) => ({
    errors: [error, ...state.errors].slice(0, 50)
  })),
  
  removeError: (id) => set((state) => ({
    errors: state.errors.filter(e => e.id !== id)
  })),
  
  clearErrors: () => set({ errors: [] }),
  
  getErrorsByContainer: (containerId) => {
    return get().errors.filter(e => e.containerId === containerId);
  },
  
  getErrorsByAction: (action) => {
    return get().errors.filter(e => e.action === action);
  },
  
  getRecentErrors: (hours = 24) => {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return get().errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
  },
  
  hasRecentErrors: (containerId, hours = 24) => {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return get().errors.some(e => 
      e.containerId === containerId && 
      new Date(e.timestamp).getTime() > cutoff
    );
  }
}));
