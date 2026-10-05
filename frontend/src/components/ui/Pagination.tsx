import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-slate-500">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="h-9 bg-slate-700 px-3 hover:bg-slate-800"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Prev
        </Button>
        <span className="min-w-24 text-center text-slate-600 dark:text-slate-300">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          type="button"
          className="h-9 bg-slate-700 px-3 hover:bg-slate-800"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
