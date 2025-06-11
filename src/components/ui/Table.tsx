// src/components/ui/Table.tsx

'use client'; // Client component directive

import React from 'react';
import { cn } from '@/lib/utils'; // Utility for conditional class names

// Table Root Component Props interface
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered'; // Visual style of the table
  size?: 'sm' | 'md' | 'lg'; // Size variant for padding and font
  responsive?: boolean; // Controls whether the table is wrapped in an overflow container
  // Columns definition for the table
  columns: {
    key: string; // Unique key to access data from each row object
    label: string | React.ReactNode; // Label to display in the table header
    render?: (item: any) => React.ReactNode; // Optional render function for custom cell content
  }[];
  data: any[]; // Array of data objects to display in the table rows
}

// CSS classes for different table variants
const variantClasses = {
  default: '',
  striped: '[&_tbody_tr:nth-child(even)]:bg-gray-50 dark:[&_tbody_tr:nth-child(even)]:bg-gray-800',
  bordered: 'border border-gray-200 dark:border-gray-700',
};

// CSS classes for different table sizes
const sizeClasses = {
  sm: '[&_th]:py-2 [&_th]:px-3 [&_td]:py-2 [&_td]:px-3 text-sm',
  md: '[&_th]:py-3 [&_th]:px-4 [&_td]:py-3 [&_td]:px-4',
  lg: '[&_th]:py-4 [&_th]:px-6 [&_td]:py-4 [&_td]:px-6 text-lg',
};

// Main Table component
export const Table: React.FC<TableProps> = ({
  variant = 'default',
  size = 'md',
  responsive = true,
  className,
  columns, // Destructure columns prop
  data, // Destructure data prop
  // Note: 'children' prop is no longer used for rendering table content directly,
  // as columns and data are used for automatic rendering.
  ...props
}) => {
  // Inner table element
  const table = (
    <table
      className={cn(
        'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Table Header (<thead>) - automatically rendered from columns prop */}
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      {/* Table Body (<tbody>) - automatically rendered from data and columns props */}
      <TableBody>
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
            // Use row.id as key if available, fallback to rowIndex
            <TableRow key={row.id || rowIndex}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {/* Render cell content using custom render function or direct key access */}
                  {col.render ? col.render(row) : (row[col.key] || '-')}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          // Display empty state if no data
          <TableEmpty colSpan={columns.length} message="No data available" />
        )}
      </TableBody>
    </table>
  );

  // Wrap table in responsive container if responsive prop is true
  if (responsive) {
    return (
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
          {table}
        </div>
      </div>
    );
  }

  return table;
};

// Table Header Component (<thead>)
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn('bg-gray-50 dark:bg-gray-800', className)}
    {...props}
  />
);

// Table Body Component (<tbody>)
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody
    className={cn(
      'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700',
      className
    )}
    {...props}
  />
);

// Table Row Component (<tr>)
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn(
      'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
      className
    )}
    {...props}
  />
);

// Table Head Cell Component (<th>) Props interface
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean; // Indicates if the column is sortable
  sorted?: 'asc' | 'desc' | false; // Current sort direction
  onSort?: () => void; // Callback for sorting
}

// Table Head Cell Component (<th>)
export const TableHead: React.FC<TableHeadProps> = ({
  sortable = false,
  sorted = false,
  onSort,
  className,
  children,
  ...props
}) => (
  <th
    className={cn(
      'text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
      sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center space-x-1">
      <span>{children}</span>
      {sortable && (
        <span className="inline-flex flex-col">
          {/* Up arrow for ascending sort */}
          <svg
            className={cn(
              'w-3 h-3 -mb-1',
              sorted === 'asc' ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
            )}
            fill="currentColor"
            viewBox="0 0 320 512"
          >
            <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z" />
          </svg>
          {/* Down arrow for descending sort */}
          <svg
            className={cn(
              'w-3 h-3 -mt-1',
              sorted === 'desc' ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
            )}
            fill="currentColor"
            viewBox="0 0 320 512"
          >
            <path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z" />
          </svg>
        </span>
      )}
    </div>
  </th>
);

// Table Cell Component (<td>)
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td
    className={cn(
      'text-gray-900 dark:text-gray-100 whitespace-nowrap',
      className
    )}
    {...props}
  />
);

// Table Footer Component (<tfoot>)
export const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tfoot
    className={cn(
      'bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700',
      className
    )}
    {...props}
  />
);

// Empty State Component Props interface
export interface TableEmptyProps {
  message?: string; // Message to display when no data is available
  icon?: React.ReactNode; // Optional icon to display
  colSpan?: number; // Number of columns the empty cell should span
}

// Empty State Component (used inside TableBody when data is empty)
export const TableEmpty: React.FC<TableEmptyProps> = ({
  message = 'No data available',
  icon,
  colSpan = 1, // Default colSpan to 1
}) => (
  <TableRow>
    <TableCell
      colSpan={colSpan} // Apply colSpan to the TableCell
      className="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      <div className="flex flex-col items-center space-y-2">
        {icon && <div className="text-gray-400">{icon}</div>}
        <p>{message}</p>
      </div>
    </TableCell>
  </TableRow>
);