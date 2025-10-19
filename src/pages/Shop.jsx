import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Filter, ShoppingCart, ShoppingBag, X, Package, Tag, Star, Store } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ProductGridSkeleton } from '@/components/ui/product-skeleton'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const Shop = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [detailProduct, setDetailProduct] = useState(null)
  const [actionType, setActionType] = useState('') // 'add' or 'buy'
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const initializeShop = async () => {
      await fetchCategories()
      await fetchProducts()
    }
    initializeShop()
  }, [selectedCategory, priceRange, searchTerm])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')

    if (data) setCategories(data)
  }

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select(
        `
        *,
        users:seller_id (full_name),
        categories (name)
      `
      )
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      let filtered = data || []

      // Apply price filter
      if (priceRange !== 'all') {
        if (priceRange === 'under25') {
          filtered = filtered.filter((p) => parseFloat(p.price) < 25)
        } else if (priceRange === '25to50') {
          filtered = filtered.filter((p) => parseFloat(p.price) >= 25 && parseFloat(p.price) <= 50)
        } else if (priceRange === '50to100') {
          filtered = filtered.filter((p) => parseFloat(p.price) > 50 && parseFloat(p.price) <= 100)
        } else if (priceRange === 'over100') {
          filtered = filtered.filter((p) => parseFloat(p.price) > 100)
        }
      }

      setProducts(filtered)
    }
    setLoading(false)
  }

  const handleProductClick = (product) => {
    setDetailProduct(product)
    setShowProductDetail(true)
  }

  const handleProductAction = (product, action) => {
    if (!user) {
      toast.error('Please sign in to continue')
      setTimeout(() => {
        navigate('/login')
      }, 1000)
      return
    }

    // Check if product needs size selection
    const categoryName = product.categories?.name?.toLowerCase() || ''
    const needsSize = !categoryName.includes('bag') && !categoryName.includes('accessories')

    setSelectedProduct(product)
    setActionType(action)
    setSelectedSize('')
    setShowProductDetail(false)

    // If product doesn't need size, proceed directly
    if (!needsSize) {
      if (action === 'add') {
        addToCart(product.id, 'N/A')
      } else if (action === 'buy') {
        buyNow(product.id, 'N/A')
      }
    } else {
      setShowSizeDialog(true)
    }
  }

  const handleSizeConfirm = async () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }

    if (actionType === 'add') {
      await addToCart(selectedProduct.id, selectedSize)
    } else if (actionType === 'buy') {
      await buyNow(selectedProduct.id, selectedSize)
    }

    setShowSizeDialog(false)
    setSelectedProduct(null)
    setSelectedSize('')
  }

  const addToCart = async (productId, size) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{ user_id: user.id, product_id: productId, quantity: 1, size: size }])
        .select()

      if (error) {
        if (error.code === '23505') {
          toast.info('Item already in cart')
        } else {
          throw error
        }
      } else {
        toast.success('Added to cart!')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const buyNow = async (productId, size) => {
    try {
      // Add to cart first
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{ user_id: user.id, product_id: productId, quantity: 1, size: size }])
        .select()

      if (error && error.code !== '23505') {
        throw error
      }

      toast.success('Redirecting to checkout...')
      // Redirect to checkout after a brief delay
      setTimeout(() => {
        navigate('/checkout')
      }, 500)
    } catch (error) {
      console.error('Error processing order:', error)
      toast.error('Failed to process order')
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop All Items</h1>
          <p className="mt-2 text-gray-600">Find your next treasure</p>
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

            {/* Price Range Filter */}
            {/* <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="under25">Under $25</option>
              <option value="25to50">$25 - $50</option>
              <option value="50to100">$50 - $100</option>
              <option value="over100">Over $100</option>
            </select> */}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
              >
                <div className="flex h-56 flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-sm text-gray-400">No image</div>
                  )}
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

                  {/* Seller Information */}
                  {product.users?.full_name && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-600">
                      <Store className="h-3 w-3" style={{ color: 'var(--primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--primary)' }}>
                        {product.users.full_name}
                      </span>
                    </div>
                  )}

                  <p className="mb-3 line-clamp-2 text-xs text-gray-600" style={{ minHeight: '2.5rem' }}>
                    {product.description}
                  </p>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span
                      className="rounded-full px-2 py-1"
                      style={{ backgroundColor: 'var(--bg-card-pink)', color: 'var(--primary)' }}
                    >
                      {product.condition?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">{product.categories?.name}</span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProductAction(product, 'buy')
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: 'var(--primary)' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--primary)')
                      }
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Buy Now
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProductAction(product, 'add')
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-sm"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detailProduct && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {detailProduct.title}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Image Section */}
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border-2" style={{ borderColor: 'var(--bg-card-pink)' }}>
                    {detailProduct.image_url ? (
                      <img
                        src={detailProduct.image_url}
                        alt={detailProduct.title}
                        className="h-80 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-80 items-center justify-center bg-gray-100">
                        <Package className="h-20 w-20 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Additional Images */}
                  {detailProduct.additional_images && detailProduct.additional_images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {detailProduct.additional_images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${detailProduct.title} ${idx + 2}`}
                          className="h-20 w-full rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info Section */}
                <div className="space-y-4">
                  {/* Price */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                      ₱{parseFloat(detailProduct.price).toFixed(2)}
                    </div>
                  </div>

                  {/* Seller Information - Prominent Display */}
                  {detailProduct.users?.full_name && (
                    <div className="rounded-lg border-2 p-4" style={{ borderColor: 'var(--bg-card-pink)', backgroundColor: 'var(--bg-hero)' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                          <Store className="h-6 w-6" style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Sold by</div>
                          <div className="font-semibold text-gray-900" style={{ color: 'var(--primary)' }}>
                            {detailProduct.users.full_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                      <span className="font-semibold">Condition:</span>
                      <span className="rounded-full px-2 py-1 text-xs" style={{ backgroundColor: 'var(--bg-card-purple)', color: 'var(--secondary)' }}>
                        {detailProduct.condition?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                      <span className="font-semibold">Quantity Available:</span>
                      <span>{detailProduct.quantity}</span>
                    </div>

                    {detailProduct.brand && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                        <span className="font-semibold">Brand:</span>
                        <span>{detailProduct.brand}</span>
                      </div>
                    )}

                    {detailProduct.size && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                        <span className="font-semibold">Size:</span>
                        <span>{detailProduct.size}</span>
                      </div>
                    )}

                    {detailProduct.categories && (
                      <div className="flex items-center gap-2 text-sm">
                        <Filter className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                        <span className="font-semibold">Category:</span>
                        <span>{detailProduct.categories.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="rounded-lg border-2 p-4" style={{ borderColor: 'var(--bg-card-purple)' }}>
                    <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
                    <p className="text-sm text-gray-600">
                      {detailProduct.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleProductAction(detailProduct, 'buy')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: 'var(--primary)' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--primary)')
                      }
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Buy Now
                    </button>
                    <button
                      onClick={() => handleProductAction(detailProduct, 'add')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-medium transition-all duration-200 hover:shadow-sm"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Size Selection Dialog */}
      <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Size</DialogTitle>
            <DialogDescription>
              Please choose your size for {selectedProduct?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {(() => {
              const categoryName = selectedProduct?.categories?.name?.toLowerCase() || ''
              let sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] // Default clothing sizes

              // Shoe sizes
              if (categoryName.includes('shoe')) {
                sizes = ['5', '6', '7', '8', '9', '10', '11', '12']
              }

              return sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
                    selectedSize === size
                      ? 'text-white shadow-md'
                      : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  style={selectedSize === size ? { backgroundColor: 'var(--primary)' } : {}}
                >
                  {size}
                </button>
              ))
            })()}
          </div>
          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={() => setShowSizeDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSizeConfirm}
              className="flex-1 text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
