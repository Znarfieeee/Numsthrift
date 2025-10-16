import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import PlaceOrderLoading from '@/components/PlaceOrderLoading'

export const Checkout = () => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    province: '',
    city: '',
    barangay: '',
    street: '',
    deliveryInstructions: '',
    phone: '',
    voucherCode: '',
    paymentMethod: 'cash_on_delivery',
    notes: '',
    // Payment specific fields
    gcashNumber: '',
    gcashName: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVV: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: ''
  })

  const [voucherDiscount, setVoucherDiscount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchCartItems()
      // Pre-fill phone from profile if available
      if (profile) {
        setFormData(prev => ({
          ...prev,
          phone: profile.phone || ''
        }))
      }
    } else {
      navigate('/login')
    }
  }, [user, profile])

  // Philippine provinces (sample list - you can expand this)
  const provinces = [
    'Metro Manila', 'Cebu', 'Davao', 'Cavite', 'Laguna', 'Rizal', 'Bulacan',
    'Pampanga', 'Batangas', 'Quezon', 'Iloilo', 'Negros Occidental', 'Leyte'
  ]

  const fetchCartItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          *,
          users:seller_id (full_name),
          categories (name)
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching cart:', error)
      toast.error('Failed to load cart items')
    } else if (!data || data.length === 0) {
      toast.info('Your cart is empty')
      navigate('/cart')
    } else {
      setCartItems(data || [])
    }
    setLoading(false)
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.products.price) * item.quantity
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return (subtotal - voucherDiscount).toFixed(2)
  }

  const applyVoucher = () => {
    // Simple voucher validation (you can expand this)
    if (formData.voucherCode.toUpperCase() === 'SAVE10') {
      const discount = calculateSubtotal() * 0.1
      setVoucherDiscount(discount)
      toast.success(`Voucher applied! You saved ₱${discount.toFixed(2)}`)
    } else if (formData.voucherCode.toUpperCase() === 'SAVE20') {
      const discount = calculateSubtotal() * 0.2
      setVoucherDiscount(discount)
      toast.success(`Voucher applied! You saved ₱${discount.toFixed(2)}`)
    } else if (formData.voucherCode) {
      toast.error('Invalid voucher code')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate address fields
    if (!formData.province) {
      toast.error('Please select a province')
      return
    }
    if (!formData.city.trim()) {
      toast.error('Please enter your city/municipality')
      return
    }
    if (!formData.barangay.trim()) {
      toast.error('Please enter your barangay')
      return
    }
    if (!formData.street.trim()) {
      toast.error('Please enter your street address')
      return
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your contact phone number')
      return
    }

    // Validate payment method specific fields
    if (formData.paymentMethod === 'gcash') {
      if (!formData.gcashNumber.trim() || !formData.gcashName.trim()) {
        toast.error('Please enter your GCash details')
        return
      }
    } else if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber.trim() || !formData.cardName.trim() || !formData.cardExpiry.trim() || !formData.cardCVV.trim()) {
        toast.error('Please complete all card details')
        return
      }
    } else if (formData.paymentMethod === 'bank_transfer') {
      if (!formData.bankName.trim() || !formData.bankAccountNumber.trim() || !formData.bankAccountName.trim()) {
        toast.error('Please complete all bank transfer details')
        return
      }
    }

    setSubmitting(true)

    // Construct full address
    const fullAddress = `${formData.street}, ${formData.barangay}, ${formData.city}, ${formData.province}${formData.deliveryInstructions ? ` - ${formData.deliveryInstructions}` : ''}`

    try {
      // Group items by seller
      const itemsBySeller = {}
      cartItems.forEach(item => {
        const sellerId = item.products.seller_id
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = []
        }
        itemsBySeller[sellerId].push(item)
      })

      // Create an order for each seller
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const orderTotal = items.reduce((total, item) => {
          return total + parseFloat(item.products.price) * item.quantity
        }, 0)

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            buyer_id: user.id,
            seller_id: sellerId,
            total_amount: orderTotal,
            payment_method: formData.paymentMethod,
            shipping_address: fullAddress,
            shipping_phone: formData.phone,
            notes: formData.notes || null,
            status: 'pending'
          }])
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.products.price
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // Update product status to pending
        for (const item of items) {
          await supabase
            .from('products')
            .update({ status: 'pending' })
            .eq('id', item.product_id)
        }

        // Remove items from cart
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .in('id', items.map(item => item.id))

        if (deleteError) throw deleteError
      }

      // Show success and redirect after a delay to allow animation
      setTimeout(() => {
        toast.success('Order placed successfully!')
        navigate('/my-orders')
      }, 2000)
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Information</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': 'var(--primary)' }}
                      required
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City/Municipality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter city/municipality"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': 'var(--primary)' }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.barangay}
                      onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                      placeholder="Enter barangay"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': 'var(--primary)' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g., 09171234567"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': 'var(--primary)' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="House/Unit No., Building, Street Name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'var(--primary)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    value={formData.deliveryInstructions}
                    onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                    placeholder="Additional details (e.g., Landmarks, gate code, etc.)"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'var(--primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions for your order"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': 'var(--primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: formData.paymentMethod === 'cash_on_delivery' ? 'var(--primary)' : '#d1d5db' }}>
                  <label
                    className="flex items-center gap-3 p-4 cursor-pointer transition-all"
                    style={{ backgroundColor: formData.paymentMethod === 'cash_on_delivery' ? 'var(--bg-card-pink)' : 'white' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="font-medium">Cash on Delivery</span>
                  </label>
                </div>

                {/* GCash */}
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: formData.paymentMethod === 'gcash' ? 'var(--primary)' : '#d1d5db' }}>
                  <label
                    className="flex items-center gap-3 p-4 cursor-pointer transition-all"
                    style={{ backgroundColor: formData.paymentMethod === 'gcash' ? 'var(--bg-card-pink)' : 'white' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={formData.paymentMethod === 'gcash'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="font-medium">GCash</span>
                  </label>
                  {formData.paymentMethod === 'gcash' && (
                    <div className="p-4 space-y-3 border-t" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GCash Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.gcashNumber}
                          onChange={(e) => setFormData({ ...formData, gcashNumber: e.target.value })}
                          placeholder="e.g., 09171234567"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'gcash'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.gcashName}
                          onChange={(e) => setFormData({ ...formData, gcashName: e.target.value })}
                          placeholder="Full name registered with GCash"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'gcash'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit/Debit Card */}
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: formData.paymentMethod === 'card' ? 'var(--primary)' : '#d1d5db' }}>
                  <label
                    className="flex items-center gap-3 p-4 cursor-pointer transition-all"
                    style={{ backgroundColor: formData.paymentMethod === 'card' ? 'var(--bg-card-pink)' : 'white' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="font-medium">Credit/Debit Card</span>
                  </label>
                  {formData.paymentMethod === 'card' && (
                    <div className="p-4 space-y-3 border-t" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'card'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.cardName}
                          onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                          placeholder="Name as shown on card"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'card'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.cardExpiry}
                            onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                            placeholder="MM/YY"
                            maxLength="5"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                            style={{ '--tw-ring-color': 'var(--primary)' }}
                            required={formData.paymentMethod === 'card'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.cardCVV}
                            onChange={(e) => setFormData({ ...formData, cardCVV: e.target.value })}
                            placeholder="123"
                            maxLength="4"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                            style={{ '--tw-ring-color': 'var(--primary)' }}
                            required={formData.paymentMethod === 'card'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: formData.paymentMethod === 'bank_transfer' ? 'var(--primary)' : '#d1d5db' }}>
                  <label
                    className="flex items-center gap-3 p-4 cursor-pointer transition-all"
                    style={{ backgroundColor: formData.paymentMethod === 'bank_transfer' ? 'var(--bg-card-pink)' : 'white' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="font-medium">Bank Transfer</span>
                  </label>
                  {formData.paymentMethod === 'bank_transfer' && (
                    <div className="p-4 space-y-3 border-t" style={{ backgroundColor: 'var(--bg-card-pink)' }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="e.g., BPI, BDO, Metrobank"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'bank_transfer'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                          placeholder="Enter account number"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'bank_transfer'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccountName}
                          onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                          placeholder="Full name of account holder"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 transition-all bg-white"
                          style={{ '--tw-ring-color': 'var(--primary)' }}
                          required={formData.paymentMethod === 'bank_transfer'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voucher */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Apply Voucher</h2>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.voucherCode}
                    onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                    placeholder="Enter voucher code"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all"
                    style={{ focusRingColor: 'var(--primary)' }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={applyVoucher}
                  className="px-6 text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Apply
                </Button>
              </div>
              {voucherDiscount > 0 && (
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--primary)' }}>
                  Voucher applied! You saved ₱{voucherDiscount.toFixed(2)}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">Try: SAVE10 or SAVE20</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
                      {item.products.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.products.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {item.size && `Size: ${item.size} • `}Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                        ₱{(parseFloat(item.products.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between" style={{ color: 'var(--primary)' }}>
                    <span>Discount</span>
                    <span>-₱{voucherDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-sm">To be calculated</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₱{calculateTotal()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg px-4 py-3 font-medium text-white transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--primary)' }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Place Order Loading Dialog */}
      <Dialog open={submitting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0">
          <div className="flex items-center justify-center">
            <PlaceOrderLoading />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
