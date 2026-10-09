import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Smile,
  MoreHorizontal
} from 'lucide-react';
import { ExpenseItem, AppUser } from '../types';
import { useLedger } from '../context/LedgerContext';
import CustomSelect, { SelectOption } from './CustomSelect';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense?: (expense: Omit<ExpenseItem, 'id' | 'logs'>) => void;
  onUpdateExpense?: (id: string, expense: Partial<ExpenseItem>) => void;
  editingExpense?: ExpenseItem | null;
  currentUser?: AppUser;
}

// Group configuration with reserve fund enablement status
interface GroupOption {
  id: string;
  name: string;
  label: string;
  hasReserveFund: boolean;
}

const AVAILABLE_GROUPS: GroupOption[] = [
  { id: 'roommates', name: '小室友們', label: '小室友們 (3人)', hasReserveFund: true },
  { id: 'taipei', name: '台北一日遊', label: '台北一日遊', hasReserveFund: false }
];

// Helper: Map expense category string to select value
const mapCategoryToValue = (cat?: string): string => {
  if (!cat) return '';
  if (cat.includes('餐') || cat.includes('食') || cat === 'food') return 'food';
  if (cat.includes('日') || cat.includes('用') || cat === 'grocery') return 'grocery';
  if (cat.includes('交') || cat.includes('車') || cat === 'traffic') return 'traffic';
  if (cat.includes('住') || cat.includes('水電') || cat === 'living') return 'living';
  if (cat.includes('樂') || cat.includes('休') || cat === 'entertainment') return 'entertainment';
  return 'other';
};

// Helper: Map group name to select value
const mapGroupToValue = (grpName?: string): string => {
  if (!grpName) return 'roommates';
  if (grpName.includes('室友') || grpName === 'roommates') return 'roommates';
  if (grpName.includes('台北') || grpName === 'taipei') return 'taipei';
  return 'roommates';
};

// Helper: Map payer string to persona option value
const mapPayerToValue = (payerStr?: string): string => {
  if (!payerStr) return 'user_me';
  if (payerStr.includes('林') || payerStr === 'user_lin') return 'user_lin';
  if (payerStr.includes('明') || payerStr === 'user_ming') return 'user_ming';
  return 'user_me';
};

// Helper: Map split members array to state
const mapSplitMembersToState = (splits?: { name: string; memberId?: string; amount?: number }[]) => {
  if (!splits || splits.length === 0) {
    return { me: true, lin: true, ming: true };
  }
  const hasMe = splits.some(s => s.name === '我' || s.name === 'Alice' || s.name === '自己' || s.memberId === 'user_me');
  const hasLin = splits.some(s => s.name === '小林' || s.memberId === 'user_lin');
  const hasMing = splits.some(s => s.name === '阿明' || s.memberId === 'user_ming');
  return {
    me: hasMe,
    lin: hasLin,
    ming: hasMing
  };
};

// 全站統一類別 Icon 與名稱對照表 (CATEGORY_CONFIG)
export const CATEGORY_CONFIG = {
  grocery: { value: 'grocery', label: '日常用品', shortLabel: '日用', icon: ShoppingCart },
  food: { value: 'food', label: '餐飲食品', shortLabel: '餐飲', icon: Utensils },
  traffic: { value: 'traffic', label: '交通出行', shortLabel: '交通', icon: Car },
  living: { value: 'living', label: '水電居住', shortLabel: '居住', icon: Home },
  entertainment: { value: 'entertainment', label: '休閒娛樂', shortLabel: '娛樂', icon: Smile },
  other: { value: 'other', label: '其他支出', shortLabel: '其他', icon: MoreHorizontal },
} as const;

export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: CATEGORY_CONFIG.grocery.value, label: CATEGORY_CONFIG.grocery.label, icon: CATEGORY_CONFIG.grocery.icon },
  { value: CATEGORY_CONFIG.food.value, label: CATEGORY_CONFIG.food.label, icon: CATEGORY_CONFIG.food.icon },
  { value: CATEGORY_CONFIG.traffic.value, label: CATEGORY_CONFIG.traffic.label, icon: CATEGORY_CONFIG.traffic.icon },
  { value: CATEGORY_CONFIG.living.value, label: CATEGORY_CONFIG.living.label, icon: CATEGORY_CONFIG.living.icon },
  { value: CATEGORY_CONFIG.entertainment.value, label: CATEGORY_CONFIG.entertainment.label, icon: CATEGORY_CONFIG.entertainment.icon },
  { value: CATEGORY_CONFIG.other.value, label: CATEGORY_CONFIG.other.label, icon: CATEGORY_CONFIG.other.icon },
];

