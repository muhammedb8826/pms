"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  error?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  xl: "max-w-xl",
  "4xl": "max-w-4xl",
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  error,
  size = "2xl",
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] p-0 flex flex-col gap-0",
          className
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="space-y-4">
            {children}
            {error && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>
        {footer && (
          <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 bg-muted/30">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

