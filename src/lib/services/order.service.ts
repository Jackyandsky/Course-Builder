import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export class OrderService extends BaseService<Order> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'orders');
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, status?: string) {
    let query = this.supabase
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
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
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
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%`);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch user profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(o => o.user_id))];
      const { data: profiles } = await this.supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Map profiles to orders
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      data.forEach(order => {
        (order as any).user = profileMap.get(order.user_id) || { 
          id: order.user_id, 
          email: 'Unknown', 
          full_name: 'Unknown User' 
        };
      });
    }

    return { 
      data, 
      error: null,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  /**
   * Create an order
   */
  async createOrder(userId: string, items: {
    item_type: string;
    item_id: string;
    item_title: string;
    quantity: number;
    price: number;
  }[]) {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax example
    const total = subtotal + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        currency: 'USD',
        payment_method: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      ...item,
      total: item.price * item.quantity
    }));

    const { error: itemsError } = await this.supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return { data: order, error: null };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({ 
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics() {
    const { data: orders, error } = await this.supabase
      .from('orders')
      .select('status, total_amount, created_at');

    if (error) throw error;

    const analytics = {
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
      cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
      refundedOrders: orders?.filter(o => o.status === 'refunded').length || 0,
      averageOrderValue: 0,
      revenueByMonth: {} as { [key: string]: number }
    };

    if (orders && orders.length > 0) {
      analytics.averageOrderValue = analytics.totalRevenue / orders.length;

      // Calculate revenue by month
      orders.forEach(order => {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        analytics.revenueByMonth[month] = (analytics.revenueByMonth[month] || 0) + (order.total_amount || 0);
      });
    }

    return analytics;
  }

  /**
   * Process payment for order
   */
  async processPayment(orderId: string, paymentIntentId: string, paymentMethod: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_intent_id: paymentIntentId,
        payment_method: paymentMethod,
        payment_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Complete order after successful payment
   */
  async completeOrder(orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }
}