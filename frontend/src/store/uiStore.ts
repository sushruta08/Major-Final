import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  activePage: string
  toggleTheme: () => void
  toggleSidebar: () => void
  setActivePage: (page: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      activePage: 'dashboard',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', newTheme === 'dark')
          return { theme: newTheme }
        }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setActivePage: (page) => set({ activePage: page }),
    }),
    { name: 'ui-storage' }
  )
)
