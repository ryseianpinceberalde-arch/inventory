import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ className = "", children, busy = false, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; busy?: boolean }) {
  return (
    <button
      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}{children}
    </button>
  );
}
