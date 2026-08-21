import React from 'react';
import { cn } from '@/lib/cn';

export type ContentColumnSize = 'feed' | 'reading' | 'wide';

export interface ContentColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContentColumnSize;
}

const widths: Record<ContentColumnSize, string> = {
  feed: 'max-w-[600px]',
  reading: 'max-w-[720px]',
  wide: 'max-w-[1120px]',
};

export const ContentColumn = React.forwardRef<HTMLDivElement, ContentColumnProps>(
  ({ size = 'feed', className, ...props }, ref) => (
    <div ref={ref} className={cn('mx-auto w-full', widths[size], className)} {...props} />
  ),
);

ContentColumn.displayName = 'ContentColumn';
