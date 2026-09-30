import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  triggerIcon?: React.ComponentType<{ className?: string; size?: number }>;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  openUpwards: boolean;
}

export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = '請選擇',
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  triggerIcon: TriggerIcon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Estimated max menu height ~220px; open upwards if space below is limited and space above is larger
    const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;

    // Minimum menu width to avoid cramping options
    const menuWidth = Math.max(rect.width, 148);

    // Prevent horizontal overflow
    const safeLeft = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));

    setMenuPosition({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: safeLeft,
      width: menuWidth,
      openUpwards
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Sync position on scroll or resize when open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = (e: Event) => {
      // If scrolling inside the dropdown menu itself, don't close or shift
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const inTrigger = triggerRef.current && triggerRef.current.contains(target);
      const inMenu = menuRef.current && menuRef.current.contains(target);
      if (!inTrigger && !inMenu) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className ? className : 'w-full'}`}>
      {/* Hidden input for form data */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3 py-2 bg-white border border-[#C3D3DE]/60 rounded-xl text-slate-600 focus:outline-none focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] transition-all text-sm font-normal h-[38px] flex items-center justify-between gap-1.5 cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {TriggerIcon ? (
            <TriggerIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : SelectedIcon ? (
            <SelectedIcon className="w-4 h-4 text-slate-400 shrink-0" />
          ) : null}
          <span className={`truncate font-normal ${selectedOption ? 'text-slate-600' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`text-slate-400 w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-600' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu rendered via React Portal to avoid Modal overflow/scrollbar issues */}
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              transform: menuPosition.openUpwards ? 'translateY(-100%)' : undefined,
              zIndex: 9999
            }}
            className={`bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 space-y-0.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 select-none ${menuClassName}`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-2.5 py-2 text-sm rounded-lg cursor-pointer transition-colors text-left font-sans ${
                    isSelected
                      ? 'bg-slate-50 text-slate-800 font-medium'
                      : 'text-slate-600 font-normal hover:bg-slate-50/80 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {OptionIcon && (
                      <OptionIcon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.subLabel && (
                      <span className="text-xs text-slate-400 shrink-0">
                        {option.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-slate-800 shrink-0 ml-1.5" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
