/**
 * @file ConfirmModal.jsx
 * @description Claude-inspired minimal confirmation modal popup replacing native browser alerts/confirms.
 * Supports Light & Dark theme variables, Escape key dismissal, and loading states.
 */

import React, { useEffect } from "react";
import { Trash2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Delete conversation?",
  message = "This will permanently delete this conversation and all of its messages. This action cannot be undone.",
  itemName = "",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div className="confirm-modal-title-wrap">
            {isDestructive && (
              <div className="confirm-icon-badge danger">
                <Trash2 size={16} />
              </div>
            )}
            <h3 id="confirm-modal-title" className="font-serif">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="confirm-modal-body">
          {itemName && (
            <div className="confirm-item-preview">
              &ldquo;{itemName}&rdquo;
            </div>
          )}
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-modal-confirm ${isDestructive ? "destructive" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
