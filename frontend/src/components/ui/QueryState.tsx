import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

export function QueryState({ loading, error, empty, message, onRetry }: { loading?: boolean; error?: boolean; empty?: string; message?: string; onRetry?: () => void }) {
  return <Card><div role={error ? "alert" : "status"} className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
    {loading ? <LoaderCircle className="animate-spin text-brand" size={28} /> : error ? <AlertCircle className="text-accent" size={28} /> : <Inbox className="text-slate-400" size={28} />}
    <p className="break-words text-sm text-slate-600 dark:text-slate-300">{loading ? "Loading records…" : error ? message ?? "Unable to load this information. Please try again." : empty ?? "No records found."}</p>
    {error && onRetry && <Button onClick={onRetry}>Try again</Button>}
  </div></Card>;
}
