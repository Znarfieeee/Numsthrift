import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  BarChart3,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SalesChart } from '@/components/analytics/SalesChart'
import { UserDistributionChart } from '@/components/analytics/UserDistributionChart'
import { ProductsChart } from '@/components/analytics/ProductsChart'

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSellers: 0,
    totalBuyers: 0,
    totalSales: 0,
    totalOrders: 0,
  })
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [analyticsData, setAnalyticsData] = useState({
    salesData: [],
    userData: [],
    productData: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      // Fetch all necessary data in parallel
      const [usersData, productsData, categoriesData, ordersData] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('orders').select('*'),
      ])

      if (usersData.data) {
        setUsers(usersData.data)
        const sellers = usersData.data.filter((u) => u.role === 'seller')
        const buyers = usersData.data.filter((u) => u.role === 'buyer')
        const admins = usersData.data.filter((u) => u.role === 'admin')

        // Set user distribution data for pie chart
        const userData = [
          { name: 'Sellers', value: sellers.length },
          { name: 'Buyers', value: buyers.length },
          { name: 'Admins', value: admins.length },
        ]

        setAnalyticsData((prev) => ({ ...prev, userData }))
      }

      if (productsData.data) {
        setProducts(productsData.data)
        const productsByCategory = {}

        productsData.data.forEach((product) => {
          if (!productsByCategory[product.category_id]) {
            productsByCategory[product.category_id] = {
              available: 0,
              sold: 0,
            }
          }
          if (product.status === 'available') {
            productsByCategory[product.category_id].available++
          } else if (product.status === 'sold') {
            productsByCategory[product.category_id].sold++
          }
        })

        // Prepare product data for bar chart
        const productData = Object.entries(productsByCategory).map(([categoryId, stats]) => ({
          name: categoriesData.data?.find((c) => c.id === categoryId)?.name || 'Unknown',
          available: stats.available,
          sold: stats.sold,
        }))

        setAnalyticsData((prev) => ({ ...prev, productData }))
      }

      if (categoriesData.data) {
        setCategories(categoriesData.data)
      }

      // Process sales data
      if (ordersData.data) {
        const salesByMonth = {}
        ordersData.data.forEach((order) => {
          const date = new Date(order.created_at)
          const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' })

          if (!salesByMonth[monthYear]) {
            salesByMonth[monthYear] = {
              sales: 0,
              orders: 0,
            }
          }
          salesByMonth[monthYear].sales += parseFloat(order.total_amount)
          salesByMonth[monthYear].orders++
        })

        // Prepare sales data for line chart
        const salesData = Object.entries(salesByMonth).map(([monthYear, data]) => ({
          name: monthYear,
          sales: data.sales,
          orders: data.orders,
        }))

        setAnalyticsData((prev) => ({ ...prev, salesData }))
      }

      // Update overall stats
      setStats({
        totalUsers: usersData.data?.length || 0,
        totalSellers: usersData.data?.filter((u) => u.role === 'seller').length || 0,
        totalBuyers: usersData.data?.filter((u) => u.role === 'buyer').length || 0,
        totalProducts: productsData.data?.length || 0,
        totalSales:
          ordersData.data?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0,
        totalOrders: ordersData.data?.length || 0,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)

    if (error) {
      alert('Failed to update user role')
      console.error(error)
    } else {
      alert('User role updated successfully')
      fetchData()
    }
  }

  const deleteProduct = useCallback(
    async (productId) => {
      if (confirm('Are you sure you want to delete this product?')) {
        const { error } = await supabase.from('products').delete().eq('id', productId)

        if (error) {
          alert('Failed to delete product')
          console.error(error)
        } else {
          fetchData()
        }
      }
    },
    [fetchData]
  )

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-2 h-9 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-9 w-16" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Card Skeleton */}
          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <div className="border-b px-6 py-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-primary mb-2 text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your numsthrift platform</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="text-primary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-primary text-3xl font-bold">{stats.totalUsers}</div>
              <p className="mt-1 text-xs text-gray-500">Registered members</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-purple)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sellers</CardTitle>
              <TrendingUp className="text-secondary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-secondary text-3xl font-bold">{stats.totalSellers}</div>
              <p className="mt-1 text-xs text-gray-500">Active sellers</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Buyers</CardTitle>
              <ShoppingCart className="text-accent h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-accent text-3xl font-bold">{stats.totalBuyers}</div>
              <p className="mt-1 text-xs text-gray-500">Active buyers</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-purple)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <Package className="text-primary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-primary text-3xl font-bold">{stats.totalProducts}</div>
              <p className="mt-1 text-xs text-gray-500">Listed items</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
          <div className="border-b">
            <nav className="flex flex-wrap gap-4 px-6 py-4" aria-label="Tabs">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('overview')}
                className={activeTab === 'overview' ? 'bg-primary text-primary-foreground' : ''}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('users')}
                className={activeTab === 'users' ? 'bg-primary text-primary-foreground' : ''}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Users
              </Button>
              <Button
                variant={activeTab === 'products' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('products')}
                className={activeTab === 'products' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Package className="mr-2 h-4 w-4" />
                Products
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('settings')}
                className={activeTab === 'settings' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>

          <CardContent className="p-6">
            {/* Overview Tab */}
            <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-primary mb-4 text-xl font-semibold">Analytics Dashboard</h2>

                  {/* Sales Overview Chart */}
                  <div className="mb-6">
                    <SalesChart data={analyticsData.salesData} />
                  </div>

                  {/* User and Product Analytics */}
                  <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <UserDistributionChart data={analyticsData.userData} />
                    <ProductsChart data={analyticsData.productData} />
                  </div>

                  {/* Detailed Stats Cards */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div
                      className="rounded-lg p-4"
                      style={{ backgroundColor: 'var(--bg-card-pink)' }}
                    >
                      <h3 className="mb-2 font-semibold text-gray-900">Platform Statistics</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Total Sales:</span>
                          <span className="text-primary font-medium">
                            ₱{stats.totalSales.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Orders:</span>
                          <span className="text-secondary font-medium">{stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Order Value:</span>
                          <span className="text-accent font-medium">
                            ₱
                            {stats.totalOrders > 0
                              ? (stats.totalSales / stats.totalOrders).toFixed(2)
                              : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{ backgroundColor: 'var(--bg-card-purple)' }}
                    >
                      <h3 className="mb-2 font-semibold text-gray-900">User Engagement</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Active Sellers:</span>
                          <span className="text-primary font-medium">{stats.totalSellers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products per Seller:</span>
                          <span className="text-secondary font-medium">
                            {stats.totalSellers > 0
                              ? (stats.totalProducts / stats.totalSellers).toFixed(1)
                              : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buyer to Seller Ratio:</span>
                          <span className="text-accent font-medium">
                            {stats.totalSellers > 0
                              ? (stats.totalBuyers / stats.totalSellers).toFixed(1)
                              : '0'}
                            :1
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-lg border-2 p-4"
                  style={{ borderColor: 'var(--bg-card-pink)', backgroundColor: 'var(--bg-hero)' }}
                >
                  <h3 className="mb-2 font-semibold text-gray-900">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setActiveTab('users')}
                      className="bg-secondary hover:bg-secondary-hover"
                    >
                      Manage Users
                    </Button>
                    <Button
                      onClick={() => setActiveTab('products')}
                      className="bg-accent hover:bg-accent-light"
                    >
                      View Products
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Tab */}
            <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
              <div>
                <h2 className="text-primary mb-4 text-xl font-semibold">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                            {user.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs leading-5 font-semibold ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'seller'
                                    ? 'text-secondary'
                                    : 'text-accent'
                              }`}
                              style={{
                                backgroundColor:
                                  user.role === 'seller'
                                    ? 'var(--bg-card-purple)'
                                    : user.role === 'buyer'
                                      ? 'var(--bg-card-pink)'
                                      : '',
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="focus:ring-primary focus:border-primary rounded border border-gray-300 px-3 py-1.5 text-sm focus:ring-2"
                            >
                              <option value="buyer">Buyer</option>
                              <option value="seller">Seller</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Products Tab */}
            <div style={{ display: activeTab === 'products' ? 'block' : 'none' }}>
              <div>
                <h2 className="text-primary mb-4 text-xl font-semibold">Product Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Condition
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                            {product.title}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                            ₱{parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs leading-5 font-semibold ${
                                product.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : product.status === 'sold'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 capitalize">
                            {product.condition?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <Button
                              onClick={() => deleteProduct(product.id)}
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-900"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Settings Tab */}
            <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
              <div>
                <h2 className="text-primary mb-4 text-xl font-semibold">Platform Settings</h2>
                <div className="space-y-6">
                  <Card className="border" style={{ borderColor: 'var(--bg-card-pink)' }}>
                    <CardHeader>
                      <CardTitle className="text-base">Email Configuration</CardTitle>
                      <CardDescription>
                        Email auto-confirmation is enabled for all new users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Auto-confirm enabled</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border" style={{ borderColor: 'var(--bg-card-purple)' }}>
                    <CardHeader>
                      <CardTitle className="text-base">Database Information</CardTitle>
                      <CardDescription>Current platform statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tables:</span>
                          <span className="font-medium">
                            users, products, categories, cart_items
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Row Level Security:</span>
                          <span className="font-medium text-green-600">Enabled</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
