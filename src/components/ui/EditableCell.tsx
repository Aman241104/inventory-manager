"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  type?: "number";
  prefix?: string;
  className?: string;
}

export default function EditableCell({
  value,
  onSave,
  prefix = "",
  className
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value.toString());
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (currentValue === value.toString()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onSave(Number(currentValue));
      setIsEditing(false);
    } catch (error) {
      setCurrentValue(value.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[80px]">
        <input
          ref={inputRef}
          type="number"
          step="any"
          className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={loading}
        />
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded transition-colors border border-transparent hover:border-indigo-100 min-w-[60px] text-right font-semibold",
        className
      )}
    >
      {prefix}{value}
    </div>
  );
}
