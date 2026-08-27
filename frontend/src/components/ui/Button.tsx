import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-[1.04] hover:bg-teal-800 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
