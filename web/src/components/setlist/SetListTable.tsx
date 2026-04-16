import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { deleteSetList, handlePreview, handleCopyLink } from "../../utils/setlists";
import { Eye, Trash, Link2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card } from "../ui/card";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto bg-popover text-popover-foreground">
        <h2 className="text-lg font-bold mb-4">Delete Set List</h2>
        <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{deleteName}</span>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80"
            onClick={closeDeleteDialog}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
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
          <Card
            key={setlist.id}
            className="flex flex-col items-center hover:shadow-xl hover:bg-muted transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring p-6"
            onClick={() => navigate(`/setlists/${setlist.id}`)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/setlists/${setlist.id}`); }}
          >
            <span className="text-xl font-bold mb-2 text-center">
              {setlist.name}
            </span>
            <div className="text-muted-foreground text-sm mb-2">
              Created: {new Date(setlist.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-4 mt-2">
              <button title="Preview" onClick={(e) => handlePreviewWrapper(setlist.id, e)} className="text-foreground hover:text-primary transition-colors">
                <Eye size={18} />
              </button>
              <button title="Copy Link" onClick={(e) => handleCopyLinkWrapper(setlist.id, e)} className="text-foreground hover:text-primary transition-colors">
                <Link2 size={18} />
              </button>
              <button title="Delete" onClick={(e) => openDeleteDialog(setlist.id, setlist.name, e)} className="text-foreground hover:text-destructive transition-colors">
                <Trash size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-center text-muted-foreground mt-8">No set lists found.</div>
      )}
    </div>
  );
};

export default SetListTable;