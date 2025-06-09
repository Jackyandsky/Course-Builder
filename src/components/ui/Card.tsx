import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
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

Card.displayName = 'Card';

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

Header.displayName = 'CardHeader';

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

Title.displayName = 'CardTitle';

const Content = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

Content.displayName = 'CardContent';

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

Footer.displayName = 'CardFooter';

export { Card, Header, Title, Content, Footer };
