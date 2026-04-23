import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { deleteSetList, handlePreview, handleCopyLink } from "../../utils/setlists";
import { Eye, Trash, Link2 } from "lucide-react";
import { toast } from "react-hot-toast";

const SetListTable = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyLinkWrapper = async (id, e) => {
    e.stopPropagation();
    await handleCopyLink(id);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = async (id) => {
    setIsDeleting(true);
    await deleteSetList(id);
    setIsDeleting(false);
    setDeleteId(null);
    toast.success("Deleted set list successfully.");
    onRefresh();
  };

  const handlePreviewWrapper = async (id, e) => {
    e.stopPropagation();
    await handlePreview(id);
  };

  const openDeleteDialog = (id, name, e) => {
    e.stopPropagation();
    setDeleteId(id);
    setDeleteName(name);
  };

  const closeDeleteDialog = () => {
    setDeleteId(null);
    setDeleteName("");
  };

  // Delete Confirmation Modal
  const DeleteModal = deleteId ? createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Delete Set List</h2>
        <p className="mb-6 text-gray-700">Are you sure you want to delete <span className="font-semibold">{deleteName}</span>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            onClick={closeDeleteDialog}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            onClick={() => handleDelete(deleteId)}
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="p-4">
      {DeleteModal}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {data.map((setlist) => (
            <div
              key={setlist.id}
              className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              onClick={() => navigate(`/setlists/${setlist.id}`)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/setlists/${setlist.id}`); }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1">
                  <span className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                    {setlist.name}
                  </span>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(setlist.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:justify-end">
                <button
                  title="Preview"
                  onClick={(e) => handlePreviewWrapper(setlist.id, e)}
                  className="inline-flex items-center gap-2 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <Eye size={18} />
                  <span className="sr-only">Preview set list</span>
                </button>
                <button
                  title="Copy Link"
                  onClick={(e) => handleCopyLinkWrapper(setlist.id, e)}
                  className="inline-flex items-center gap-2 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <Link2 size={18} />
                  <span className="sr-only">Copy set list link</span>
                </button>
                <button
                  title="Delete"
                  onClick={(e) => openDeleteDialog(setlist.id, setlist.name, e)}
                  className="inline-flex items-center gap-2 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  <Trash size={18} />
                  <span className="sr-only">Delete set list</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">No set lists found.</div>
      )}
    </div>
  );
};

export default SetListTable;