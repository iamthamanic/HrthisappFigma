import { Loader2 } from './icons/HRTHISIcons';
import SkeletonLoader from './SkeletonLoader';

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  type?: 'spinner' | 'skeleton';
  skeletonType?: 'card' | 'list' | 'table' | 'stats' | 'dashboard' | 'avatar';
  skeletonCount?: number;
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingState({
  loading,
  children,
  type = 'skeleton',
  skeletonType = 'card',
  skeletonCount = 3,
  fullScreen = false,
  message = 'Wird geladen...'
}: LoadingStateProps) {
  
  if (!loading) {
    return <>{children}</>;
  }

  // Full screen loading
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-transparent rounded-full animate-spin mx-auto absolute inset-0 animate-spin-slow"></div>
          </div>
          <p className="text-gray-600 animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  // Spinner
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    );
  }

  // Skeleton
  return <SkeletonLoader type={skeletonType} count={skeletonCount} />;
}
