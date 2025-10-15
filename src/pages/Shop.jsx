import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Filter, ShoppingCart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ProductGridSkeleton } from '@/components/ui/product-skeleton'

export const Shop = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState('all')
  const { user } = useAuth()

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
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (data) setCategories(data)
  }

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select(`
        *,
        users:seller_id (full_name),
        categories (name)
      `)
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
          filtered = filtered.filter(p => parseFloat(p.price) < 25)
        } else if (priceRange === '25to50') {
          filtered = filtered.filter(p => parseFloat(p.price) >= 25 && parseFloat(p.price) <= 50)
        } else if (priceRange === '50to100') {
          filtered = filtered.filter(p => parseFloat(p.price) > 50 && parseFloat(p.price) <= 100)
        } else if (priceRange === 'over100') {
          filtered = filtered.filter(p => parseFloat(p.price) > 100)
        }
      }

      setProducts(filtered)
    }
    setLoading(false)
  }

  const addToCart = async (productId) => {
    if (!user) {
      alert('Please sign in to add items to cart')
      return
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .insert([
          { user_id: user.id, product_id: productId, quantity: 1 }
        ])
        .select()

      if (error) {
        if (error.code === '23505') {
          alert('Item already in cart')
        } else {
          throw error
        }
      } else {
        alert('Added to cart!')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart')
    }
  }

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop All Items</h1>
          <p className="mt-2 text-gray-600">Find your next treasure</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="under25">Under $25</option>
              <option value="25to50">$25 - $50</option>
              <option value="50to100">$50 - $100</option>
              <option value="over100">Over $100</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {product.title}
                    </h3>
                    <span className="text-lg font-bold text-blue-600 ml-2">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {product.condition?.replace('_', ' ')}
                    </span>
                    <span>{product.categories?.name}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
