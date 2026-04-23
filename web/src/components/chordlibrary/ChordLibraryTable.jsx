import React from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

const ChordLibraryTable = ({ data, pageIndex, setPageIndex, totalCount, pageSize, onDelete }) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  // Render page numbers (max 5 at a time)
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, pageIndex - 2);
    let endPage = Math.min(totalPages - 1, pageIndex + 2);

    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 0) {
        endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
      }
    }

    if (startPage > 0) {
      pageNumbers.push(
        <button key="first" className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50" onClick={() => setPageIndex(0)}>
          1
        </button>
      );
      if (startPage > 1) {
        pageNumbers.push(<span key="dots-start" className="px-1 text-gray-400">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`px-3 py-1.5 rounded-md border text-sm ${pageIndex === i ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
          onClick={() => setPageIndex(i)}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pageNumbers.push(<span key="dots-end" className="px-1 text-gray-400">...</span>);
      }
      pageNumbers.push(
        <button key="last" className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50" onClick={() => setPageIndex(totalPages - 1)}>
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="p-4 overflow-auto">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {data.map((chord) => (
            <div
              key={chord.id}
              className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link to={`/library/${chord.id}`} className="min-w-0 flex-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
                <div className="flex flex-col gap-1">
                  <span className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                    {chord.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    {chord.artist && <span className="truncate">{chord.artist}</span>}
                    {chord.key && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Key: {chord.key}</span>}
                  </div>
                </div>
              </Link>

              <div className="flex items-center justify-end sm:ml-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(chord.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  title="Delete Chord Sheet"
                >
                  <Trash2 size={18} />
                  <span className="sr-only">Delete chord sheet</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
          No chords found.
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
          <button
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Prev
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">{renderPageNumbers()}</div>

          <button
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ChordLibraryTable;
