// components/ui/use-toast.ts
import { toast as sonnerToast } from "sonner";
import React from "react";

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title: string;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastProps) => {
    const options: ToastOptions = {
      duration: duration || 3000,
    };

    if (variant === "destructive") {
      sonnerToast.error(title, { description, ...options });
    } else {
      sonnerToast.message(title, { description, ...options });
    }
  };

  return { toast };
}
