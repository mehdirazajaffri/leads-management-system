"use client";
import React from "react";
import { Modal } from "../modal";
import Button from "../button/Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: "text-error-600 dark:text-error-400",
    warning: "text-warning-600 dark:text-warning-400",
    info: "text-blue-light-600 dark:text-blue-light-400",
  };

  const buttonVariants = {
    danger: "primary" as const,
    warning: "primary" as const,
    info: "primary" as const,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md m-4">
      <div className="p-6 dark:bg-gray-900">
        <h3 className={`text-lg font-semibold mb-2 ${variantStyles[variant]}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

