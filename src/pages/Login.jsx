import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        throw error
      }

      // Wait for profile to be loaded
      const checkProfileAndRedirect = async () => {
        const storedProfile = JSON.parse(localStorage.getItem('userProfile'))

        if (storedProfile) {
          switch (storedProfile.role) {
            case 'admin':
              navigate('/admin')
              break
            case 'seller':
              navigate('/seller')
              break
            default:
              navigate('/shop')
          }
          setLoading(false)
        } else {
          // If profile not loaded yet, retry after a short delay
          setTimeout(checkProfileAndRedirect, 100)
        }
      }

      checkProfileAndRedirect()
    } catch (error) {
      toast.error(error.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--bg-hero)' }}
    >
      {/* Outer Container with Enhanced Styling */}
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-6 shadow-2xl sm:p-8"
          style={{
            backgroundColor: 'white',
            boxShadow:
              '0 20px 25px -5px rgba(233, 165, 209, 0.1), 0 10px 10px -5px rgba(233, 165, 209, 0.04)',
          }}
        >
          {/* Logo/Branding */}
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="rounded-full p-2" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                <ShoppingBag className="text-primary h-7 w-7 sm:h-9 sm:w-9" />
              </div>
              <h1 className="text-primary text-3xl font-bold sm:text-4xl">Numsthrift</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Welcome back! Sign in to continue
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="space-y-1 px-0 pb-4">
              <CardTitle className="text-primary text-center text-xl font-bold sm:text-2xl">
                Sign in to your account
              </CardTitle>
              <CardDescription className="text-center text-sm text-gray-600">
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-8 h-11 w-full text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:text-base"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.backgroundColor = 'var(--primary-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--primary)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-0 pt-6">
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-secondary hover:text-accent font-semibold underline-offset-4 transition-colors hover:underline"
                >
                  Create one now
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500 sm:text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
