"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  _id: string;
  name: string;
  [key: string]: any;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  required?: boolean;
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className,
  onKeyDown,
  required
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);

  const inputRef = (ref as React.MutableRefObject<HTMLInputElement>) || internalInputRef;

  const selectedOption = options.find((opt) => opt._id === value);

  const filteredOptions = query === ""
    ? options
    : options.filter((opt) =>
        opt.name.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option._id);
    setIsOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
    
    if (e.key === "Enter" && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }

    if (e.key === "Escape") {
      setIsOpen(false);
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "flex items-center justify-between w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-text",
          isOpen && "ring-2 ring-indigo-500 border-transparent"
        )}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        }}
      >
        <div className="flex flex-1 items-center min-w-0">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent outline-none border-none p-0 text-sm"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              autoFocus
            />
          ) : (
            <span className={cn("truncate w-full", !selectedOption && "text-slate-400")}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredOptions.length > 0 ? (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option._id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                    option._id === value ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                >
                  <span className="truncate">{option.name}</span>
                  {option._id === value && <Check size={14} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
      
      <input 
        type="text" 
        tabIndex={-1} 
        className="sr-only" 
        required={required} 
        value={value} 
        readOnly
      />
    </div>
  );
});

Combobox.displayName = "Combobox";
