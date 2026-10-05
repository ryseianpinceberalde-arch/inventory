import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-label={title} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-line bg-white p-5 text-ink shadow-soft backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" aria-label={`Close ${title}`} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X size={20} /></button></div>{children}
  </dialog>;
}
