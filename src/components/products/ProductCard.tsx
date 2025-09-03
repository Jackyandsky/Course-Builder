'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  title: string;
  author?: string;
  description?: string;
  price?: number;
  currency?: string;
  discount_percentage?: number;
  sale_price?: number;
  is_free?: boolean;
  imageUrl?: string;
  type: 'library' | 'store';
  category?: string;
}

export default function ProductCard({
  id,
  title,
  author,
  description,
  price,
  currency = 'CAD',
  discount_percentage,
  sale_price,
  is_free,
  imageUrl,
  type,
  category
}: ProductCardProps) {
  const productUrl = type === 'library' ? `/library/${id}` : `/store/${id}`;

  return (
    <Link href={productUrl} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full border border-gray-200">
        {/* Image or Placeholder - Reduced height */}
        <div className="aspect-[4/3] relative bg-gray-50 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
              <h3 className="text-base font-semibold text-slate-800 text-center line-clamp-2 px-2">
                {title}
              </h3>
              {author && (
                <p className="text-xs text-slate-600 mt-1.5 text-center">
                  by {author}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {category && (
            <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mb-2">
              {category}
            </span>
          )}
          
          {imageUrl && (
            <>
              <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              {author && (
                <p className="text-sm text-gray-600 mt-1">by {author}</p>
              )}
            </>
          )}
          
          {description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {description}
            </p>
          )}
          
          {(price !== undefined || is_free) && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {is_free ? (
                  <span className="text-lg font-bold text-green-600">FREE</span>
                ) : discount_percentage && discount_percentage > 0 ? (
                  <>
                    <span className="text-lg font-bold text-gray-900">
                      {currency === 'CAD' ? 'CA$' : '$'}{(sale_price || price || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {currency === 'CAD' ? 'CA$' : '$'}{(price || 0).toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      -{discount_percentage}%
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    {currency === 'CAD' ? 'CA$' : '$'}{(price || 0).toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-sm text-blue-600 group-hover:text-blue-700">
                View Details →
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}