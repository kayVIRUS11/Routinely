import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-text-secondary font-medium">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 rounded-lg bg-card border border-border text-text-primary placeholder-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-colors duration-200",
            error && "border-error focus:ring-error",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
