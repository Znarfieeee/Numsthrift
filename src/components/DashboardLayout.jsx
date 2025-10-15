import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LogOut, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export const DashboardLayout = ({ children, navItems = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--background)'}}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">numsthrift</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 border-r bg-white shadow-lg`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-4 border-b">
            <div className="p-2 rounded-full" style={{backgroundColor: 'var(--bg-card-pink)'}}>
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary">numsthrift</span>
          </Link>

          {/* User Info */}
          <div className="px-3 py-3 mb-4 rounded-lg" style={{backgroundColor: 'var(--bg-hero)'}}>
            <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-gray-600">{profile?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full capitalize" style={{
              backgroundColor: profile?.role === 'admin' ? 'var(--bg-card-purple)' :
                             profile?.role === 'seller' ? 'var(--bg-card-pink)' :
                             'var(--bg-hero)',
              color: profile?.role === 'admin' ? 'var(--accent)' :
                     profile?.role === 'seller' ? 'var(--primary)' :
                     'var(--secondary)'
            }}>
              {profile?.role}
            </span>
          </div>

          {/* Navigation */}
          <ul className="space-y-2 font-medium">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center p-3 rounded-lg transition-all ${
                      isActive
                        ? 'text-primary-foreground font-semibold shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={isActive ? {
                      backgroundColor: 'var(--primary)'
                    } : {}}
                  >
                    {item.icon && <item.icon className="h-5 w-5 mr-3" />}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Sign Out Button (Desktop) */}
          <div className="hidden lg:block absolute bottom-4 left-3 right-3">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
