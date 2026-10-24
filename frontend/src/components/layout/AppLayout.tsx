import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUIStore } from '../../store/uiStore'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <Sidebar />
      <motion.div
        animate={{ marginLeft: sidebarCollapsed ? 68 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </motion.div>
    </div>
  )
}
