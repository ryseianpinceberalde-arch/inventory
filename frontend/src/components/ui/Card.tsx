import { ReactNode } from "react";

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-xl border border-line bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900 sm:p-5 ${className}`}>{children}</section>;
}
