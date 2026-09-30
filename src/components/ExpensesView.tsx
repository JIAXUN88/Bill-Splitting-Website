import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  User, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Coffee, 
  Utensils, 
  Car, 
  Home, 
  Smile, 
  MoreHorizontal, 
  ShoppingCart,
  SlidersHorizontal,
  Plus,
  X,
  Check,
  Zap
} from 'lucide-react';
import { ExpenseItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import CustomSelect, { SelectOption } from './CustomSelect';
import FilterBottomSheet from './FilterBottomSheet';
import { useLedger } from '../context/LedgerContext';

// 全站統一類別 Icon 與名稱對照表 (CATEGORY_CONFIG)
export const CATEGORY_CONFIG = {
  grocery: { value: 'grocery', label: '日常用品', shortLabel: '日用', icon: ShoppingCart },
  food: { value: 'food', label: '餐飲食品', shortLabel: '餐飲', icon: Utensils },
  traffic: { value: 'traffic', label: '交通出行', shortLabel: '交通', icon: Car },
  living: { value: 'living', label: '水電居住', shortLabel: '居住', icon: Home },
  entertainment: { value: 'entertainment', label: '休閒娛樂', shortLabel: '娛樂', icon: Smile },
  other: { value: 'other', label: '其他支出', shortLabel: '其他', icon: MoreHorizontal },
} as const;

// 統一類別 Icon 對照表 (與 CATEGORY_CONFIG 保持 100% 一致)
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case '日用':
    case '日常用品':
    case 'grocery':
      return CATEGORY_CONFIG.grocery.icon;
    case '餐飲':
    case '餐飲食品':
    case 'food':
      return CATEGORY_CONFIG.food.icon;
    case '交通':
    case '交通出行':
      return CATEGORY_CONFIG.traffic.icon;
    case '電費':
    case '帳單':
      return Zap;
    case '居住':
    case '水電居住':
    case '水電':
    case 'living':
      return CATEGORY_CONFIG.living.icon;
    case '娛樂':
    case '休閒娛樂':
    case 'entertainment':
      return CATEGORY_CONFIG.entertainment.icon;
    case '其他':
    case '其他支出':
    case 'other':
      return CATEGORY_CONFIG.other.icon;
    default:
      return Coffee;
  }
};

const GROUP_OPTIONS: SelectOption[] = [
  { value: 'all', label: '所有群組' },
  { value: '小室友們', label: '小室友們' },
  { value: '台北一日遊', label: '台北一日遊' },
];

const PAYER_OPTIONS: SelectOption[] = [
  { value: 'all', label: '所有付款人' },
  { value: 'me', label: '我 (Alice)' },
  { value: 'lin', label: '小林' },
  { value: 'ming', label: '阿明' },
];

const formatPayerLabel = (payer: string): string => {
  if (!payer) return '';
  if (payer.includes('付款') || payer.includes('代墊') || payer.includes('支付')) {
    return payer;
  }
  return `${payer} 付款`;
};

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  onDeleteExpense: (id: string) => void;
  onOpenQuickRecord: () => void;
  onEditExpense?: (expense: ExpenseItem) => void;
}

