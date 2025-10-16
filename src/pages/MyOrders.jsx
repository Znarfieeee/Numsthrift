import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PackageIcon, TruckIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from 'lucide-react'
import { toast } from 'sonner'

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'default',
    icon: ClockIcon,
    color: 'text-yellow-600',
  },
  processing: {
    label: 'Processing',
    variant: 'secondary',
    icon: PackageIcon,
    color: 'text-blue-600',
  },
  shipped: {
    label: 'Shipped',
    variant: 'secondary',
    icon: TruckIcon,
    color: 'text-purple-600',
  },
  delivered: {
    label: 'Delivered',
    variant: 'default',
    icon: CheckCircle2Icon,
    color: 'text-green-600',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    icon: XCircleIcon,
    color: 'text-red-600',
  },
}

function OrderCard({ order, userRole, onStatusUpdate }) {
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(
          `
          *,
          products (
            id,
            title,
            image_url,
            brand
          )
        `
        )
        .eq('order_id', order.id)

      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error('Error fetching order items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (error) throw error

      // If order is cancelled, update all products in the order back to available
      if (newStatus === 'cancelled') {
        const { data: orderItems, error: fetchError } = await supabase
          .from('order_items')
          .select('product_id')
          .eq('order_id', order.id)

        if (!fetchError && orderItems) {
          const productIds = orderItems.map(item => item.product_id)

          const { error: updateError } = await supabase
            .from('products')
            .update({ status: 'available' })
            .in('id', productIds)

          if (updateError) {
            console.error('Error updating product status:', updateError)
          }
        }
      }

      toast.success(newStatus === 'cancelled' ? 'Order cancelled successfully!' : 'Order status updated successfully!')
      if (onStatusUpdate) onStatusUpdate()
    } catch (error) {
      toast.error('Error updating order status: ' + error.message)
    }
  }

  const StatusIcon = statusConfig[order.status]?.icon || ClockIcon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
            <CardDescription className="text-xs">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </CardDescription>
          </div>
          <Badge variant={statusConfig[order.status]?.variant} className="gap-1.5">
            <StatusIcon className={`h-3 w-3 ${statusConfig[order.status]?.color}`} />
            {statusConfig[order.status]?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Order Items */}
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.title}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-100">
                      <PackageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.products?.title || 'Product'}</h4>
                    {item.products?.brand && (
                      <p className="text-xs text-gray-500">{item.products.brand}</p>
                    )}
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{parseFloat(item.price_at_purchase).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Details */}
            <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">
                  {order.payment_method.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping Address:</span>
                <span className="max-w-xs truncate text-right font-medium">
                  {order.shipping_address}
                </span>
              </div>
              {order.shipping_phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium">{order.shipping_phone}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total Amount:</span>
                <span className="text-pink-600">₱{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Seller Actions */}
            {userRole === 'seller' && order.status !== 'cancelled' && order.status !== 'delivered' && (
              <div className="flex flex-wrap gap-2 pt-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('processing')}
                      className="flex-1"
                    >
                      Mark as Processing
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange('cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === 'processing' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('shipped')}
                    className="flex-1"
                  >
                    Mark as Shipped
                  </Button>
                )}
                {order.status === 'shipped' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange('delivered')}
                    className="flex-1"
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            )}

            {/* Buyer Actions */}
            {userRole === 'buyer' && order.status === 'pending' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange('cancelled')}
                className="w-full"
              >
                Cancel Order
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyOrders() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user && profile) {
      fetchOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let query = supabase.from('orders').select('*')

      // Fetch based on user role
      if (profile?.role === 'seller' || profile?.role === 'admin') {
        query = query.eq('seller_id', user.id)
      } else {
        query = query.eq('buyer_id', user.id)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Error loading orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-gray-600">
          {profile?.role === 'seller' || profile?.role === 'admin'
            ? 'Manage and track orders from your customers'
            : 'Track and manage your orders'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(orderCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'border-pink-600 bg-pink-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50'
            }`}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label} ({count})
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <OrdersSkeleton />
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageIcon className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No orders found</h3>
            <p className="text-center text-gray-600">
              {filter === 'all'
                ? profile?.role === 'seller' || profile?.role === 'admin'
                  ? "You haven't received any orders yet"
                  : "You haven't placed any orders yet"
                : `No ${statusConfig[filter]?.label.toLowerCase()} orders`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              userRole={profile?.role}
              onStatusUpdate={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  )
}
