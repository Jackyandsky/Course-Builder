'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { CheckCircle, Package, Download, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderItem {
  id: string;
  item_type: string;
  item_title: string;
  quantity: number;
  price: number;
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
  order_items: OrderItem[];
}

function CheckoutSuccessContent() {
  const { user } = useAuth();
  const { clearCart, refreshCart } = useCart();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  const formatPrice = (price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  useEffect(() => {
    let isVerificationInProgress = false;
    
    const verifyPayment = async () => {
      // Prevent duplicate calls
      if (isVerificationInProgress || !sessionId || !orderId) {
        if (!sessionId || !orderId) {
          setError('Missing payment information');
          setLoading(false);
        }
        return;
      }

      isVerificationInProgress = true;

      try {
        const response = await fetch('/api/checkout/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            order_id: orderId
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setOrder(data.order);
        
        // Ensure cart is cleared after successful payment
        if (data.order?.payment_status === 'completed') {
          // First refresh to sync with server state (server cleared cart during verification)
          await refreshCart();
          // If cart still has items, clear it explicitly
          try {
            await clearCart();
          } catch (cartError) {
            console.debug('Cart already cleared or error clearing:', cartError);
          }
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
        isVerificationInProgress = false;
      }
    };

    verifyPayment();
  }, [sessionId, orderId]); // Removed clearCart from dependencies to prevent re-renders

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Verifying payment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="space-x-4">
              <Link href="/account/orders">
                <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  View Orders
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find your order details.</p>
            <Link href="/account/orders">
              <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Your order has been confirmed and you'll receive an email confirmation shortly.
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <div className="text-right">
                <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('en-CA')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{item.item_title}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.item_type} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(order.tax_amount, order.currency)}</span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total_amount, order.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Access Information */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
          <div className="flex items-start">
            <Download className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div className="w-full">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Access Your Purchases</h3>
              <p className="text-blue-800 mb-4">
                Your purchased items are now available in your account. You can manage your courses and packages from your account dashboard.
              </p>
              <div className="flex gap-4">
                <Link href="/account" className="inline-block">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center transition-colors">
                    <Package className="h-4 w-4 mr-2" />
                    View Account
                  </button>
                </Link>
                <Link href="/account/orders" className="inline-block">
                  <button className="bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 inline-flex items-center transition-colors">
                    View All Orders
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Continue Learning</h3>
          <div className="flex justify-center gap-4">
            <Link href="/courses" className="inline-block">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Browse Courses
              </button>
            </Link>
            <Link href="/store" className="inline-block">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Explore Store
              </button>
            </Link>
          </div>
        </div>

        {/* Customer Support */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@igps.ca" className="text-blue-600 hover:text-blue-700">
              support@igps.ca
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}