import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button } from './ui/button';

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  success?: boolean;
  withRipple?: boolean;
  withHaptic?: boolean;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    children, 
    loading, 
    success, 
    withRipple = true,
    withHaptic = false,
    className = '',
    onClick,
    disabled,
    ...props 
  }, ref) => {

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      if (withRipple) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');

        const rippleContainer = button.querySelector('.ripple-container');
        if (rippleContainer) {
          rippleContainer.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        }
      }

      // Haptic feedback (if supported)
      if (withHaptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }

      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        className={`
          relative overflow-hidden
          transition-all duration-200
          active:scale-95
          ${success ? 'bg-green-600 hover:bg-green-700' : ''}
          ${loading ? 'cursor-wait' : ''}
          ${className}
        `}
        onClick={handleClick}
        disabled={disabled || loading || success}
        {...props}
      >
        {/* Ripple Container */}
        <span className="ripple-container absolute inset-0 overflow-hidden pointer-events-none"></span>

        {/* Content */}
        <span className={`flex items-center justify-center gap-2 ${loading || success ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
          {children}
        </span>

        {/* Loading Spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        )}

        {/* Success Checkmark */}
        {success && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}

        <style jsx>{`
          .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
          }

          @keyframes ripple-animation {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}</style>
      </Button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;
