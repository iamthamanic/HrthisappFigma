/**
 * NOTIFICATION BADGE (v4.0.0)
 * Badge counter for navigation items
 */

import { cn } from '../components/ui/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null;

  // Display max 99, show "99+" for larger numbers
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span
      className={cn(
        'flex items-center justify-center',
        'min-w-[20px] h-[20px] px-1',
        'rounded-full',
        'bg-red-500 text-white',
        'text-xs font-medium',
        'animate-in fade-in zoom-in duration-200',
        className
      )}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  );
}
