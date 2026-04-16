import React from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Card } from "../ui/card";
import {Button} from "@/components/ui/button";

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
        <Button key="first" className="px-3 py-1 mx-1" onClick={() => setPageIndex(0)}>1</Button>
      );
      if (startPage > 1) {
        pageNumbers.push(<span key="dots-start">...</span>);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          className={`px-3 py-1 mx-1 ${pageIndex === i ? "bg-muted" : ""}`}
          onClick={() => setPageIndex(i)}
        >
          {i + 1}
        </Button>
      );
    }
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pageNumbers.push(<span key="dots-end">...</span>);
      }
      pageNumbers.push(
        <Button key="last" className="px-3 py-1 mx-1" onClick={() => setPageIndex(totalPages - 1)}>
          {totalPages}
        </Button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="p-4 overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data.map((chord) => (
          <Card
            key={chord.id}
            className="flex flex-col items-center hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-ring relative p-6"
          >
            <Link to={`/library/${chord.id}`} className="flex flex-col items-center w-full">
              <span className="text-xl font-bold mb-2 text-center">
                {chord.title}
              </span>
              {chord.artist && (
                <div className="text-sm mb-1">{chord.artist}</div>
              )}
              {chord.key && (
                <div className="text-xs mb-2 text-muted-foreground">Key: {chord.key}</div>
              )}
            </Link>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(chord.id);
              }}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 p-2 rounded-full text-muted-foreground hover:text-destructive focus:outline-none transition-colors"
              title="Delete Chord Sheet"
            >
              <Trash2 size={20} />
            </Button>
          </Card>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">No chords found.</div>
      )}
      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center border sticky bottom-10 md:bottom-0 p-3 mt-8 sm:hidden mt-12">
          <button
            className="px-4 py-2 border rounded disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Prev
          </button>
          <span className="mx-4 text-muted-foreground text-sm">
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
        <div className="justify-center items-center sticky bottom-10 md:bottom-0 p-3 mt-8 hidden sm:flex">
          <Button
            className="px-4 py-2 disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Prev
          </Button>
          <div className="flex mx-2">{renderPageNumbers()}</div>
          <Button
            className="px-4 py-2 disabled:opacity-50"
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChordLibraryTable;
