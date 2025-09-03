import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import Link from 'next/link';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Eye, 
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';

interface OrderItem {
  id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

async function getOrders(page = 1, limit = 10, statusFilter = 'all') {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Build query
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        item_type,
        item_id,
        item_title,
        quantity,
        price,
        total
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply status filter
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: orders, error, count } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }

  return {
    orders: orders || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > page * limit
    }
  };
}

function formatPrice(price: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'cancelled':
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Package className="h-4 w-4 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const statusFilter = searchParams.status || 'all';
  
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  let ordersData;
  let error = null;

  try {
    ordersData = await getOrders(page, 10, statusFilter);
  } catch (err) {
    error = 'Failed to load orders';
    console.error(err);
  }

  if (!ordersData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600 mb-8">Please sign in to view your orders.</p>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { orders, pagination } = ordersData;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Orders</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/account">
            <Button variant="primary">Back to Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your purchases</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              <div className="flex gap-2">
                {['all', 'completed', 'pending', 'cancelled'].map((status) => (
                  <Link 
                    key={status}
                    href={`/account/orders${status !== 'all' ? `?status=${status}` : ''}`}
                  >
                    <button
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        statusFilter === status
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {pagination.total} total orders
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-8">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${statusFilter} orders found.`
              }
            </p>
            <Link href="/courses">
              <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.order_items.length} items
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(order.total_amount, order.currency)}
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mt-3 max-w-2xl">
                        <div className="text-sm text-gray-800 space-y-1">
                          {order.order_items.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="flex-1">{item.item_title} × {item.quantity}</span>
                              <span className="text-gray-900 font-medium whitespace-nowrap">{formatPrice(item.total, order.currency)}</span>
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <div className="text-gray-500 italic">
                              +{order.order_items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex">
                      <Link href={`/account/orders/${order.id}`}>
                        <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-gray-600">
                  Showing page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/account/orders?page=${page - 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}>
                      <Button className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {page < pagination.totalPages && (
                    <Link href={`/account/orders?page=${page + 1}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`}>
                      <Button className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}