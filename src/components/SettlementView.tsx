import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Receipt,
  CheckSquare, 
  CreditCard, 
  CheckCircle,
  Clock,
  Lock,
  RotateCcw,
  History,
  X,
  Send,
  Filter,
  Calendar,
  Layers,
  ChevronDown,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  UploadCloud,
  Trash2,
  Building2,
  Banknote,
  FileImage,
  ZoomIn,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Smile,
  MoreHorizontal,
  SlidersHorizontal,
  Search,
  ChevronRight,
  FolderUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLedger } from '../context/LedgerContext';
import { SettlementOrder } from '../types';

// Card item for Receivable (他人欠我代墊款)
export interface ReceivableCardItem {
  id: string;              // composite unique id: `${exp.id}-${debtorId}`
  expenseId: string;
  expenseName: string;
  date: string;
  category: string;
  groupName: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  status: 'UNPAID' | 'PENDING_APPROVAL' | 'SETTLED' | 'REJECTED';
  isLocked: boolean;
  orderId?: string;
  rejectReason?: string;
}

// Card item for Payable (我欠他人代墊款)
export interface PayableCardItem {
  id: string;              // composite unique id: `${exp.id}-${creditorId}`
  expenseId: string;
  expenseName: string;
  date: string;
  category: string;
  groupName: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  status: 'UNPAID' | 'PENDING_APPROVAL' | 'SETTLED' | 'REJECTED';
  isLocked: boolean;
  orderId?: string;
  rejectReason?: string;
}

// 統一狀態 Badge 設定與外觀配置 (狀態顏色僅由狀態本身決定，不受應收/應付或角色影響)
export type SettlementItemStatus = 'UNPAID' | 'PENDING_APPROVAL' | 'SETTLED' | 'REJECTED';

// 類別 Icon 對應邏輯 (與新增支出 Modal 及支出明細列表完全一致)
export const getCategoryIcon = (category: string) => {
  switch (category) {
    case '餐飲':
    case '餐飲食品':
      return Utensils;
    case '交通':
    case '交通出行':
      return Car;
    case '日用':
    case '日常用品':
      return ShoppingBag;
    case '居住':
    case '水電居住':
      return Home;
    case '娛樂':
    case '休閒娛樂':
      return Smile;
    default:
      return MoreHorizontal;
  }
};

interface SettlementStatusBadgeProps {
  status: SettlementItemStatus;
  isChecked?: boolean;
}

const SETTLEMENT_STATUS_STYLES: Record<string, { label: string; className: string; showClock?: boolean }> = {
  PENDING_APPROVAL: {
    label: '待確認',
    // 統一黃色 Badge 樣式組合，僅保留時鐘 Icon (方案 A)
    className: 'bg-amber-100 text-amber-800 border border-amber-200/80',
    showClock: true
  },
  REJECTED: {
    label: '被退回',
    className: 'bg-rose-50 text-rose-500 border border-transparent',
    showClock: false
  },
  UNPAID: {
    label: '未結清',
    className: 'bg-slate-100 text-slate-600 border border-transparent',
    showClock: false
  },
  SETTLED: {
    label: '已結清',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    showClock: false
  },
  SELECTED: {
    label: '已選取',
    className: 'bg-[#74818E] text-white border border-transparent shadow-2xs',
    showClock: false
  }
};

export function SettlementStatusBadge({ status }: SettlementStatusBadgeProps) {
  const config = SETTLEMENT_STATUS_STYLES[status] || SETTLEMENT_STATUS_STYLES.UNPAID;

  return (
    <span className={`inline-flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full font-sans whitespace-nowrap shrink-0 ${config.className}`}>
      {config.showClock && <Clock size={11} className="shrink-0" />}
      {config.label}
    </span>
  );
}