const PAYER_OPTIONS: SelectOption[] = [
  { value: 'user_me', label: '我 (本人)' },
  { value: 'user_lin', label: '小林' },
  { value: 'user_ming', label: '阿明' },
];

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onAddExpense,
  onUpdateExpense,
  editingExpense: propEditingExpense,
  currentUser: propUser 
}: AddExpenseModalProps) {
  const { 
    currentUser: contextUser, 
    groupFundBalance, 
    enableReserveFund,
    distributeRemainder,
    handleAddExpense: contextAddExpense,
    handleUpdateExpense: contextUpdateExpense,
    editingExpense: contextEditingExpense
  } = useLedger();

  const currentUser = propUser || contextUser;
  const editingExpense = propEditingExpense !== undefined ? propEditingExpense : contextEditingExpense;
  const isEditMode = Boolean(editingExpense);

  // Empty State defaults: input fields start empty with placeholder text
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  // Date defaults to today in YYYY-MM-DD format
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState('');
  const [group, setGroup] = useState('');
  const [paymentMode, setPaymentMode] = useState<'advance_split' | 'reserve_fund'>('advance_split');
  const [payer, setPayer] = useState(currentUser?.id || 'user_me');
  const [splitMembers, setSplitMembers] = useState({
    me: true,
    lin: true,
    ming: true
  });
  const [notes, setNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('新增支出成功！');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Check whether the selected group has enabled reserve fund
  const selectedGroupConfig = AVAILABLE_GROUPS.find(g => g.id === group);
  const hasReserveFund = Boolean((enableReserveFund ?? true) && selectedGroupConfig?.hasReserveFund);

  // 編輯模式下「即時可用公積金餘額 (Available Pool Balance)」動態計算：
  // 若此筆編輯中的支出原本就是公積金支付，先暫時釋放其原本佔用的金額，算出真正的公積金上限
  const editingExpenseOriginalFundAmount = (isEditMode && editingExpense && (editingExpense.paymentMethod === 'OFFICIAL_FUND' || editingExpense.payer.includes('公積金')))
    ? (editingExpense.amount || 0)
    : 0;
  const availablePoolBalance = groupFundBalance + editingExpenseOriginalFundAmount;

  const parsedAmount = isNaN(parseFloat(amount)) ? 0 : parseFloat(amount);
  const isInsufficientFund = hasReserveFund && parsedAmount > availablePoolBalance;
  // 預計剩餘餘額 = (目前資料庫公積金餘額 + 本筆支出原始金額) - 當前輸入的金額
  const projectedFundBalance = availablePoolBalance - parsedAmount;

  // Background Scroll Lock (Lock body scroll when modal is open)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Clean up toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Explicit Reset helper: Only called on Cancel button or on initial load if needed
  const resetFormToDefault = () => {
    setName('');
    setAmount('');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
    setCategory('');
    setGroup('');
    setPaymentMode('advance_split');
    setPayer(currentUser?.id || 'user_me');
    setSplitMembers({ me: true, lin: true, ming: true });
    setNotes('');
    setShowToast(false);
  };

  // Handle amount change with live balance overflow protection
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num > availablePoolBalance && paymentMode === 'reserve_fund') {
      // Auto-switch to personal advance when amount exceeds available pool balance
      setPaymentMode('advance_split');
    }
  };

  // Handle group change with reserve fund status linkage
  const handleGroupChange = (newGroupId: string) => {
    setGroup(newGroupId);
    const targetConfig = AVAILABLE_GROUPS.find(g => g.id === newGroupId);
    const targetHasFund = Boolean((enableReserveFund ?? true) && targetConfig?.hasReserveFund);

    if (targetHasFund) {
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0 && num > availablePoolBalance) {
        setPaymentMode('advance_split');
      } else {
        setPaymentMode('reserve_fund');
      }
    } else {
      setPaymentMode('advance_split');
    }
  };

  // Handle manual payment mode selection
  const handlePaymentModeChange = (mode: 'advance_split' | 'reserve_fund') => {
    if (mode === 'reserve_fund') {
      if (!hasReserveFund) return;
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0 && num > availablePoolBalance) {
        setPaymentMode('advance_split');
        return;
      }
      setPaymentMode('reserve_fund');
    } else {
      setPaymentMode('advance_split');
    }
  };

  // Sync state upon Modal opening:
  // - Edit mode: always prefill with editingExpense data
  // - New mode: preserve existing draft (do NOT reset on reopen)
  useEffect(() => {
    if (isOpen && editingExpense) {
      setName(editingExpense.name || '');
      setAmount(editingExpense.amount ? editingExpense.amount.toString() : '');
      setDate(editingExpense.date ? editingExpense.date.replace(/\//g, '-') : new Date().toISOString().split('T')[0]);
      setCategory(mapCategoryToValue(editingExpense.category));
      setGroup(mapGroupToValue(editingExpense.groupName));
      const isFund = editingExpense.paymentMethod === 'OFFICIAL_FUND' || editingExpense.payer.includes('公積金');
      setPaymentMode(isFund ? 'reserve_fund' : 'advance_split');
      setPayer(mapPayerToValue(editingExpense.payer));
      setSplitMembers(mapSplitMembersToState(editingExpense.splitMembers));
      setNotes(editingExpense.notes || '');
    }
  }, [isOpen, editingExpense]);

  // Animation state for smooth mobile slide up / slide down and desktop scale/fade
  const [isMountedAnimation, setIsMountedAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsMountedAnimation(true);
      }, 15);
      return () => clearTimeout(timer);
    } else {
      setIsMountedAnimation(false);
    }
  }, [isOpen]);

  const handleAnimatedClose = (afterClose?: () => void) => {
    setIsMountedAnimation(false);
    setTimeout(() => {
      if (afterClose) {
        afterClose();
      }
      onClose();
    }, 200);
  };

  // When clicking Cancel / X / Overlay: close without resetting (preserve draft)
  const handleCancel = () => {
    handleAnimatedClose();
  };

  // Guard: if current selected group doesn't have reserve fund, fallback paymentMode to 'advance_split'
  useEffect(() => {
    if (!hasReserveFund && paymentMode === 'reserve_fund') {
      setPaymentMode('advance_split');
    }
  }, [group, hasReserveFund, paymentMode]);

  // Member selection logic
  const selectedMembersCount = Object.values(splitMembers).filter(Boolean).length;
  const isAllMembersSelected = selectedMembersCount === 3;
  const isAnyMemberSelected = selectedMembersCount > 0;

  const groupOptions: SelectOption[] = AVAILABLE_GROUPS.map((g) => ({
    value: g.id,
    label: g.label
  }));

  // Toggle all members
  const handleToggleSelectAll = () => {
    if (isAllMembersSelected) {
      setSplitMembers({ me: false, lin: false, ming: false });
    } else {
      setSplitMembers({ me: true, lin: true, ming: true });
    }
  };

  // Form Validation: in advance_split mode, at least one member must be selected
  const isSplitValid = paymentMode === 'reserve_fund' || isAnyMemberSelected;
  const isFormValid = name.trim() !== '' && amount.trim() !== '' && parseFloat(amount) > 0 && category.trim() !== '' && group.trim() !== '' && isSplitValid;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !date || !category || !group) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Calculate split shares using distributeRemainder engine
    const candidateMembers: { id: string; name: string }[] = [];
    if (splitMembers.me) candidateMembers.push({ id: 'user_me', name: '我' });
    if (splitMembers.lin) candidateMembers.push({ id: 'user_lin', name: '小林' });
    if (splitMembers.ming) candidateMembers.push({ id: 'user_ming', name: '阿明' });

    let splitData: { name: string; amount: number; memberId?: string }[] = [];
    if (candidateMembers.length > 0) {
      const distResult = distributeRemainder(numAmount, candidateMembers);
      splitData = distResult.shares.map(s => ({
        name: s.memberName,
        amount: s.amount,
        memberId: s.memberId
      }));
    }

    const payerMap: Record<string, string> = {
      user_me: '自己',
      user_lin: '小林',
      user_ming: '阿明'
    };

    const submittedName = name.trim();
    const isFund = paymentMode === 'reserve_fund';

    const categoryMap: Record<string, string> = {
      food: '餐飲',
      grocery: '日用',
      traffic: '交通',
      living: '居住',
      entertainment: '娛樂',
      other: '其他'
    };

    // If editing existing expense, apply update and close modal
    if (isEditMode && editingExpense) {
      const isOriginallyLocked = editingExpense.isLocked === true && editingExpense.status === 'SETTLED';

      const updatePayload: Partial<ExpenseItem> = {
        name: submittedName,
        amount: numAmount,
        date: date.replace(/-/g, '/'),
        groupName: selectedGroupConfig?.name || '未指定群組',
        payer: isFund ? '公積金支付' : `${payerMap[payer] || '自己'}代墊`,
        paymentMethod: isFund ? 'OFFICIAL_FUND' : 'PERSONAL_ADVANCE',
        status: isOriginallyLocked ? editingExpense.status : 'UNPAID',
        isLocked: isOriginallyLocked ? editingExpense.isLocked : false,
        category: categoryMap[category] || '其他',
        notes: notes.trim().slice(0, 50),
        splitMembers: isFund ? [] : splitData,
      };

      if (onUpdateExpense) {
        onUpdateExpense(editingExpense.id, updatePayload);
      } else {
        contextUpdateExpense(editingExpense.id, updatePayload);
      }

      handleAnimatedClose();
      return;
    }

    const expensePayload: Omit<ExpenseItem, 'id' | 'logs'> = {
      name: submittedName,
      amount: numAmount,
      date: date.replace(/-/g, '/'),
      groupName: selectedGroupConfig?.name || '未指定群組',
      payer: isFund ? '公積金支付' : `${payerMap[payer] || '自己'}代墊`,
      paymentMethod: isFund ? 'OFFICIAL_FUND' : 'PERSONAL_ADVANCE',
      status: isFund ? 'SETTLED' : 'UNPAID',
      category: categoryMap[category] || '其他',
      notes: notes.trim().slice(0, 50),
      splitMembers: isFund ? [] : splitData,
      isLocked: false
    };

    let resultMsg = `「${submittedName}」新增支出成功！`;
    if (onAddExpense) {
      onAddExpense(expensePayload);
    } else {
      const res = contextAddExpense(expensePayload);
      if (res.convertedToAdvance) {
        resultMsg = `「${submittedName}」公積金餘額不足，已全額轉為個人代墊！`;
      }
    }

    // PRD 4.1 & Module 1: Continuous recording workflow
    // 1. Do NOT close modal
    // 2. Sticky Form Reset: clear [name], [amount], [notes]; retain [date], [category], [group], [paymentMode], [payer/splitMembers]
    setName('');
    setAmount('');
    setNotes('');

    // 3. Trigger lightweight Toast Notification (Auto fade out after 3 seconds)
    setToastMessage(resultMsg);
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3200);

    // 4. Refocus name input for instant next entry
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden" style={{ contain: 'layout size', position: 'fixed' }}>
      {/* Backdrop - Clickable to dismiss modal */}
      <div 
        onClick={() => handleAnimatedClose()}
        aria-label="點擊遮罩關閉"
        className={`fixed inset-0 bg-[#3A342E]/40 backdrop-blur-[2px] transition-opacity duration-200 cursor-pointer pointer-events-auto ${
          isMountedAnimation ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Floating Success / Warning Toast */}
      <div 
        className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[60] max-w-[94vw] sm:max-w-lg pointer-events-none transition-all duration-300 ease-out ${
          showToast 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-3 scale-95'
        }`}
      >
        <div className={`px-4 py-2.5 rounded-2xl sm:rounded-full shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
          toastType === 'warning'
            ? 'bg-[#FAF7EE] text-[#3A342E] border border-amber-300/90 ring-1 ring-amber-400/20 shadow-amber-900/5'
            : 'bg-white text-[#3A342E] border border-[#8FB96C]/60'
        }`}>
          {toastType === 'warning' ? (
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-[#8FB96C] shrink-0" />
          )}
          <span className="leading-snug">{toastMessage}</span>
          {toastType !== 'warning' && (
            <span className="text-[#74818E] text-xs shrink-0 hidden sm:inline">・可繼續記帳</span>
          )}
        </div>
      </div>

      {/* Modal Card - Bottom Sheet on Mobile (<640px: rounded-t-2xl max-h-[90vh] h-auto, slide up/down), Dialog on Desktop (sm:rounded-2xl sm:max-h-[calc(100vh-32px)], scale/fade) */}
      <div style={{ height: 'fit-content', maxHeight: '100%' }} className={`relative bg-white w-full sm:max-w-[560px] max-h-[90vh] h-auto sm:max-h-[calc(100vh-32px)] rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#C3D3DE]/50 flex flex-col overflow-hidden z-10 transition-transform duration-200 ease-out sm:transition-all sm:duration-150 ${
        isMountedAnimation 
          ? 'translate-y-0 sm:opacity-100 sm:scale-100' 
          : 'translate-y-full sm:translate-y-0 sm:opacity-0 sm:scale-95'
      }`}>
        
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Modal Header - Fixed, compact height */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-[#C3D3DE]/30 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#74818E] rounded-full inline-block"></span>
            <h2 className="text-base font-bold text-[#3A342E] tracking-tight font-sans">
              {isEditMode ? '編輯支出' : '新增支出'}
            </h2>
          </div>
          <button 
            onClick={() => handleAnimatedClose()}
            aria-label="關閉對話框" 
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[#74818E] hover:bg-[#F7F2E7] hover:text-[#3A342E] transition-colors cursor-pointer"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body - Compact controls (36-38px), space-y-2.5, single outer lightweight scrollbar */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4.5 space-y-2.5 text-sm flex-grow overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* 1. 項目名稱 (Full Width) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="expense-name">
              項目名稱 <span className="text-[#C1503B]">*</span>
            </label>
            <input 
              ref={nameInputRef}
              className="w-full px-3 py-1.5 bg-white border border-[#C3D3DE]/60 rounded-lg text-slate-700 font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] transition-all text-sm font-sans h-[38px] sm:h-9" 
              id="expense-name" 
              name="name" 
              placeholder="例如：全聯超市採買、水電費、週末宵夜..." 
              required 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 2. 金額 與 日期 併排為雙欄 */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 金額 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="expense-amount">
                金額 <span className="text-[#C1503B]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-normal text-sm">
                  $
                </span>
                <input 
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#C3D3DE]/60 rounded-lg text-slate-700 font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] transition-all text-sm font-sans h-[38px] sm:h-9" 
                  id="expense-amount" 
                  min="1" 
                  name="amount" 
                  placeholder="0" 
                  required 
                  type="number" 
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
            </div>

            {/* 日期 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="expense-date">
                日期 <span className="text-[#C1503B]">*</span>
              </label>
              <input 
                className="w-full px-3 py-1.5 bg-white border border-[#C3D3DE]/60 rounded-lg text-slate-700 font-normal focus:outline-none focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] transition-all text-sm font-sans h-[38px] sm:h-9" 
                id="expense-date" 
                name="date" 
                required 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* 3. 類別 與 群組 併排為雙欄 */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 類別 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="expense-category">
                類別 <span className="text-[#C1503B]">*</span>
              </label>
              <CustomSelect
                id="expense-category"
                name="category"
                value={category}
                onChange={setCategory}
                options={CATEGORY_OPTIONS}
                placeholder="請選擇類別"
              />
            </div>

            {/* 群組 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="expense-group">
                群組 <span className="text-[#C1503B]">*</span>
              </label>
              <CustomSelect
                id="expense-group"
                name="group"
                value={group}
                onChange={handleGroupChange}
                options={groupOptions}
                placeholder="請選擇群組"
              />
            </div>
          </div>

          {/* 4. 「付款與分攤」微型化卡片容器 (p-2.5 sm:p-3.5, space-y-2.5) */}
          <div className="p-2.5 sm:p-3.5 bg-slate-50/70 rounded-xl border border-[#C3D3DE]/50 space-y-2.5">
            {/* 頂部：付款模式標籤 */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                付款模式 <span className="text-[#C1503B]">*</span>
              </label>
            </div>

            {/* 純單選按鈕 (Radio Button) 樣式 - 無卡片背景、無黑邊框、無重複餘額標籤 */}
            <div className="flex items-center gap-6 sm:gap-7 pt-0.5">
              {/* 一般支付 */}
              <label 
                id="payment-radio-advance"
                className="inline-flex items-center gap-2 cursor-pointer font-sans select-none text-sm group"
                onClick={() => handlePaymentModeChange('advance_split')}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="advance_split"
                  checked={paymentMode === 'advance_split'}
                  onChange={() => handlePaymentModeChange('advance_split')}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  paymentMode === 'advance_split'
                    ? 'border-[#74818E] bg-white'
                    : 'border-[#94A3B8] bg-white group-hover:border-[#74818E]'
                }`}>
                  {paymentMode === 'advance_split' && (
                    <div className="w-2 h-2 rounded-full bg-[#74818E]" />
                  )}
                </div>
                <span className={paymentMode === 'advance_split' ? 'font-medium text-slate-700' : 'font-normal text-slate-500'}>
                  一般支付
                </span>
              </label>

              {/* 公積金支付 */}
              {hasReserveFund ? (
                <label 
                  id="payment-radio-fund"
                  className={`inline-flex items-center gap-2 font-sans select-none text-sm transition-all ${
                    isInsufficientFund 
                      ? 'cursor-not-allowed opacity-60' 
                      : 'cursor-pointer group'
                  }`}
                  onClick={() => {
                    if (!isInsufficientFund) {
                      handlePaymentModeChange('reserve_fund');
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value="reserve_fund"
                    disabled={isInsufficientFund}
                    checked={paymentMode === 'reserve_fund'}
                    onChange={() => {
                      if (!isInsufficientFund) {
                        handlePaymentModeChange('reserve_fund');
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isInsufficientFund
                      ? 'border-slate-300 bg-slate-100'
                      : paymentMode === 'reserve_fund'
                      ? 'border-[#74818E] bg-white'
                      : 'border-[#94A3B8] bg-white group-hover:border-[#74818E]'
                  }`}>
                    {paymentMode === 'reserve_fund' && (
                      <div className="w-2 h-2 rounded-full bg-[#74818E]" />
                    )}
                  </div>
                  <span className={
                    isInsufficientFund 
                      ? 'text-slate-400 font-normal'
                      : paymentMode === 'reserve_fund' 
                      ? 'font-medium text-slate-700' 
                      : 'font-normal text-slate-500'
                  }>
                    公積金支付
                  </span>
                  {isInsufficientFund && (
                    <span className="text-xs font-medium text-rose-600 font-sans">
                      (餘額不足)
                    </span>
                  )}
                </label>
              ) : (
                <div 
                  id="payment-radio-fund-disabled"
                  className="inline-flex items-center gap-2 cursor-not-allowed font-sans select-none text-sm text-slate-400 opacity-60"
                  title="該群組未啟用公積金"
                >
                  <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center shrink-0" />
                  <span className="text-sm font-normal">公積金支付</span>
                </div>
              )}
            </div>

            {/* 僅在公積金支付模式下顯示公積金餘額 */}
            {hasReserveFund && paymentMode === 'reserve_fund' && (
              <div className="pt-2 border-t border-[#C3D3DE]/40 flex items-center gap-1.5 text-xs font-sans animate-in fade-in duration-150 min-w-0">
                <span className="shrink-0 text-xs text-slate-500 font-normal">公積金餘額：</span>
                <span className="truncate text-xs">
                  {isInsufficientFund ? (
                    <>
                      <span className="font-bold text-slate-800">NT${availablePoolBalance.toLocaleString()}</span>
                      <span className="text-rose-500 font-medium">（餘額不足）</span>
                    </>
                  ) : parsedAmount > 0 ? (
                    <>
                      <span className="font-bold text-slate-800">NT${availablePoolBalance.toLocaleString()}</span>
                      <span className="text-slate-400 font-normal">（扣除後剩 </span>
                      <span className="font-bold text-slate-800">NT${projectedFundBalance.toLocaleString()}</span>
                      <span className="text-slate-400 font-normal">）</span>
                    </>
                  ) : (
                    <span className="font-bold text-slate-800">NT${availablePoolBalance.toLocaleString()}</span>
                  )}
                </span>
              </div>
            )}

            {/* 僅一般支付時顯示：【付款人】與【分攤成員】Mobile 垂直排版 / Desktop 雙欄併排 */}
            {paymentMode === 'advance_split' && (
              <div className="pt-2 border-t border-[#C3D3DE]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Mobile: 垂直排列 / Desktop: 雙欄併排 */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-6 sm:items-end">
                  {/* 付款人 (Desktop 佔 5 欄) */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-sm font-medium text-slate-700" htmlFor="payer-select">
                      付款人
                    </label>
                    <CustomSelect
                      id="payer-select"
                      name="payer"
                      value={payer}
                      onChange={setPayer}
                      options={PAYER_OPTIONS}
                    />
                  </div>

                  {/* 分攤成員 (Desktop 佔 7 欄) */}
                  <div className="sm:col-span-7 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="block text-sm font-medium text-slate-700">
                          分攤成員
                        </label>
                        {/* 當未選任何分攤成員時，直接併排顯示小字級警語 */}
                        {!isAnyMemberSelected && (
                          <span className="text-xs text-[#C1503B] font-normal animate-in fade-in">
                            (請至少勾選一名)
                          </span>
                        )}
                      </div>
                      {/* 【全選 / 取消全選】切換按鈕 */}
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-xs text-slate-500 hover:text-slate-700 font-normal transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <input 
                          type="checkbox" 
                          readOnly
                          checked={isAllMembersSelected}
                          className="w-3.5 h-3.5 accent-[#74818E] cursor-pointer pointer-events-none" 
                        />
                        <span>全選</span>
                      </button>
                    </div>

                    {/* 純文字樣式分攤成員選項：無背景卡片、無圓角邊框，僅標準 Checkbox 與文字 */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap pt-0.5">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer font-sans select-none text-sm font-normal text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={splitMembers.me}
                          onChange={(e) => setSplitMembers({...splitMembers, me: e.target.checked})}
                          className="accent-[#74818E] rounded w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer" 
                        />
                        <span>我</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer font-sans select-none text-sm font-normal text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={splitMembers.lin}
                          onChange={(e) => setSplitMembers({...splitMembers, lin: e.target.checked})}
                          className="accent-[#74818E] rounded w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer" 
                        />
                        <span>小林</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer font-sans select-none text-sm font-normal text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={splitMembers.ming}
                          onChange={(e) => setSplitMembers({...splitMembers, ming: e.target.checked})}
                          className="accent-[#74818E] rounded w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer" 
                        />
                        <span>阿明</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. 備註欄位：獨立於卡片下方 + 最大 50 字限制 + 右上角字數計數器 (如 0/50) */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700" htmlFor="expense-notes">
                備註 <span className="text-xs text-slate-400 font-normal">(選填)</span>
              </label>
              {/* 字數計數器 */}
              <span className={`text-xs font-sans transition-colors ${
                notes.length >= 50 
                  ? 'text-[#C1503B] font-bold' 
                  : notes.length >= 40 
                  ? 'text-[#F0883E] font-medium' 
                  : 'text-slate-400'
              }`}>
                {notes.length}/50
              </span>
            </div>
            <input 
              className="w-full px-3 py-1.5 bg-white border border-[#C3D3DE]/60 rounded-lg text-slate-700 font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#74818E] focus:ring-1 focus:ring-[#74818E] transition-all text-sm font-sans h-[38px] sm:h-9" 
              id="expense-notes" 
              name="notes" 
              maxLength={50}
              placeholder="例如：生鮮食材、烤肉醬料與發票已上傳" 
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>

        {/* Modal Footer - Fixed at bottom, validation on submit button */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-2.5 border-t border-[#C3D3DE]/30 bg-[#F7F2E7]/60 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          <button 
            type="button"
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-lg border border-[#74818E] text-[#74818E] font-semibold text-sm bg-white hover:bg-[#F7F2E7] transition-colors cursor-pointer h-[38px] sm:h-9"
          >
            取消
          </button>
          <button 
            type="button"
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`px-5 py-1.5 rounded-lg text-sm shadow-xs transition-all flex items-center justify-center h-[38px] sm:h-9 ${
              isFormValid 
                ? 'bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] font-medium cursor-pointer' 
                : 'bg-[#E5E7EB] text-[#99A1AF] cursor-not-allowed font-medium'
            }`}
          >
            {isEditMode ? '儲存變更' : '確認'}
          </button>
        </div>
      </div>
    </div>
  );
}
