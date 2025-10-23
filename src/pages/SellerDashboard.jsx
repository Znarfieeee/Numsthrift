import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AddProductDialog } from '@/components/AddProductDialog'
import { EditProductDialog } from '@/components/EditProductDialog'
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import { Plus, Edit, Trash2, Package, BarChart3, ImagePlus, Info, DollarSign, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export const SellerDashboard = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const [editingProduct, setEditingProduct] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name')

    if (data) setCategories(data)
  }, [])

  const fetchMyProducts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        categories (name)
      `
      )
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [user])

  const fetchMyOrders = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
  }, [user])

  useEffect(() => {
    fetchCategories()
    fetchMyProducts()
    fetchMyOrders()
  }, [fetchCategories, fetchMyProducts, fetchMyOrders])

  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product)
    setEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return

    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', productToDelete.id)

    if (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } else {
      toast.success('Product deleted successfully')
      fetchMyProducts()
    }

    setDeleting(false)
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }, [productToDelete, fetchMyProducts])

  const stats = useMemo(
    () => {
      // Calculate completed sales (delivered orders)
      const deliveredOrders = orders.filter((o) => o.status === 'delivered')
      const completedSales = deliveredOrders.length

      // Calculate total revenue from delivered orders
      const totalRevenue = deliveredOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total_amount || 0)
      }, 0)

      return {
        totalProducts: products.length,
        availableProducts: products.filter((p) => p.status === 'available').length,
        completedSales: completedSales,
        totalRevenue: totalRevenue,
        draftProducts: products.filter((p) => p.status === 'draft').length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
      }
    },
    [products, orders]
  )

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="mb-2 h-9 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-36" />
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
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-40" />
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-primary mb-2 text-3xl font-bold">Seller Dashboard</h1>
          </div>
          <AddProductDialog
            onSuccess={fetchMyProducts}
            trigger={
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-md">
                <Plus className="mr-2 h-5 w-5" />
                Add Product
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <Package className="text-primary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-primary text-3xl font-bold">{stats.totalProducts}</div>
              <p className="mt-1 text-xs text-gray-500">All your listings</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-purple)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sales</CardTitle>
              <ShoppingCart className="text-secondary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-secondary text-3xl font-bold">{stats.completedSales}</div>
              <p className="mt-1 text-xs text-gray-500">Delivered orders</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="text-accent h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-accent text-3xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
              <p className="mt-1 text-xs text-gray-500">From delivered orders</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-purple)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{stats.pendingOrders}</div>
              <p className="mt-1 text-xs text-gray-500">Awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
          <div className="border-b">
            <nav className="flex flex-wrap gap-4 px-6 py-4" aria-label="Tabs">
              <Button
                variant={activeTab === 'products' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('products')}
                className={activeTab === 'products' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Package className="mr-2 h-4 w-4" />
                Products
              </Button>
              {/* <Button
                variant={activeTab === 'guide' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('guide')}
                className={activeTab === 'guide' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Info className="mr-2 h-4 w-4" />
                Image Upload Guide
              </Button> */}
            </nav>
          </div>

          <CardContent className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                {products.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <p className="mb-4 text-lg text-gray-500">
                      You haven't listed any products yet
                    </p>
                    <AddProductDialog
                      onSuccess={fetchMyProducts}
                      trigger={
                        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Product
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="overflow-hidden rounded-lg border-2 bg-white transition-shadow hover:shadow-lg"
                        style={{ borderColor: 'var(--bg-card-pink)' }}
                      >
                        <div className="relative flex h-48 items-center justify-center bg-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <ImagePlus className="mb-2 h-12 w-12" />
                              <span className="text-sm">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <h3 className="line-clamp-1 flex-1 text-lg font-semibold text-gray-900">
                              {product.title}
                            </h3>
                            <span className="text-primary ml-2 text-lg font-bold">
                              ₱{parseFloat(product.price).toFixed(2)}
                            </span>
                          </div>
                          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                            {product.description || 'No description'}
                          </p>
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`rounded-full px-2 py-1 font-medium ${
                                product.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : product.status === 'sold'
                                    ? 'bg-gray-100 text-gray-800'
                                    : product.status === 'draft'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {product.status}
                            </span>
                            <span
                              className="rounded-full px-2 py-1"
                              style={{
                                backgroundColor: 'var(--bg-card-purple)',
                                color: 'var(--secondary)',
                              }}
                            >
                              Qty: {product.quantity}
                            </span>
                            {product.categories && (
                              <span className="text-gray-500">{product.categories.name}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditProduct(product)}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(product)}
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Upload Guide Tab */}
            {activeTab === 'guide' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-primary mb-4 text-2xl font-bold">
                    How to Add Product Images
                  </h2>
                  <p className="mb-6 text-gray-600">
                    Follow these steps to add images to your product listings:
                  </p>
                </div>

                <Card className="border" style={{ borderColor: 'var(--bg-card-pink)' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                        1
                      </span>
                      Upload Your Image to a Hosting Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Use one of these free image hosting services:
                    </p>
                    <ul className="ml-4 list-inside list-disc space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>Imgur</strong> -{' '}
                        <a
                          href="https://imgur.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          imgur.com
                        </a>
                      </li>
                      <li>
                        <strong>ImgBB</strong> -{' '}
                        <a
                          href="https://imgbb.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          imgbb.com
                        </a>
                      </li>
                      <li>
                        <strong>Postimages</strong> -{' '}
                        <a
                          href="https://postimages.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          postimages.org
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border" style={{ borderColor: 'var(--bg-card-purple)' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="bg-secondary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                        2
                      </span>
                      Get the Direct Image Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      After uploading, copy the <strong>direct image URL</strong>. It should end
                      with an image extension like:
                    </p>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-gray-700">
                      <li>.jpg or .jpeg</li>
                      <li>.png</li>
                      <li>.webp</li>
                      <li>.gif</li>
                    </ul>
                    <div
                      className="mt-3 rounded p-3"
                      style={{ backgroundColor: 'var(--bg-card-purple)' }}
                    >
                      <p className="font-mono text-xs text-gray-700">
                        Example: https://i.imgur.com/abc123.jpg
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border" style={{ borderColor: 'var(--bg-card-pink)' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="bg-accent flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                        3
                      </span>
                      Paste the URL in the Product Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">When creating or editing a product:</p>
                    <ol className="ml-4 list-inside list-decimal space-y-2 text-sm text-gray-700">
                      <li>Click "Add Product" or "Edit" on an existing product</li>
                      <li>Scroll to the "Image URL" field</li>
                      <li>Paste your direct image link</li>
                      <li>Click "Create Product" or "Update Product"</li>
                    </ol>
                  </CardContent>
                </Card>

                <div
                  className="rounded-lg border-2 p-4"
                  style={{
                    borderColor: 'var(--bg-card-purple)',
                    backgroundColor: 'var(--bg-hero)',
                  }}
                >
                  <p className="flex items-start gap-2 text-sm text-gray-700">
                    <Info className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>
                      <strong>Tip:</strong> Make sure your images are clear, well-lit, and show the
                      product from multiple angles for better sales!
                    </span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editingProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchMyProducts}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        productTitle={productToDelete?.title || ''}
        loading={deleting}
      />
    </div>
  )
}
