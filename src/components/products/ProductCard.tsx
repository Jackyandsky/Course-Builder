'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Book } from 'lucide-react';

interface ProductCardProps {
  id: string;
  title: string;
  author?: string;
  description?: string;
  price?: number;
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
  imageUrl,
  type,
  category
}: ProductCardProps) {
  const productUrl = type === 'library' ? `/library/${id}` : `/store/${id}`;

  return (
    <Link href={productUrl} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full border border-gray-200">
        {/* Image or Placeholder - Reduced height */}
        <div className="aspect-[4/3] relative bg-gray-50">
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
              <Book className="w-12 h-12 text-slate-400 mb-3" />
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
          
          {price !== undefined && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
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