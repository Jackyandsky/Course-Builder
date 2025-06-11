// File: src/components/ui/Card.tsx

import { cn } from '@/lib/utils'; 
import { forwardRef } from 'react'; 

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode; 
}

// 1. Define the main Card component as before
const CardComponent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white overflow-hidden shadow rounded-lg border border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardComponent.displayName = 'Card'; 

// 2. Define sub-components as before
const Header = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Header.displayName = 'Header'; 

const Title = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-medium text-gray-900', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
Title.displayName = 'Title'; 

const Content = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);
Content.displayName = 'Content'; 

const Footer = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 bg-gray-50 border-t border-gray-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Footer.displayName = 'Footer'; 

// 3. Combine them into a single object for export
export const Card = Object.assign(CardComponent, {
  Header,
  Title,
  Content,
  Footer,
});