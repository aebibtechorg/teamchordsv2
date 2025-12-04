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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20 md:mb-0">
        {data.map((setlist) => (
          <div
            key={setlist.id}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:shadow-xl hover:bg-gray-200 transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => navigate(`/setlists/${setlist.id}`)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/setlists/${setlist.id}`); }}
          >
            <span className="text-xl font-bold text-gray-700 mb-2 text-center">
              {setlist.name}
            </span>
            <div className="text-gray-500 text-sm mb-2">
              Created: {new Date(setlist.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-4 mt-2">
              <button title="Preview" onClick={(e) => handlePreviewWrapper(setlist.id, e)}>
                <Eye size={18} />
              </button>
              <button title="Copy Link" onClick={(e) => handleCopyLinkWrapper(setlist.id, e)}>
                <Link2 size={18} />
              </button>
              <button title="Delete" onClick={(e) => openDeleteDialog(setlist.id, setlist.name, e)}>
                <Trash size={18} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No set lists found.</div>
      )}
    </div>
  );
};

export default SetListTable;