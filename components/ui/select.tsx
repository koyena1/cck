"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// This is a simplified version of the Select component 
// designed to work immediately with your existing project.

const Select = ({ children, onValueChange, defaultValue }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(defaultValue);

  const handleSelect = (value: string) => {
    setSelected(value);
    onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            onClick: () => setIsOpen(!isOpen),
            value: selected 
          });
        }
        if (child.type === SelectContent && isOpen) {
          return React.cloneElement(child, { 
            onSelect: handleSelect,
            onClose: () => setIsOpen(false) 
          });
        }
        return null;
      })}
    </div>
  );
};

const SelectTrigger = ({ className, children, value, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
  >
    {value || children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
);

const SelectValue = ({ placeholder, value }: any) => (
  <span>{value || placeholder}</span>
);

const SelectContent = ({ children, onSelect, onClose }: any) => (
  <>
    <div className="fixed inset-0 z-50" onClick={onClose} />
    <div className="absolute top-11 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full">
      <div className="p-1">
        {React.Children.map(children, (child) => 
          React.cloneElement(child, { onSelect })
        )}
      </div>
    </div>
  </>
);

const SelectItem = ({ value, children, onSelect }: any) => (
  <div
    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    onClick={() => onSelect(value)}
  >
    {children}
  </div>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };