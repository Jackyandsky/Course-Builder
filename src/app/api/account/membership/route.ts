import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export type MembershipLevel = 'basic' | 'standard' | 'premium';

interface MembershipInfo {
  level: MembershipLevel;
  packageName?: string;
  purchaseDate?: string;
  features: string[];
}

// Map package difficulty/level to membership levels
const PACKAGE_LEVEL_MAPPING: Record<string, MembershipLevel> = {
  'basic': 'basic',
  'standard': 'standard',
  'premium': 'premium',
  // Legacy mappings
  'foundation': 'basic',
  'intermediate': 'standard',
  'advanced': 'premium'
};

const MEMBERSHIP_FEATURES: Record<MembershipLevel, string[]> = {
  'basic': [
    'Access to basic courses',
    'Standard support',
    'Basic materials'
  ],
  'standard': [
    'Access to all standard courses',
    'Priority support',
    'Extended materials',
    'Progress tracking'
  ],
  'premium': [
    'Access to all courses',
    'Premium support',
    'All materials and resources',
    '5/5/5 Essay Builder access',
    'Advanced analytics',
    'Personalized learning paths'
  ]
};

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all user's package purchases/orders
    // First check orders table for purchased packages
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        order_items!inner (
          item_type,
          item_id,
          metadata
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Extract package IDs from orders
    const packageIds: string[] = [];
    if (orders) {
      for (const order of orders) {
        const packageItems = order.order_items?.filter(
          (item: any) => item.item_type === 'package'
        ) || [];
        packageIds.push(...packageItems.map((item: any) => item.item_id));
      }
    }

    // Also check user_purchases table for direct purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('item_id, item_type, created_at')
      .eq('user_id', user.id)
      .eq('item_type', 'package')
      .eq('status', 'active');

    if (!purchasesError && purchases) {
      packageIds.push(...purchases.map(p => p.item_id));
    }

    // If no packages purchased, return basic membership
    if (packageIds.length === 0) {
      return NextResponse.json<MembershipInfo>({
        level: 'basic',
        features: MEMBERSHIP_FEATURES.basic
      });
    }

    // Fetch package details to determine highest level
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, title, recommended_level, difficulty')
      .in('id', [...new Set(packageIds)]); // Remove duplicates

    if (packagesError || !packages || packages.length === 0) {
      return NextResponse.json<MembershipInfo>({
        level: 'basic',
        features: MEMBERSHIP_FEATURES.basic
      });
    }

    // Determine highest membership level
    let highestLevel: MembershipLevel = 'basic';
    let highestPackage = packages[0];
    
    for (const pkg of packages) {
      const levelField = pkg.difficulty || pkg.recommended_level || 'basic';
      const level = PACKAGE_LEVEL_MAPPING[levelField.toLowerCase()] || 'basic';
      
      // Compare levels (premium > standard > basic)
      if (level === 'premium') {
        highestLevel = 'premium';
        highestPackage = pkg;
        break; // Can't get higher than premium
      } else if (level === 'standard' && highestLevel !== 'premium') {
        highestLevel = 'standard';
        highestPackage = pkg;
      }
    }

    // Get the most recent purchase date for the highest package
    let purchaseDate: string | undefined;
    if (orders) {
      const relevantOrder = orders.find(order => 
        order.order_items?.some((item: any) => 
          item.item_type === 'package' && item.item_id === highestPackage.id
        )
      );
      if (relevantOrder) {
        purchaseDate = relevantOrder.created_at;
      }
    }

    return NextResponse.json<MembershipInfo>({
      level: highestLevel,
      packageName: highestPackage.title,
      purchaseDate,
      features: MEMBERSHIP_FEATURES[highestLevel]
    });

  } catch (error) {
    console.error('Error fetching membership level:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership level' },
      { status: 500 }
    );
  }
}