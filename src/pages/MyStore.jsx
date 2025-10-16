import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Package, Edit, Trash2, ImagePlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddProductDialog } from '@/components/AddProductDialog'
import { EditProductDialog } from '@/components/EditProductDialog'
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'
import { ProductGridSkeleton } from '@/components/ui/product-skeleton'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export const MyStore = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { user, profile, isSeller } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSeller) {
      navigate('/shop')
      return
    }

    const initializeStore = async () => {
      await fetchCategories()
      await fetchMyProducts()
    }
    initializeStore()
  }, [selectedCategory, selectedStatus, isSeller, navigate])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (data) setCategories(data)
  }

  const fetchMyProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, categories (name)')
      .eq('seller_id', user.id)

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }
    
    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
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
  }

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'draft', label: 'Draft' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Store</h1>
            <p className="mt-2 text-gray-600">Manage your products</p>
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

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No products found</h3>
            <p className="mb-4 text-gray-500">
              {searchTerm ? 'Try different search terms' : 'Start by adding your first product'}
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
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative flex h-48 flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
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
                  <div className="absolute top-2 right-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="line-clamp-2 flex-1 text-base font-semibold text-gray-900" style={{ minHeight: '3rem' }}>
                      {product.title}
                    </h3>
                    <span
                      className="ml-2 text-lg font-bold whitespace-nowrap"
                      style={{ color: 'var(--primary)' }}
                    >
                      ₱{parseFloat(product.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs text-gray-600" style={{ minHeight: '2.5rem' }}>
                    {product.description || 'No description'}
                  </p>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: 'var(--bg-card-pink)', color: 'var(--primary)' }}
                    >
                      {product.condition?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">Qty: {product.quantity}</span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-medium transition-all duration-200 hover:shadow-sm"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-red-500 px-2 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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