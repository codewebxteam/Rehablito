import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'surface';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:opacity-90 shadow-md shadow-primary/20',
      secondary: 'bg-secondary text-white hover:opacity-90 shadow-md shadow-secondary/20',
      outline: 'border border-outline-variant/30 text-on-surface hover:bg-surface-container-low',
      ghost: 'text-on-surface-variant hover:text-primary hover:bg-primary/5',
      error: 'bg-error text-white hover:opacity-90 shadow-md shadow-error/20',
      surface: 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container-low',
    };

    const sizes = {
      sm: 'px-3 py-2 md:py-1.5 text-xs rounded-lg min-h-[36px] md:min-h-[32px]',
      md: 'px-5 py-3.5 md:py-2.5 text-sm rounded-xl min-h-[44px] md:min-h-[40px]',
      lg: 'px-8 py-5 md:py-4 text-base rounded-2xl min-h-[56px]',
      icon: 'p-3 md:p-2 rounded-lg min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
