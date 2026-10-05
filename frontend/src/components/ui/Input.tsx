import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      aria-label={props["aria-label"] ?? props.placeholder}
      className={`h-11 min-w-0 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-shadow placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${className}`}
    />
  );
});
