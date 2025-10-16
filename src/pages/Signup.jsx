import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'buyer',
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password Mismatch', {
        description: 'Passwords do not match',
      })
      return
    }

    if (formData.password.length < 6) {
      toast.error('Weak Password', {
        description: 'Password must be at least 6 characters',
      })
      return
    }

    setLoading(true)

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.role
    )

    if (error) {
      toast.error('Signup Failed', {
        description: error.message || 'Could not create account',
      })
      setLoading(false)
    } else {
      toast.success('Account Created!', {
        description: 'Redirecting to login page...',
      })

      // Redirect to login page after successful signup
      setTimeout(() => {
        navigate('/login')
      }, 1500)
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
              '0 20px 25px -5px rgba(216, 165, 216, 0.1), 0 10px 10px -5px rgba(216, 165, 216, 0.04)',
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
              Create your account to get started
            </p>
          </div>

          {/* Signup Card */}
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="space-y-1 px-0 pb-4">
              <CardTitle className="text-primary text-center text-xl font-bold sm:text-2xl">
                Join numsthrift
              </CardTitle>
              <CardDescription className="text-center text-sm text-gray-600">
                Fill in your details to create a new account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    I want to
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buy items</SelectItem>
                      <SelectItem value="seller">Sell items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="focus:ring-primary focus:border-primary h-11 w-full border-gray-300 transition-all focus:ring-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-6 h-11 w-full text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:text-base"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.backgroundColor = 'var(--secondary-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--secondary)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-0 pt-6">
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-secondary hover:text-accent font-semibold underline-offset-4 transition-colors hover:underline"
                >
                  Sign in instead
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500 sm:text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
