import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  ShoppingCart,
  User,
  Users,
  LogOut,
  LayoutDashboard,
  Package,
  Store,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const Navbar = () => {
  const { user, profile, signOut, loading } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100'
      case 'seller':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <nav className="border-b-2 bg-white shadow-lg" style={{ borderColor: 'var(--bg-card-pink)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center">
              <span className="text-primary text-2xl font-bold">Numsthrift</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/shop"
                className="hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 transition-colors"
              >
                Shop
              </Link>
              {!loading && user && (profile?.role === 'seller' || profile?.role === 'admin') && (
                <Link
                  to="/my-store"
                  className="hover:text-secondary inline-flex items-center gap-2 px-1 pt-1 text-sm font-medium text-gray-900 transition-colors"
                >
                  <Store className="h-4 w-4" />
                  <span>My Store</span>
                </Link>
              )}
              {!loading && user && profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="hover:text-primary relative p-2 text-gray-600 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={getRoleColor(profile?.role)}>
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm leading-none font-medium">{profile?.full_name}</p>
                          {profile?.role === 'admin' && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs leading-none">
                          {profile?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {profile?.role === 'admin' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="w-full cursor-pointer">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/users" className="w-full cursor-pointer">
                              <Users className="mr-2 h-4 w-4" />
                              <span>Manage Users</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/products" className="w-full cursor-pointer">
                              <Package className="mr-2 h-4 w-4" />
                              <span>Manage Products</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/settings" className="w-full cursor-pointer">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>System Settings</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {profile?.role === 'seller' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/seller" className="w-full cursor-pointer">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Seller Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/my-store" className="w-full cursor-pointer">
                              <Store className="mr-2 h-4 w-4" />
                              <span>My Store</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/my-orders" className="w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" asChild className="hover:text-secondary text-gray-700">
                  <Link to="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-md"
                >
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
