import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, GitBranch, Shield, BarChart3, FileText,
  CheckSquare, Bell, Bot, Settings, BookOpen, Activity,
  ChevronLeft, ChevronRight, Zap, Lock
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const navItems = [
  { group: 'Overview', items: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/activity', label: 'Activity', icon: Activity },
  ]},
  { group: 'Security', items: [
    { path: '/projects', label: 'Projects', icon: FolderOpen },
    { path: '/repositories', label: 'Repositories', icon: GitBranch },
    { path: '/pipelines', label: 'Pipelines', icon: Zap },
    { path: '/scans', label: 'Scans', icon: Shield },
    { path: '/compliance', label: 'Compliance', icon: CheckSquare },
  ]},
  { group: 'Reports', items: [
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/audit', label: 'Audit Logs', icon: BookOpen },
  ]},
  { group: 'Tools', items: [
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ]},
  { group: 'System', items: [
    { path: '/settings', label: 'Settings', icon: Settings },
  ]},
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-30 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-dark-700/50 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyber-500/25">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold text-white tracking-tight">SecureCI</p>
                <p className="text-[10px] text-slate-500 truncate">Security Framework</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto text-slate-500 hover:text-slate-300 hover:bg-dark-700/50 rounded-md p-1 transition-all flex-shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navItems.map((group) => (
          <div key={group.group}>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest"
                >
                  {group.group}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
                return (
                  <NavLink
                    key={path}
                    to={path}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                      isActive
                        ? 'text-cyber-400 bg-cyber-500/10 border border-cyber-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className={cn('flex-shrink-0', isActive ? 'w-4.5 h-4.5' : 'w-4 h-4')} />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="truncate font-medium"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={cn(
        'p-3 border-t border-dark-700/50 flex items-center gap-3',
        sidebarCollapsed && 'justify-center'
      )}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user?.full_name?.[0] ?? 'U'}
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0 flex-1"
            >
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
