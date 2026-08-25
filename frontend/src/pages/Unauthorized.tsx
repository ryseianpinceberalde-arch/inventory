import { Link } from "react-router-dom";

export function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg border border-line bg-white p-6 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">403 Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to view this page.</p>
        <Link to="/dashboard" className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white">Dashboard</Link>
      </div>
    </div>
  );
}
