import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Trash2, Plus, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export const Cart = () => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      navigate('/login')
    }
  }, [user])

  const fetchCartItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        *,
        products (
          *,
          users:seller_id (full_name),
          categories (name)
        )
      `
      )
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching cart:', error)
    } else {
      setCartItems(data || [])
    }
    setLoading(false)
  }

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId)

    if (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    } else {
      fetchCartItems()
    }
  }

  const removeItem = async (itemId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId)

    if (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    } else {
      toast.success('Item removed from cart')
      fetchCartItems()
    }
  }

  const proceedToCheckout = () => {
    navigate('/checkout')
  }

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => {
        return total + parseFloat(item.products.price) * item.quantity
      }, 0)
      .toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-8 h-9 w-48" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items Skeleton */}
            <div className="space-y-4 lg:col-span-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 rounded-lg bg-white p-6 shadow">
                  <Skeleton className="h-24 w-24 rounded" />
                  <div className="flex-1">
                    <div className="mb-4 flex justify-between">
                      <div className="flex-1">
                        <Skeleton className="mb-2 h-6 w-3/4" />
                        <Skeleton className="mb-1 h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary Skeleton */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white p-6 shadow">
                <Skeleton className="mb-4 h-7 w-40" />
                <div className="mb-6 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-4 h-6 w-full" />
                </div>
                <Skeleton className="mb-3 h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow">
            <p className="mb-4 text-lg text-gray-500">Your cart is empty</p>
            <button
              onClick={() => navigate('/shop')}
              className="rounded-md px-6 py-2 text-white transition-all hover:shadow-md"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                  <div className="h-28 w-28 flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
                    {item.products.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.title}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.products.title}
                        </h3>
                        <p className="text-sm text-gray-500">{item.products.categories?.name}</p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-card-pink)', color: 'var(--primary)' }}>
                            {item.products.condition?.replace('_', ' ')}
                          </span>
                          {item.size && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                          ₱{parseFloat(item.products.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-lg p-1.5 transition-colors"
                          style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="rounded-lg px-5 py-1.5 font-medium" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-lg p-1.5 transition-colors"
                          style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Order Summary</h2>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₱{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-sm">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold" style={{ borderColor: 'var(--border)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>₱{calculateTotal()}</span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full rounded-lg px-4 py-3 font-medium text-white transition-all hover:shadow-md mb-3"
                  style={{ backgroundColor: 'var(--primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full rounded-lg px-4 py-3 font-medium bg-white transition-all hover:shadow-sm"
                  style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-pink)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
