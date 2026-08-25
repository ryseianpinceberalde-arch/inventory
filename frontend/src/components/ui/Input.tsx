import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={`h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950 ${className}`}
    />
  );
});
