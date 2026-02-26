import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-500">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
        <Icon size={48} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="px-8 shadow-indigo-200 shadow-lg">
            {actionLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
