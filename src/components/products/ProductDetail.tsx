'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Book, ShoppingCart, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import ProductCard from './ProductCard';

interface ProductDetailProps {
  id: string;
  title: string;
  author?: string;
  description?: string;
  longDescription?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  type: 'library' | 'store';
  isbn?: string;
  publisher?: string;
  publishDate?: string;
  pages?: number;
  language?: string;
  features?: string[];
  rating?: number;
  reviewCount?: number;
}

export default function ProductDetail({
  id,
  title,
  author,
  description,
  longDescription,
  price,
  imageUrl,
  category,
  type,
  isbn,
  publisher,
  publishDate,
  pages,
  language,
  features = [],
  rating,
  reviewCount
}: ProductDetailProps) {
  const { addToCart, loading: cartLoading } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const handlePurchase = async () => {
    if (!price || cartLoading) return;
    
    try {
      await addToCart({
        item_type: 'content', // Store products are content items
        item_id: id,
        title,
        price,
        thumbnail_url: imageUrl,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }, quantity);
      
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const backUrl = type === 'library' ? '/library' : '/store';
  const backLabel = type === 'library' ? 'Back to Library' : 'Back to Store';

  // Function to limit description - initially 4-5 paragraphs, then double
  const processDescription = (text: string) => {
    if (!text) return null;
    
    // Split by double newlines or single newlines
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());
    
    const initialLimit = 5;  // Show 5 paragraphs initially
    const expandedLimit = 10; // Show 10 paragraphs when expanded
    
    if (paragraphs.length <= initialLimit) {
      return { display: text, hasMore: false };
    }
    
    if (expandedDescription) {
      if (paragraphs.length <= expandedLimit) {
        return { 
          display: text, 
          hasMore: false,
          canCollapse: true 
        };
      } else {
        return { 
          display: paragraphs.slice(0, expandedLimit).join('\n\n'), 
          hasMore: true,
          canCollapse: true 
        };
      }
    } else {
      return { 
        display: paragraphs.slice(0, initialLimit).join('\n\n'), 
        hasMore: true,
        canCollapse: false 
      };
    }
  };

  const processedDescription = longDescription ? processDescription(longDescription) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href={backUrl}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Image Section */}
            <div className="p-8">
              <div className="aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
                    <Book className="w-24 h-24 text-slate-400 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 text-center">
                      {title}
                    </h2>
                    {author && (
                      <p className="text-lg text-slate-600 mt-3 text-center">
                        by {author}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="p-8">
              {/* Category */}
              {category && (
                <span className="inline-block px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full mb-4">
                  {category}
                </span>
              )}

              {/* Title & Author */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {author && (
                <p className="text-xl text-gray-600 mb-4">by {author}</p>
              )}

              {/* Rating */}
              {rating && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${
                          i < Math.floor(rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {rating} ({reviewCount || 0} reviews)
                  </span>
                </div>
              )}

              {/* Price & Purchase */}
              {price !== undefined && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    {type === 'store' && (
                      <span className="ml-2 text-sm text-gray-600">
                        USD
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={cartLoading || !price}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {cartLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : addedToCart ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {type === 'library' ? 'Buy Now' : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Description */}
              {(longDescription || description) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">About this {type === 'library' ? 'Book' : 'Product'}</h3>
                  <div className="text-gray-700 leading-relaxed">
                    {processedDescription ? (
                      <div className="whitespace-pre-wrap">
                        {processedDescription.display}
                        {(processedDescription.hasMore || processedDescription.canCollapse) && (
                          <button
                            onClick={() => setExpandedDescription(!expandedDescription)}
                            className="block mt-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {expandedDescription ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p>{description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Product Details */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                <dl className="space-y-2 text-sm">
                  {isbn && (
                    <div className="flex">
                      <dt className="text-gray-600 w-24">ISBN:</dt>
                      <dd className="text-gray-900">{isbn}</dd>
                    </div>
                  )}
                  {publisher && (
                    <div className="flex">
                      <dt className="text-gray-600 w-24">Publisher:</dt>
                      <dd className="text-gray-900">{publisher}</dd>
                    </div>
                  )}
                  {publishDate && (
                    <div className="flex">
                      <dt className="text-gray-600 w-24">Published:</dt>
                      <dd className="text-gray-900">{publishDate}</dd>
                    </div>
                  )}
                  {pages && (
                    <div className="flex">
                      <dt className="text-gray-600 w-24">Pages:</dt>
                      <dd className="text-gray-900">{pages}</dd>
                    </div>
                  )}
                  {language && (
                    <div className="flex">
                      <dt className="text-gray-600 w-24">Language:</dt>
                      <dd className="text-gray-900">{language}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Section */}
      <RelatedProducts 
        currentProductId={id}
        category={category}
        type={type}
      />
    </div>
  );
}

// Related Products Component
function RelatedProducts({ 
  currentProductId, 
  category, 
  type 
}: { 
  currentProductId: string; 
  category?: string; 
  type: 'library' | 'store' 
}) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedProducts();
  }, [currentProductId, category]);

  const loadRelatedProducts = async () => {
    try {
      const params = new URLSearchParams({
        productId: currentProductId,
        type: type,
        ...(category && { category })
      });

      const response = await fetch(`/api/products/related?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setRelatedProducts(data);
      } else {
        console.error('Failed to fetch related products');
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related {type === 'library' ? 'Books' : 'Products'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map(product => (
            <ProductCard
              key={product.id}
              {...product}
            />
          ))}
        </div>
      </div>
    </div>
  );
}