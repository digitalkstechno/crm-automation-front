'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  cls: string;
}

interface InlineDropdownProps {
  value: string;
  options: DropdownOption[];
  onSelect: (val: string) => void;
}

export default function InlineDropdown({ value, options, onSelect }: InlineDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => {
      if (open) updatePosition();
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  };

  const handleToggle = () => {
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-80 transition-all border border-transparent hover:border-gray-200 ${current?.cls || 'bg-gray-100 text-gray-700'}`}
      >
        {current?.label || value}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded-md transition-all ${value === opt.value ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <span className="px-2 py-1 rounded-md text-xs cursor-pointer">{opt.label}</span>
              {value === opt.value && (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}