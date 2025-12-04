import React from "react";
import { Link } from "react-router-dom";

const ChordLibraryTable = ({ data, pageIndex, setPageIndex, totalCount, pageSize }) => {
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
        <button key="first" className="px-3 py-1 border rounded mx-1" onClick={() => setPageIndex(0)}>1</button>
      );
      if (startPage > 1) {
        pageNumbers.push(<span key="dots-start">...</span>);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`px-3 py-1 border rounded mx-1 ${pageIndex === i ? "bg-gray-300" : "bg-white"}`}
          onClick={() => setPageIndex(i)}
        >
          {i + 1}
        </button>
      );
    }
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pageNumbers.push(<span key="dots-end">...</span>);
      }
      pageNumbers.push(
        <button key="last" className="px-3 py-1 border rounded mx-1" onClick={() => setPageIndex(totalPages - 1)}>
          {totalPages}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data.map((chord) => (
          <Link
            key={chord.id}
            to={`/library/${chord.id}`}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:shadow-xl hover:bg-gray-200 transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <span className="text-xl font-bold text-gray-700 mb-2 text-center">
              {chord.title}
            </span>
            {chord.artist && (
              <div className="text-gray-500 text-sm mb-1">{chord.artist}</div>
            )}
            {chord.key && (
              <div className="text-gray-400 text-xs mb-2">Key: {chord.key}</div>
            )}
          </Link>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No chords found.</div>
      )}
      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center bg-white border-t sticky bottom-10 md:bottom-0 p-3 mt-8 sm:hidden">
          <button
            className="px-4 py-2 border rounded disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Prev
          </button>
          <span className="mx-4 text-gray-600 text-sm">
            Page {pageIndex + 1} of {totalPages}
          </span>
          <button
            className="px-4 py-2 border rounded disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
      {/* Desktop Pagination */}
      {totalPages > 1 && (
        <div className="justify-center items-center bg-white border-t sticky bottom-10 md:bottom-0 p-3 mt-8 hidden sm:flex">
          <button
            className="px-4 py-2 border rounded disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Prev
          </button>
          <div className="flex mx-2">{renderPageNumbers()}</div>
          <button
            className="px-4 py-2 border rounded disabled:opacity-50"
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
