import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { mockNotifications } from '../../utils/mockData'
import { Badge } from '../ui/Badge'

export function Topbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const unreadCount = mockNotifications.filter(n => !n.is_read).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search vulnerabilities, repos, pipelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-800/80 border border-dark-700/50 text-sm text-slate-300 placeholder-slate-600 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 focus:border-cyber-500/40 transition-all"
          />
          {searchQuery && (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-dark-700 px-1.5 py-0.5 rounded border border-dark-600">
              ESC
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-700/50 transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-700/50 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-dark-900" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                  <Badge variant="critical" size="sm">{unreadCount} new</Badge>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {mockNotifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-dark-700/50 hover:bg-dark-700/40 transition-colors ${!n.is_read ? 'bg-dark-700/20' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'critical' ? 'bg-red-500' :
                          n.type === 'warning' ? 'bg-yellow-500' :
                          n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-xs font-medium text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-dark-700">
                  <button onClick={() => { navigate('/notifications'); setShowNotifications(false) }}
                    className="text-xs text-cyber-400 hover:text-cyber-300 transition-colors">
                    View all notifications →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-dark-700/50 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.[0] ?? 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-slate-200">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-dark-700">
                  <p className="text-sm font-medium text-slate-200">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => { navigate('/profile'); setShowProfile(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700/50 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { navigate('/settings'); setShowProfile(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700/50 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <div className="border-t border-dark-700 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
