import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';

export interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Date Range
  dateRangePreset: 'all' | 'this_month' | 'last_month' | 'custom';
  setDateRangePreset: (preset: 'all' | 'this_month' | 'last_month' | 'custom') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onClearDateRange: () => void;
  // Group
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  // Payer
  selectedPayer: string;
  onPayerChange: (payer: string) => void;
  // Sort
  sortBy: 'date' | 'amount';
  sortOrder: 'desc' | 'asc';
  onSortChange: (sortBy: 'date' | 'amount', sortOrder: 'desc' | 'asc') => void;
  // Count & Reset
  filteredCount: number;
  hasActiveFilters: boolean;
  onResetAll: () => void;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomBottomSheetSelectProps {
  id?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  isParentClosing?: boolean;
}

/**
 * Custom Dropdown/Popover Select for Bottom Sheet
 * Replaces native HTML <select> with customized rounded-2xl container,
 * smooth hover/selected states, and Check icon indicator.
 */
function CustomBottomSheetSelect({
  value,
  options,
  onChange,
  placeholder = '請選擇',
  isParentClosing = false,
}: CustomBottomSheetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown if parent modal is closing
  useEffect(() => {
    if (isParentClosing) {
      setIsOpen(false);
    }
  }, [isParentClosing]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Estimated max menu height ~200px; open upwards if space below is tight and space above is larger
    const openUpwards = spaceBelow < 200 && spaceAbove > spaceBelow;
    const menuWidth = rect.width;
    const safeLeft = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12));

    setMenuPosition({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: safeLeft,
      width: menuWidth,
      openUpwards,
    });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click, escape, resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs font-sans ${
          isOpen
            ? 'border-[#74818E] ring-2 ring-[#74818E]/10 bg-[#FAF7EE]/50 text-[#3A342E]'
            : 'border-stone-200 text-[#3A342E] hover:border-slate-400 hover:bg-slate-100'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#3A342E]' : ''
          }`}
        />
      </button>

      {/* Popover / Dropdown Menu Floating Content (Rendered via React Portal) */}
      {isOpen &&
        menuPosition &&
        typeof document !== 'undefined' &&
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
              zIndex: 9999,
            }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-0.5 max-h-60 overflow-y-auto select-none font-sans animate-in fade-in zoom-in-95 duration-150"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full py-2.5 px-4 text-sm rounded-xl transition-colors cursor-pointer text-left font-sans ${
                    isSelected
                      ? 'bg-[#74818E]/10 text-[#3A342E] font-semibold'
                      : 'text-slate-600 font-normal hover:bg-stone-50 hover:text-slate-800'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#606D7A] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

const GROUP_SELECT_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '所有群組' },
  { value: '小室友們', label: '小室友們' },
  { value: '台北一日遊', label: '台北一日遊' },
];

const PAYER_SELECT_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '所有付款人' },
  { value: 'me', label: '我 (Alice)' },
  { value: 'lin', label: '小林' },
  { value: 'ming', label: '阿明' },
];

const SORT_SELECT_OPTIONS: DropdownOption[] = [
  { value: 'date_desc', label: '日期由新到舊' },
  { value: 'date_asc', label: '日期由舊到新' },
  { value: 'amount_desc', label: '金額由高到低' },
  { value: 'amount_asc', label: '金額由低到高' },
];

export default function FilterBottomSheet({
  isOpen,
  onClose,
  dateRangePreset,
  setDateRangePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClearDateRange: _onClearDateRange,
  selectedGroup,
  onGroupChange,
  selectedPayer,
  onPayerChange,
  sortBy,
  sortOrder,
  onSortChange,
  filteredCount: _filteredCount,
  hasActiveFilters,
  onResetAll,
}: FilterBottomSheetProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Manage mount/unmount and smooth transition states
  useEffect(() => {
    let animFrame: number;
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setIsRendered(true);
      // Wait for next frame to trigger enter transition
      animFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isRendered) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Date Preset handler
  const handleSelectPreset = (preset: 'all' | 'this_month' | 'custom') => {
    setDateRangePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'this_month') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    }
  };

  const isDateDisabled = dateRangePreset !== 'custom';
  const currentSortValue = `${sortBy}_${sortOrder}`;

  const handleSortSelect = (val: string) => {
    if (val === 'date_desc') onSortChange('date', 'desc');
    else if (val === 'date_asc') onSortChange('date', 'asc');
    else if (val === 'amount_desc') onSortChange('amount', 'desc');
    else if (val === 'amount_asc') onSortChange('amount', 'asc');
  };

  return (
    <div 
      className={`fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop click to close */}
      <div 
        className="flex-1 cursor-pointer" 
        onClick={handleClose} 
        aria-label="點擊關閉篩選"
      />
      
      {/* Bottom Sheet Container (smooth slide-in and slide-out) */}
      <div 
        className={`bg-[#FAF7EE] w-full max-w-lg sm:mx-auto rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl border-t sm:border-x border-[#C3D3DE]/60 transition-transform duration-300 ease-in-out transform ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Sheet Handle & Header */}
        <div className="px-5 pt-3 pb-3 border-b border-[#C3D3DE]/30 shrink-0">
          <div className="w-10 h-1 bg-[#C3D3DE] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#74818E]" />
              <span className="font-bold text-base text-[#3A342E]">篩選與排序</span>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetAll}
                  className="text-xs text-[#C1503B] hover:underline font-medium cursor-pointer"
                >
                  重設全部
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-full text-[#74818E] hover:text-[#3A342E] hover:bg-black/5 cursor-pointer transition-colors"
                aria-label="關閉"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Form Options (Order: 日期區間 ➔ 分帳群組 ➔ 付款人 ➔ 排序方式) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
          
          {/* 1. Date Range Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
              日期區間
            </label>
            {/* Quick 3 Options: [全部時間] [本月] [自訂] */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  dateRangePreset === 'all'
                    ? 'bg-[#74818E] text-white shadow-xs'
                    : 'bg-white text-[#3A342E] border border-stone-200 hover:bg-stone-50'
                }`}
              >
                全部時間
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('this_month')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  dateRangePreset === 'this_month'
                    ? 'bg-[#74818E] text-white shadow-xs'
                    : 'bg-white text-[#3A342E] border border-stone-200 hover:bg-stone-50'
                }`}
              >
                本月
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  dateRangePreset === 'custom'
                    ? 'bg-[#74818E] text-white shadow-xs'
                    : 'bg-white text-[#3A342E] border border-stone-200 hover:bg-stone-50'
                }`}
              >
                自訂
              </button>
            </div>

            {/* Dynamic Date Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[11px] font-semibold text-[#74818E] mb-1 block">起始日期</span>
                <input
                  type="date"
                  value={startDate}
                  disabled={isDateDisabled}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset('custom');
                  }}
                  className={`w-full px-2.5 py-2 text-xs border rounded-xl transition-colors font-sans focus:outline-none ${
                    isDateDisabled
                      ? 'bg-stone-100/90 text-slate-400 border-stone-200 cursor-not-allowed select-none'
                      : 'bg-white text-[#3A342E] border-stone-300 focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] cursor-pointer'
                  }`}
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#74818E] mb-1 block">結束日期</span>
                <input
                  type="date"
                  value={endDate}
                  disabled={isDateDisabled}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset('custom');
                  }}
                  className={`w-full px-2.5 py-2 text-xs border rounded-xl transition-colors font-sans focus:outline-none ${
                    isDateDisabled
                      ? 'bg-stone-100/90 text-slate-400 border-stone-200 cursor-not-allowed select-none'
                      : 'bg-white text-[#3A342E] border-stone-300 focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] cursor-pointer'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. Group Section (Custom Popover Dropdown) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
              分帳群組
            </label>
            <CustomBottomSheetSelect
              value={selectedGroup}
              options={GROUP_SELECT_OPTIONS}
              onChange={onGroupChange}
              placeholder="請選擇分帳群組"
              isParentClosing={!isVisible}
            />
          </div>

          {/* 3. Payer Section (Custom Popover Dropdown) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
              付款人
            </label>
            <CustomBottomSheetSelect
              value={selectedPayer}
              options={PAYER_SELECT_OPTIONS}
              onChange={onPayerChange}
              placeholder="請選擇付款人"
              isParentClosing={!isVisible}
            />
          </div>

          {/* 4. Sort Mode Section (Custom Popover Dropdown, Placed at Bottom) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
              排序方式
            </label>
            <CustomBottomSheetSelect
              value={currentSortValue}
              options={SORT_SELECT_OPTIONS}
              onChange={handleSortSelect}
              placeholder="請選擇排序方式"
              isParentClosing={!isVisible}
            />
          </div>

        </div>

        {/* Bottom Confirm Button */}
        <div className="p-4 border-t border-[#C3D3DE]/30 bg-white/70 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            套用
          </button>
        </div>
      </div>
    </div>
  );
}
