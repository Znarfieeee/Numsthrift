import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProductForm } from '@/components/ProductForm'
import { Plus, Edit, Trash2, Package, BarChart3, ImagePlus, Info } from 'lucide-react'
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

export const SellerDashboard = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [activeTab, setActiveTab] = useState('products')
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'good',
    category_id: '',
    image_url: '',
    size: '',
    brand: '',
    quantity: 1,
    status: 'available',
  })

  useEffect(() => {
    fetchCategories()
    fetchMyProducts()
  }, [user])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')

    if (data) setCategories(data)
  }

  const fetchMyProducts = async () => {
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
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const productData = {
      ...formData,
      seller_id: user.id,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)

      if (error) {
        console.error('Error updating product:', error)
        alert('Failed to update product')
      } else {
        alert('Product updated successfully!')
        closeModal()
        fetchMyProducts()
      }
    } else {
      const { error } = await supabase.from('products').insert([productData])

      if (error) {
        console.error('Error creating product:', error)
        alert('Failed to create product')
      } else {
        alert('Product created successfully!')
        closeModal()
        fetchMyProducts()
      }
    }
  }

  const deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      } else {
        fetchMyProducts()
      }
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        title: product.title,
        description: product.description || '',
        price: product.price,
        condition: product.condition,
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        size: product.size || '',
        brand: product.brand || '',
        quantity: product.quantity,
        status: product.status,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        title: '',
        description: '',
        price: '',
        condition: 'good',
        category_id: '',
        image_url: '',
        size: '',
        brand: '',
        quantity: 1,
        status: 'available',
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const stats = {
    totalProducts: products.length,
    availableProducts: products.filter((p) => p.status === 'available').length,
    soldProducts: products.filter((p) => p.status === 'sold').length,
    draftProducts: products.filter((p) => p.status === 'draft').length,
  }

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
          <Button
            onClick={() => openModal()}
            className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-md"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Product
          </Button>
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
              <CardTitle className="text-sm font-medium text-gray-600">Available</CardTitle>
              <BarChart3 className="text-secondary h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-secondary text-3xl font-bold">{stats.availableProducts}</div>
              <p className="mt-1 text-xs text-gray-500">Ready for sale</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sold</CardTitle>
              <BarChart3 className="text-accent h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className="text-accent text-3xl font-bold">{stats.soldProducts}</div>
              <p className="mt-1 text-xs text-gray-500">Completed sales</p>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: 'var(--bg-card-purple)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
              <Edit className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{stats.draftProducts}</div>
              <p className="mt-1 text-xs text-gray-500">Unpublished</p>
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
              <Button
                variant={activeTab === 'guide' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('guide')}
                className={activeTab === 'guide' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Info className="mr-2 h-4 w-4" />
                Image Upload Guide
              </Button>
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
                    <Button
                      onClick={() => openModal()}
                      className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Product
                    </Button>
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
                              ${parseFloat(product.price).toFixed(2)}
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
                              onClick={() => openModal(product)}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground flex-1"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteProduct(product.id)}
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

        {/* Product Modal */}
        {showModal && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <h2 className="text-primary mb-4 text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Product title"
                      className="focus:ring-primary focus:border-primary focus:ring-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your product"
                      className="focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                        Price * ($)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        name="price"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="focus:ring-primary focus:border-primary focus:ring-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                        Quantity *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        name="quantity"
                        required
                        min="0"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="focus:ring-primary focus:border-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id" className="text-sm font-semibold text-gray-700">
                        Category
                      </Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => handleSelectChange('category_id', value)}
                      >
                        <SelectTrigger className="focus:ring-primary focus:ring-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition" className="text-sm font-semibold text-gray-700">
                        Condition *
                      </Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => handleSelectChange('condition', value)}
                      >
                        <SelectTrigger className="focus:ring-primary focus:ring-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="like_new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-sm font-semibold text-gray-700">
                        Brand
                      </Label>
                      <Input
                        id="brand"
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="e.g., Nike, Zara"
                        className="focus:ring-primary focus:border-primary focus:ring-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-semibold text-gray-700">
                        Size
                      </Label>
                      <Input
                        id="size"
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        placeholder="e.g., M, L, XL"
                        className="focus:ring-primary focus:border-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className="focus:ring-primary focus:ring-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-sm font-semibold text-gray-700">
                      Image URL
                    </Label>
                    <Input
                      id="image_url"
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="focus:ring-primary focus:border-primary focus:ring-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      See the "Image Upload Guide" tab for instructions on how to get an image URL
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-primary-foreground flex-1"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                    <Button type="button" onClick={closeModal} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
