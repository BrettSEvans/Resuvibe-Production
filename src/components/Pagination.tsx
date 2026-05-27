/**
 * Pagination
 *
 * Interaction design following Workday Canvas Pagination:
 * https://canvas.workday.com/components/navigation/pagination
 *
 * Controls (left → right):
 *   [«] Jump to First  —  [‹] Step to Previous  —  page numbers  —  [›] Step to Next  —  [»] Jump to Last
 *
 * Page range:
 *   A sliding window of RANGE_DESKTOP (5) consecutive page numbers centred on the
 *   current page, clamped to [1, lastPage].  On narrow viewports the window
 *   shrinks to RANGE_MOBILE (3) via responsive rendering.
 *
 * Below the controls:
 *   - GoTo input + label ("Page ___ of N pages")  —  submit on Enter
 *   - Additional details: "X–Y of Z applications"  (aria-live region)
 *
 * Accessibility:
 *   - Wraps in <nav aria-label="Pagination">
 *   - Active page button carries aria-current="page"
 *   - Boundary buttons carry aria-disabled when unavailable
 *   - Additional details use role="status" aria-live="polite" aria-atomic="true"
 */

import { useState, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────

const RANGE_DESKTOP = 5;
const RANGE_MOBILE  = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns an array of consecutive page numbers for the visible window. */
function getRange(current: number, last: number, size: number): number[] {
  if (last <= 0) return [];
  const half  = Math.floor(size / 2);
  const start = Math.max(1, Math.min(current - half, last - size + 1));
  const end   = Math.min(last, start + size - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** First item number shown on this page. */
export function getVisibleMin(page: number, pageSize: number): number {
  return (page - 1) * pageSize + 1;
}

/** Last item number shown on this page. */
export function getVisibleMax(page: number, pageSize: number, total: number): number {
  return Math.min(page * pageSize, total);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  currentPage: number;
  totalPages:  number;
  totalItems:  number;
  pageSize:    number;
  onPageChange: (page: number) => void;
  /** Word used in "X–Y of Z ___". Defaults to "items". */
  itemLabel?: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
  className,
}: PaginationProps) {
  const uid        = useId();
  const inputId    = `pagination-goto-${uid}`;
  const detailsId  = `pagination-details-${uid}`;

  const [gotoValue, setGotoValue] = useState("");

  const isFirst = currentPage <= 1;
  const isLast  = currentPage >= totalPages;

  const go = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    if (clamped !== currentPage) onPageChange(clamped);
  }, [currentPage, totalPages, onPageChange]);

  const handleGotoSubmit = () => {
    const parsed = parseInt(gotoValue, 10);
    if (!isNaN(parsed)) go(parsed);
    setGotoValue("");
  };

  const desktopRange = getRange(currentPage, totalPages, RANGE_DESKTOP);
  const mobileRange  = getRange(currentPage, totalPages, RANGE_MOBILE);

  const visMin = totalItems > 0 ? getVisibleMin(currentPage, pageSize) : 0;
  const visMax = totalItems > 0 ? getVisibleMax(currentPage, pageSize, totalItems) : 0;

  if (totalPages <= 1 && totalItems <= pageSize) return null;

  // ── Shared page-button renderer ─────────────────────────────────────────────
  const PageButton = ({ page, hidden = false }: { page: number; hidden?: boolean }) => {
    const isActive = page === currentPage;
    return (
      <button
        type="button"
        onClick={() => go(page)}
        aria-label={`Page ${page}`}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "h-9 w-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground",
          hidden && "hidden md:inline-flex",
          "inline-flex items-center justify-center"
        )}
      >
        {page}
      </button>
    );
  };

  // ── Nav button (Prev/Next/First/Last) ─────────────────────────────────────
  const NavButton = ({
    onClick,
    disabled,
    label,
    children,
  }: {
    onClick: () => void;
    disabled: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-md border border-input bg-background inline-flex items-center justify-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <nav aria-label="Pagination" className={cn("flex flex-col items-center gap-3 py-3", className)}>

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">

        {/* Jump to first */}
        <NavButton onClick={() => go(1)} disabled={isFirst} label="Jump to first page">
          <ChevronsLeft className="h-4 w-4" />
        </NavButton>

        {/* Step to previous */}
        <NavButton onClick={() => go(currentPage - 1)} disabled={isFirst} label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </NavButton>

        {/* ── Mobile range (3 pages) ── */}
        <div className="flex items-center gap-1 md:hidden">
          {mobileRange.map((p) => (
            <PageButton key={p} page={p} />
          ))}
        </div>

        {/* ── Desktop range (5 pages) ── */}
        <div className="hidden md:flex items-center gap-1">
          {desktopRange.map((p) => (
            <PageButton key={p} page={p} />
          ))}
        </div>

        {/* Step to next */}
        <NavButton onClick={() => go(currentPage + 1)} disabled={isLast} label="Next page">
          <ChevronRight className="h-4 w-4" />
        </NavButton>

        {/* Jump to last */}
        <NavButton onClick={() => go(totalPages)} disabled={isLast} label="Jump to last page">
          <ChevronsRight className="h-4 w-4" />
        </NavButton>
      </div>

      {/* ── GoTo form + Additional details row ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">

        {/* GoTo input */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor={inputId} className="text-xs whitespace-nowrap select-none">
              Page
            </label>
            <Input
              id={inputId}
              type="number"
              min={1}
              max={totalPages}
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGotoSubmit();
                }
              }}
              aria-describedby={detailsId}
              placeholder={String(currentPage)}
              className="h-8 w-16 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs whitespace-nowrap select-none">
              of {totalPages} {totalPages === 1 ? "page" : "pages"}
            </span>
          </div>
        )}

        {/* Additional details — aria-live region for screen readers */}
        <p
          id={detailsId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-xs"
        >
          {totalItems > 0
            ? `${visMin}–${visMax} of ${totalItems} ${itemLabel}`
            : `0 ${itemLabel}`}
        </p>
      </div>
    </nav>
  );
}
