import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's cart items
    const { data: cartItems, error } = await supabase
      .from('shopping_cart')
      .select('id, item_type, item_id, quantity, added_at')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart:', error);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // Transform cart items to include product details
    const transformedItems = await Promise.all(
      (cartItems || []).map(async (item) => {
        let productDetails = null;
        let title = '';
        let price = 0;
        let currency = 'CAD';
        let thumbnail_url = null;
        let slug = null;

        try {
          // Fetch product details based on item type
          if (item.item_type === 'course') {
            const { data: course } = await supabase
              .from('courses')
              .select('id, title, price, currency, thumbnail_url, public_slug')
              .eq('id', item.item_id)
              .single();
            
            if (course) {
              title = course.title || '';
              price = typeof course.price === 'string' ? parseFloat(course.price) : (course.price || 0);
              currency = course.currency || 'CAD';
              thumbnail_url = course.thumbnail_url;
              slug = course.public_slug;
              productDetails = course;
            }
          } else if (item.item_type === 'book') {
            const { data: book, error: bookError } = await supabase
              .from('books')
              .select('id, title, price, currency, cover_image_url, public_slug')
              .eq('id', item.item_id)
              .single();
            
            if (bookError) {
              console.error('Error fetching book:', bookError, 'for item_id:', item.item_id);
            }
            
            if (book) {
              title = book.title || '';
              price = typeof book.price === 'string' ? parseFloat(book.price) : (book.price || 0);
              currency = book.currency || 'CAD';
              thumbnail_url = book.cover_image_url;
              slug = book.public_slug;
              productDetails = book;
            }
          } else if (item.item_type === 'content') {
            const { data: content } = await supabase
              .from('content')
              .select('id, name, price, currency, public_slug, metadata')
              .eq('id', item.item_id)
              .single();
            
            if (content) {
              title = content.name || '';
              price = typeof content.price === 'string' ? parseFloat(content.price) : (content.price || 0);
              currency = content.currency || 'CAD';
              thumbnail_url = content.metadata?.image_url;
              slug = content.public_slug;
              productDetails = content;
            }
          } else if (item.item_type === 'package') {
            const { data: packageData } = await supabase
              .from('packages')
              .select('id, title, price, description, payment_type')
              .eq('id', item.item_id)
              .single();
            
            if (packageData) {
              title = packageData.title || '';
              price = typeof packageData.price === 'string' ? parseFloat(packageData.price) : (packageData.price || 0);
              currency = 'CAD'; // Default currency for packages
              thumbnail_url = null; // Packages don't have thumbnails
              slug = packageData.id; // Use package ID as slug
              productDetails = packageData;
            }
          }
        } catch (productError) {
          console.error(`Error fetching ${item.item_type} details:`, productError);
          // Continue with default values
        }

        return {
          id: item.id,
          item_type: item.item_type,
          item_id: item.item_id,
          title: title || 'Unknown Product',
          price: price || 0,
          currency: currency || 'CAD',
          quantity: item.quantity,
          thumbnail_url: thumbnail_url || null,
          slug: slug || item.item_id, // Fallback to item_id if no slug
          added_at: item.added_at,
          productDetails
        };
      })
    );

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error in cart GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_type, item_id, quantity = 1 } = body;

    // Validate input
    if (!item_type || !item_id) {
      return NextResponse.json({ error: 'item_type and item_id are required' }, { status: 400 });
    }

    if (!['course', 'book', 'content', 'package'].includes(item_type)) {
      return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }

    // Check if user has already purchased this course
    if (item_type === 'course') {
      // Check in user_purchases table
      const { data: existingPurchase, error: purchaseCheckError } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'course')
        .eq('item_id', item_id)
        .eq('status', 'active')
        .single();

      if (existingPurchase) {
        return NextResponse.json({ 
          error: 'You have already purchased this course. It is available in your library.' 
        }, { status: 400 });
      }

      // Also check in completed orders
      const { data: completedOrders, error: orderCheckError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            item_type,
            item_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('order_items.item_type', 'course')
        .eq('order_items.item_id', item_id);

      if (completedOrders && completedOrders.length > 0) {
        return NextResponse.json({ 
          error: 'You have already purchased this course. It is available in your library.' 
        }, { status: 400 });
      }

      // Also get the course name for better error messages
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', item_id)
        .single();

      if (existingPurchase || (completedOrders && completedOrders.length > 0)) {
        const courseName = course?.title || 'this course';
        return NextResponse.json({ 
          error: `You have already purchased "${courseName}". It is available in your library.` 
        }, { status: 400 });
      }
    }

    // Check if user is trying to add a package when they already own associated courses
    if (item_type === 'package') {
      // Get package details to find associated courses
      const { data: packageData } = await supabase
        .from('packages')
        .select('title')
        .eq('id', item_id)
        .single();

      // Check if package is associated with courses via course_packages table
      const { data: coursePackages } = await supabase
        .from('course_packages')
        .select('course_id')
        .eq('package_id', item_id);

      if (coursePackages && coursePackages.length > 0) {
        const courseIds = coursePackages.map(cp => cp.course_id);

        // Check if user already owns any of these courses
        const { data: existingCoursePurchases } = await supabase
          .from('user_purchases')
          .select('item_id')
          .eq('user_id', user.id)
          .eq('item_type', 'course')
          .in('item_id', courseIds)
          .eq('status', 'active');

        // Also check in completed orders
        const { data: completedCourseOrders } = await supabase
          .from('orders')
          .select(`
            id,
            order_items!inner (
              item_type,
              item_id
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('order_items.item_type', 'course')
          .in('order_items.item_id', courseIds);

        const ownedCourseIds = new Set();
        if (existingCoursePurchases) {
          existingCoursePurchases.forEach(p => ownedCourseIds.add(p.item_id));
        }
        if (completedCourseOrders) {
          completedCourseOrders.forEach(order => {
            if (Array.isArray(order.order_items)) {
              order.order_items.forEach((item: any) => {
                ownedCourseIds.add(item.item_id);
              });
            }
          });
        }

        if (ownedCourseIds.size > 0) {
          // Get course names for the error message
          const { data: ownedCourses } = await supabase
            .from('courses')
            .select('title')
            .in('id', Array.from(ownedCourseIds));

          const courseNames = ownedCourses?.map(c => c.title).join(', ') || 'courses';
          const packageName = packageData?.title || 'this package';

          return NextResponse.json({ 
            error: `You already own the following course(s): ${courseNames}. You don't need to purchase "${packageName}" as you already have access to the included content.` 
          }, { status: 400 });
        }
      }
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('shopping_cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .single();

    let result;

    if (existingItem) {
      // Update existing item quantity
      const { data, error } = await supabase
        .from('shopping_cart')
        .update({ 
          quantity: existingItem.quantity + quantity,
          added_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
      }

      result = data;
    } else {
      // Add new item to cart
      const { data, error } = await supabase
        .from('shopping_cart')
        .insert({
          user_id: user.id,
          item_type,
          item_id,
          quantity
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to cart:', error);
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cart POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear entire cart
    const { error } = await supabase
      .from('shopping_cart')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing cart:', error);
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cart DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}