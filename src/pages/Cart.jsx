import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Trash2, Plus, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'

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
    } else {
      fetchCartItems()
    }
  }

  const removeItem = async (itemId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId)

    if (error) {
      console.error('Error removing item:', error)
    } else {
      fetchCartItems()
    }
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
              className="bg-primary hover:bg-primary/80 rounded-md px-6 py-2 text-white"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg bg-white p-6 shadow">
                  <div className="h-24 w-24 flex-shrink-0 rounded bg-gray-200">
                    {item.products.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.title}
                        className="h-full w-full rounded object-cover"
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
                        <p className="text-sm text-gray-500">
                          Condition: {item.products.condition?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          ${parseFloat(item.products.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="rounded border border-gray-300 px-4 py-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
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
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Order Summary</h2>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${calculateTotal()}</span>
                  </div>
                </div>

                <button
                  className="w-full cursor-not-allowed rounded-md bg-gray-400 px-4 py-3 font-medium text-white"
                  disabled
                >
                  Checkout (Coming Soon)
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="mt-3 w-full rounded-md border border-blue-600 bg-white px-4 py-3 font-medium text-blue-600 hover:bg-blue-50"
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
