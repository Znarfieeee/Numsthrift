import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Package, ShoppingCart, TrendingUp, Settings, BarChart3, UserCog } from 'lucide-react'
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
    totalOrders: 0
  })
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [analyticsData, setAnalyticsData] = useState({
    salesData: [],
    userData: [],
    productData: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    try {
      // Fetch all necessary data in parallel
      const [usersData, productsData, categoriesData, ordersData] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('orders').select('*')
      ])

      if (usersData.data) {
        setUsers(usersData.data)
        const sellers = usersData.data.filter(u => u.role === 'seller')
        const buyers = usersData.data.filter(u => u.role === 'buyer')
        const admins = usersData.data.filter(u => u.role === 'admin')

        // Set user distribution data for pie chart
        const userData = [
          { name: 'Sellers', value: sellers.length },
          { name: 'Buyers', value: buyers.length },
          { name: 'Admins', value: admins.length }
        ]
        
        setAnalyticsData(prev => ({ ...prev, userData }))
      }

      if (productsData.data) {
        setProducts(productsData.data)
        const productsByCategory = {}
        
        productsData.data.forEach(product => {
          if (!productsByCategory[product.category_id]) {
            productsByCategory[product.category_id] = {
              available: 0,
              sold: 0
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
          name: categoriesData.data?.find(c => c.id === categoryId)?.name || 'Unknown',
          available: stats.available,
          sold: stats.sold
        }))

        setAnalyticsData(prev => ({ ...prev, productData }))
      }

      if (categoriesData.data) {
        setCategories(categoriesData.data)
      }

      // Process sales data
      if (ordersData.data) {
        const salesByMonth = {}
        ordersData.data.forEach(order => {
          const date = new Date(order.created_at)
          const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' })
          
          if (!salesByMonth[monthYear]) {
            salesByMonth[monthYear] = {
              sales: 0,
              orders: 0
            }
          }
          salesByMonth[monthYear].sales += parseFloat(order.total_amount)
          salesByMonth[monthYear].orders++
        })

        // Prepare sales data for line chart
        const salesData = Object.entries(salesByMonth).map(([monthYear, data]) => ({
          name: monthYear,
          sales: data.sales,
          orders: data.orders
        }))

        setAnalyticsData(prev => ({ ...prev, salesData }))
      }

      // Update overall stats
      setStats({
        totalUsers: usersData.data?.length || 0,
        totalSellers: usersData.data?.filter(u => u.role === 'seller').length || 0,
        totalBuyers: usersData.data?.filter(u => u.role === 'buyer').length || 0,
        totalProducts: productsData.data?.length || 0,
        totalSales: ordersData.data?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0,
        totalOrders: ordersData.data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Failed to update user role')
      console.error(error)
    } else {
      alert('User role updated successfully')
      fetchData()
    }
  }

  const deleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        alert('Failed to delete product')
        console.error(error)
      } else {
        fetchData()
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--background)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-2" style={{borderColor: 'var(--bg-card-pink)'}}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Card Skeleton */}
          <Card className="border-2" style={{borderColor: 'var(--bg-card-pink)'}}>
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
    <div className="min-h-screen" style={{backgroundColor: 'var(--background)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your numsthrift platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2" style={{borderColor: 'var(--bg-card-pink)'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">Registered members</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{borderColor: 'var(--bg-card-purple)'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sellers</CardTitle>
              <TrendingUp className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.totalSellers}</div>
              <p className="text-xs text-gray-500 mt-1">Active sellers</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{borderColor: 'var(--bg-card-pink)'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Buyers</CardTitle>
              <ShoppingCart className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.totalBuyers}</div>
              <p className="text-xs text-gray-500 mt-1">Active buyers</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{borderColor: 'var(--bg-card-purple)'}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalProducts}</div>
              <p className="text-xs text-gray-500 mt-1">Listed items</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Card className="border-2" style={{borderColor: 'var(--bg-card-pink)'}}>
          <div className="border-b">
            <nav className="flex flex-wrap gap-4 px-6 py-4" aria-label="Tabs">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('overview')}
                className={activeTab === 'overview' ? 'bg-primary text-primary-foreground' : ''}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('users')}
                className={activeTab === 'users' ? 'bg-primary text-primary-foreground' : ''}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button
                variant={activeTab === 'products' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('products')}
                className={activeTab === 'products' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Package className="h-4 w-4 mr-2" />
                Products
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('settings')}
                className={activeTab === 'settings' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </nav>
          </div>

          <CardContent className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-primary mb-4">Analytics Dashboard</h2>
                  
                  {/* Sales Overview Chart */}
                  <div className="mb-6">
                    <SalesChart data={analyticsData.salesData} />
                  </div>

                  {/* User and Product Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <UserDistributionChart data={analyticsData.userData} />
                    <ProductsChart data={analyticsData.productData} />
                  </div>

                  {/* Detailed Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-card-pink)'}}>
                      <h3 className="font-semibold text-gray-900 mb-2">Platform Statistics</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Total Sales:</span>
                          <span className="font-medium text-primary">${stats.totalSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Orders:</span>
                          <span className="font-medium text-secondary">{stats.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Order Value:</span>
                          <span className="font-medium text-accent">
                            ${stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-card-purple)'}}>
                      <h3 className="font-semibold text-gray-900 mb-2">User Engagement</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Active Sellers:</span>
                          <span className="font-medium text-primary">{stats.totalSellers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products per Seller:</span>
                          <span className="font-medium text-secondary">
                            {stats.totalSellers > 0 ? (stats.totalProducts / stats.totalSellers).toFixed(1) : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buyer to Seller Ratio:</span>
                          <span className="font-medium text-accent">
                            {stats.totalSellers > 0 ? (stats.totalBuyers / stats.totalSellers).toFixed(1) : '0'}:1
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border-2" style={{borderColor: 'var(--bg-card-pink)', backgroundColor: 'var(--bg-hero)'}}>
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setActiveTab('users')} className="bg-secondary hover:bg-secondary-hover">
                      Manage Users
                    </Button>
                    <Button onClick={() => setActiveTab('products')} className="bg-accent hover:bg-accent-light">
                      View Products
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-primary mb-4">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'seller' ? 'text-secondary' :
                              'text-accent'
                            }`} style={{
                              backgroundColor: user.role === 'seller' ? 'var(--bg-card-purple)' :
                                             user.role === 'buyer' ? 'var(--bg-card-pink)' : ''
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-primary"
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
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h2 className="text-xl font-semibold text-primary mb-4">Product Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${parseFloat(product.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === 'available' ? 'bg-green-100 text-green-800' :
                              product.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {product.condition?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button
                              onClick={() => deleteProduct(product.id)}
                              variant="ghost"
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
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
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-primary mb-4">Platform Settings</h2>
                <div className="space-y-6">
                  <Card className="border" style={{borderColor: 'var(--bg-card-pink)'}}>
                    <CardHeader>
                      <CardTitle className="text-base">Email Configuration</CardTitle>
                      <CardDescription>Email auto-confirmation is enabled for all new users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Auto-confirm enabled</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border" style={{borderColor: 'var(--bg-card-purple)'}}>
                    <CardHeader>
                      <CardTitle className="text-base">Database Information</CardTitle>
                      <CardDescription>Current platform statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tables:</span>
                          <span className="font-medium">users, products, categories, cart_items</span>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
