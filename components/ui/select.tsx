"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  labelMap: Record<string, string>;
  isOpen: boolean;
  onSelect: (value: string) => void;
  registerLabel: (value: string, label: string) => void;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  value: "",
  labelMap: {},
  isOpen: false,
  onSelect: () => {},
  registerLabel: () => {},
  setIsOpen: () => {},
});

const Select = ({ children, onValueChange, defaultValue, value: controlledValue }: any) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue ?? "");
  const [labelMap, setLabelMap] = React.useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const value = isControlled ? (controlledValue ?? "") : internalValue;

  const registerLabel = React.useCallback((val: string, lbl: string) => {
    setLabelMap((prev) => (prev[val] === lbl ? prev : { ...prev, [val]: lbl }));
  }, []);

  const handleSelect = (val: string) => {
    if (!isControlled) setInternalValue(val);
    onValueChange?.(val);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, labelMap, isOpen, onSelect: handleSelect, registerLabel, setIsOpen }}>
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ className, children }: any) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        className
      )}
    >
      <span className="flex-1 text-left truncate">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </button>
  );
};

const SelectValue = ({ placeholder, children }: any) => {
  const { labelMap, value } = React.useContext(SelectContext);
  const display = children || labelMap[value] || value || placeholder || "";
  return <span className="truncate">{display}</span>;
};

const SelectContent = ({ children, className }: any) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "absolute left-0 top-full mt-1 z-50 w-full overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
          className
        )}
      >
        <div className="p-1">{children}</div>
      </div>
    </>
  );
};

const SelectItem = ({ value, children, className, disabled = false }: any) => {
  const { onSelect, value: selectedValue, registerLabel } = React.useContext(SelectContext);
  const childText = typeof children === "string" ? children : value;

  React.useEffect(() => {
    registerLabel(value, childText);
  }, [value, childText, registerLabel]);

  const isSelected = selectedValue === value;

  return (
    <div
      className={cn(
        "relative flex w-full select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50 pointer-events-none"
          : "cursor-pointer text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100",
        isSelected && "bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        className
      )}
      onClick={() => {
        if (!disabled) onSelect(value);
      }}
    >
      {isSelected && (
        <span className="absolute left-2 flex items-center justify-center">
          <Check className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </span>
      )}
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