export function SettlementMicroStatusBadge({ status }: SettlementStatusBadgeProps) {
  // 取消「勾選時顯示『已選取』Tag 蓋過帳款狀態」的機制，保持原本帳款狀態恆定顯示
  let colorCls = 'bg-slate-100 text-slate-600 border-slate-200/80';
  let label = '未結清';
  if (status === 'PENDING_APPROVAL') {
    colorCls = 'bg-amber-50 text-amber-700 border-amber-200/80';
    label = '待確認';
  } else if (status === 'REJECTED') {
    colorCls = 'bg-rose-50 text-rose-600 border-rose-200/80';
    label = '被退回';
  } else if (status === 'SETTLED') {
    colorCls = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    label = '已結清';
  }

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium shrink-0 leading-none whitespace-nowrap ${colorCls}`}>
      {label}
    </span>
  );
}

export function SettlementCategoryPrefix({ category }: { category: string }) {
  const CategoryIcon = getCategoryIcon(category);
  return (
    <div 
      className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0" 
      title={`類別：${category}`}
    >
      <CategoryIcon size={15} />
    </div>
  );
}

export function SettlementCategoryBadge({ category }: { category: string }) {
  const CategoryIcon = getCategoryIcon(category);
  return (
    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-slate-400 font-normal font-sans whitespace-nowrap">
      <CategoryIcon size={13} className="shrink-0 text-slate-400" />
      {category}
    </span>
  );
}

// 退回原因解析輔助函式：主原因與補充說明拆分
export function parseRejectReason(reasonText?: string): {
  mainReason: string;
  detailReason?: string;
  displayTitle: string;
} {
  if (!reasonText || !reasonText.trim()) {
    return {
      mainReason: '款項不符',
      displayTitle: '退回原因：款項不符'
    };
  }

  const trimmed = reasonText.trim();
  // 檢測括號模式，例如「金額不符（少轉 200 元）」或「末5碼有誤(12345)」
  const parenMatch = trimmed.match(/^([^（(]+)[（(]([^）)]+)[）)]/);
  if (parenMatch) {
    const rawMain = parenMatch[1].trim();
    const main = rawMain === '末 5 碼有誤' ? '末5碼有誤' : rawMain;
    const detail = parenMatch[2].trim();
    return {
      mainReason: main || '其他',
      detailReason: detail,
      displayTitle: detail ? `退回原因：${main}\n補充說明：${detail}` : `退回原因：${main}`
    };
  }

  const KNOWN = ['金額不符', '末 5 碼有誤', '末5碼有誤', '其他', '款項不符'];
  for (const k of KNOWN) {
    if (trimmed === k) {
      const cleanMain = k === '末 5 碼有誤' ? '末5碼有誤' : k;
      return {
        mainReason: cleanMain,
        detailReason: undefined,
        displayTitle: `退回原因：${cleanMain}`
      };
    }
  }

  if (trimmed.startsWith('其他:') || trimmed.startsWith('其他：')) {
    const detail = trimmed.slice(3).trim();
    return {
      mainReason: '其他',
      detailReason: detail,
      displayTitle: detail ? `退回原因：其他\n補充說明：${detail}` : '退回原因：其他'
    };
  }

  return {
    mainReason: '其他',
    detailReason: trimmed,
    displayTitle: `退回原因：其他\n補充說明：${trimmed}`
  };
}

// 統一退回原因微型標籤元件 (卡片表面僅呈現主分類，Hover/點擊展開補充說明)
export function SettlementRejectReasonBadge({
  rejectReason,
  variant = 'desktop',
  onOpenModal
}: {
  rejectReason?: string;
  variant?: 'desktop' | 'inline';
  onOpenModal: (data: { mainReason: string; detailReason?: string }) => void;
}) {
  const parsed = parseRejectReason(rejectReason);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal({
      mainReason: parsed.mainReason,
      detailReason: parsed.detailReason
    });
  };

  if (variant === 'desktop') {
    return (
      <div 
        onClick={handleClick}
        className="ml-1 sm:ml-2 flex items-center gap-1 text-xs sm:text-sm text-rose-600 font-normal font-sans shrink-0 min-w-0 max-w-[130px] sm:max-w-[170px] cursor-pointer hover:underline select-none" 
        title={parsed.displayTitle}
      >
        <Info size={13} className="shrink-0 text-rose-600" />
        <span className="truncate">
          退回：{parsed.mainReason}
        </span>
      </div>
    );
  }

  return (
    <span 
      onClick={handleClick}
      className="text-rose-600 truncate ml-1 font-medium max-w-[120px] sm:max-w-[160px] shrink-0 cursor-pointer inline-flex items-center gap-0.5 select-none hover:underline"
      title={parsed.displayTitle}
    >
      <Info size={11} className="shrink-0 text-rose-600" />
      <span className="truncate">
        · 退回: {parsed.mainReason}
      </span>
    </span>
  );
}

export default function SettlementView() {
  const {
    expenses,
    settlementOrders,
    currentUser,
    auditLogs,
    createSettlement,
    approveSettlement,
    rejectSettlement
  } = useLedger();

  // Top Filter & Tab Bar state
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState<boolean>(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'receivable' | 'payable' | 'pending'>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Animation state for Mobile Filter Bottom Sheet (matching FilterBottomSheet.tsx transition)
  const [isFilterSheetRendered, setIsFilterSheetRendered] = useState(isMobileFilterOpen);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  useEffect(() => {
    let animFrame: number;
    let timer: NodeJS.Timeout;

    if (isMobileFilterOpen) {
      setIsFilterSheetRendered(true);
      animFrame = requestAnimationFrame(() => {
        setIsFilterSheetVisible(true);
      });
    } else {
      setIsFilterSheetVisible(false);
      timer = setTimeout(() => {
        setIsFilterSheetRendered(false);
      }, 300);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isMobileFilterOpen]);

  const handleCloseFilterSheet = () => {
    setIsFilterSheetVisible(false);
    setTimeout(() => {
      setIsMobileFilterOpen(false);
    }, 300);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Secondary view toggle: 'cards' (主要清單) or 'orders' (還款單據) or 'logs' (稽核軌跡)
  const [subView, setSubView] = useState<'cards' | 'orders' | 'logs'>('cards');

  // Checkbox selection for payable items
  const [selectedPayableCardIds, setSelectedPayableCardIds] = useState<Record<string, boolean>>({});

  // Payment Settlement Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [lastFiveDigits, setLastFiveDigits] = useState('');
  const [note, setNote] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit Review Modal (for Creditor / Receiver)
  const [auditModalOrder, setAuditModalOrder] = useState<SettlementOrder | null>(null);
  const [showRejectMenu, setShowRejectMenu] = useState(false);
  const [isExpenseListExpanded, setIsExpenseListExpanded] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState<'金額不符' | '末 5 碼有誤' | '其他'>('金額不符');
  const [customRejectInput, setCustomRejectInput] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [reasonModalData, setReasonModalData] = useState<{ mainReason: string; detailReason?: string } | null>(null);

  // Revision Modal for Rejected Item (退款款項修正)
  const [revisionItem, setRevisionItem] = useState<PayableCardItem | null>(null);
  const [revisionPaymentMethod, setRevisionPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [revisionLastFiveDigits, setRevisionLastFiveDigits] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionProofImage, setRevisionProofImage] = useState<string | null>(null);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenRevision = (item: PayableCardItem) => {
    setRevisionItem(item);
    setRevisionPaymentMethod('transfer');
    setRevisionLastFiveDigits('');
    setRevisionNote('');
    setRevisionProofImage(null);
  };

  const handleRevisionProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('請上傳圖片格式檔案 (JPG, PNG, WEBP 等)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('圖片檔案大小請勿超過 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setRevisionProofImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmRevision = () => {
    if (!revisionItem) return;

    // 尋找關聯的退回單據
    const rejectedOrder = settlementOrders.find(o =>
      o.status === 'REJECTED' &&
      (o.id === revisionItem.orderId ||
        (o.fromUserId === revisionItem.debtorId &&
         o.toUserId === revisionItem.creditorId &&
         o.relatedExpenseIds.includes(revisionItem.expenseId)))
    );

    const relatedIds = rejectedOrder ? rejectedOrder.relatedExpenseIds : [revisionItem.expenseId];
    const totalAmount = rejectedOrder ? rejectedOrder.amount : revisionItem.amount;

    const noteText = [
      revisionPaymentMethod === 'transfer' ? `銀行轉帳 (末5碼: ${revisionLastFiveDigits})` : '現金/其他',
      revisionNote.trim()
    ].filter(Boolean).join(' - ');

    const res = createSettlement({
      title: `${currentUser.name} 重新送出 ${relatedIds.length} 筆結清項目`,
      fromUserId: currentUser.id,
      toUserId: revisionItem.creditorId,
      amount: totalAmount,
      expenseIds: relatedIds,
      notes: noteText,
      proofUrl: revisionProofImage || undefined
    });

    if (res.success) {
      setRevisionItem(null);
      showToast(`已重新送出審核！${relatedIds.length} 筆支出已連鎖鎖定。`);
    } else {
      showToast(res.error || '重新送出失敗');
    }
  };

  // 防呆機制：Modal 開啟時禁用 Esc 鍵關閉（避免誤觸丟失資料）
  useEffect(() => {
    if (!auditModalOrder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // 若此時開著憑證放大 Lightbox，則優先關閉 Lightbox
        if (previewImageUrl) {
          setPreviewImageUrl(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [auditModalOrder, previewImageUrl]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 嚴格比對原始成員 ID 之輔助函式
  const resolveMemberId = (memberId?: string, nameOrPayer?: string): string => {
    if (memberId && (memberId === 'user_me' || memberId === 'user_lin' || memberId === 'user_ming')) {
      return memberId;
    }
    const s = nameOrPayer || '';
    if (s.includes('小林') || s.includes('Bob') || s.includes('李小華') || s === 'user_lin' || s === 'member_2') {
      return 'user_lin';
    }
    if (s.includes('阿明') || s.includes('Charlie') || s.includes('小明') || s === 'user_ming' || s === 'member_3') {
      return 'user_ming';
    }
    if (s.includes('Alice') || s.includes('自己') || s.includes('我') || s.includes('個人') || s === 'user_me' || s === 'member_1') {
      return 'user_me';
    }
    return 'user_me';
  };

  // 根據當前視角與真實成員 ID 渲染名稱：僅真實 ID 等於當前使用者時才顯示為「我」
  const getMemberDisplayName = (memberId: string): string => {
    if (memberId === currentUser.id) return '我';
    if (memberId === 'user_lin') return '小林';
    if (memberId === 'user_ming') return '阿明';
    if (memberId === 'user_me') return 'Alice';
    return '成員';
  };

  // Map pending settlement orders by expenseId for fast lookup, categorized by debtor and creditor
  const pendingOrdersMap = useMemo(() => {
    // Key: `${order.fromUserId}-${order.toUserId}-${expenseId}`
    const map = new Map<string, SettlementOrder>();
    settlementOrders
      .filter(o => o.status === 'PENDING')
      .forEach(o => {
        o.relatedExpenseIds.forEach(id => {
          map.set(`${o.fromUserId}-${o.toUserId}-${id}`, o);
        });
      });
    return map;
  }, [settlementOrders]);

  // Section 1: 動態生成「應收帳款卡片」 (Receivable Cards)
  // 遍歷所有個人代墊款：當我代墊，且其他成員有應付份額時，為每一位非我的債務人建立獨立卡片
  const allReceivableItems: ReceivableCardItem[] = useMemo(() => {
    const items: ReceivableCardItem[] = [];

    expenses.forEach(exp => {
      // 隔離公積金與已結清項目
      if (exp.paymentMethod === 'OFFICIAL_FUND') return;
      if (exp.status === 'SETTLED') return;

      const creditorId = resolveMemberId(undefined, exp.payer);
      // 只有當前使用者是代墊人時，才屬於「我」的應收帳款
      if (creditorId !== currentUser.id) return;

      if (exp.splitMembers && exp.splitMembers.length > 0) {
        exp.splitMembers.forEach(split => {
          const debtorId = resolveMemberId(split.memberId, split.name);
          // 嚴格排除自己分攤的份額，且絕不可出現「自己欠自己」畫面 (debtorId === creditorId)
          if (debtorId === creditorId || debtorId === currentUser.id || split.amount <= 0) return;

          const debtorName = getMemberDisplayName(debtorId);
          const creditorName = getMemberDisplayName(creditorId);
          
          // 精確比對：僅當待確認單據的付款人為該 debtorId、收款人為該 creditorId，且包含此 expenseId 時才視為待確認
          const pendingOrder = pendingOrdersMap.get(`${debtorId}-${creditorId}-${exp.id}`) ||
            settlementOrders.find(o => 
              o.status === 'PENDING' && 
              o.fromUserId === debtorId && 
              o.toUserId === creditorId && 
              (o.id === exp.relatedSettlementId || o.relatedExpenseIds.includes(exp.id))
            );
          const isPending = !!pendingOrder;

          // 尋找關聯的退回單據 (若目前非待確認鎖定中，且同樣精確匹配該特定債務人與債權人)
          const rejectedOrder = !isPending
            ? settlementOrders
                .filter(o => 
                  o.status === 'REJECTED' && 
                  o.fromUserId === debtorId && 
                  o.toUserId === creditorId && 
                  (o.id === exp.relatedSettlementId || o.relatedExpenseIds.includes(exp.id))
                )
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]
            : undefined;

          const isRejected = !isPending && !!rejectedOrder;

          let rejectReasonText = rejectedOrder?.rejectReason;
          if (!rejectReasonText && rejectedOrder?.notes) {
            const match = rejectedOrder.notes.match(/\[退回原因:\s*([^\]]+)\]/);
            if (match) {
              rejectReasonText = match[1];
            }
          }

          items.push({
            id: `${exp.id}-${debtorId}`,
            expenseId: exp.id,
            expenseName: exp.name,
            date: exp.date,
            category: exp.category,
            groupName: exp.groupName || '未指定群組',
            debtorId,
            debtorName,
            creditorId,
            creditorName,
            amount: split.amount,
            status: isPending ? 'PENDING_APPROVAL' : isRejected ? 'REJECTED' : 'UNPAID',
            isLocked: isPending,
            orderId: pendingOrder?.id,
            rejectReason: isRejected ? (rejectReasonText || '款項不符') : undefined
          });
        });
      }
    });

    return items;
  }, [expenses, currentUser, pendingOrdersMap, settlementOrders]);

  // Section 2: 動態生成「應付帳款卡片」 (Payable Cards)
  // 遍歷所有個人代墊款：他人代墊，且我有分攤份額時，建立獨立應付卡片
  const allPayableItems: PayableCardItem[] = useMemo(() => {
    const items: PayableCardItem[] = [];

    expenses.forEach(exp => {
      // 隔離公積金與已結清項目
      if (exp.paymentMethod === 'OFFICIAL_FUND') return;
      if (exp.status === 'SETTLED') return;

      const creditorId = resolveMemberId(undefined, exp.payer);
      // 排除「我代墊」的項目
      if (creditorId === currentUser.id) return;

      if (exp.splitMembers && exp.splitMembers.length > 0) {
        const mySplit = exp.splitMembers.find(m => resolveMemberId(m.memberId, m.name) === currentUser.id);
        if (mySplit && mySplit.amount > 0) {
          const debtorId = currentUser.id;
          // 嚴格比對原始成員 ID，絕不可出現自我欠債 (debtorId === creditorId)
          if (debtorId === creditorId) return;

          const debtorName = getMemberDisplayName(debtorId);
          const creditorName = getMemberDisplayName(creditorId);

          // 精確比對：僅當待確認單據的付款人為我 (debtorId)、收款人為該代墊人 (creditorId)，且包含此 expenseId 時才視為待確認
          const pendingOrder = pendingOrdersMap.get(`${debtorId}-${creditorId}-${exp.id}`) ||
            settlementOrders.find(o => 
              o.status === 'PENDING' && 
              o.fromUserId === debtorId && 
              o.toUserId === creditorId && 
              (o.id === exp.relatedSettlementId || o.relatedExpenseIds.includes(exp.id))
            );
          const isPending = !!pendingOrder;

          // 尋找關聯的退回單據 (若目前非待確認鎖定中，且同樣精確匹配我與該代墊人)
          const rejectedOrder = !isPending
            ? settlementOrders
                .filter(o => 
                  o.status === 'REJECTED' && 
                  o.fromUserId === debtorId && 
                  o.toUserId === creditorId && 
                  (o.id === exp.relatedSettlementId || o.relatedExpenseIds.includes(exp.id))
                )
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]
            : undefined;

          const isRejected = !isPending && !!rejectedOrder;

          let rejectReasonText = rejectedOrder?.rejectReason;
          if (!rejectReasonText && rejectedOrder?.notes) {
            const match = rejectedOrder.notes.match(/\[退回原因:\s*([^\]]+)\]/);
            if (match) {
              rejectReasonText = match[1];
            }
          }

          items.push({
            id: `${exp.id}-${creditorId}`,
            expenseId: exp.id,
            expenseName: exp.name,
            date: exp.date,
            category: exp.category,
            groupName: exp.groupName || '未指定群組',
            debtorId,
            debtorName,
            creditorId,
            creditorName,
            amount: mySplit.amount,
            status: isPending ? 'PENDING_APPROVAL' : isRejected ? 'REJECTED' : 'UNPAID',
            isLocked: isPending,
            orderId: pendingOrder?.id,
            rejectReason: isRejected ? (rejectReasonText || '款項不符') : undefined
          });
        }
      }
    });

    return items;
  }, [expenses, currentUser, pendingOrdersMap, settlementOrders]);

  // Apply filters (Group & Month)
  const filterByGroupAndMonth = (dateStr: string, expId: string) => {
    const exp = expenses.find(e => e.id === expId);
    if (selectedGroup !== 'all') {
      if (selectedGroup === 'roommates' && exp?.groupName !== '小室友們' && exp?.groupName) {
        return false;
      }
    }
    if (selectedMonth !== 'all') {
      // dateStr formats like '2024/05/22' or '2024-05-22'
      const norm = dateStr.replace(/\//g, '-');
      if (!norm.startsWith(selectedMonth)) {
        return false;
      }
    }
    return true;
  };

  const filteredReceivables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allReceivableItems.filter(item => {
      if (!filterByGroupAndMonth(item.date, item.expenseId)) return false;
      if (activeTab === 'pending') {
        if (item.status !== 'PENDING_APPROVAL') return false;
      }
      if (q) {
        const matchesName = item.expenseName.toLowerCase().includes(q);
        const matchesDebtor = item.debtorName.toLowerCase().includes(q);
        const matchesCreditor = item.creditorName.toLowerCase().includes(q);
        const matchesGroup = item.groupName.toLowerCase().includes(q);
        if (!matchesName && !matchesDebtor && !matchesCreditor && !matchesGroup) {
          return false;
        }
      }
      return true;
    });
  }, [allReceivableItems, selectedGroup, selectedMonth, activeTab, expenses, searchQuery]);

  const filteredPayables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPayableItems.filter(item => {
      if (!filterByGroupAndMonth(item.date, item.expenseId)) return false;
      if (activeTab === 'pending') {
        if (item.status !== 'PENDING_APPROVAL') return false;
      }
      if (q) {
        const matchesName = item.expenseName.toLowerCase().includes(q);
        const matchesDebtor = item.debtorName.toLowerCase().includes(q);
        const matchesCreditor = item.creditorName.toLowerCase().includes(q);
        const matchesGroup = item.groupName.toLowerCase().includes(q);
        if (!matchesName && !matchesDebtor && !matchesCreditor && !matchesGroup) {
          return false;
        }
      }
      return true;
    });
  }, [allPayableItems, selectedGroup, selectedMonth, activeTab, expenses, searchQuery]);

  // Active Tab Visibility Flags
  const showReceivables = activeTab === 'all' || activeTab === 'receivable' || (activeTab === 'pending' && filteredReceivables.length > 0);
  const showPayables = activeTab === 'all' || activeTab === 'payable' || (activeTab === 'pending' && filteredPayables.length > 0);

  // Statistics
  const pendingCount = allReceivableItems.filter(i => i.status === 'PENDING_APPROVAL').length + 
                       allPayableItems.filter(i => i.status === 'PENDING_APPROVAL').length;

  // Payable Selection actions
  // 被退回項目不應出現在批次勾選範圍內，與鎖定項目同等隔離
  const unlockedPayables = filteredPayables.filter(i => !i.isLocked && i.status !== 'REJECTED');
  const isAllPayablesChecked = unlockedPayables.length > 0 && unlockedPayables.every(i => selectedPayableCardIds[i.id]);

  const handleToggleSelectAll = () => {
    if (isAllPayablesChecked) {
      setSelectedPayableCardIds({});
    } else {
      const next: Record<string, boolean> = {};
      unlockedPayables.forEach(i => {
        next[i.id] = true;
      });
      setSelectedPayableCardIds(next);
    }
  };

  const toggleSelectPayable = (cardId: string) => {
    const item = filteredPayables.find(i => i.id === cardId);
    if (item?.isLocked) return;
    setSelectedPayableCardIds(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Selected Payable Items and total
  const selectedPayableItems = filteredPayables.filter(i => selectedPayableCardIds[i.id]);
  const selectedPayableTotal = selectedPayableItems.reduce((sum, i) => sum + i.amount, 0);

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    if (selectedPayableItems.length === 0) {
      showToast('請先勾選欲還款的應付項目！');
      return;
    }
    setPaymentMethod('transfer');
    setIsPaymentModalOpen(true);
    setLastFiveDigits('');
    setNote('');
    setProofImage(null);
  };

  // Proof image upload handling
  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('請上傳圖片格式檔案 (JPG, PNG, WEBP 等)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('圖片檔案大小請勿超過 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setProofImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProofImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProofImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm Settlement Payment
  const handleConfirmPayment = () => {
    if (selectedPayableItems.length === 0) return;

    const targetCreditorId = selectedPayableItems[0].creditorId;
    const relatedIds: string[] = Array.from(new Set<string>(selectedPayableItems.map(i => i.expenseId)));

    const noteText = [
      paymentMethod === 'transfer' ? `銀行轉帳 (末5碼: ${lastFiveDigits})` : '現金/其他',
      note.trim()
    ].filter(Boolean).join(' - ');

    const res = createSettlement({
      title: `${currentUser.name} 結清 ${selectedPayableItems.length} 筆應付款項`,
      fromUserId: currentUser.id,
      toUserId: targetCreditorId,
      amount: selectedPayableTotal,
      expenseIds: relatedIds,
      notes: noteText,
      proofUrl: proofImage || undefined
    });

    if (res.success && res.order) {
      setIsPaymentModalOpen(false);
      setSelectedPayableCardIds({});
      setProofImage(null);
      showToast(`已建立還款申請，${relatedIds.length} 筆支出已連鎖鎖定！`);
    } else {
      showToast(res.error || '建立還款申請失敗');
    }
  };

  // 提取還款單中的轉帳與對帳資訊
  const parseTransferDetails = (notes?: string) => {
    if (!notes) {
      return {
        paymentType: '銀行轉帳' as const,
        isCash: false,
        lastFive: null,
        memoText: ''
      };
    }

    // 匹配末5碼 (支援多種常見格式)
    const match5 = notes.match(/末\s*5\s*碼[:：]?\s*([A-Za-z0-9]{4,6})/);
    const lastFive = match5 ? match5[1] : null;

    const isCash = notes.includes('現金');
    const paymentType = isCash ? ('現金 / 其他' as const) : ('銀行轉帳' as const);

    // 清理備註字串
    let memoText = notes
      .replace(/銀行轉帳\s*(\([^)]*\))?\s*[-–—]?\s*/g, '')
      .replace(/現金\/其他\s*[-–—]?\s*/g, '')
      .trim();

    return { paymentType, isCash, lastFive, memoText };
  };

  // Open Order Audit Modal
  const handleOpenAuditForOrder = (orderId?: string, openRejectMenu: boolean = false) => {
    let order: SettlementOrder | undefined;
    if (orderId) {
      order = settlementOrders.find(o => o.id === orderId);
    }
    if (!order) {
      order = settlementOrders.find(o => o.status === 'PENDING' && o.toUserId === currentUser.id);
    }
    if (order) {
      setAuditModalOrder(order);
      setShowRejectMenu(openRejectMenu);
      setIsExpenseListExpanded(false);
      if (openRejectMenu) {
        setSelectedRejectReason('金額不符');
        setCustomRejectInput('');
      }
    } else {
      showToast('找不到對應的還款單據');
    }
  };

  // Open Audit Modal for a specific receivable card item
  const handleOpenAuditForItem = (item: ReceivableCardItem, openRejectMenu: boolean = false) => {
    let order: SettlementOrder | undefined;
    if (item.orderId) {
      order = settlementOrders.find(o => o.id === item.orderId);
    }
    if (!order) {
      // 嚴格比對：此筆帳款所屬的 expenseId、該特定付款人 (debtorId) 與收款人 (currentUser.id)
      order = settlementOrders.find(o => 
        o.status === 'PENDING' && 
        o.fromUserId === item.debtorId && 
        o.toUserId === currentUser.id && 
        o.relatedExpenseIds.includes(item.expenseId)
      );
    }

    if (order) {
      setAuditModalOrder(order);
      setShowRejectMenu(openRejectMenu);
      setIsExpenseListExpanded(false);
      if (openRejectMenu) {
        setSelectedRejectReason('金額不符');
        setCustomRejectInput('');
      }
    } else {
      showToast('找不到對應的審核單據');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#3A342E] text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle size={16} className="text-[#8FB96C]" />
          <span className="font-sans font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 主容器：單一大白卡片 (Single Container Card) */}
      {subView === 'cards' && (
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-xs overflow-hidden">
          {/* Phone 頂部全頁控制列 (搜尋 + 篩選) (與支出明細相同規格，僅在 Phone 尺寸 sm:hidden 顯示) */}
          <div className="sm:hidden flex items-center justify-between gap-2.5 p-3.5 bg-white border-b border-slate-100 w-full">
            {/* 左側：搜尋輸入框 [ 🔍 搜尋項目或成員... ] */}
            <div className="flex-1 min-w-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none shrink-0" />
                <input 
                  type="text" 
                  placeholder="搜尋項目或成員..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 placeholder:text-slate-400 font-normal text-xs sm:text-sm font-sans focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all h-[38px]" 
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    title="清除搜尋"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 右側：全頁 [篩選 Icon] 按鈕 (點擊叫出與支出明細相同規格之 Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className={`flex items-center justify-center w-[38px] h-[38px] rounded-xl border transition-colors shrink-0 cursor-pointer relative ${
                selectedGroup !== 'all' || selectedMonth !== 'all' || activeTab !== 'all'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
              aria-label="開啟全頁篩選"
              title="開啟全頁篩選"
            >
              <SlidersHorizontal size={17} />
              {(selectedGroup !== 'all' || selectedMonth !== 'all' || activeTab !== 'all') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C1503B] rounded-full ring-2 ring-[#FAF7EE]" />
              )}
            </button>
          </div>

          {/* 1. 頂部 Filter 工具列 (RWD 自適應尺寸，Phone 尺寸隱藏，改由上方全頁控制列觸發 Bottom Sheet) */}
          <div className="hidden sm:flex items-center justify-between w-full gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white">
            {/* 左側群組：放置「全部群組」與「全部月份」下拉選單 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* 群組自訂下拉選單 */}
              <div className="relative shrink-0" ref={groupDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsGroupDropdownOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 h-[34px] sm:h-[38px] rounded-xl bg-white/80 text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-xs sm:text-sm font-normal cursor-pointer font-sans focus:outline-none ${
                    isGroupDropdownOpen
                      ? 'border-slate-400 ring-1 ring-slate-400 bg-slate-50'
                      : ''
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-normal text-slate-600 whitespace-nowrap">
                    {selectedGroup === 'all'
                      ? '全部群組'
                      : selectedGroup === 'roommates'
                      ? '小室友們'
                      : selectedGroup}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 pointer-events-none ${
                      isGroupDropdownOpen ? 'rotate-180 text-slate-600' : ''
                    }`}
                  />
                </button>

                {isGroupDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-stone-200/80 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { value: 'all', label: '全部群組' },
                      { value: 'roommates', label: '小室友們 (3人)' }
                    ].map((opt) => {
                      const isSelected = selectedGroup === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedGroup(opt.value);
                            setIsGroupDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 font-medium text-amber-900'
                              : 'text-slate-600 font-normal hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 日期選單 */}
              <div className="relative shrink-0" ref={monthDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMonthDropdownOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 h-[34px] sm:h-[38px] rounded-xl bg-white/80 text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-xs sm:text-sm font-normal cursor-pointer font-sans focus:outline-none ${
                    isMonthDropdownOpen
                      ? 'border-slate-400 ring-1 ring-slate-400 bg-slate-50'
                      : ''
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-normal text-slate-600 whitespace-nowrap">
                    {selectedMonth === 'all'
                      ? '全部月份'
                      : selectedMonth === '2024-05'
                      ? '2024 年 5 月'
                      : selectedMonth === '2024-04'
                      ? '2024 年 4 月'
                      : selectedMonth}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 pointer-events-none ${
                      isMonthDropdownOpen ? 'rotate-180 text-slate-600' : ''
                    }`}
                  />
                </button>

                {isMonthDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-stone-200/80 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { value: 'all', label: '全部月份' },
                      { value: '2024-05', label: '2024 年 5 月' },
                      { value: '2024-04', label: '2024 年 4 月' }
                    ].map((opt) => {
                      const isSelected = selectedMonth === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(opt.value);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 font-medium text-amber-900'
                              : 'text-slate-600 font-normal hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 右側固定：Tablet / Mobile 顯示「全部狀態」下拉選單靠右對齊 (ml-auto)；Desktop (≥ 1024px) 顯示 Segmented Control */}
            <div className="ml-auto shrink-0 flex items-center">
              {/* 第 3 個下拉選單：狀態選單 (僅在 < 1024px Tablet / Phone 顯示，靠右對齊) */}
              <div className="relative shrink-0 ml-auto lg:hidden" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 h-[34px] sm:h-[38px] rounded-xl bg-white/80 text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-xs sm:text-sm font-normal cursor-pointer font-sans focus:outline-none ${
                    isStatusDropdownOpen
                      ? 'border-slate-400 ring-1 ring-slate-400 bg-slate-50'
                      : ''
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-normal text-slate-600 whitespace-nowrap">
                    {activeTab === 'all'
                      ? `全部狀態 (${allReceivableItems.length + allPayableItems.length})`
                      : activeTab === 'payable'
                      ? `應付帳款 (${allPayableItems.length})`
                      : activeTab === 'receivable'
                      ? `應收帳款 (${allReceivableItems.length})`
                      : `待確認 (${pendingCount})`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 pointer-events-none ${
                      isStatusDropdownOpen ? 'rotate-180 text-slate-600' : ''
                    }`}
                  />
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-stone-200/80 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { value: 'all', label: `全部狀態 (${allReceivableItems.length + allPayableItems.length})` },
                      { value: 'payable', label: `應付帳款 (${allPayableItems.length})` },
                      { value: 'receivable', label: `應收帳款 (${allReceivableItems.length})` },
                      { value: 'pending', label: `待確認 (${pendingCount})` }
                    ].map((opt) => {
                      const isSelected = activeTab === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setActiveTab(opt.value as any);
                            setSubView('cards');
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm font-sans flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 font-medium text-amber-900'
                              : 'text-slate-600 font-normal hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 切換 Tab：全部 | 應付 | 應收 | 待確認 (Segmented Control，僅 lg ≥ 1024px 顯示) */}
              <div className="hidden lg:flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 font-sans gap-1 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSubView('cards');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white text-stone-800 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700 font-normal'
                }`}
              >
                全部
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-stone-100 text-stone-600">
                  {allReceivableItems.length + allPayableItems.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('payable');
                  setSubView('cards');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payable'
                    ? 'bg-white text-stone-800 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700 font-normal'
                }`}
              >
                應付
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-stone-100 text-stone-600">
                  {allPayableItems.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('receivable');
                  setSubView('cards');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'receivable'
                    ? 'bg-white text-stone-800 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700 font-normal'
                }`}
              >
                應收
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-stone-100 text-stone-600">
                  {allReceivableItems.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pending');
                  setSubView('cards');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-white text-stone-800 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700 font-normal'
                }`}
              >
                待確認
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-stone-100 text-stone-600">
                  {pendingCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Dividing Line between FilterBar and Content */}
        <div className="hidden sm:block border-t border-stone-200/60" />

          {/* 內部內容容器：加上適當 padding (p-4 sm:p-6 md:p-8)，確保列表內容與外框具備良好呼吸留白感 */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* 1. 應付帳款區塊 (Payables) */}
            {showPayables && (
              <div>
                {/* Phone 尺寸 (< 640px)：區塊標題與操作列 (單行 flex items-center justify-between w-full mb-3) */}
                <div className="sm:hidden flex items-center justify-between w-full mb-3 pb-2 border-b border-slate-100">
                  {/* 左側：[Icon] 應付帳款 (共 X 筆) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-5.5 h-5.5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                      <Receipt size={14} />
                    </span>
                    <h2 className="text-sm font-bold text-[#3A342E] font-sans tracking-tight">
                      應付帳款
                    </h2>
                    <span className="text-xs text-slate-400 font-normal font-sans">
                      (共 {filteredPayables.length} 筆)
                    </span>
                  </div>

                  {/* 右側：批次操作按鈕組 [全選 / 取消] 與 [還清] (尺寸固化、防寬度跳動) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* [全選 / 取消] */}
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      disabled={unlockedPayables.length === 0}
                      className="h-7 px-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-normal text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans whitespace-nowrap shrink-0 min-w-[3.75rem]"
                    >
                      <CheckSquare size={13} className={isAllPayablesChecked ? 'text-[#8FB96C]' : 'text-slate-400'} />
                      <span>{isAllPayablesChecked ? '取消' : '全選'}</span>
                    </button>

                    {/* [還清] (固定寬度 min-w-[4rem] px-3，僅渲染 Icon + 文字，永不渲染動態金額以維持寬度 100% 恆定) */}
                    <button
                      type="button"
                      onClick={handleOpenPaymentModal}
                      disabled={selectedPayableItems.length === 0}
                      className={`h-7 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer font-sans whitespace-nowrap shrink-0 min-w-[4rem] border ${
                        selectedPayableItems.length > 0
                          ? 'bg-[#8FB96C] text-white border-transparent hover:bg-[#7ea55e] shadow-xs'
                          : 'bg-gray-100 text-gray-400 border-gray-200/60 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard size={13} />
                      <span>還清</span>
                    </button>
                  </div>
                </div>

                {/* Tablet / Desktop 尺寸 (≥ 640px)：保持先前設定的單行完整佈局 */}
                <div className="hidden sm:flex bg-transparent pb-3.5 items-center justify-between gap-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      <Receipt size={15} />
                    </span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-[#3A342E] font-sans tracking-tight">
                        應付帳款
                      </h2>
                      <span className="text-sm text-slate-400 font-normal font-sans">
                        (共 {filteredPayables.length} 筆)
                      </span>
                    </div>
                  </div>

                  {/* 核心動作按鈕組 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleSelectAll}
                      disabled={unlockedPayables.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-[#C3D3DE]/70 bg-white hover:bg-[#F7F2E7] text-xs font-bold text-[#74818E] hover:text-[#3A342E] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans shadow-2xs"
                    >
                      <CheckSquare size={13} className={isAllPayablesChecked ? 'text-[#8FB96C]' : ''} />
                      {isAllPayablesChecked ? '取消全選' : '一鍵全選'}
                    </button>

                    <button
                      onClick={handleOpenPaymentModal}
                      disabled={selectedPayableItems.length === 0}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-xs ${
                        selectedPayableItems.length > 0
                          ? 'bg-[#8FB96C] text-white hover:bg-[#7ea55e]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard size={13} />
                      還清所選
                      {selectedPayableTotal > 0 && (
                        <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[11px] font-bold">
                          NT${selectedPayableTotal.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 應付帳款清單 (每筆 Row 具備 rounded-xl 圓角、margin 與 padding，Hover/Selected 絕不貼邊) */}
                {filteredPayables.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#74818E] font-sans">
                    🎉 目前沒有任何應付項目，帳目清爽無欠款！
                  </div>
                ) : (
                <div className="mt-3 space-y-2 pb-20">
                    {filteredPayables.map((item) => {
                      const isChecked = !!selectedPayableCardIds[item.id];
                      const isPending = item.status === 'PENDING_APPROVAL';
                      const isRejected = item.status === 'REJECTED';

                      return (
                        <div
                          key={item.id}
                          onClick={() => !item.isLocked && !isRejected && toggleSelectPayable(item.id)}
                          className={`w-full py-3.5 px-4 sm:px-5 rounded-xl border border-slate-100 shadow-none transition-all select-none ${
                            item.isLocked
                              ? 'bg-gray-50/70 border-gray-100 cursor-not-allowed opacity-75'
                              : isRejected
                              ? 'bg-transparent border-slate-100'
                              : isChecked
                              ? 'bg-[#C3D3DE]/25 hover:bg-[#C3D3DE]/35 border-[#C3D3DE]/70 cursor-pointer'
                              : 'bg-white hover:bg-slate-50/80 hover:border-slate-200/80 cursor-pointer'
                          }`}
                        >
                          {isRejected ? (
                            /* 被退回項目：統一全斷點採用兩層式排版（無 Checkbox、無雙人頭箭頭、無冗餘警告文字） */
                            <div className="w-full flex flex-col gap-2">
                              {/* 第一層 (Top Row)：左側【品名】+ 淡紅【被退回】Badge / 右側【金額】NT$XXX */}
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-sm font-medium text-slate-800 truncate font-sans" title={item.expenseName}>
                                    {item.expenseName}
                                  </span>
                                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-rose-50 text-rose-500 font-medium shrink-0 leading-none">
                                    被退回
                                  </span>
                                </div>
                                <div className="text-right text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap ml-1">
                                  NT${item.amount.toLocaleString()}
                                </div>
                              </div>

                              {/* 第二層 (Bottom Row)：左側人像 Icon + 對方姓名 · 日期 / 右側 查看與修正 > */}
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="text-xs text-slate-400 font-sans flex items-center gap-1.5 min-w-0 truncate">
                                  <div className="inline-flex items-center gap-1 shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold shrink-0">
                                      <User size={10} />
                                    </div>
                                    <span className="font-medium text-slate-600 truncate max-w-[80px]">
                                      {getMemberDisplayName(item.creditorId)}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-slate-300">·</span>
                                  <span className="shrink-0">{item.date}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRevision(item);
                                  }}
                                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-0.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap font-medium"
                                >
                                  <span>查看與修正</span>
                                  <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Desktop View (≥ 1024px)：完整多欄位排版 */}
                          <div className="hidden lg:flex items-center justify-between gap-3 w-full">
                            {/* 左側主體：[Checkbox (w-5)] + [對象區 (w-[124px])] + [日期] + [名稱] + [類別 Badge] */}
                            <div className="flex items-center min-w-0 gap-3 sm:gap-4 shrink-0">
                              {/* [Checkbox / 鎖定標記] */}
                              <div className="w-5 shrink-0 flex items-center justify-center">
                                {item.isLocked ? (
                                  <div className="p-0.5 rounded text-amber-700" title="已關聯還款單連鎖鎖定中">
                                    <Lock size={14} />
                                  </div>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelectPayable(item.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 accent-[#74818E] cursor-pointer self-center"
                                  />
                                )}
                              </div>

                              {/* [對象區] (靠左，固定 w-[124px] shrink-0)：付款人 ➔ 收款人 */}
                              <div className="flex items-center gap-1.5 shrink-0 w-[124px]">
                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-[#C1503B]/10 text-[#C1503B] flex items-center justify-center font-bold">
                                    <User size={13} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.debtorId)}
                                  </span>
                                </div>

                                <ArrowRight size={13} className="text-[#74818E]/60 shrink-0 mx-1" />

                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold">
                                    <User size={13} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.creditorId)}
                                  </span>
                                </div>
                              </div>

                              {/* [日期] */}
                              <div className="w-[78px] sm:w-[84px] shrink-0">
                                <span className="text-xs sm:text-sm text-slate-400 font-sans whitespace-nowrap">
                                  {item.date}
                                </span>
                              </div>

                              {/* [項目主體：Icon + 名稱] */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <SettlementCategoryPrefix category={item.category} />
                                <div className="w-28 sm:w-36 md:w-44 shrink-0">
                                  <span className="text-sm font-medium text-slate-700 truncate block font-sans" title={item.expenseName}>
                                    {item.expenseName}
                                  </span>
                                </div>
                              </div>

                              {/* [所屬群組名稱標籤] */}
                              <div className="w-20 sm:w-28 shrink-0">
                                <span className="text-xs sm:text-sm text-slate-400 font-normal font-sans truncate block" title={`所屬群組：${item.groupName}`}>
                                  {item.groupName}
                                </span>
                              </div>

                            </div>

                            {/* [狀態標籤與金額] (靠右) */}
                            <div className="flex items-center justify-end gap-3 ml-auto shrink-0">
                              <div className="w-20 flex items-center justify-center shrink-0">
                                <SettlementStatusBadge status={item.status} isChecked={isChecked} />
                              </div>
                              <div className="w-28 text-right text-sm sm:text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap">
                                NT${item.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Phone View (< 640px)：空間優化雙行佈局 */}
                          <div className="sm:hidden flex items-start gap-2.5 w-full">
                            {/* 勾選框 Checkbox (置於左側，對齊第一行) */}
                            <div className="w-5 shrink-0 flex items-center justify-center mt-0.5">
                              {item.isLocked ? (
                                <div className="p-0.5 rounded text-amber-700" title="已關聯還款單連鎖鎖定中">
                                  <Lock size={13} />
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectPayable(item.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 accent-[#74818E] cursor-pointer"
                                />
                              )}
                            </div>

                            {/* 卡片主體內容區 */}
                            <div className="min-w-0 flex-1 flex flex-col gap-1">
                              {/* 第一行 (主要資訊)：左側 [項目標題] + [狀態 Tag] / 右側 NT$ 金額 */}
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span className="text-sm font-medium text-slate-800 truncate block font-sans" title={item.expenseName}>
                                    {item.expenseName}
                                  </span>
                                  <SettlementMicroStatusBadge status={item.status} />
                                </div>
                                <div className="text-right text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap ml-1">
                                  NT${item.amount.toLocaleString()}
                                </div>
                              </div>

                              {/* 第二行 (輔助資訊)：[債權人頭像+姓名] · 日期 · 群組名稱 */}
                              <div className="text-xs text-gray-500 font-sans truncate flex items-center gap-1.5 min-w-0">
                                <div className="inline-flex items-center gap-1 shrink-0">
                                  <div className="w-4 h-4 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold shrink-0">
                                    <User size={10} />
                                  </div>
                                  <span className="font-medium text-slate-600 truncate max-w-[80px]">
                                    {getMemberDisplayName(item.creditorId)}
                                  </span>
                                </div>
                                <span className="shrink-0 text-slate-300">·</span>
                                <span className="shrink-0">{item.date}</span>
                                <span className="shrink-0 text-slate-300">·</span>
                                <span className="truncate">{item.groupName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tablet View (640px ≤ width < 1024px)：保持完整橫向雙層資訊佈局 */}
                          <div className="hidden sm:flex lg:hidden items-center justify-between gap-2.5 sm:gap-4 w-full">
                            {/* 左側：Checkbox + 人員轉向圖示 (如：我 ➔ 小林) */}
                            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                              <div className="w-5 shrink-0 flex items-center justify-center">
                                {item.isLocked ? (
                                  <div className="p-0.5 rounded text-amber-700" title="已關聯還款單連鎖鎖定中">
                                    <Lock size={14} />
                                  </div>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelectPayable(item.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 accent-[#74818E] cursor-pointer self-center"
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-[#C1503B]/10 text-[#C1503B] flex items-center justify-center font-bold">
                                    <User size={12} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.debtorId)}
                                  </span>
                                </div>

                                <ArrowRight size={12} className="text-[#74818E]/60 shrink-0 mx-0.5" />

                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold">
                                    <User size={12} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.creditorId)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 中間 (主資訊欄)：上行 類別 Icon + 項目名稱，下行 日期 · 群組 */}
                            <div className="min-w-0 flex-1 px-1 sm:px-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                  {React.createElement(getCategoryIcon(item.category), { size: 12 })}
                                </span>
                                <span className="text-sm font-medium text-slate-700 truncate block font-sans" title={item.expenseName}>
                                  {item.expenseName}
                                </span>
                              </div>
                              <div className="text-xs text-stone-400 font-sans truncate mt-0.5 flex items-center gap-1 min-w-0">
                                <span className="shrink-0">{item.date}</span>
                                <span className="shrink-0">·</span>
                                <span className="truncate">{item.groupName}</span>
                              </div>
                            </div>

                            {/* 右側 (固定靠右 shrink-0)：金額 + 狀態標籤 */}
                            <div className="flex flex-col items-end justify-center shrink-0 gap-1 pl-1">
                              <div className="text-right text-sm sm:text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap">
                                NT${item.amount.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <SettlementStatusBadge status={item.status} isChecked={isChecked} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. 應收帳款區塊 (Receivables) */}
            {showReceivables && (
              <div className={showPayables ? "pt-8 border-t border-slate-100" : ""}>
                {/* 區塊 Header：無底色，圖示容器質感灰底，筆數靠左緊跟標題 */}
                <div className="bg-transparent pb-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      <HandCoins size={15} />
                    </span>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-[#3A342E] font-sans tracking-tight">
                        應收帳款
                      </h2>
                      <span className="text-sm text-slate-400 font-normal font-sans">
                        (共 {filteredReceivables.length} 筆)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 應收帳款清單 (每筆 Row 具備 rounded-xl 圓角、margin 與 padding，Hover/Highlight 絕不貼邊) */}
                {filteredReceivables.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#74818E] font-sans">
                    🌱 目前沒有任何應收帳款項目。
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {filteredReceivables.map((item) => {
                      const isPending = item.status === 'PENDING_APPROVAL';
                      const isRejected = item.status === 'REJECTED';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isPending) {
                              handleOpenAuditForItem(item, false);
                            }
                          }}
                          className={`w-full py-3.5 px-4 sm:px-5 rounded-xl border border-slate-100 shadow-none transition-all ${
                            isRejected
                              ? 'bg-rose-50/20 hover:bg-rose-50/30 border-rose-200/60 hover:border-rose-300 cursor-pointer'
                              : isPending
                              ? 'bg-white hover:bg-slate-50/80 hover:border-slate-200/80 cursor-pointer'
                              : 'bg-white hover:bg-slate-50/80 hover:border-slate-200/80'
                          }`}
                        >
                          {/* Desktop View (≥ 1024px)：完整多欄位排版 */}
                          <div className="hidden lg:flex items-center justify-between gap-3 w-full">
                            {/* 左側主體：[隱形 Checkbox 占位 (w-5)] + [對象區 (w-[124px])] + [日期] + [名稱] + [類別 Badge] */}
                            <div className="flex items-center min-w-0 gap-3 sm:gap-4 shrink-0">
                              {/* Checkbox 隱形占位 */}
                              <div className="w-5 shrink-0" aria-hidden="true" />

                              {/* [對象區] (靠左，固定 w-[124px] shrink-0)：付款人 ➔ 收款人 */}
                              <div className="flex items-center gap-1.5 shrink-0 w-[124px]">
                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-[#C1503B]/10 text-[#C1503B] flex items-center justify-center font-bold">
                                    <User size={13} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.debtorId)}
                                  </span>
                                </div>

                                <ArrowRight size={13} className="text-[#74818E]/60 shrink-0 mx-1" />

                                <div className="flex flex-col items-center">
                                  <div className="w-7 h-7 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold">
                                    <User size={13} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.creditorId)}
                                  </span>
                                </div>
                              </div>

                              {/* [日期] */}
                              <div className="w-[78px] sm:w-[84px] shrink-0">
                                <span className="text-xs sm:text-sm text-slate-400 font-sans whitespace-nowrap">
                                  {item.date}
                                </span>
                              </div>

                              {/* [項目主體：Icon + 名稱] */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <SettlementCategoryPrefix category={item.category} />
                                <div className="w-28 sm:w-36 md:w-44 shrink-0">
                                  <span className="text-sm font-medium text-slate-700 truncate block font-sans" title={item.expenseName}>
                                    {item.expenseName}
                                  </span>
                                </div>
                              </div>

                              {/* [所屬群組名稱標籤] */}
                              <div className="w-20 sm:w-28 shrink-0">
                                <span className="text-xs sm:text-sm text-slate-400 font-normal font-sans truncate block" title={`所屬群組：${item.groupName}`}>
                                  {item.groupName}
                                </span>
                              </div>

                              {/* [退回原因] */}
                              {isRejected && (
                                <SettlementRejectReasonBadge 
                                  rejectReason={item.rejectReason} 
                                  variant="desktop" 
                                  onOpenModal={setReasonModalData} 
                                />
                              )}
                            </div>

                            {/* [狀態標籤與金額 + 操作按鈕] (靠右) */}
                            <div className="flex items-center justify-end gap-3 ml-auto shrink-0">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAuditForItem(item, false);
                                  }}
                                  className="px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-[#8FB96C] hover:bg-[#7ea55e] active:bg-[#6e9251] rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 font-sans shrink-0"
                                  title="開啟還款審核彈窗並核對款項"
                                >
                                  <ShieldCheck size={13} className="shrink-0" />
                                  <span>核對款項</span>
                                </button>
                              )}

                              <div className="w-20 flex items-center justify-center shrink-0">
                                <SettlementStatusBadge status={item.status} />
                              </div>

                              <div className="w-28 text-right text-sm sm:text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap">
                                NT${item.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Phone View (< 640px)：空間優化雙行佈局 (第一行：占位 + 項目標題 + 帳款狀態 Tag + 金額 / 第二行：對齊標題起頭，顯示頭像姓名 · 日期 · 群組) */}
                          <div className="sm:hidden flex items-start gap-2.5 w-full">
                            {/* 隱形 Checkbox 占位 (保持與應付帳款列表起頭一致) */}
                            <div className="w-5 shrink-0 mt-0.5" aria-hidden="true" />

                            {/* 卡片主體內容區 (標題起頭與第二行輔助資訊完美垂直對齊) */}
                            <div className="min-w-0 flex-1 flex flex-col gap-1">
                              {/* 第一行 (主要資訊)：左側 [項目標題] + [恆定顯示的帳款狀態 Tag] / 右側 金額與核對按鈕 */}
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span className="text-sm font-medium text-slate-800 truncate block font-sans" title={item.expenseName}>
                                    {item.expenseName}
                                  </span>
                                  <SettlementMicroStatusBadge status={item.status} />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-1">
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAuditForItem(item, false);
                                      }}
                                      className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#8FB96C] hover:bg-[#7ea55e] active:bg-[#6e9251] rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 font-sans shrink-0"
                                      title="開啟還款審核彈窗並核對款項"
                                    >
                                      <ShieldCheck size={11} />
                                      <span>核對</span>
                                    </button>
                                  )}
                                  <span className="text-right text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap">
                                    NT${item.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* 第二行 (輔助資訊)：左側對齊標題起頭，依序顯示 [👤頭像+姓名] · 日期 · 群組名稱 */}
                              <div className="text-xs text-gray-500 font-sans truncate flex items-center gap-1.5 min-w-0">
                                <div className="inline-flex items-center gap-1 shrink-0">
                                  <div className="w-4 h-4 rounded-full bg-[#C1503B]/10 text-[#C1503B] flex items-center justify-center font-bold shrink-0">
                                    <User size={10} />
                                  </div>
                                  <span className="font-medium text-slate-600 truncate max-w-[80px]">
                                    {getMemberDisplayName(item.debtorId)}
                                  </span>
                                </div>
                                <span className="shrink-0 text-slate-300">·</span>
                                <span className="shrink-0">{item.date}</span>
                                <span className="shrink-0 text-slate-300">·</span>
                                <span className="truncate">{item.groupName}</span>
                                {isRejected && (
                                  <SettlementRejectReasonBadge 
                                    rejectReason={item.rejectReason} 
                                    variant="inline" 
                                    onOpenModal={setReasonModalData} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tablet View (640px ≤ width < 1024px)：保持完整橫向雙層資訊佈局 */}
                          <div className="hidden sm:flex lg:hidden items-center justify-between gap-2.5 sm:gap-4 w-full">
                            {/* 左側：隱形 Checkbox 占位 + 人員轉向圖示 */}
                            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                              <div className="w-5 shrink-0" aria-hidden="true" />

                              <div className="flex items-center gap-1 shrink-0">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-[#C1503B]/10 text-[#C1503B] flex items-center justify-center font-bold">
                                    <User size={12} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.debtorId)}
                                  </span>
                                </div>

                                <ArrowRight size={12} className="text-[#74818E]/60 shrink-0 mx-0.5" />

                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-[#8FB96C]/15 text-[#8FB96C] flex items-center justify-center font-bold">
                                    <User size={12} />
                                  </div>
                                  <span className="text-[10px] font-bold text-[#3A342E] mt-0.5 whitespace-nowrap">
                                    {getMemberDisplayName(item.creditorId)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 中間 (主資訊欄)：上行 類別 Icon + 項目名稱，下行 日期 · 群組 */}
                            <div className="min-w-0 flex-1 px-1 sm:px-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                  {React.createElement(getCategoryIcon(item.category), { size: 12 })}
                                </span>
                                <span className="text-sm font-medium text-slate-700 truncate block font-sans" title={item.expenseName}>
                                  {item.expenseName}
                                </span>
                              </div>
                              <div className="text-xs text-stone-400 font-sans truncate mt-0.5 flex items-center gap-1 min-w-0">
                                <span className="shrink-0">{item.date}</span>
                                <span className="shrink-0">·</span>
                                <span className="truncate">{item.groupName}</span>
                                {isRejected && (
                                  <SettlementRejectReasonBadge 
                                    rejectReason={item.rejectReason} 
                                    variant="inline" 
                                    onOpenModal={setReasonModalData} 
                                  />
                                )}
                              </div>
                            </div>

                            {/* 右側 (固定靠右 shrink-0)：金額 + 狀態標籤 (+ 核對按鈕) */}
                            <div className="flex flex-col items-end justify-center shrink-0 gap-1 pl-1">
                              <div className="text-right text-sm sm:text-base font-bold font-sans text-slate-800 shrink-0 whitespace-nowrap">
                                NT${item.amount.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAuditForItem(item, false);
                                    }}
                                    className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#8FB96C] hover:bg-[#7ea55e] active:bg-[#6e9251] rounded-md shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 font-sans shrink-0"
                                    title="開啟還款審核彈窗並核對款項"
                                  >
                                    <ShieldCheck size={11} />
                                    <span>核對</span>
                                  </button>
                                )}
                                <SettlementStatusBadge status={item.status} />
                              </div>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 待確認專用空狀態 */}
          {activeTab === 'pending' && filteredReceivables.length === 0 && filteredPayables.length === 0 && (
            <div className="py-12 text-center text-xs sm:text-sm text-[#74818E] font-sans">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <span className="font-semibold text-slate-700 block mb-1">目前沒有任何待確認帳目</span>
              <span>所有發起的還款單皆已審核結清，帳目清爽無待確認項目！</span>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Phone Comprehensive Filter Bottom Sheet Modal (< 640px) */}
      {isFilterSheetRendered && (
        <div 
          className={`fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isFilterSheetVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop click to close */}
          <div 
            className="flex-1 cursor-pointer" 
            onClick={handleCloseFilterSheet} 
            aria-label="點擊關閉篩選"
          />
          
          {/* Bottom Sheet Container (smooth slide-in and slide-out) */}
          <div 
            className={`bg-[#FAF7EE] w-full rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-[#C3D3DE]/60 transition-transform duration-300 ease-in-out transform ${
              isFilterSheetVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Sheet Handle & Header */}
            <div className="px-5 pt-3 pb-3 border-b border-[#C3D3DE]/30 shrink-0">
              <div className="w-10 h-1 bg-[#C3D3DE] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#74818E]" />
                  <span className="font-bold text-base text-[#3A342E]">結算中心篩選</span>
                </div>
                <div className="flex items-center gap-3">
                  {(selectedGroup !== 'all' || selectedMonth !== 'all' || activeTab !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroup('all');
                        setSelectedMonth('all');
                        setActiveTab('all');
                      }}
                      className="text-xs text-[#C1503B] hover:underline font-medium cursor-pointer"
                    >
                      重設全部
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseFilterSheet}
                    className="p-1 rounded-full text-[#74818E] hover:text-[#3A342E] hover:bg-black/5 cursor-pointer transition-colors"
                    aria-label="關閉"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Filter Options with Standard Select Dropdowns */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
              {/* 1. 分帳群組 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
                  分帳群組
                </label>
                <div className="relative">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-[#3A342E] hover:border-slate-400 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#74818E]/20 focus:border-[#74818E] cursor-pointer transition-colors shadow-2xs font-sans pr-9"
                  >
                    <option value="all">全部群組</option>
                    <option value="roommates">小室友們 (3人)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* 2. 結算月份 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
                  結算月份
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-[#3A342E] hover:border-slate-400 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#74818E]/20 focus:border-[#74818E] cursor-pointer transition-colors shadow-2xs font-sans pr-9"
                  >
                    <option value="all">全部月份</option>
                    <option value="2024-05">2024 年 5 月</option>
                    <option value="2024-04">2024 年 4 月</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* 3. 帳款狀態 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#74818E] uppercase tracking-wider">
                  帳款狀態
                </label>
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => {
                      setActiveTab(e.target.value as any);
                      setSubView('cards');
                    }}
                    className="w-full appearance-none px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-[#3A342E] hover:border-slate-400 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#74818E]/20 focus:border-[#74818E] cursor-pointer transition-colors shadow-2xs font-sans pr-9"
                  >
                    <option value="all">全部狀態 ({allReceivableItems.length + allPayableItems.length})</option>
                    <option value="payable">應付帳款 ({allPayableItems.length})</option>
                    <option value="receivable">應收帳款 ({allReceivableItems.length})</option>
                    <option value="pending">待確認 ({pendingCount})</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Confirm Button */}
            <div className="p-4 border-t border-[#C3D3DE]/30 bg-white/70 shrink-0">
              <button
                type="button"
                onClick={handleCloseFilterSheet}
                className="w-full py-3 bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] font-bold text-sm rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                套用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 次級視圖 1: 還款審核單據中心 (Settlement Orders) */}
      {subView === 'orders' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#C3D3DE]/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C3D3DE]/30 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#3A342E] font-sans">還款單據與連鎖鎖定管理</h3>
              <p className="text-xs text-[#74818E] mt-0.5">發起之還款單自動連鎖鎖定關聯支出；退回時全數自動解鎖並退回未付款狀態。</p>
            </div>
            <button
              onClick={() => setSubView('cards')}
              className="text-xs font-bold text-[#74818E] hover:text-[#3A342E] underline cursor-pointer"
            >
              返回清單
            </button>
          </div>

          {settlementOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#74818E]">
              目前尚未建立任何還款單據。
            </div>
          ) : (
            <div className="space-y-4">
              {settlementOrders.map(order => {
                const isCreditor = order.toUserId === currentUser.id;
                const isPending = order.status === 'PENDING';

                return (
                  <div 
                    key={order.id}
                    className={`rounded-2xl border p-4.5 transition-all ${
                      order.status === 'SETTLED'
                        ? 'bg-[#F7F2E7]/40 border-[#8FB96C]/40'
                        : order.status === 'REJECTED'
                        ? 'bg-red-50/30 border-red-200'
                        : 'bg-white border-[#C3D3DE]/70 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#74818E] bg-[#F7F2E7] px-2 py-0.5 rounded">
                          {order.title || '還款結清單'}
                        </span>
                        <span className="text-xs font-bold text-[#3A342E]">
                          {order.fromUserName} ➜ {order.toUserName}
                        </span>
                        <span className="text-[11px] text-[#74818E]">{order.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-sans">
                            <Clock size={12} /> 待收款審核 (關聯支出已鎖定)
                          </span>
                        )}
                        {order.status === 'SETTLED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8FB96C] bg-[#8FB96C]/15 px-2.5 py-0.5 rounded-full font-sans">
                            <CheckCircle size={12} /> 已核准結清
                          </span>
                        )}
                        {order.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C1503B] bg-red-100 px-2.5 py-0.5 rounded-full font-sans">
                            <RotateCcw size={12} /> 已退回 (支出已解鎖)
                          </span>
                        )}
                        <span className="text-base font-black font-sans text-[#3A342E] ml-2">
                          NT${order.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="py-3 text-xs space-y-1.5 text-[#3A342E] font-sans">
                      {order.notes && (
                        <p className="text-[#74818E]">
                          備註說明：<span className="text-[#3A342E]">{order.notes}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-[#74818E]">
                        <span>關聯原始支出：共 {order.relatedExpenseIds.length} 筆</span>
                        {order.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <Lock size={11} /> 禁止修改與刪除保護中
                          </span>
                        )}
                      </div>
                    </div>

                    {isPending && isCreditor && (
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2.5">
                        <span className="text-xs text-[#74818E] flex items-center gap-1">
                          <Lock size={12} className="text-amber-700" />
                          待您審核確認收款
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditModalOrder(order);
                              setShowRejectMenu(false);
                            }}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-[#8FB96C] hover:bg-[#7ea55e] active:bg-[#6e9251] rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 font-sans"
                          >
                            <ShieldCheck size={14} />
                            核對款項
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 次級視圖 2: 系統稽核日誌軌跡 (Audit Logs) */}
      {subView === 'logs' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#C3D3DE]/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C3D3DE]/30 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#3A342E] font-sans">系統稽核與操作日誌 (Audit Trail)</h3>
              <p className="text-xs text-[#74818E] mt-0.5">完整記錄每次還款單建立、連鎖鎖定、核准與退回解鎖之不可篡改歷史。</p>
            </div>
            <button
              onClick={() => setSubView('cards')}
              className="text-xs font-bold text-[#74818E] hover:text-[#3A342E] underline cursor-pointer"
            >
              返回清單
            </button>
          </div>

          <div className="relative border-l-2 border-[#C3D3DE]/50 pl-5 ml-3 space-y-5 font-sans pt-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#74818E] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#74818E]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3A342E]">{log.action}</span>
                    <span className="text-[11px] text-[#74818E]">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#74818E] mt-1">
                    操作者：<span className="font-semibold text-[#3A342E]">{log.operatorName}</span>
                    {log.detail && ` — ${log.detail}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Settlement Modal (還款申請彈窗) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#3A342E]/50 backdrop-blur-xs" onClick={() => setIsPaymentModalOpen(false)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#C3D3DE]/50 z-10 animate-in fade-in zoom-in-95 duration-200 font-sans max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-[#3A342E] flex items-center gap-2">
                <CreditCard size={18} className="text-[#74818E]" />
                還款申請
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
              {/* 1. 整合卡片組：上方顯示大字總額，下方展開細項清單 */}
              <div className="bg-[#F7F2E7] rounded-2xl border border-[#C3D3DE]/60 overflow-hidden shadow-2xs">
                {/* 上方：本次還款總額 */}
                <div className="p-3.5 flex justify-between items-center bg-[#F7F2E7]">
                  <div>
                    <span className="text-xs font-bold text-[#3A342E] block">本次還款總額</span>
                    <span className="text-[11px] text-[#74818E]">
                      共 {selectedPayableItems.length} 筆結清項目
                    </span>
                  </div>
                  <span className="text-2xl font-black font-sans text-[#C1503B]">
                    NT${selectedPayableTotal.toLocaleString()}
                  </span>
                </div>

                {/* 下方：細項清單 (包合在總額卡片下方) */}
                <div className="bg-white/90 border-t border-[#C3D3DE]/40 p-2.5 space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">項目明細</div>
                  {selectedPayableItems.map(i => (
                    <div 
                      key={i.id} 
                      className="flex justify-between items-center text-xs text-[#3A342E] bg-slate-50/80 hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors"
                    >
                      <span className="truncate max-w-[210px] font-medium">
                        {i.expenseName}
                        <span className="text-slate-400 text-[11px] ml-1.5">({i.creditorName})</span>
                      </span>
                      <span className="font-bold text-slate-700 shrink-0 font-sans">
                        NT${i.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 付款管道 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3A342E]">付款管道</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    id="payment-method-transfer-btn"
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 text-xs font-semibold rounded-xl cursor-pointer text-center transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-2 border-[#74818E] bg-[#C3D3DE]/20 text-[#3A342E] font-bold'
                        : 'border border-[#C3D3DE] text-[#74818E] bg-white hover:bg-slate-50'
                    }`}
                  >
                    銀行轉帳
                  </button>
                  <button
                    id="payment-method-cash-btn"
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 text-xs font-semibold rounded-xl cursor-pointer text-center transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-2 border-[#74818E] bg-[#C3D3DE]/20 text-[#3A342E] font-bold'
                        : 'border border-[#C3D3DE] text-[#74818E] bg-white hover:bg-slate-50'
                    }`}
                  >
                    現金/其他
                  </button>
                </div>
              </div>

              {/* 3. 轉帳帳號末五碼 */}
              {paymentMethod === 'transfer' && (
                <div className="p-2.5 bg-gray-50/80 rounded-2xl border border-[#C3D3DE]/50 space-y-1.5">
                  <label className="block text-xs font-bold text-[#3A342E]">
                    轉帳帳號末五碼 <span className="text-[#C1503B]">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={lastFiveDigits}
                    onChange={(e) => setLastFiveDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="例如：58291"
                    className="w-full px-3 py-1.5 bg-white border border-[#C3D3DE] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#74818E]"
                  />
                </div>
              )}

              {/* 4. 上傳憑證/截圖 (選填) - 精簡橫向佈局 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3A342E]">
                  上傳憑證/截圖 (選填)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleProofImageChange}
                  className="hidden"
                />

                {!proofImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-[#C3D3DE] hover:border-[#74818E] bg-[#F7F2E7]/40 hover:bg-[#F7F2E7]/80 rounded-2xl py-2 px-3 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-[#C3D3DE]/60 flex items-center justify-center text-[#74818E] group-hover:text-[#3A342E] group-hover:scale-105 transition-all shrink-0">
                        <UploadCloud size={15} />
                      </div>
                      <p className="text-[11px] text-[#74818E]">支援 JPG, PNG, WEBP (最大 5MB)</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#74818E] group-hover:text-[#3A342E] bg-white px-2.5 py-1 rounded-lg border border-[#C3D3DE]/50 shadow-2xs shrink-0">
                      選擇檔案
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-[#C3D3DE] bg-slate-50 p-2 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                      <img
                        src={proofImage}
                        alt="付款憑證截圖"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#3A342E] truncate leading-tight">已附加憑證截圖</p>
                      <p className="text-[10px] text-[#74818E]">點擊右側垃圾桶可移除或更換</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveProofImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer mr-0.5"
                      title="刪除憑證"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* 5. 備註留言 (選填) - 調至最下方 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3A342E]">備註留言 (選填)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例如：已匯款至玉山帳戶，請查收"
                  className="w-full px-3 py-1.5 bg-white border border-[#C3D3DE] rounded-xl text-xs focus:outline-none focus:border-[#74818E]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 px-6 py-3.5 border-t border-gray-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentMethod === 'transfer' && lastFiveDigits.length !== 5}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === 'transfer' && lastFiveDigits.length !== 5
                    ? 'bg-[#E5E7EB] text-[#99A1AF] cursor-not-allowed'
                    : 'bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] shadow-xs cursor-pointer'
                }`}
              >
                確認送出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 收款人審核彈窗 (Audit Modal for Creditor / Receiver) */}
      {auditModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* 背景黑幕：禁用點擊黑幕關閉 (Strict Modal Closure 防呆機制) */}
          <div className="fixed inset-0 bg-[#3A342E]/50 backdrop-blur-xs select-none" />

          <div 
            className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-lg border border-[#C3D3DE]/50 z-10 my-auto h-auto flex flex-col font-sans transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#8FB96C]" />
                <div>
                  <h3 className="text-base font-bold text-[#3A342E]">
                    還款審核
                  </h3>
                  <p className="text-[11px] text-[#74818E]">單據編號：{auditModalOrder.id}</p>
                </div>
              </div>
              {/* 唯一關閉按鈕 [X] (嚴格防呆，僅能透過此處關閉) */}
              <button 
                type="button"
                onClick={() => {
                  setAuditModalOrder(null);
                  setShowRejectMenu(false);
                  setIsExpenseListExpanded(false);
                }} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="關閉審核視窗"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: h-auto without internal scrollbar */}
            <div className="py-3.5 space-y-3.5 font-sans">
              {/* 1. 金額與對象總覽卡片（整合輕量可摺疊關聯支出） */}
              <div className="bg-[#F7F2E7] p-3.5 sm:p-4 rounded-2xl border border-[#C3D3DE]/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#74818E]">付款方 ➜ 收款方</div>
                    <div className="text-sm font-bold text-[#3A342E] mt-0.5">
                      {auditModalOrder.fromUserName} ➜ {auditModalOrder.toUserName} (我)
                    </div>
                    <div className="text-[11px] text-[#74818E] mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      {auditModalOrder.createdAt} 發起還款
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-[#74818E]">待核對還款總額</div>
                    <div className="text-2xl font-black text-[#C1503B] font-sans">
                      NT${auditModalOrder.amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 輕量級可摺疊關聯支出開關 */}
                <div className="pt-2 border-t border-[#C3D3DE]/40 flex flex-col">
                  <button
                    type="button"
                    onClick={() => setIsExpenseListExpanded(prev => !prev)}
                    className="self-start inline-flex items-center gap-1 text-xs font-semibold text-[#606D7A] hover:text-[#3A342E] cursor-pointer transition-colors"
                  >
                    <span>包含 {auditModalOrder.relatedExpenseIds.length} 筆支出明細</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isExpenseListExpanded ? 'rotate-180 text-[#3A342E]' : ''}`}
                    />
                  </button>

                  {/* 展開之支出清單 */}
                  <AnimatePresence initial={false}>
                    {isExpenseListExpanded && (
                      <motion.div
                        key="expense-sublist"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1.5 pt-1">
                          {expenses
                            .filter(e => auditModalOrder.relatedExpenseIds.includes(e.id))
                            .map(exp => {
                              const debtorSplit = exp.splitMembers.find(m => resolveMemberId(m.memberId, m.name) === auditModalOrder.fromUserId);
                              const myShare = debtorSplit?.amount || exp.amount;
                              return (
                                <div
                                  key={exp.id}
                                  className="bg-white/90 p-2 rounded-xl border border-stone-200/70 flex items-center justify-between text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#3A342E]">{exp.name}</span>
                                      <span className="text-[10px] text-[#74818E] bg-stone-100 px-1.5 py-0.2 rounded">{exp.category}</span>
                                    </div>
                                    <div className="text-[10px] text-[#74818E]">{exp.date} · 原始 NT${exp.amount.toLocaleString()}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-[#8FB96C] font-sans">
                                      應收 NT${myShare.toLocaleString()}
                                    </div>
                                    <span className="text-[9px] text-amber-700 inline-flex items-center gap-0.5 font-medium">
                                      <Lock size={8} /> 鎖定中
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 2. 對方提供之轉帳資訊專區 (整合輕量縮圖組件) */}
              {(() => {
                const info = parseTransferDetails(auditModalOrder.notes);
                return (
                  <div className="bg-slate-50/90 px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
                    {info.isCash ? (
                      /* 現金/其他：單行精簡資訊列 */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-[#74818E] shrink-0" />
                          <span className="text-[#74818E] font-medium">付款管道：</span>
                          <span className="font-medium text-slate-800">現金 / 其他</span>
                        </div>
                        <span className="text-[11px] text-[#74818E]">實體交付結清</span>
                      </div>
                    ) : (
                      /* 銀行轉帳：精簡單行資訊列（付款管道 + 帳號末 5 碼同一橫行，文字 Baseline 基準線垂直對齊） */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#74818E] shrink-0" />
                          <span className="text-[#74818E] font-medium">付款管道：</span>
                          <span className="font-medium text-slate-800">銀行轉帳</span>
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[#74818E] font-medium">帳號末 5 碼：</span>
                          {info.lastFive ? (
                            <span className="font-medium text-xs text-slate-800 tracking-wide">
                              #{info.lastFive}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">未填寫</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 憑證截圖小型縮圖組件 (若有上傳憑證，顯示淡色檔名並支援點擊放大) */}
                    {auditModalOrder.proofUrl && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-[#74818E] shrink-0" />
                          <span className="text-[#74818E] font-medium">憑證截圖：</span>
                          <span className="text-slate-400 font-normal text-xs">
                            {auditModalOrder.proofUrl.startsWith('data:')
                              ? `receipt_${auditModalOrder.createdAt ? auditModalOrder.createdAt.split(' ')[0].replace(/[^0-9]/g, '').slice(4) || '0917' : '0917'}.png`
                              : (auditModalOrder.proofUrl.split('/').pop()?.split('?')[0] || 'receipt_0917.png')}
                          </span>
                        </div>

                        <div 
                          className="relative group cursor-pointer shrink-0"
                          onClick={() => setPreviewImageUrl(auditModalOrder.proofUrl!)}
                          title="點擊放大檢視付款憑證"
                        >
                          <img 
                            src={auditModalOrder.proofUrl} 
                            alt="付款憑證縮圖" 
                            className="w-16 h-16 object-cover rounded-lg border border-slate-300/90 shadow-2xs transition-all duration-150 group-hover:scale-105 group-hover:border-slate-400"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-medium pointer-events-none">
                            <ZoomIn size={14} className="mb-0.5" />
                            <span>點擊放大</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {info.memoText && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px]">
                        <span className="text-[#74818E] font-medium shrink-0">備註：</span>
                        <span className="text-slate-800 font-medium leading-normal">{info.memoText}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. 退回原因選單 (純文字水平單行 Radio 排版 + Smooth Accordion 動態展開) */}
              <AnimatePresence initial={false}>
                {showRejectMenu && (
                  <motion.div
                    key="reject-accordion"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50/80 border border-red-200/90 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-rose-600">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>退回原因：</span>
                      </div>

                      {/* 水平單行純文字 Radio 選擇器 (縮排 pl-6 與上方標頭第一字精準垂直對齊，選取時使用標準中性色系) */}
                      <div className="pl-6 flex flex-wrap items-center gap-4 sm:gap-6 py-0.5 text-xs">
                        {(['金額不符', '末 5 碼有誤', '其他'] as const).map(cat => {
                          const isChecked = selectedRejectReason === cat;
                          return (
                            <label
                              key={cat}
                              className="inline-flex items-center gap-1.5 cursor-pointer font-medium select-none transition-colors"
                            >
                              <input
                                type="radio"
                                name="rejectReasonRadio"
                                value={cat}
                                checked={isChecked}
                                onChange={() => setSelectedRejectReason(cat)}
                                className="w-3.5 h-3.5 text-slate-800 focus:ring-slate-400 accent-slate-800 cursor-pointer"
                              />
                              <span className={isChecked ? 'font-medium text-slate-800' : 'font-medium text-slate-500 hover:text-slate-800'}>
                                {cat}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="pl-6">
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={30}
                            value={customRejectInput}
                            onChange={(e) => setCustomRejectInput(e.target.value)}
                            placeholder={
                              selectedRejectReason === '其他'
                                ? '請說明退回原因 (例：少轉 200 元、查無帳目)...'
                                : '可選填補充說明 (例如：請再次核對轉帳末五碼)...'
                            }
                            className="w-full px-3 py-1.5 pr-12 bg-white border border-red-200 rounded-xl text-xs focus:outline-none focus:border-[#C1503B]"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-sans pointer-events-none select-none">
                            {customRejectInput.length}/30
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5 font-sans">
              {!showRejectMenu ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectMenu(true)}
                    className="px-3.5 py-2 text-xs font-bold text-[#C1503B] hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    <RotateCcw size={13} />
                    款項不符退回
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = approveSettlement(auditModalOrder.id);
                      if (res.success) {
                        showToast(`已確認核對無誤！${auditModalOrder.relatedExpenseIds.length} 筆支出已順利平帳結清。`);
                        setAuditModalOrder(null);
                        setShowRejectMenu(false);
                        setIsExpenseListExpanded(false);
                      } else {
                        showToast(res.error || '核准失敗');
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#8FB96C] hover:bg-[#7ea55e] active:bg-[#6e9251] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    <CheckCircle size={14} />
                    確認無誤
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-end gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setShowRejectMenu(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer transition-colors font-sans"
                  >
                    取消退回
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const finalReason = selectedRejectReason === '其他' 
                        ? (customRejectInput.trim() ? `其他（${customRejectInput.trim()}）` : '其他') 
                        : (customRejectInput.trim() ? `${selectedRejectReason === '末 5 碼有誤' ? '末5碼有誤' : selectedRejectReason}（${customRejectInput.trim()}）` : (selectedRejectReason === '末 5 碼有誤' ? '末5碼有誤' : selectedRejectReason));
                      
                      const res = rejectSettlement(auditModalOrder.id, finalReason);
                      if (res.success) {
                        showToast(`已退回還款單（${finalReason}），${auditModalOrder.relatedExpenseIds.length} 筆支出已自動解除鎖定！`);
                        setAuditModalOrder(null);
                        setShowRejectMenu(false);
                        setIsExpenseListExpanded(false);
                      } else {
                        showToast(res.error || '退回操作失敗');
                      }
                    }}
                    className="px-5 py-2 bg-[#C1503B] hover:bg-[#a84430] active:bg-[#913b29] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 font-sans transition-colors"
                  >
                    <AlertCircle size={13} />
                    確認退回
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 憑證截圖大圖預覽 Lightbox Overlay (點擊任意處關閉) */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150 select-none"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] flex flex-col items-center"
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              title="關閉預覽"
            >
              <X size={15} />
              <span>關閉</span>
            </button>
            <img
              src={previewImageUrl}
              alt="憑證大圖預覽"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/20"
              referrerPolicy="no-referrer"
            />
            <div className="mt-2.5 text-white/70 text-xs font-sans">
              點擊任意處關閉預覽
            </div>
          </div>
        </div>
      )}

      {/* 完整退回原因彈窗提示 (點擊卡片退回原因時展開 Popover/Modal) */}
      {reasonModalData && (
        <div 
          className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setReasonModalData(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-rose-100 flex flex-col space-y-3.5 font-sans animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100/60">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Info size={16} />
                <span>款項退回原因明細</span>
              </div>
              <button
                type="button"
                onClick={() => setReasonModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="關閉"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium shrink-0">主分類：</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/80">
                  {reasonModalData.mainReason}
                </span>
              </div>

              {reasonModalData.detailReason ? (
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-slate-500 font-medium">補充說明：</span>
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs sm:text-sm text-slate-700 leading-relaxed break-words font-sans">
                    {reasonModalData.detailReason}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed font-sans">
                  此款項因「{reasonModalData.mainReason}」被退回，申請人暫無提供額外補充說明。
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setReasonModalData(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer font-sans"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 專屬退款款項修正 Modal (Revision Modal) */}
      {revisionItem && (() => {
        const rejectedOrder = settlementOrders.find(o =>
          o.status === 'REJECTED' &&
          (o.id === revisionItem.orderId ||
            (o.fromUserId === revisionItem.debtorId &&
             o.toUserId === revisionItem.creditorId &&
             o.relatedExpenseIds.includes(revisionItem.expenseId)))
        );

        const relatedExpenseIds = rejectedOrder ? rejectedOrder.relatedExpenseIds : [revisionItem.expenseId];
        const relatedExpenses = expenses.filter(e => relatedExpenseIds.includes(e.id));
        const totalAmount = rejectedOrder ? rejectedOrder.amount : revisionItem.amount;
        const parsedReason = parseRejectReason(revisionItem.rejectReason || rejectedOrder?.rejectReason);
        const reasonSummary = parsedReason.detailReason
          ? `${parsedReason.mainReason}（${parsedReason.detailReason}）`
          : parsedReason.mainReason;
        const rejecterName = getMemberDisplayName(revisionItem.creditorId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-[#3A342E]/50 backdrop-blur-xs" 
              onClick={() => setRevisionItem(null)} 
            />
            <div 
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#C3D3DE]/50 z-10 animate-in fade-in zoom-in-95 duration-200 font-sans max-h-[92vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. 頂部標題區 (Header) */}
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-[#C3D3DE]/30 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#74818E] rounded-full inline-block" />
                  <h3 className="text-base font-bold text-[#3A342E]">退款款項修正</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setRevisionItem(null)} 
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors rounded-lg hover:bg-slate-100"
                  title="關閉"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                {/* 2. 中部診斷與對帳整合卡片 */}
                <div className="bg-[#FAF7EE]/70 rounded-2xl border border-[#C3D3DE]/40 overflow-hidden shadow-2xs">
                  {/* 頂部警示區 */}
                  <div className="bg-rose-50/70 px-3.5 py-2 flex items-center gap-1.5 border-b border-rose-100/60">
                    <AlertCircle size={15} className="text-rose-600 shrink-0" />
                    <span className="text-xs font-medium text-rose-700 leading-tight">
                      審核未通過：{reasonSummary}（{rejecterName} 退回）
                    </span>
                  </div>

                  {/* 卡片內文 */}
                  <div className="p-3.5 space-y-2.5 font-sans">
                    {/* 還款總額 (唯讀純文字) */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#74818E] font-medium">還款總額</span>
                      <span className="text-xl font-bold font-sans text-[#3A342E]">
                        NT$ {totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* 合併還款明細清單 */}
                    <div className="pt-2 border-t border-[#C3D3DE]/30 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#74818E] font-medium">
                        <span>款項明細清單</span>
                        <span>共 {relatedExpenseIds.length} 筆</span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
                        {relatedExpenses.length > 0 ? (
                          relatedExpenses.map(exp => {
                            const split = exp.splitMembers.find(m => resolveMemberId(m.memberId, m.name) === revisionItem.debtorId);
                            const itemAmount = split ? split.amount : exp.amount;
                            return (
                              <div key={exp.id} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white/80 border border-[#C3D3DE]/30">
                                <span className="truncate max-w-[210px] text-[#3A342E] font-medium" title={exp.name}>
                                  {exp.name}
                                </span>
                                <span className="font-semibold text-slate-700 shrink-0 font-sans">
                                  NT$ {itemAmount.toLocaleString()}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white/80 border border-[#C3D3DE]/30">
                            <span className="truncate max-w-[210px] text-[#3A342E] font-medium">
                              {revisionItem.expenseName}
                            </span>
                            <span className="font-semibold text-slate-700 shrink-0 font-sans">
                              NT$ {revisionItem.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 底緣提示 */}
                    <div className="text-[11px] text-[#74818E] pt-1 leading-normal">
                      ※ 若已私下補足款項，確認總額無誤後直接送出即可。
                    </div>
                  </div>
                </div>

                {/* 3. 下部補件與重新送審表單 */}
                <div className="space-y-3.5 font-sans">
                  {/* 付款模式 * */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#3A342E]">
                      付款模式 <span className="text-[#C1503B]">*</span>
                    </label>
                    <div className="flex items-center gap-6 text-xs text-[#3A342E]">
                      <label className="inline-flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="radio"
                          name="revisionPaymentMethod"
                          value="transfer"
                          checked={revisionPaymentMethod === 'transfer'}
                          onChange={() => setRevisionPaymentMethod('transfer')}
                          className="w-4 h-4 accent-[#74818E] cursor-pointer"
                        />
                        <span>銀行轉帳</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="radio"
                          name="revisionPaymentMethod"
                          value="cash"
                          checked={revisionPaymentMethod === 'cash'}
                          onChange={() => setRevisionPaymentMethod('cash')}
                          className="w-4 h-4 accent-[#74818E] cursor-pointer"
                        />
                        <span>現金/其他</span>
                      </label>
                    </div>
                  </div>

                  {/* 隱藏的檔案上傳 input */}
                  <input
                    type="file"
                    ref={revisionFileInputRef}
                    accept="image/*"
                    onChange={handleRevisionProofChange}
                    className="hidden"
                  />

                  {/* 選擇「銀行轉帳」時顯示 帳號末五碼 * Input (h-9) + [ FolderUp 上傳憑證 ] 按鈕 */}
                  {revisionPaymentMethod === 'transfer' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-7 space-y-1">
                          <label className="block text-xs font-bold text-[#3A342E]">
                            帳號末五碼 <span className="text-[#C1503B]">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={revisionLastFiveDigits}
                            onChange={(e) => setRevisionLastFiveDigits(e.target.value.replace(/\D/g, ''))}
                            placeholder="例如：58291"
                            className="w-full h-9 px-3 bg-white border border-[#C3D3DE] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#74818E]"
                          />
                        </div>
                        <div className="col-span-5">
                          <button
                            type="button"
                            onClick={() => revisionFileInputRef.current?.click()}
                            className="w-full h-9 px-2.5 rounded-xl border border-dashed border-[#C3D3DE] hover:border-[#74818E] bg-[#FAF7EE]/60 hover:bg-[#FAF7EE] text-xs font-semibold text-[#74818E] hover:text-[#3A342E] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <FolderUp size={14} className="shrink-0" />
                            <span>{revisionProofImage ? '更換憑證' : '上傳憑證'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 憑證縮圖 / 狀態 */}
                      {revisionProofImage && (
                        <div className="rounded-xl border border-[#C3D3DE] bg-slate-50 p-2 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                              <img
                                src={revisionProofImage}
                                alt="付款憑證"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate">已附加憑證截圖</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRevisionProofImage(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="移除憑證"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 「現金/其他」時隱藏末五碼，僅顯示全寬憑證上傳鈕 */
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => revisionFileInputRef.current?.click()}
                        className="w-full h-9 px-3 rounded-xl border border-dashed border-[#C3D3DE] hover:border-[#74818E] bg-[#FAF7EE]/60 hover:bg-[#FAF7EE] text-xs font-semibold text-[#74818E] hover:text-[#3A342E] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FolderUp size={14} className="shrink-0" />
                        <span>{revisionProofImage ? '更換付款憑證 (選填)' : '上傳付款憑證 (選填)'}</span>
                      </button>

                      {/* 憑證縮圖 / 狀態 */}
                      {revisionProofImage && (
                        <div className="rounded-xl border border-[#C3D3DE] bg-slate-50 p-2 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                              <img
                                src={revisionProofImage}
                                alt="付款憑證"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate">已附加憑證截圖</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRevisionProofImage(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="移除憑證"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 備註留言 (選填)：單行 Input (h-9) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#3A342E]">備註留言 (選填)</label>
                    <input
                      type="text"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      placeholder="例如：已補匯不足款項，請查收"
                      className="w-full h-9 px-3 bg-white border border-[#C3D3DE] rounded-xl text-xs focus:outline-none focus:border-[#74818E]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 底部動作列 (Footer Strip)：bg-[#F7F2E7] */}
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#F7F2E7] border-t border-[#C3D3DE]/30 flex items-center justify-between shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setRevisionItem(null)}
                  className="px-4 py-2 border border-[#C3D3DE] bg-white text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevision}
                  disabled={revisionPaymentMethod === 'transfer' && revisionLastFiveDigits.length !== 5}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    revisionPaymentMethod === 'transfer' && revisionLastFiveDigits.length !== 5
                      ? 'bg-[#E5E7EB] text-[#99A1AF] cursor-not-allowed'
                      : 'bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] shadow-xs cursor-pointer'
                  }`}
                >
                  重新送出審核
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

