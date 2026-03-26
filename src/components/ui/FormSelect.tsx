import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, ChevronDown, X, Check } from "lucide-react";

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  color?: string;   // optional color dot for labels/tags
  disabled?: boolean;
}

// ─── Base border/ring utility (mirrors FormInput logic) ────────────────────────

function getBorderClasses(hasError: boolean, isFocused: boolean, disabled: boolean): string {
  if (disabled) return "border-gray-300 bg-gray-50 opacity-70 cursor-not-allowed";
  if (hasError) return "border-red-700 ring-1 ring-red-300";
  if (isFocused) return "border-blue-700 ring-1 ring-blue-300";
  return "border-gray-300 hover:border-gray-700";
}

// ─── FormSelect (single) ───────────────────────────────────────────────────────

interface FormSelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "— Select —",
  error,
  required = false,
  disabled = false,
  helperText,
  icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasError = !!error;
  const selected = options.find((o) => o.value === value);

  // Close dropdown on outside click
  const onBlurRef = useRef(onBlur);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        onBlurRef.current?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setIsFocused(true);
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setIsFocused(false);
    onBlur?.();
  };

  const triggerClasses = `
    w-full flex items-center justify-between
    px-3 py-2.5 rounded-xl border
    bg-white/90 backdrop-blur-sm
    text-sm transition-all duration-200
    outline-none select-none
    ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
    ${icon ? "pl-10" : ""}
    ${getBorderClasses(hasError, isFocused || isOpen, disabled)}
    ${className}
  `;

  return (
    <div className="w-full mb-4" ref={containerRef}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-700 ml-1">*</span>}
          </label>
          {helperText && !hasError && (
            <span className="text-xs text-gray-500">{helperText}</span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Trigger */}
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); }
            if (e.key === "Escape") { setIsOpen(false); setIsFocused(false); }
          }}
          className={triggerClasses}
        >
          <span className={selected ? "text-gray-800" : "text-gray-400"}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.color && (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
                )}
                {selected.label}
              </span>
            ) : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
              {options.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-gray-400 text-center">No options available</li>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      className={`
                        flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${option.disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"}
                        ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : ""}
                      `}
                    >
                      <span className="flex items-center gap-2">
                        {option.color && (
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                        )}
                        {option.label}
                      </span>
                      {isSelected && <Check size={14} className="text-blue-600 flex-shrink-0" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {hasError && (
        <div className="mt-2 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-red-700 flex-shrink-0" />
          <p className="text-red-700 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

// ─── FormMultiSelect ───────────────────────────────────────────────────────────

interface FormMultiSelectProps {
  label?: string;
  name: string;
  value: string[];
  onChange: (values: string[]) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
  maxSelected?: number;
}

export const FormMultiSelect: React.FC<FormMultiSelectProps> = ({
  label,
  name,
  value = [],
  onChange,
  onBlur,
  options,
  placeholder = "— Select —",
  error,
  required = false,
  disabled = false,
  helperText,
  icon,
  className = "",
  maxSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasError = !!error;
  const selectedOptions = options.filter((o) => value.includes(o.value));

  // Close dropdown on outside click
  const onBlurRef = useRef(onBlur);
  useEffect(() => { onBlurRef.current = onBlur; }, [onBlur]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        onBlurRef.current?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setIsFocused(true);
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    const isSelected = value.includes(option.value);
    if (isSelected) {
      onChange(value.filter((v) => v !== option.value));
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      onChange([...value, option.value]);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const triggerClasses = `
    w-full flex items-center justify-between gap-2
    px-3 py-2 rounded-xl border min-h-[44px]
    bg-white/90 backdrop-blur-sm
    text-sm transition-all duration-200
    outline-none
    ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
    ${icon ? "pl-10" : ""}
    ${getBorderClasses(hasError, isFocused || isOpen, disabled)}
    ${className}
  `;

  return (
    <div className="w-full mb-4" ref={containerRef}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-700 ml-1">*</span>}
          </label>
          {helperText && !hasError && (
            <span className="text-xs text-gray-500">{helperText}</span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Trigger */}
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-multiselectable="true"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(); }
            if (e.key === "Escape") { setIsOpen(false); setIsFocused(false); }
          }}
          className={triggerClasses}
        >
          {/* Tags or placeholder */}
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: option.color ? `${option.color}22` : "#e2e8f0",
                    color: option.color || "#334155",
                    border: `1px solid ${option.color ? `${option.color}55` : "#cbd5e1"}`,
                  }}
                >
                  {option.color && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                  )}
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(e, option.value)}
                      className="ml-0.5 hover:opacity-70 transition-opacity focus:outline-none"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            {/* Clear all */}
            {selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {maxSelected && (
              <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">
                {value.length}/{maxSelected} selected
              </div>
            )}
            <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
              {options.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-gray-400 text-center">No options available</li>
              ) : (
                options.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isMaxReached = !!maxSelected && value.length >= maxSelected && !isSelected;
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !isMaxReached && handleSelect(option)}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                        ${option.disabled || isMaxReached ? "text-gray-300 cursor-not-allowed" : "text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-blue-700"}
                        ${isSelected ? "bg-blue-50 text-blue-700" : ""}
                      `}
                    >
                      {/* Checkbox */}
                      <span className={`
                        flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                        ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"}
                      `}>
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>

                      <span className="flex items-center gap-2">
                        {option.color && (
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: option.color }} />
                        )}
                        <span className={isSelected ? "font-medium" : ""}>{option.label}</span>
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {hasError && (
        <div className="mt-2 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-red-700 flex-shrink-0" />
          <p className="text-red-700 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FormSelect;