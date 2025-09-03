import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    // Admin route access is already controlled by middleware
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30'; // days
    const groupBy = searchParams.get('groupBy') || 'day';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get orders within date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Process analytics data
    const analytics = processAnalytics(orders || [], groupBy);

    // Get top products
    const { data: topProducts } = await supabase
      .from('order_items')
      .select(`
        item_id,
        item_type,
        item_title,
        quantity,
        total
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Aggregate top products
    const productSales: { [key: string]: any } = {};
    topProducts?.forEach(item => {
      if (item.item_id) {
        if (!productSales[item.item_id]) {
          productSales[item.item_id] = {
            id: item.item_id,
            name: item.item_title,
            type: item.item_type,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.item_id].quantity += item.quantity || 0;
        productSales[item.item_id].revenue += item.total || 0;
      }
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Get customer insights
    const { data: customers } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const uniqueCustomers = new Set(customers?.map(c => c.user_id)).size;
    const repeatCustomers = customers ? customers.length - uniqueCustomers : 0;

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: period
      },
      summary: {
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        averageOrderValue: orders?.length ? 
          (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length) : 0,
        uniqueCustomers,
        repeatCustomers,
        conversionRate: 0, // Would need visitor data to calculate
        ordersByStatus: {
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          processing: orders?.filter(o => o.status === 'processing').length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0,
          cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
          refunded: orders?.filter(o => o.status === 'refunded').length || 0
        }
      },
      chartData: analytics,
      topProducts: topSellingProducts,
      recentTrends: calculateTrends(orders || [])
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function processAnalytics(orders: any[], groupBy: string) {
  const grouped: { [key: string]: any } = {};

  orders.forEach(order => {
    const date = new Date(order.created_at);
    let key: string;

    switch (groupBy) {
      case 'hour':
        key = `${date.toISOString().slice(0, 13)}:00`;
        break;
      case 'day':
        key = date.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        orders: 0,
        revenue: 0,
        customers: new Set()
      };
    }

    grouped[key].orders++;
    grouped[key].revenue += order.total_amount || 0;
    grouped[key].customers.add(order.user_id);
  });

  return Object.values(grouped).map(g => ({
    date: g.date,
    orders: g.orders,
    revenue: g.revenue,
    customers: g.customers.size
  }));
}

function calculateTrends(orders: any[]) {
  if (orders.length < 2) return null;

  const midPoint = Math.floor(orders.length / 2);
  const firstHalf = orders.slice(0, midPoint);
  const secondHalf = orders.slice(midPoint);

  const firstHalfRevenue = firstHalf.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const secondHalfRevenue = secondHalf.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const revenueGrowth = firstHalfRevenue > 0 
    ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100
    : 0;

  const orderGrowth = firstHalf.length > 0
    ? ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
    : 0;

  return {
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    orderGrowth: Math.round(orderGrowth * 10) / 10,
    trending: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable'
  };
}