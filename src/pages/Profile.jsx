import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  StarIcon,
} from 'lucide-react'
import { toast } from 'sonner'

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function SellerStats({ userId }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSellerStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchSellerStats = async () => {
    try {
      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)

      // Fetch orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('seller_id', userId)

      const totalSales = orders?.filter((o) => o.status === 'delivered').length || 0
      const totalRevenue =
        orders
          ?.filter((o) => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0

      setStats({
        totalProducts: productsCount || 0,
        totalSales,
        totalRevenue,
        pendingOrders,
      })
    } catch (error) {
      console.error('Error fetching seller stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seller Statistics</CardTitle>
        <CardDescription>Your shop performance overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-gradient-to-br from-pink-50 to-white p-4">
            <div className="flex items-center gap-2 text-pink-600">
              <PackageIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Total Products</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white p-4">
            <div className="flex items-center gap-2 text-green-600">
              <ShoppingBagIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Total Sales</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalSales}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUpIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Total Revenue</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              ₱{stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-yellow-50 to-white p-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <StarIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Pending Orders</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BuyerStats({ userId }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBuyerStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchBuyerStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('buyer_id', userId)

      const totalOrders = orders?.length || 0
      const completedOrders = orders?.filter((o) => o.status === 'delivered').length || 0
      const totalSpent =
        orders
          ?.filter((o) => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0

      setStats({
        totalOrders,
        completedOrders,
        totalSpent,
        pendingOrders,
      })
    } catch (error) {
      console.error('Error fetching buyer stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Statistics</CardTitle>
        <CardDescription>Your shopping activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-gradient-to-br from-pink-50 to-white p-4">
            <div className="flex items-center gap-2 text-pink-600">
              <ShoppingBagIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Total Orders</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white p-4">
            <div className="flex items-center gap-2 text-green-600">
              <PackageIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Completed</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUpIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Total Spent</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">₱{stats.totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-yellow-50 to-white p-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <StarIcon className="h-5 w-5" />
              <p className="text-sm font-medium">Pending</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Profile() {
  const { user, profile: currentProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile)
      setFormData({
        full_name: currentProfile.full_name || '',
        phone: currentProfile.phone || '',
        address: currentProfile.address || '',
      })
      setLoading(false)
    }
  }, [currentProfile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...formData })
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Error updating profile: ' + error.message)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <ProfileSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-gray-600">Manage your account information</p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <UserIcon className="h-3 w-3" />
            {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!editing && (
                <Button onClick={() => setEditing(true)} size="sm">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-gray-500" />
                Email
              </Label>
              <Input id="email" type="email" value={profile?.email || ''} disabled />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-500" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="Enter your address"
              />
            </div>

            {editing && (
              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleSave} className="">
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics - Conditional based on role */}
        {profile?.role === 'seller' || profile?.role === 'admin' ? (
          <SellerStats userId={user.id} />
        ) : (
          <BuyerStats userId={user.id} />
        )}

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Additional account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Account Created:</span>
              <span className="font-medium">
                {new Date(profile?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">
                {new Date(profile?.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-xs font-medium">{user?.id}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
