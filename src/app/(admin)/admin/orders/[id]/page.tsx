'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Badge, Textarea } from '@/components/ui';
import { 
  ArrowLeftIcon,
  UserIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PrinterIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  payment_method: string;
  payment_status: string;
  shipping_address: any;
  billing_address: any;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    created_at: string;
  };
  order_items: Array<{
    id: string;
    item_type: string;
    item_id: string;
    item_title: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  order_status_logs: Array<{
    id: string;
    status: string;
    notes: string;
    created_at: string;
    changed_by: {
      email: string;
      full_name: string;
    };
  }>;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      setOrder(data);
      setAdminNotes(data.admin_notes || '');
    } catch (error) {
      console.error('Error fetching order details:', error);
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: params.id, 
          status: newStatus,
          notes: adminNotes 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const processRefund = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      setShowRefundModal(false);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCartIcon className="h-5 w-5" />
                Order Items
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.item_title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Type: {item.item_type}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span>${item.price} each</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.subtotal?.toFixed(2) || order.total_amount.toFixed(2)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">${order.shipping_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Status History */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Status History
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {order.order_status_logs?.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {index === 0 ? getStatusIcon(log.status) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        By: {log.changed_by?.full_name || log.changed_by?.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer Information
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{order.user.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
                {order.user.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{order.user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <p className="font-medium">
                    {new Date(order.user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Payment Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Payment Information
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="font-medium capitalize">{order.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {order.payment_status || 'pending'}
                  </Badge>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Admin Actions */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold">Admin Actions</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes about this order..."
                />
              </div>

              <div className="space-y-2">
                {order.status === 'pending' && (
                  <Button
                    className="w-full"
                    variant="primary"
                    onClick={() => updateOrderStatus('processing')}
                  >
                    Mark as Processing
                  </Button>
                )}
                {order.status === 'processing' && (
                  <Button
                    className="w-full"
                    variant="primary"
                    onClick={() => updateOrderStatus('completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateOrderStatus('cancelled')}
                  >
                    Cancel Order
                  </Button>
                )}
                {order.status === 'completed' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowRefundModal(true)}
                  >
                    Process Refund
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <Card.Header>
              <h3 className="text-lg font-semibold">Process Refund</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount
                </label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={order.total_amount.toString()}
                  max={order.total_amount}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Enter refund reason..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  variant="primary"
                  onClick={processRefund}
                  disabled={!refundReason}
                >
                  Process Refund
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}