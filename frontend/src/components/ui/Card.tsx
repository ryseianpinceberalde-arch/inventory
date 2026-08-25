import { ReactNode } from "react";

export function Card({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</section>;
}