export default function ExpensesView({ 
  expenses, 
  onDeleteExpense, 
  onOpenQuickRecord, 
  onEditExpense 
}: ExpensesViewProps) {
  const { selectedExpenseGroupFilter, setSelectedExpenseGroupFilter, openEditExpenseModal } = useLedger();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null);

  const handleEditExpense = (item: ExpenseItem) => {
    if (onEditExpense) {
      onEditExpense(item);
    } else if (openEditExpenseModal) {
      openEditExpenseModal(item);
    }
  };

  // 取得初始群組篩選：優先讀取 URL query (?group= 或 ?groupId=)，其次為 Context 中的 selectedExpenseGroupFilter
  const getInitialGroup = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlGroup = params.get('group') || params.get('groupId');
      if (urlGroup) {
        if (urlGroup === '台北一日遊' || urlGroup === 'taipei' || urlGroup === 'g2') return '台北一日遊';
        if (urlGroup === '小室友們' || urlGroup === 'roommates' || urlGroup === 'g1') return '小室友們';
        return urlGroup;
      }
    } catch {
      // ignore
    }
    if (selectedExpenseGroupFilter && selectedExpenseGroupFilter !== 'all') {
      if (selectedExpenseGroupFilter === 'roommates') return '小室友們';
      if (selectedExpenseGroupFilter === 'taipei') return '台北一日遊';
      return selectedExpenseGroupFilter;
    }
    return 'all';
  };

  const [selectedGroup, setSelectedGroup] = useState<string>(getInitialGroup);
  const [selectedPayer, setSelectedPayer] = useState('all');

  // Keep selectedGroup in sync if selectedExpenseGroupFilter or URL updates
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlGroup = params.get('group') || params.get('groupId');
      if (urlGroup) {
        const resolved = (urlGroup === '台北一日遊' || urlGroup === 'taipei' || urlGroup === 'g2') 
          ? '台北一日遊' 
          : (urlGroup === '小室友們' || urlGroup === 'roommates' || urlGroup === 'g1') 
            ? '小室友們' 
            : urlGroup;
        setSelectedGroup(resolved);
        return;
      }
    } catch {
      // ignore
    }

    if (selectedExpenseGroupFilter) {
      if (selectedExpenseGroupFilter === 'roommates') {
        setSelectedGroup('小室友們');
      } else if (selectedExpenseGroupFilter === 'taipei') {
        setSelectedGroup('台北一日遊');
      } else {
        setSelectedGroup(selectedExpenseGroupFilter);
      }
    }
  }, [selectedExpenseGroupFilter]);

  const handleGroupChange = (val: string) => {
    setSelectedGroup(val);
    setSelectedExpenseGroupFilter(val);
    try {
      const url = new URL(window.location.href);
      if (val === 'all') {
        url.searchParams.delete('group');
        url.searchParams.delete('groupId');
      } else {
        url.searchParams.set('group', val);
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };
  const [expandedId, setExpandedId] = useState<string | null>(null); // starts collapsed
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Date Range Filtering State
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dateRangeRef = useRef<HTMLDivElement | null>(null);

  // Close date range popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setIsDateRangeOpen(false);
      }
    }
    if (isDateRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateRangeOpen]);

  // Set date preset helpers
  const handleSelectPreset = (preset: 'all' | 'this_month' | 'last_month' | 'custom') => {
    setDateRangePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setIsDateRangeOpen(false);
    } else if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
      setIsDateRangeOpen(false);
    } else if (preset === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonthDate.getFullYear();
      const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, lastMonthDate.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
      setIsDateRangeOpen(false);
    }
  };

  const handleClearDateRange = () => {
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setIsDateRangeOpen(false);
  };

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter expenses based on search, group, payer, and date range
  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.payer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGroup = selectedGroup === 'all' || 
                         ((selectedGroup === 'roommates' || selectedGroup === '小室友們') && (item.groupName === '小室友們' || !item.groupName)) || 
                         ((selectedGroup === 'taipei' || selectedGroup === '台北一日遊') && item.groupName === '台北一日遊') ||
                         (selectedGroup === 'none' && (item.groupName === '無群組' || item.groupName === '個人/無群組'));
                         
    const matchesPayer = selectedPayer === 'all' || 
                         (selectedPayer === 'me' && (item.payer.includes('自己') || item.payer.includes('我'))) ||
                         (selectedPayer === 'lin' && item.payer.includes('小林')) ||
                         (selectedPayer === 'ming' && item.payer.includes('阿明'));

    // Date Range comparison (item.date formatted as 'YYYY/MM/DD' or 'YYYY-MM-DD')
    let matchesDate = true;
    if (startDate || endDate) {
      const itemDateStr = item.date.replace(/\//g, '-');
      if (startDate && itemDateStr < startDate) {
        matchesDate = false;
      }
      if (endDate && itemDateStr > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesGroup && matchesPayer && matchesDate;
  }).sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
    // Default sort by date
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Check if any comprehensive filter or non-default sort is active
  const hasActiveFilters = 
    selectedGroup !== 'all' || 
    selectedPayer !== 'all' || 
    startDate !== '' || 
    endDate !== '' || 
    dateRangePreset !== 'all' || 
    sortBy !== 'date' || 
    sortOrder !== 'desc';

  // Date range display button label
  const getDateRangeLabel = () => {
    if (dateRangePreset === 'this_month') return '本月';
    if (dateRangePreset === 'last_month') return '上月';
    if (startDate && endDate) return `${startDate.slice(5)} ~ ${endDate.slice(5)}`;
    if (startDate) return `${startDate.slice(5)} 起`;
    if (endDate) return `至 ${endDate.slice(5)}`;
    return '日期範圍';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-3 md:gap-4 w-full">
        {/* 左側：搜尋框 (填滿剩餘空間，在 lg 以上保有限制寬度) */}
        <div className="flex-1 min-w-[180px] lg:max-w-[480px]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="搜尋項目、分類或付款人..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 placeholder:text-slate-400 font-normal text-sm font-sans focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all h-[38px]" 
            />
          </div>
        </div>

        {/* lg 以下 (< 1024px，包含 Tablet 與 Phone)：整合為單一「篩選 Icon 按鈕」 */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className={`lg:hidden flex items-center justify-center w-[38px] h-[38px] rounded-xl border transition-colors shrink-0 cursor-pointer relative ${
            hasActiveFilters
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-white/80 text-slate-600 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="開啟綜合篩選"
          title="開啟綜合篩選"
        >
          <SlidersHorizontal size={17} />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C1503B] rounded-full ring-2 ring-[#FAF7EE]" />
          )}
        </button>

        {/* lg 以上 (≥ 1024px)：三個獨立下拉選單 (日期、群組、付款人) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Calendar Range selector */}
          <div className="relative" ref={dateRangeRef}>
            <button 
              type="button"
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              className={`px-3 py-2 rounded-xl border font-normal text-sm flex items-center gap-1.5 transition-colors cursor-pointer h-[38px] ${
                startDate || endDate || dateRangePreset !== 'all'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Calendar size={15} className={startDate || endDate || dateRangePreset !== 'all' ? 'text-white' : 'text-slate-400'} />
              <span>{getDateRangeLabel()}</span>
              {startDate || endDate ? (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDateRange();
                  }}
                  className="hover:bg-white/20 rounded-full p-0.5 ml-0.5"
                  title="清除日期範圍"
                >
                  <X size={12} />
                </span>
              ) : (
                <ChevronDown size={13} className={startDate || endDate || dateRangePreset !== 'all' ? 'text-white' : 'text-slate-400'} />
              )}
            </button>

            {/* Date Range Picker Popover */}
            {isDateRangeOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-[#C3D3DE]/60 p-4 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#C3D3DE]/30">
                  <span className="text-xs font-bold text-[#3A342E] flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#74818E]" />
                    篩選日期範圍
                  </span>
                  {(startDate || endDate || dateRangePreset !== 'all') && (
                    <button 
                      type="button"
                      onClick={handleClearDateRange}
                      className="text-[11px] text-[#74818E] hover:text-[#C1503B] underline cursor-pointer"
                    >
                      重設
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5 py-3 border-b border-[#C3D3DE]/30">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('all')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                      dateRangePreset === 'all' && !startDate && !endDate
                        ? 'bg-[#74818E] text-white'
                        : 'bg-[#F7F2E7] text-[#74818E] hover:bg-[#C3D3DE]/30'
                    }`}
                  >
                    全部時間
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('this_month')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                      dateRangePreset === 'this_month'
                        ? 'bg-[#74818E] text-white'
                        : 'bg-[#F7F2E7] text-[#74818E] hover:bg-[#C3D3DE]/30'
                    }`}
                  >
                    本月份
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('last_month')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                      dateRangePreset === 'last_month'
                        ? 'bg-[#74818E] text-white'
                        : 'bg-[#F7F2E7] text-[#74818E] hover:bg-[#C3D3DE]/30'
                    }`}
                  >
                    上個月份
                  </button>
                </div>

                {/* Custom Date Inputs */}
                <div className="pt-3 space-y-2.5">
                  <div className="text-[11px] font-semibold text-[#74818E]">自訂區間</div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] text-[#74818E] mb-1">起始日期</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDateRangePreset('custom');
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-[#F7F2E7]/40 border border-[#C3D3DE]/60 rounded-md text-[#3A342E] focus:outline-none focus:border-[#74818E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#74818E] mb-1">結束日期</label>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDateRangePreset('custom');
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-[#F7F2E7]/40 border border-[#C3D3DE]/60 rounded-md text-[#3A342E] focus:outline-none focus:border-[#74818E]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDateRangeOpen(false)}
                      className="px-3 py-1.5 bg-[#74818E] hover:bg-[#606D7A] text-white text-xs font-semibold rounded-md shadow-2xs cursor-pointer"
                    >
                      套用篩選
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group dropdown */}
          <CustomSelect 
            value={selectedGroup}
            onChange={handleGroupChange}
            options={GROUP_OPTIONS}
            triggerIcon={Users}
            className="w-auto shrink-0"
            triggerClassName="!h-[38px] !py-2 !px-3 !gap-1.5 !bg-white/80 hover:!bg-slate-50 !border-slate-200 !text-sm !font-normal !rounded-xl !text-slate-600"
          />

          {/* Payer dropdown */}
          <CustomSelect 
            value={selectedPayer}
            onChange={setSelectedPayer}
            options={PAYER_OPTIONS}
            triggerIcon={User}
            className="w-auto shrink-0"
            triggerClassName="!h-[38px] !py-2 !px-3 !gap-1.5 !bg-white/80 hover:!bg-slate-50 !border-slate-200 !text-sm !font-normal !rounded-xl !text-slate-600"
          />
        </div>
      </div>

      {/* Active Group Filter Summary Indicator */}
      {selectedGroup !== 'all' && (
        <div className="bg-[#FAF7EE] border border-[#C3D3DE]/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#3A342E] shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500">目前檢視群組：</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#C3D3DE]/70 font-bold text-[#3A342E] shadow-2xs">
              <Users size={13} className="text-[#74818E]" />
              {selectedGroup}
            </span>
            <span className="text-[#74818E] font-medium">
              (共 {filteredExpenses.length} 筆明細，群組總支出 NT${filteredExpenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString()})
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleGroupChange('all')}
            className="text-xs text-[#74818E] hover:text-[#3A342E] underline font-medium cursor-pointer"
          >
            檢視全站所有支出
          </button>
        </div>
      )}

      {/* Ledger List Card Container */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-2 sm:p-2.5 space-y-1">
        {/* Header Row (Desktop only ≥ 1024px) */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-4 py-3 bg-stone-50/80 rounded-xl text-[#74818E] text-xs font-semibold border border-stone-100/80 items-center select-none">
          <div>名稱</div>
          <div>
            <button
              type="button"
              onClick={() => handleSort('date')}
              className="inline-flex items-center gap-1 hover:text-[#3A342E] transition-colors cursor-pointer"
              title={`依日期排序 (${sortBy === 'date' && sortOrder === 'asc' ? '目前由舊到新' : '目前由新到舊'})`}
            >
              <span>日期</span>
              <span className="text-[11px] font-mono">
                {sortBy === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : '⇅'}
              </span>
            </button>
          </div>
          <div>群組</div>
          <div>付款人</div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => handleSort('amount')}
              className="inline-flex items-center gap-1 hover:text-[#3A342E] transition-colors cursor-pointer justify-end ml-auto"
              title={`依原始金額排序 (${sortBy === 'amount' && sortOrder === 'asc' ? '目前由小到大' : '目前由大到小'})`}
            >
              <span>原始金額</span>
              <span className="text-[11px] font-mono">
                {sortBy === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : '⇅'}
              </span>
            </button>
          </div>
          {/* Operation column label removed for cleanliness */}
          <div className="text-right pr-2"></div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart size={40} className="mx-auto text-[#74818E] opacity-40 mb-3" />
            <p className="text-sm font-semibold text-[#74818E]">找不到符合條件的支出款項</p>
            <button 
              onClick={onOpenQuickRecord}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              立即新增一筆
            </button>
          </div>
        ) : (
          filteredExpenses.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            const isExpanded = expandedId === item.id;
            const isFundPayment = item.paymentMethod === 'OFFICIAL_FUND' || item.payer === '公積金支付' || item.payer.includes('公積金');
            const isItemLocked = !isFundPayment && (!!item.isLocked || item.status === 'PENDING' || item.status === 'SETTLED');

            return (
              <div 
                key={item.id}
                id={`expense-card-${item.id}`}
                className={`rounded-xl transition-all group relative overflow-hidden ${
                  isItemLocked
                    ? 'bg-[#F9F9F8]/80 text-gray-600'
                    : 'bg-white hover:bg-stone-50/80'
                }`}
              >
                {/* Desktop Table Row (≥ 1024px) */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="hidden lg:grid lg:grid-cols-6 gap-4 px-4 py-3.5 items-center cursor-pointer select-none"
                >
                  {/* Column 1: Name and Category */}
                  <div className="flex items-center gap-3 font-sans min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isItemLocked ? 'bg-gray-200/70 text-gray-500' : 'bg-[#C3D3DE]/20 text-[#74818E]'
                    }`}>
                      <IconComponent size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`font-bold text-sm flex items-center gap-1.5 ${isItemLocked ? 'text-gray-600' : 'text-[#3A342E]'}`}>
                        <span className="truncate">{item.name}</span>
                        {isItemLocked && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                            <Lock size={10} /> 已鎖定
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Date */}
                  <div className={`text-sm font-medium font-sans ${isItemLocked ? 'text-gray-500' : 'text-[#3A342E]'}`}>
                    {item.date}
                  </div>

                  {/* Column 3: Group */}
                  <div className={`text-sm font-semibold truncate ${item.groupName === '無群組' ? 'text-gray-400 italic' : isItemLocked ? 'text-gray-500' : 'text-[#3A342E]'}`}>
                    {item.groupName}
                  </div>

                  {/* Column 4: Payer */}
                  <div className={`text-sm font-sans truncate ${isItemLocked ? 'text-gray-500' : 'text-[#3A342E]'}`}>
                    {item.payer}
                  </div>

                  {/* Column 5: Amount */}
                  <div className={`text-right text-base lg:text-lg font-bold font-sans flex items-center justify-end gap-1.5 shrink-0 ml-auto ${
                    isItemLocked ? 'text-gray-500' : 'text-[#74818E]'
                  }`}>
                    <span className="tabular-nums">NT${item.amount.toLocaleString()}</span>
                  </div>

                  {/* Column 6: Action Buttons */}
                  <div className="flex justify-end items-center gap-1 pr-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isItemLocked) return;
                        handleEditExpense(item);
                      }}
                      disabled={isItemLocked}
                      aria-disabled={isItemLocked}
                      className={`p-1.5 rounded transition-colors ${
                        isItemLocked 
                          ? 'text-gray-300 cursor-not-allowed pointer-events-none opacity-40' 
                          : 'text-[#74818E] hover:bg-[#F7F2E7] cursor-pointer'
                      }`}
                      title={isItemLocked ? "已連鎖鎖定，不可編輯" : "編輯支出"}
                      aria-label={isItemLocked ? "已連鎖鎖定，不可編輯" : "編輯支出"}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isItemLocked) return;
                        setDeletingExpense(item);
                      }}
                      disabled={isItemLocked}
                      aria-disabled={isItemLocked}
                      className={`p-1.5 rounded transition-colors ${
                        isItemLocked 
                          ? 'text-gray-300 cursor-not-allowed pointer-events-none opacity-40' 
                          : 'text-[#74818E] hover:text-[#C1503B] hover:bg-red-50 cursor-pointer'
                      }`}
                      title={isItemLocked ? "已連鎖鎖定，不可刪除" : "刪除"}
                      aria-label={isItemLocked ? "已連鎖鎖定，不可刪除" : "刪除"}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                      className="p-1 rounded text-[#74818E] hover:text-slate-700 hover:bg-[#F7F2E7] cursor-pointer transition-colors ml-1"
                      title={isExpanded ? "收合明細" : "展開明細"}
                      aria-label={isExpanded ? "收合明細" : "展開明細"}
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 transform ${isExpanded ? 'rotate-180 text-slate-800' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Tablet & Mobile Card Row (< 1024px) */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="lg:hidden flex items-start justify-between gap-3 px-4 py-3 cursor-pointer select-none"
                >
                  {/* Left: Category Icon, Name, Date & Payer, Group Chip */}
                  <div className="flex items-start gap-3 font-sans min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isItemLocked ? 'bg-gray-200/70 text-gray-500' : 'bg-[#C3D3DE]/20 text-[#74818E]'
                    }`}>
                      <IconComponent size={18} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Line 1: Name */}
                      <span className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${isItemLocked ? 'text-gray-600' : 'text-[#3A342E]'}`}>
                        <span className="truncate">{item.name}</span>
                        {isItemLocked && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                            <Lock size={10} /> 已鎖定
                          </span>
                        )}
                      </span>
                      {/* Line 2: Date & Payer */}
                      <div className="text-xs text-[#74818E] font-sans leading-tight whitespace-nowrap truncate">
                        {item.date} · {formatPayerLabel(item.payer)}
                      </div>
                      {/* Line 3: Group Badge/Chip */}
                      <div className="pt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-[#74818E] border border-stone-200/70 leading-normal">
                          {item.groupName || '小室友們'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount and Chevron - items-start aligned with Line 1 */}
                  <div className="flex items-start gap-2 shrink-0 pt-0.5">
                    <span className={`text-base sm:text-lg font-bold font-sans tabular-nums leading-tight ${
                      isItemLocked ? 'text-gray-500' : 'text-[#74818E]'
                    }`}>
                      NT${item.amount.toLocaleString()}
                    </span>
                    <div className="text-[#74818E] shrink-0 mt-0.5">
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 transform ${isExpanded ? 'rotate-180 text-slate-800' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsible detail panel with smooth vertical slide animation */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`details-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-4.5 border-t border-stone-100 bg-stone-50/40 rounded-b-xl text-left">
                    {/* Locked notice if item is locked */}
                    {isItemLocked && (
                      <div className="mb-4 bg-amber-50/80 border border-amber-200/70 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-800 font-sans">
                        <Lock size={14} className="shrink-0 text-amber-700" />
                        <span>此筆支出已關聯還款審核單或已結算，受連鎖鎖定保護中，無法進行編輯與刪除。</span>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-8 max-w-4xl">
                      {/* Left Block: Notes & splitting details */}
                      <div className="flex-1 space-y-3.5">
                        <div>
                          <h4 className="text-xs font-bold text-[#74818E] uppercase tracking-wider mb-1 font-sans">
                            備註內容
                          </h4>
                          <p className="text-sm text-[#3A342E] font-medium leading-relaxed">
                            {item.notes || '無備註資訊。'}
                          </p>
                        </div>
                        
                        {item.splitMembers.length > 0 && (
                          <div className="pt-2">
                            <h4 className="text-xs font-bold text-[#74818E] uppercase tracking-wider mb-2 font-sans">
                              分攤成員
                            </h4>
                            <div className="flex flex-col gap-2 font-sans text-xs max-w-[220px]">
                              {item.splitMembers.map((sm, smIdx) => (
                                <div 
                                  key={smIdx} 
                                  className="flex items-center justify-between text-[#3A342E]"
                                >
                                  <div className="flex items-center gap-2">
                                    <User size={14} className="text-[#74818E] shrink-0" />
                                    <span className="font-medium text-[#3A342E]">{sm.name}</span>
                                  </div>
                                  <span className="font-bold text-[#3A342E] font-mono tabular-nums">
                                    ${sm.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Operation timeline tracks (Newest First) */}
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#74818E] uppercase tracking-wider mb-2 font-sans">
                          操作軌跡
                        </h4>
                        <div className="relative border-l border-gray-200 pl-4 ml-1.5 space-y-3.5 font-sans">
                          {(() => {
                            // 倒序排列（Newest First，最新操作在最上面）
                            const sortedLogs = [...item.logs].sort((a, b) => {
                              const timeA = new Date(a.date.replace(/-/g, '/')).getTime();
                              const timeB = new Date(b.date.replace(/-/g, '/')).getTime();
                              if (isNaN(timeA) || isNaN(timeB)) {
                                return b.date.localeCompare(a.date);
                              }
                              return timeB - timeA;
                            });

                            return sortedLogs.map((log, lIdx) => (
                              <div key={lIdx} className="relative">
                                {/* Timeline indicator circle */}
                                <span className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${
                                  lIdx === 0 ? 'bg-[#74818E]' : 'bg-gray-300'
                                }`} />
                                <div className="text-xs">
                                  <p className="text-[#3A342E] font-bold">{log.date} 由 {log.author} {log.text.includes('建立') ? '建立' : '更新'}</p>
                                  <p className="text-[#74818E] text-[11px] mt-0.5">{log.text}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Tablet & Mobile Quick Action Buttons in expanded details panel (< 1024px) */}
                    <div className="lg:hidden mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-end gap-2 font-sans">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isItemLocked) return;
                          handleEditExpense(item);
                        }}
                        disabled={isItemLocked}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isItemLocked 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-[#606D7A] bg-[#F7F2E7] hover:bg-[#E8EDF1] active:bg-[#D9E3EA] cursor-pointer'
                        }`}
                      >
                        <Edit size={13} />
                        <span>編輯支出</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isItemLocked) return;
                          setDeletingExpense(item);
                        }}
                        disabled={isItemLocked}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isItemLocked 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-[#C1503B] bg-red-50 hover:bg-red-100 active:bg-red-200 cursor-pointer'
                        }`}
                      >
                        <Trash2 size={13} />
                        <span>刪除</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#3A342E]/40 backdrop-blur-[2px] transition-opacity cursor-pointer pointer-events-auto"
            onClick={() => setDeletingExpense(null)}
            aria-label="點擊遮罩關閉"
          />

          {/* Dialog Card */}
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl border border-stone-200/80 p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-150 font-sans"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="delete-dialog-title" className="text-base font-bold text-[#3A342E]">
                  確認要刪除此筆支出？
                </h3>
                <p className="text-sm text-[#74818E] mt-1 leading-relaxed">
                  刪除後將無法復原「<span className="font-semibold text-[#3A342E]">{deletingExpense.name}</span>」（金額 NT${deletingExpense.amount.toLocaleString()}）。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-[#3A342E] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = deletingExpense.id;
                  setDeletingExpense(null);
                  onDeleteExpense(targetId);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tablet & Phone Comprehensive Filter Bottom Sheet Modal (< lg) */}
      <FilterBottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        dateRangePreset={dateRangePreset}
        setDateRangePreset={setDateRangePreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onClearDateRange={handleClearDateRange}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        selectedPayer={selectedPayer}
        onPayerChange={setSelectedPayer}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        filteredCount={filteredExpenses.length}
        hasActiveFilters={hasActiveFilters}
        onResetAll={() => {
          handleClearDateRange();
          handleGroupChange('all');
          setSelectedPayer('all');
          setSortBy('date');
          setSortOrder('desc');
        }}
      />

    </div>
  );
}
