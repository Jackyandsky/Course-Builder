'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CheckoutCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Track the cancellation event
    console.log('Checkout cancelled by user');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Cancellation Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Checkout Cancelled
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            No worries! Your payment was not processed and no charges were made. 
            Your items are still in your cart whenever you're ready to complete your purchase.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/cart">
              <Button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Cart
              </Button>
            </Link>
            
            <Link href="/checkout">
              <Button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
          </div>

          {/* Alternative Actions */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Continue Exploring
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Link href="/courses">
                <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg transition-colors">
                  Browse Courses
                </Button>
              </Link>
              
              <Link href="/library">
                <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg transition-colors">
                  View Library
                </Button>
              </Link>
              
              <Link href="/store">
                <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg transition-colors">
                  Visit Store
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Need Help?
            </h4>
            <p className="text-blue-800 text-sm mb-4">
              If you encountered any issues during checkout or have questions about your order, 
              we're here to help.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-blue-700">
                Email: <a href="mailto:support@igps.ca" className="font-semibold hover:underline">support@igps.ca</a>
              </p>
              <p className="text-blue-700">
                Or visit our <Link href="/about" className="font-semibold hover:underline text-blue-600">support page</Link> for more assistance.
              </p>
            </div>
          </div>

          {/* Common Issues */}
          <div className="mt-8 text-left max-w-2xl mx-auto">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Common reasons for checkout cancellation:
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• You decided to review your order before purchasing</li>
              <li>• You wanted to add more items to your cart</li>
              <li>• You encountered a technical issue with payment</li>
              <li>• You wanted to use a different payment method</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}