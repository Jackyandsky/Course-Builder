'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSingletonSupabaseClient } from '@/lib/supabase-singleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  CreditCard, Plus, Trash2, Edit2, Check,
  AlertCircle, Download, Calendar, TrendingUp,
  DollarSign, Package, FileText, ChevronRight,
  Shield, Lock, Star, Award
} from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  email?: string;
  bank_name?: string;
  is_default: boolean;
  created_at: string;
}

interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice_url?: string;
}

interface Subscription {
  id: string;
  name: string;
  status: 'active' | 'cancelled' | 'paused';
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string;
  features: string[];
}

export default function BillingPage() {
  const { user } = useAuth();
  const supabase = getSingletonSupabaseClient();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      exp_month: 12,
      exp_year: 2025,
      is_default: true,
      created_at: '2024-01-01'
    }
  ]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    thisMonth: 0,
    lastMonth: 0,
    averageMonthly: 0
  });

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!supabase || !user) return;
    
    try {
      // Fetch orders for billing history
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform orders to billing history
      const history: BillingHistory[] = orders?.map(order => ({
        id: order.id,
        date: order.created_at,
        description: `Order #${order.order_number}`,
        amount: parseFloat(order.total_amount || '0'),
        status: 'paid' as const,
        invoice_url: `/api/invoices/${order.id}`
      })) || [];

      setBillingHistory(history);

      // Calculate stats
      const total = history.reduce((sum, item) => sum + item.amount, 0);
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      const thisMonthTotal = history
        .filter(item => new Date(item.date) >= thisMonthStart)
        .reduce((sum, item) => sum + item.amount, 0);

      setStats({
        totalSpent: total,
        thisMonth: thisMonthTotal,
        lastMonth: 0, // Calculate based on actual data
        averageMonthly: total / 12 // Simplified calculation
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const addPaymentMethod = async (method: any) => {
    // Future implementation: Add payment method via Stripe
    console.log('Adding payment method:', method);
    setShowAddPayment(false);
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({
      ...m,
      is_default: m.id === id
    })));
  };

  const downloadInvoice = (invoiceUrl: string) => {
    // Future implementation: Download invoice PDF
    console.log('Downloading invoice:', invoiceUrl);
  };

  const cancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payment</h1>
        <p className="mt-2 text-gray-600">
          Manage your payment methods and billing information
        </p>
      </div>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Month</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.lastMonth)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Monthly</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.averageMonthly)}</p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Active Subscription */}
      {subscription && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">Premium Subscription</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                {formatCurrency(subscription.price)} / {subscription.billing_cycle}
              </p>
              <div className="space-y-2 mb-4">
                {subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Next billing date: {new Date(subscription.next_billing_date).toLocaleDateString('en-CA')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                Update Plan
              </Button>
              {subscription.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelSubscription}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Payment Methods */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Payment Methods</h2>
          <Button
            onClick={() => setShowAddPayment(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
          </Button>
        </div>

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {method.type === 'card' && <CreditCard className="h-6 w-6 text-gray-600" />}
                  {method.type === 'paypal' && <DollarSign className="h-6 w-6 text-blue-600" />}
                  {method.type === 'bank' && <Shield className="h-6 w-6 text-green-600" />}
                </div>
                <div>
                  {method.type === 'card' && (
                    <>
                      <p className="font-medium">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </>
                  )}
                  {method.type === 'paypal' && (
                    <>
                      <p className="font-medium">PayPal</p>
                      <p className="text-sm text-gray-600">{method.email}</p>
                    </>
                  )}
                  {method.type === 'bank' && (
                    <>
                      <p className="font-medium">{method.bank_name}</p>
                      <p className="text-sm text-gray-600">•••• {method.last4}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.is_default ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Default
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultPaymentMethod(method.id)}
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePaymentMethod(method.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {paymentMethods.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No payment methods added yet</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Your payment information is secure</p>
              <p>We use industry-standard encryption to protect your payment details. Your full card number is never stored on our servers.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Billing History</h2>
          <Link href="/account/orders">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              View All Orders
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : billingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">
                      {new Date(item.date).toLocaleDateString('en-CA')}
                    </td>
                    <td className="py-3 px-2 text-sm">{item.description}</td>
                    <td className="py-3 px-2 text-sm font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => item.invoice_url && downloadInvoice(item.invoice_url)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No billing history yet</p>
            <p className="text-sm text-gray-500 mt-1">Your transactions will appear here</p>
          </div>
        )}
      </Card>

      {/* Add Payment Method Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button className="flex-1 p-3 border-2 border-blue-500 rounded-lg flex flex-col items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Credit/Debit Card</span>
                </button>
                <button className="flex-1 p-3 border rounded-lg flex flex-col items-center gap-2 hover:border-gray-400">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                  <span className="text-sm font-medium">PayPal</span>
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <Input placeholder="1234 5678 9012 3456" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <Input placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <Input placeholder="123" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name on Card
                </label>
                <Input placeholder="John Doe" />
              </div>

              <div className="flex gap-3">
                <Button onClick={() => addPaymentMethod({})}>
                  Add Payment Method
                </Button>
                <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}