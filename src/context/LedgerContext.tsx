import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { 
  ActiveTab, 
  ExpenseItem, 
  AppUser, 
  TEST_USERS, 
  SettlementItem, 
  Group, 
  PaymentMethod,
  ExpenseStatus,
  SettlementOrder,
  SettlementOrderStatus,
  AuditLog,
  MemberBalance,
  SimplifiedDebt,
  AppNotification
} from '../types';

// Initial Mock Expenses: 固定 5 筆 UAT 測試支出 (Bob代墊3筆 / Alice代墊1筆 / 公積金1筆)
const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp_01',
    name: '鹹酥雞宵夜',
    date: '2024/05/20',
    groupName: '台北一日遊',
    payer: '小林代墊',
    amount: 300,
    category: '餐飲',
    notes: '鹹酥雞宵夜分攤',
    paymentMethod: 'PERSONAL_ADVANCE',
    status: 'UNPAID',
    splitMembers: [
      { name: 'Alice', amount: 100, memberId: 'user_me' },
      { name: '小林', amount: 100, memberId: 'user_lin' },
      { name: '阿明', amount: 100, memberId: 'user_ming' }
    ],
    logs: [
      { date: '2024/05/20 22:30', text: '小林代墊鹹酥雞宵夜 $300，共 3 人平分 (Alice、小林、阿明)', author: '小林' }
    ],
    isLocked: false
  },
  {
    id: 'exp_02',
    name: '週末義式大餐',
    date: '2024/05/21',
    groupName: '台北一日遊',
    payer: '小林代墊',
    amount: 1200,
    category: '餐飲',
    notes: '週末義式大餐分攤',
    paymentMethod: 'PERSONAL_ADVANCE',
    status: 'UNPAID',
    splitMembers: [
      { name: 'Alice', amount: 600, memberId: 'user_me' },
      { name: '小林', amount: 600, memberId: 'user_lin' }
    ],
    logs: [
      { date: '2024/05/21 19:40', text: '小林代墊週末義式大餐 $1,200，共 2 人平分 (Alice、小林)', author: '小林' }
    ],
    isLocked: false
  },
  {
    id: 'exp_03',
    name: '電費代墊',
    date: '2024/05/22',
    groupName: '小室友們',
    payer: '小林代墊',
    amount: 900,
    category: '居住',
    notes: '本期電費代墊',
    paymentMethod: 'PERSONAL_ADVANCE',
    status: 'UNPAID',
    splitMembers: [
      { name: 'Alice', amount: 450, memberId: 'user_me' },
      { name: '阿明', amount: 450, memberId: 'user_ming' }
    ],
    logs: [
      { date: '2024/05/22 10:15', text: '小林代墊電費代墊 $900，共 2 人平分 (Alice、阿明)', author: '小林' }
    ],
    isLocked: false
  },
  {
    id: 'exp_04',
    name: '買衛生紙',
    date: '2024/05/23',
    groupName: '小室友們',
    payer: '我代墊',
    amount: 200,
    category: '日用',
    notes: '採購公用衛生紙',
    paymentMethod: 'PERSONAL_ADVANCE',
    status: 'UNPAID',
    splitMembers: [
      { name: 'Alice', amount: 100, memberId: 'user_me' },
      { name: '阿明', amount: 100, memberId: 'user_ming' }
    ],
    logs: [
      { date: '2024/05/23 15:00', text: 'Alice代墊買衛生紙 $200，共 2 人平分 (Alice、阿明)', author: 'Alice' }
    ],
    isLocked: false
  },
  {
    id: 'exp_05',
    name: '珍珠奶茶',
    date: '2024/05/24',
    groupName: '小室友們',
    payer: '公積金支付',
    amount: 150,
    category: '餐飲',
    notes: '公積金下午茶珍珠奶茶',
    paymentMethod: 'OFFICIAL_FUND',
    status: 'UNPAID',
    splitMembers: [
      { name: 'Alice', amount: 50, memberId: 'user_me' },
      { name: '小林', amount: 50, memberId: 'user_lin' },
      { name: '阿明', amount: 50, memberId: 'user_ming' }
    ],
    logs: [
      { date: '2024/05/24 16:20', text: '公積金支付扣款 $150，全體 3 人平分享用 (Alice、小林、阿明)', author: '系統' }
    ],
    isLocked: false
  }
];

// Initial Settlement items
const INITIAL_SETTLEMENTS: SettlementItem[] = [];

// Initial Settlement Orders (無預設鎖定訂單，保持純淨初始狀態)
const INITIAL_SETTLEMENT_ORDERS: SettlementOrder[] = [];

// Initial Notifications (小林代墊通知預設針對 Alice；系統提醒通知全體可見)
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-base-1',
    recipientId: 'user_me',
    title: '小林新增了「電費代墊」',
    desc: '代墊 NT$900，個人應分攤 NT$450',
    time: '1 小時前',
    unread: true,
    sender: '林',
    targetTab: 'settlement',
    createdAt: 1716300000000,
  },
  {
    id: 'notif-base-2',
    recipientId: 'all',
    title: '公積金支出扣款通知',
    desc: '「珍珠奶茶」已自公積金扣除 NT$150',
    time: '昨天',
    unread: false,
    sender: '公',
    targetTab: 'details',
    createdAt: 1716200000000,
  }
];

// Initial Groups (僅保留「小室友們」與「台北一日遊」)
const INITIAL_GROUPS: Group[] = [
  { id: 'g1', name: '小室友們', memberCount: 3, balance: 0, icon: 'Users', hasReserveFund: true },
  { id: 'g2', name: '台北一日遊', memberCount: 3, balance: 0, icon: 'Compass', hasReserveFund: false }
];

// Initial Group Fund Balance
const DEFAULT_GROUP_FUND_BALANCE = 5000;

// Data Version & Storage keys (更新版本至 v12，解鎖珍珠奶茶資料與操作軌跡倒序)
const CURRENT_DATA_VERSION = 'nagomi_v12_unlock_pearl_tea';

const STORAGE_KEYS = {
  VERSION: 'nagomi_ledger_data_version_v12',
  EXPENSES: 'nagomi_ledger_expenses_v12',
  USER: 'nagomi_ledger_user_v12',
  SETTLEMENTS: 'nagomi_ledger_settlements_v12',
  ORDERS: 'nagomi_ledger_orders_v12',
  LOGS: 'nagomi_ledger_logs_v12',
  FUND_BALANCE: 'nagomi_ledger_fund_balance_v12',
  ENABLE_RESERVE_FUND: 'nagomi_ledger_enable_fund_v12',
  REMAINDER_COUNTS: 'nagomi_ledger_remainder_counts_v12',
  NOTIFICATIONS: 'nagomi_ledger_notifications_v12'
};

// Helper: Match member names with persona id
export function mapNameToUserId(name: string): string {
  if (name === '小林' || name.includes('Bob') || name.includes('李小華') || name === 'member_2' || name === 'user_lin') {
    return 'user_lin';
  }
  if (name === '阿明' || name.includes('Charlie') || name.includes('小明') || name === 'member_3' || name === 'user_ming') {
    return 'user_ming';
  }
  if (name === '我' || name === '自己' || name === '個人獨資' || name.includes('Alice') || name === 'member_1' || name === 'user_me') {
    return 'user_me';
  }
  return 'user_me';
}

export function isUserMember(memberName: string, user: AppUser): boolean {
  return mapNameToUserId(memberName) === user.id;
}

export function isUserPayer(payerText: string, user: AppUser): boolean {
  if (user.id === 'user_me') {
    return (
      payerText.includes('自己') || 
      payerText.includes('我') || 
      payerText.includes('個人') || 
      payerText.includes('Alice') ||
      payerText.includes('member_1')
    );
  }
  if (user.id === 'user_lin') {
    return payerText.includes('小林') || payerText.includes('Bob') || payerText.includes('李小華') || payerText.includes('member_2');
  }
  if (user.id === 'user_ming') {
    return payerText.includes('阿明') || payerText.includes('Charlie') || payerText.includes('小明') || payerText.includes('member_3');
  }
  return false;
}

export interface RemainderDistributionResult {
  shares: { memberId: string; memberName: string; amount: number }[];
  absorbedMemberIds: string[];
}

export interface LedgerContextType {
  // Navigation & UI States
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isQuickRecordOpen: boolean;
  setIsQuickRecordOpen: (open: boolean) => void;
  editingExpense: ExpenseItem | null;
  setEditingExpense: React.Dispatch<React.SetStateAction<ExpenseItem | null>>;
  openEditExpenseModal: (expense: ExpenseItem) => void;
  selectedExpenseGroupFilter: string;
  setSelectedExpenseGroupFilter: (filter: string) => void;

  // Persona State
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  switchUserById: (userId: string) => void;

  // Expenses & Chain-Locking Lifecycle Actions
  expenses: ExpenseItem[];
  handleAddExpense: (newExpense: Omit<ExpenseItem, 'id' | 'logs'>) => { success: boolean; convertedToAdvance?: boolean; message?: string };
  handleDeleteExpense: (id: string) => { success: boolean; error?: string };
  handleUpdateExpense: (id: string, updated: Partial<ExpenseItem>) => { success: boolean; error?: string };

  // Reserve Fund (公積金)
  enableReserveFund: boolean;
  setEnableReserveFund: React.Dispatch<React.SetStateAction<boolean>>;
  groupFundBalance: number;
  setGroupFundBalance: React.Dispatch<React.SetStateAction<number>>;
  depositGroupFund: (amount: number, depositorName?: string, notes?: string) => void;

  // Remainder Distribution Engine
  distributeRemainder: (totalAmount: number, members: { id: string; name: string }[]) => RemainderDistributionResult;
  remainderAbsorbCounts: Record<string, number>;

  // Dynamic Settlement Engine
  settlementOrders: SettlementOrder[];
  memberBalances: MemberBalance[];
  simplifiedDebts: SimplifiedDebt[];
  calculateSettlements: (customExpenses?: ExpenseItem[]) => { memberBalances: MemberBalance[]; simplifiedDebts: SimplifiedDebt[] };
  
  // Settlement Actions (Chain-Locking)
  createSettlement: (params: {
    title: string;
    expenseIds: string[];
    fromUserId: string;
    toUserId: string;
    amount: number;
    notes?: string;
    proofUrl?: string;
    status?: SettlementOrderStatus;
  }) => { success: boolean; error?: string; order?: SettlementOrder };
  approveSettlement: (orderId: string) => { success: boolean; error?: string };
  rejectSettlement: (orderId: string, reason?: string) => { success: boolean; error?: string };

  // Existing Settlement Items (for compatibility with existing UI tabs)
  settlementItems: SettlementItem[];
  handleSettleItem: (id: string) => void;

  // Groups
  groups: Group[];

  // Operation Logs
  auditLogs: AuditLog[];
  addLog: (entry: { action: string; detail: string; relatedId?: string }) => void;

  // Notifications & Badges
  notifications: AppNotification[];
  userNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'time'> & { time?: string }) => void;

  // Computed & Derived Metrics
  totalExpenses: number;
  myTotalPaid: number;
  myTotalShouldPay: number;
  netBalance: number; // 正數代表應收，負數代表應付
  unsettledCount: number;

  // Utilities
  resetToDefaultData: () => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export function LedgerProvider({ children }: { children: ReactNode }) {
  // 自動清除舊快取機制：若版本不是 CURRENT_DATA_VERSION，即刻重置
  if (typeof window !== 'undefined') {
    try {
      const savedVer = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (savedVer !== CURRENT_DATA_VERSION) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nagomi_ledger_')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_DATA_VERSION);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      }
    } catch {
      // ignore
    }
  }

  // Navigation state - 預設起始頁面設定為「首頁 (Dashboard)」
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [selectedExpenseGroupFilter, setSelectedExpenseGroupFilter] = useState<string>('all');

  const openEditExpenseModal = useCallback((expense: ExpenseItem) => {
    setEditingExpense(expense);
    setIsQuickRecordOpen(true);
  }, []);

  // Persona state with localStorage persistence
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const matched = TEST_USERS.find(u => u.id === parsed.id);
        if (matched) return matched;
      }
    } catch {
      // ignore
    }
    return TEST_USERS[0];
  });

  // Reserve Fund Balance State
  const [groupFundBalance, setGroupFundBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FUND_BALANCE);
      if (saved !== null) {
        const num = parseFloat(saved);
        if (!isNaN(num)) return num;
      }
    } catch {
      // ignore
    }
    return DEFAULT_GROUP_FUND_BALANCE;
  });

  // Enable reserve fund toggle state
  const [enableReserveFund, setEnableReserveFund] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENABLE_RESERVE_FUND);
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore
    }
    return true;
  });

  // Remainder Absorbing History Tracking (memberId -> absorb count)
  const [remainderAbsorbCounts, setRemainderAbsorbCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMAINDER_COUNTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      user_me: 0,
      user_lin: 0,
      user_ming: 0
    };
  });

  // Expenses state with localStorage persistence & version check
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (version === CURRENT_DATA_VERSION) {
        const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_EXPENSES;
  });

  // Settlement Orders state (Chain-Locking Engine)
  const [settlementOrders, setSettlementOrders] = useState<SettlementOrder[]>(() => {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (version === CURRENT_DATA_VERSION) {
        const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTLEMENT_ORDERS;
  });

  // Audit Logs (時間軸日誌)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'log_05',
        timestamp: '2024/05/24 16:20:00',
        action: '公積金支出扣款',
        detail: '公積金扣款 $150「珍珠奶茶」，全體 3 人平分享用',
        operatorId: 'user_me',
        operatorName: '我 (Alice)',
        operatorAvatarText: '我',
        relatedId: 'exp_05'
      },
      {
        id: 'log_04',
        timestamp: '2024/05/23 15:00:00',
        action: '新增支出',
        detail: 'Alice代墊「買衛生紙」$200，分攤成員 (Alice、阿明)',
        operatorId: 'user_me',
        operatorName: '我 (Alice)',
        operatorAvatarText: '我',
        relatedId: 'exp_04'
      },
      {
        id: 'log_03',
        timestamp: '2024/05/22 10:15:00',
        action: '新增支出',
        detail: '小林代墊「電費代墊」$900，分攤成員 (Alice、阿明)',
        operatorId: 'user_lin',
        operatorName: '小林 (Bob)',
        operatorAvatarText: '林',
        relatedId: 'exp_03'
      },
      {
        id: 'log_02',
        timestamp: '2024/05/21 19:40:00',
        action: '新增支出',
        detail: '小林代墊「週末義式大餐」$1,200，2人平分 (Alice、小林)',
        operatorId: 'user_lin',
        operatorName: '小林 (Bob)',
        operatorAvatarText: '林',
        relatedId: 'exp_02'
      },
      {
        id: 'log_01',
        timestamp: '2024/05/20 22:30:00',
        action: '新增支出',
        detail: '小林代墊「鹹酥雞宵夜」$300，3人平分 (Alice、小林、阿明)',
        operatorId: 'user_lin',
        operatorName: '小林 (Bob)',
        operatorAvatarText: '林',
        relatedId: 'exp_01'
      }
    ];
  });

  // Existing Settlement items (for compatibility)
  const [settlementItems, setSettlementItems] = useState<SettlementItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTLEMENTS;
  });

  // Notifications state (Dynamic multi-persona notifications)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to persist expenses', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Failed to persist currentUser', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FUND_BALANCE, groupFundBalance.toString());
    } catch (e) {
      console.warn('Failed to persist fund balance', e);
    }
  }, [groupFundBalance]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENABLE_RESERVE_FUND, enableReserveFund.toString());
    } catch (e) {
      console.warn('Failed to persist enable reserve fund', e);
    }
  }, [enableReserveFund]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMAINDER_COUNTS, JSON.stringify(remainderAbsorbCounts));
    } catch (e) {
      console.warn('Failed to persist remainder counts', e);
    }
  }, [remainderAbsorbCounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(settlementOrders));
    } catch (e) {
      console.warn('Failed to persist orders', e);
    }
  }, [settlementOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Failed to persist audit logs', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlementItems));
    } catch (e) {
      console.warn('Failed to persist settlements', e);
    }
  }, [settlementItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to persist notifications', e);
    }
  }, [notifications]);

  // Filter notifications for current user (either targeted directly or broadcast to 'all')
  const userNotifications = useMemo(() => {
    return notifications.filter(n => !n.recipientId || n.recipientId === 'all' || n.recipientId === currentUser.id);
  }, [notifications, currentUser.id]);

  const unreadNotificationsCount = useMemo(() => {
    return userNotifications.filter(n => n.unread).length;
  }, [userNotifications]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => {
      if (!n.recipientId || n.recipientId === 'all' || n.recipientId === currentUser.id) {
        return { ...n, unread: false };
      }
      return n;
    }));
  }, [currentUser.id]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'time'> & { time?: string }) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: notif.time || '剛剛',
      createdAt: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Format Helper for timestamps
  const getFormattedNow = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
  };

  // Section 3: 操作日誌寫入 (addLog)
  const addLog = useCallback((entry: { action: string; detail: string; relatedId?: string }) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getFormattedNow(),
      action: entry.action,
      detail: entry.detail,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorAvatarText: currentUser.avatarText,
      relatedId: entry.relatedId
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Reserve Fund Deposit Action (存入公積金)
  const depositGroupFund = useCallback((amount: number, depositorName?: string, notes?: string) => {
    if (amount <= 0) return;
    setGroupFundBalance(prev => {
      const next = prev + amount;
      const actor = depositorName || currentUser.name.split(' ')[0];
      addLog({
        action: '存入公積金',
        detail: `${actor} 存入公積金 NT$${amount.toLocaleString()}${notes ? `（備註: ${notes}）` : ''}，公積金目前餘額 NT$${next.toLocaleString()}`
      });

      const now = new Date();
      const timeStr = `${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      addNotification({
        title: '公積金儲值成功',
        message: `${actor} 已為群組存入公積金 NT$${amount.toLocaleString()}！目前公積金餘額為 NT$${next.toLocaleString()}`,
        time: timeStr,
        timestamp: Date.now(),
        unread: true,
        type: 'fund',
        actionLink: 'reports'
      });
      return next;
    });
  }, [currentUser, addLog, addNotification]);

  // Section 1: 餘數分配處理 (Remainder Distribution Engine)
  // 除不盡金額時，依「歷史吸收次數最少者」優先分配，次數相同則依 Member_ID 較小者優先
  const distributeRemainder = useCallback((
    totalAmount: number, 
    members: { id: string; name: string }[]
  ): RemainderDistributionResult => {
    const count = members.length;
    if (count === 0) {
      return { shares: [], absorbedMemberIds: [] };
    }

    const baseAmount = Math.floor(totalAmount / count);
    const remainder = Math.round(totalAmount - (baseAmount * count));

    if (remainder <= 0) {
      return {
        shares: members.map(m => ({ memberId: m.id, memberName: m.name, amount: baseAmount })),
        absorbedMemberIds: []
      };
    }

    // Sort candidate members to absorb remainder:
    // 1. Minimum historical absorb count first
    // 2. Lexicographically smaller memberId first
    const sortedMembers = [...members].sort((a, b) => {
      const countA = remainderAbsorbCounts[a.id] || 0;
      const countB = remainderAbsorbCounts[b.id] || 0;
      if (countA !== countB) {
        return countA - countB;
      }
      return a.id.localeCompare(b.id);
    });

    const luckyMembers = sortedMembers.slice(0, remainder);
    const luckySet = new Set(luckyMembers.map(m => m.id));

    // Update historical absorb counts
    setRemainderAbsorbCounts(prev => {
      const next = { ...prev };
      luckyMembers.forEach(m => {
        next[m.id] = (next[m.id] || 0) + 1;
      });
      return next;
    });

    const shares = members.map(m => ({
      memberId: m.id,
      memberName: m.name,
      amount: luckySet.has(m.id) ? baseAmount + 1 : baseAmount
    }));

    return {
      shares,
      absorbedMemberIds: luckyMembers.map(m => m.id)
    };
  }, [remainderAbsorbCounts]);

  // Section 1: 新增支出 (含公積金轉代墊邏輯)
  const handleAddExpense = useCallback((newExpense: Omit<ExpenseItem, 'id' | 'logs'>) => {
    const isFundSelected = 
      newExpense.paymentMethod === 'OFFICIAL_FUND' || 
      newExpense.payer.includes('公積金');

    let finalPaymentMethod: PaymentMethod = isFundSelected ? 'OFFICIAL_FUND' : 'PERSONAL_ADVANCE';
    let finalPayer = newExpense.payer;
    let finalStatus: ExpenseStatus = 'UNPAID';
    let finalIsLocked = Boolean(newExpense.isLocked);
    let convertedToAdvance = false;
    let noticeMessage = '';

    // 公積金轉代墊邏輯: 若選公積金支付，但 groupFundBalance < amount，全額自動轉為 PERSONAL_ADVANCE
    if (isFundSelected) {
      if (groupFundBalance < newExpense.amount) {
        convertedToAdvance = true;
        finalPaymentMethod = 'PERSONAL_ADVANCE';
        finalStatus = 'UNPAID';
        finalIsLocked = false;
        finalPayer = `${currentUser.name.split(' ')[0]}代墊`;
        noticeMessage = `公積金餘額不足 (剩餘 $${groupFundBalance}，需 $${newExpense.amount})，已全額自動轉為「${currentUser.name.split(' ')[0]}」個人代墊！`;

        addLog({
          action: '公積金自動轉代墊',
          detail: noticeMessage
        });
      } else {
        // 公積金充足: 公積金扣款隔離，直接扣除餘額，status 設為 SETTLED，絕不列入個人算平引擎
        setGroupFundBalance(prev => prev - newExpense.amount);
        finalPaymentMethod = 'OFFICIAL_FUND';
        finalStatus = 'SETTLED';
        finalIsLocked = false;
        noticeMessage = `公積金成功扣款 $${newExpense.amount}，公積金剩餘 $${groupFundBalance - newExpense.amount}`;

        addLog({
          action: '公積金支付扣款',
          detail: noticeMessage
        });
      }
    }

    const id = Date.now().toString();
    const formattedNow = getFormattedNow().slice(0, 16);

    const expenseItem: ExpenseItem = {
      ...newExpense,
      id,
      payer: finalPayer,
      paymentMethod: finalPaymentMethod,
      status: finalStatus,
      isLocked: finalIsLocked,
      logs: [
        { 
          date: formattedNow, 
          text: `新增開支紀錄 $${newExpense.amount}${convertedToAdvance ? ' (餘額不足轉個人代墊)' : ''}`, 
          author: currentUser.name.split(' ')[0] 
        }
      ]
    };

    setExpenses(prev => [expenseItem, ...prev]);

    if (!isFundSelected || convertedToAdvance) {
      addLog({
        action: '新增個人代墊支出',
        detail: `登記「${newExpense.name}」$${newExpense.amount} (${finalPayer})`,
        relatedId: id
      });
    }

    return { success: true, convertedToAdvance, message: noticeMessage };
  }, [currentUser, groupFundBalance, addLog]);

  // Section 2: 鎖定保護阻斷 - 刪除防呆
  const handleDeleteExpense = useCallback((id: string) => {
    const target = expenses.find(e => e.id === id);
    if (!target) {
      return { success: false, error: '找不到指定的支出項目' };
    }

    const isFund = target.paymentMethod === 'OFFICIAL_FUND' || target.payer.includes('公積金');

    // 鎖定保護阻斷: isLocked === true 阻斷刪除 (公積金支付項目不鎖定)
    if (target.isLocked && !isFund) {
      const errorMsg = `支出「${target.name}」已進入結算流程或已鎖定，嚴禁刪除！`;
      addLog({
        action: '刪除操作遭阻斷',
        detail: `嘗試刪除已鎖定項目「${target.name}」(ID: #${id}) 失敗`,
        relatedId: id
      });
      return { success: false, error: errorMsg };
    }

    // 若刪除公積金支出，將金額回補至公積金餘額
    if (isFund) {
      setGroupFundBalance(prev => prev + target.amount);
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    addLog({
      action: '刪除支出項目',
      detail: `已刪除支出「${target.name}」$${target.amount}${isFund ? ' (已回補公積金餘額)' : ''}`,
      relatedId: id
    });
    return { success: true };
  }, [expenses, addLog]);

  // Section 2: 鎖定保護阻斷 - 更新防呆
  const handleUpdateExpense = useCallback((id: string, updated: Partial<ExpenseItem>) => {
    const target = expenses.find(e => e.id === id);
    if (!target) {
      return { success: false, error: '找不到指定的支出項目' };
    }

    const isFund = target.paymentMethod === 'OFFICIAL_FUND' || target.payer.includes('公積金');

    // 鎖定保護阻斷: isLocked === true 阻斷修改 (公積金支付項目不鎖定)
    if (target.isLocked && !isFund) {
      const errorMsg = `支出「${target.name}」已進入結算流程或已鎖定，嚴禁修改！`;
      addLog({
        action: '修改操作遭阻斷',
        detail: `嘗試修改已鎖定項目「${target.name}」(ID: #${id}) 失敗`,
        relatedId: id
      });
      return { success: false, error: errorMsg };
    }

    const formattedNow = getFormattedNow().slice(0, 16);

    // 動態比較並記錄「具體變更欄位」
    const changes: string[] = [];
    if (updated.amount !== undefined && updated.amount !== target.amount) {
      changes.push(`金額由 $${target.amount} 變更為 $${updated.amount}`);
    }
    if (updated.name !== undefined && updated.name !== target.name) {
      changes.push(`名稱由『${target.name}』變更為『${updated.name}』`);
    }
    if (updated.notes !== undefined && updated.notes !== target.notes) {
      changes.push(target.notes ? `備註由『${target.notes}』變更為『${updated.notes}』` : `新增備註「${updated.notes}」`);
    }
    if (updated.category !== undefined && updated.category !== target.category) {
      changes.push(`類別由『${target.category}』變更為『${updated.category}』`);
    }

    let changeLogText = '';
    if (changes.length === 0) {
      changeLogText = '更新開支明細內容';
    } else if (changes.length === 1) {
      changeLogText = changes[0];
    } else {
      // 若多個欄位變更：「更新金額 ($200) 與備註內容」等格式
      const summaryParts: string[] = [];
      if (updated.amount !== undefined && updated.amount !== target.amount) {
        summaryParts.push(`金額 ($${updated.amount})`);
      }
      if (updated.name !== undefined && updated.name !== target.name) {
        summaryParts.push(`名稱`);
      }
      if (updated.notes !== undefined && updated.notes !== target.notes) {
        summaryParts.push(`備註內容`);
      }
      if (updated.category !== undefined && updated.category !== target.category) {
        summaryParts.push(`類別`);
      }
      if (summaryParts.length > 0) {
        changeLogText = `更新${summaryParts.join(' 與 ')}`;
      } else {
        changeLogText = changes.join('；');
      }
    }

    // 公積金餘額即時同步調整：
    // 檢查舊支出與新支出是否涉及公積金支付
    const wasFund = target.paymentMethod === 'OFFICIAL_FUND' || target.payer.includes('公積金');
    const willBeFund = updated.paymentMethod !== undefined 
      ? (updated.paymentMethod === 'OFFICIAL_FUND' || (updated.payer && updated.payer.includes('公積金')))
      : (updated.payer !== undefined ? updated.payer.includes('公積金') : wasFund);
    const newAmount = updated.amount !== undefined ? updated.amount : target.amount;

    if (wasFund && !willBeFund) {
      // 舊為公積金，改為非公積金：釋放並全額回補原本扣除的公積金
      setGroupFundBalance(prev => prev + target.amount);
    } else if (!wasFund && willBeFund) {
      // 舊為非公積金，改為公積金：扣除新金額
      setGroupFundBalance(prev => prev - newAmount);
    } else if (wasFund && willBeFund) {
      // 兩者皆為公積金：依差額多退少補 (+target.amount - newAmount)
      const diff = target.amount - newAmount;
      if (diff !== 0) {
        setGroupFundBalance(prev => prev + diff);
      }
    }

    setExpenses(prev => prev.map(item => {
      if (item.id !== id) return item;
      // 確保除非原本即為鎖定或已結算完成，否則編輯後保持 isLocked 為 false
      const willBeLocked = (item.isLocked === true || item.status === 'SETTLED') && updated.isLocked !== false;
      return {
        ...item,
        ...updated,
        isLocked: updated.isLocked !== undefined ? updated.isLocked : willBeLocked,
        logs: [
          { date: formattedNow, text: changeLogText, author: currentUser.name.split(' ')[0] },
          ...item.logs
        ]
      };
    }));

    addLog({
      action: '更新支出項目',
      detail: `更新項目「${target.name}」金額或內容`,
      relatedId: id
    });

    return { success: true };
  }, [expenses, currentUser, addLog]);

  // Section 1: 動態算平演算法 (calculateSettlements)
  // 1. 嚴格遵循 PRD「不進行強制雙向金額抵銷 (No Mandatory Netting Off)」原則
  // 2. 僅計算 paymentMethod === 'PERSONAL_ADVANCE' 且 status === 'UNPAID' 且 !isLocked
  // 3. 公積金扣款 OFFICIAL_FUND 100% 隔離，絕不列入算平
  // 4. 應收與應付總額依據原始未結算帳單獨立累加，不將（我欠 A）與（A 欠我）相減抵銷
  const calculateSettlements = useCallback((customExpenses?: ExpenseItem[]): {
    memberBalances: MemberBalance[];
    simplifiedDebts: SimplifiedDebt[];
  } => {
    const targetExpenses = customExpenses || expenses;

    // Filter valid unpaid personal advance items
    const validExpenses = targetExpenses.filter(e => {
      const isAdvance = e.paymentMethod === 'PERSONAL_ADVANCE' || (!e.paymentMethod && !e.payer.includes('公積金'));
      const isUnpaid = e.status === 'UNPAID' || e.status === 'REJECTED' || (!e.status && !e.isLocked);
      return isAdvance && isUnpaid && !e.isLocked;
    });

    // 1. 初始化成員統計資料 (應收與應付完全獨立統計，不強制雙向抵銷)
    const userStats: Record<string, {
      paid: number;          // 個人代墊總金額
      shouldPay: number;     // 個人應分攤總額 (個人總支出)
      receivable: number;    // 總應收金額 (他人欠我的代墊款，獨立累加)
      payable: number;       // 總應付金額 (我欠他人的代墊款，獨立累加)
    }> = {};

    TEST_USERS.forEach(u => {
      userStats[u.id] = { paid: 0, shouldPay: 0, receivable: 0, payable: 0 };
    });

    // 2. 紀錄單向債務關係：從分攤債務人 (fromUserId) 到代墊債權人 (toUserId)
    // 嚴格遵守獨立原則：A 欠 B 與 B 欠 A 各自成立，不進行淨額抵扣
    const debtMap: Record<string, {
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      toUserName: string;
      amount: number;
      relatedExpenseIds: string[];
    }> = {};

    validExpenses.forEach(exp => {
      const payerUserId = mapNameToUserId(exp.payer);
      if (!userStats[payerUserId]) {
        userStats[payerUserId] = { paid: 0, shouldPay: 0, receivable: 0, payable: 0 };
      }
      userStats[payerUserId].paid += exp.amount;

      if (exp.splitMembers && exp.splitMembers.length > 0) {
        exp.splitMembers.forEach(split => {
          const splitUserId = split.memberId || mapNameToUserId(split.name);
          if (!userStats[splitUserId]) {
            userStats[splitUserId] = { paid: 0, shouldPay: 0, receivable: 0, payable: 0 };
          }
          // 個人總支出 (應分攤金額)
          userStats[splitUserId].shouldPay += split.amount;

          // 若非代墊人本人分攤，則產生對代墊人的應付款項 (不強制抵銷)
          if (splitUserId !== payerUserId && split.amount > 0) {
            userStats[payerUserId].receivable += split.amount;
            userStats[splitUserId].payable += split.amount;

            // 建立定向債務 (debtor -> creditor)
            const debtKey = `${splitUserId}->${payerUserId}`;
            if (!debtMap[debtKey]) {
              const debtorUser = TEST_USERS.find(u => u.id === splitUserId);
              const creditorUser = TEST_USERS.find(u => u.id === payerUserId);
              debtMap[debtKey] = {
                fromUserId: splitUserId,
                fromUserName: debtorUser ? debtorUser.name.split(' ')[0] : split.name,
                toUserId: payerUserId,
                toUserName: creditorUser ? creditorUser.name.split(' ')[0] : exp.payer.replace('代墊', ''),
                amount: 0,
                relatedExpenseIds: []
              };
            }
            debtMap[debtKey].amount += split.amount;
            if (!debtMap[debtKey].relatedExpenseIds.includes(exp.id)) {
              debtMap[debtKey].relatedExpenseIds.push(exp.id);
            }
          }
        });
      } else {
        // 個人獨資
        userStats[payerUserId].shouldPay += exp.amount;
      }
    });

    // 建立 MemberBalance 清單
    const memberBalances: MemberBalance[] = TEST_USERS.map(u => {
      const data = userStats[u.id] || { paid: 0, shouldPay: 0, receivable: 0, payable: 0 };
      return {
        userId: u.id,
        userName: u.name,
        paidAmount: Math.round(data.paid),
        shouldPayAmount: Math.round(data.shouldPay), // 個人總支出
        netBalance: Math.round(data.receivable - data.payable), // 參考差額
        totalReceivable: Math.round(data.receivable), // 總應收金額 (獨立累加)
        totalPayable: Math.round(data.payable)        // 總應付金額 (獨立累加)
      };
    });

    // 輸出未經雙向強制抵銷之單向債務往來
    const simplifiedDebts: SimplifiedDebt[] = Object.values(debtMap).map(d => ({
      fromUserId: d.fromUserId,
      fromUserName: d.fromUserName,
      toUserId: d.toUserId,
      toUserName: d.toUserName,
      amount: Math.round(d.amount),
      relatedExpenseIds: d.relatedExpenseIds
    }));

    return { memberBalances, simplifiedDebts };
  }, [expenses]);

  // Derived calculations for current state
  const { memberBalances, simplifiedDebts } = useMemo(() => {
    return calculateSettlements(expenses);
  }, [calculateSettlements, expenses]);

  // Section 2: 連鎖鎖定引擎 - 發起還款單 (createSettlement)
  // 當勾選支出發起還款單 (PENDING/SETTLED) 時，自動將這些原始支出的 isLocked 設為 true，並改寫狀態
  const createSettlement = useCallback((params: {
    title: string;
    expenseIds: string[];
    fromUserId: string;
    toUserId: string;
    amount: number;
    notes?: string;
    proofUrl?: string;
    status?: SettlementOrderStatus;
  }) => {
    const { title, expenseIds, fromUserId, toUserId, amount, notes, proofUrl, status = 'PENDING' } = params;

    // Check if any of the target expenses is already locked
    const lockedItems = expenses.filter(e => expenseIds.includes(e.id) && e.isLocked);
    if (lockedItems.length > 0) {
      return { 
        success: false, 
        error: `選取的項目中包含已鎖定項目 (${lockedItems.map(i => i.name).join(', ')})，無法重複發起還款單！` 
      };
    }

    const orderId = `ord_${Date.now().toString().slice(-6)}`;
    const resolvedFromId = mapNameToUserId(fromUserId);
    const resolvedToId = mapNameToUserId(toUserId);
    const fromUser = TEST_USERS.find(u => u.id === resolvedFromId) || currentUser;
    const toUser = TEST_USERS.find(u => u.id === resolvedToId) || TEST_USERS[1];
    const timestamp = getFormattedNow();

    const newOrder: SettlementOrder = {
      id: orderId,
      title,
      fromUserId: fromUser.id,
      fromUserName: fromUser.name,
      toUserId: toUser.id,
      toUserName: toUser.name,
      amount,
      status,
      relatedExpenseIds: expenseIds,
      createdAt: timestamp,
      notes,
      proofUrl
    };

    // 1. 連鎖鎖定原始支出
    const formattedNowDate = timestamp.slice(0, 16);
    setExpenses(prev => prev.map(item => {
      if (expenseIds.includes(item.id)) {
        return {
          ...item,
          isLocked: true,
          status: status === 'SETTLED' ? 'SETTLED' : 'PENDING',
          relatedSettlementId: orderId,
          rejectReason: undefined,
          logs: [
            ...item.logs,
            { 
              date: formattedNowDate, 
              text: `已納入還款單「${title}」(單號: #${orderId})，項目鎖定`, 
              author: currentUser.name.split(' ')[0] 
            }
          ]
        };
      }
      return item;
    }));

    // 2. 儲存還款單
    setSettlementOrders(prev => [newOrder, ...prev]);

    // 3. 記錄稽核日誌
    addLog({
      action: status === 'SETTLED' ? '發起並直接結清還款單' : '發起還款申請單',
      detail: `建立還款單「${title}」(單號: #${orderId})，金額 $${amount}，由 ${fromUser.name} 付款給 ${toUser.name}，鎖定 ${expenseIds.length} 筆支出`,
      relatedId: orderId
    });

    // 4. 自動建立給收款人 (toUser) 的未讀通知
    const newNotification: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientId: toUser.id,
      title: `${fromUser.name.split(' ')[0]}已發起還款申請`,
      desc: `「${title}」NT$${amount.toLocaleString()} 等待確認審核`,
      time: '剛剛',
      unread: true,
      sender: fromUser.shortName || fromUser.name.slice(0, 1),
      targetTab: 'settlement',
      relatedOrderId: orderId,
      createdAt: Date.now()
    };
    setNotifications(prev => [newNotification, ...prev]);

    return { success: true, order: newOrder };
  }, [expenses, currentUser, addLog]);

  // Section 2: 連鎖鎖定引擎 - 退回解鎖 (rejectSettlement)
  // 當還款單被審核退回 (REJECTED) 時，自動將對應支出的 isLocked 恢復為 false，狀態回復為 UNPAID
  const rejectSettlement = useCallback((orderId: string, reason?: string) => {
    const order = settlementOrders.find(o => o.id === orderId);
    if (!order) {
      return { success: false, error: '找不到指定的還款單' };
    }

    // 1. 更新還款單狀態為 REJECTED
    setSettlementOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: 'REJECTED', 
          rejectReason: reason,
          notes: reason ? `${o.notes || ''} [退回原因: ${reason}]` : o.notes 
        };
      }
      return o;
    }));

    // 2. 連鎖解鎖對應原始支出
    const formattedNowDate = getFormattedNow().slice(0, 16);
    let unlockedCount = 0;

    setExpenses(prev => prev.map(item => {
      if (item.relatedSettlementId === orderId || order.relatedExpenseIds.includes(item.id)) {
        unlockedCount++;
        return {
          ...item,
          isLocked: false,
          status: 'REJECTED',
          rejectReason: reason,
          relatedSettlementId: undefined,
          logs: [
            ...item.logs,
            { 
              date: formattedNowDate, 
              text: `還款單 #${orderId} 遭審核退回${reason ? `（${reason}）` : ''}，項目已解除鎖定回復未結清`, 
              author: currentUser.name.split(' ')[0] 
            }
          ]
        };
      }
      return item;
    }));

    // 3. 記錄稽核日誌
    addLog({
      action: '退回還款單並解鎖',
      detail: `退回還款單「${order.title}」(單號: #${orderId})，原因: ${reason || '無'}，已連鎖解鎖 ${unlockedCount} 筆支出`,
      relatedId: orderId
    });

    // 4. 自動建立給付款人的退回通知
    const rejectNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientId: order.fromUserId,
      title: `${currentUser.name.split(' ')[0]}已退回還款單`,
      desc: reason ? `退回原因：${reason}` : `「${order.title}」已退回並自動解除支出鎖定`,
      time: '剛剛',
      unread: true,
      sender: currentUser.shortName || currentUser.name.slice(0, 1),
      targetTab: 'settlement',
      relatedOrderId: order.id,
      createdAt: Date.now()
    };
    setNotifications(prev => [rejectNotif, ...prev]);

    return { success: true };
  }, [settlementOrders, currentUser, addLog]);

  // Section 2: 連鎖鎖定引擎 - 核准結清 (approveSettlement)
  const approveSettlement = useCallback((orderId: string) => {
    const order = settlementOrders.find(o => o.id === orderId);
    if (!order) {
      return { success: false, error: '找不到指定的還款單' };
    }

    // 1. 更新還款單狀態為 SETTLED
    setSettlementOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'SETTLED' };
      }
      return o;
    }));

    // 2. 更新對應支出狀態為 SETTLED 並保持鎖定
    const formattedNowDate = getFormattedNow().slice(0, 16);
    setExpenses(prev => prev.map(item => {
      if (item.relatedSettlementId === orderId || order.relatedExpenseIds.includes(item.id)) {
        return {
          ...item,
          isLocked: true,
          status: 'SETTLED',
          logs: [
            ...item.logs,
            { 
              date: formattedNowDate, 
              text: `還款單 #${orderId} 經核准結清完畢`, 
              author: currentUser.name.split(' ')[0] 
            }
          ]
        };
      }
      return item;
    }));

    // 3. 記錄稽核日誌
    addLog({
      action: '核准還款結清',
      detail: `核准還款單「${order.title}」(單號: #${orderId})，金額 $${order.amount} 已全額結清完畢`,
      relatedId: orderId
    });

    // 4. 自動建立給付款人的結清核准通知
    const approveNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientId: order.fromUserId,
      title: `${currentUser.name.split(' ')[0]}已核准還款單`,
      desc: `「${order.title}」NT$${order.amount.toLocaleString()} 已順利平帳結清`,
      time: '剛剛',
      unread: true,
      sender: currentUser.shortName || currentUser.name.slice(0, 1),
      targetTab: 'settlement',
      relatedOrderId: order.id,
      createdAt: Date.now()
    };
    setNotifications(prev => [approveNotif, ...prev]);

    return { success: true };
  }, [settlementOrders, currentUser, addLog]);

  // Compatibility: Settle Item for existing UI
  const handleSettleItem = (id: string) => {
    setSettlementItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'unsettled' ? 'pending' : 'unsettled' };
      }
      return item;
    }));
  };

  // Actions: Persona Switch (支援 member_1/2/3 及 user_me/lin/ming)
  const switchUserById = (userId: string) => {
    const mappedId = userId === 'member_1' ? 'user_me' : userId === 'member_2' ? 'user_lin' : userId === 'member_3' ? 'user_ming' : userId;
    const target = TEST_USERS.find(u => u.id === mappedId);
    if (target) {
      setCurrentUser(target);
      addLog({
        action: '切換使用者身分',
        detail: `切換為「${target.name}」視角`
      });
    }
  };

  // Actions: Reset All (重設為 3 筆最基礎的原始支出)
  const resetToDefaultData = useCallback(() => {
    setExpenses(INITIAL_EXPENSES);
    setCurrentUser(TEST_USERS[0]);
    setGroups(INITIAL_GROUPS);
    setGroupFundBalance(DEFAULT_GROUP_FUND_BALANCE);
    setEnableReserveFund(true);
    setRemainderAbsorbCounts({ user_me: 0, user_lin: 0, user_ming: 0 });
    setSettlementOrders([]);
    setSettlementItems([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    try {
      if (typeof window !== 'undefined') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nagomi_ledger_')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_DATA_VERSION);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      }
    } catch {
      // ignore
    }
    addLog({
      action: '重設系統資料',
      detail: '已重置為 5 筆 UAT 測試支出 (Bob代墊3筆 / Alice代墊1筆 / 公積金1筆)'
    });
  }, [addLog]);

  // Computed & Derived Metrics based on current user
  const { totalExpenses, myTotalPaid, myTotalShouldPay, netBalance } = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const myBalance = memberBalances.find(m => m.userId === currentUser.id);
    if (myBalance) {
      return {
        totalExpenses: total,
        myTotalPaid: myBalance.paidAmount,
        myTotalShouldPay: myBalance.shouldPayAmount,
        netBalance: myBalance.netBalance
      };
    }

    return {
      totalExpenses: total,
      myTotalPaid: 0,
      myTotalShouldPay: 0,
      netBalance: 0
    };
  }, [expenses, memberBalances, currentUser]);

  const unsettledCount = useMemo(() => {
    return simplifiedDebts.length;
  }, [simplifiedDebts]);

  const value = useMemo<LedgerContextType>(() => ({
    activeTab,
    setActiveTab,
    isQuickRecordOpen,
    setIsQuickRecordOpen,
    editingExpense,
    setEditingExpense,
    openEditExpenseModal,
    selectedExpenseGroupFilter,
    setSelectedExpenseGroupFilter,
    currentUser,
    setCurrentUser,
    switchUserById,
    expenses,
    handleAddExpense,
    handleDeleteExpense,
    handleUpdateExpense,
    enableReserveFund,
    setEnableReserveFund,
    groupFundBalance,
    setGroupFundBalance,
    depositGroupFund,
    distributeRemainder,
    remainderAbsorbCounts,
    settlementOrders,
    memberBalances,
    simplifiedDebts,
    calculateSettlements,
    createSettlement,
    approveSettlement,
    rejectSettlement,
    settlementItems,
    handleSettleItem,
    groups,
    auditLogs,
    addLog,
    notifications,
    userNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    totalExpenses,
    myTotalPaid,
    myTotalShouldPay,
    netBalance,
    unsettledCount,
    resetToDefaultData
  }), [
    activeTab,
    isQuickRecordOpen,
    editingExpense,
    openEditExpenseModal,
    selectedExpenseGroupFilter,
    currentUser,
    expenses,
    handleAddExpense,
    handleDeleteExpense,
    handleUpdateExpense,
    enableReserveFund,
    groupFundBalance,
    depositGroupFund,
    distributeRemainder,
    remainderAbsorbCounts,
    settlementOrders,
    memberBalances,
    simplifiedDebts,
    calculateSettlements,
    createSettlement,
    approveSettlement,
    rejectSettlement,
    settlementItems,
    groups,
    auditLogs,
    addLog,
    notifications,
    userNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    totalExpenses,
    myTotalPaid,
    myTotalShouldPay,
    netBalance,
    unsettledCount
  ]);

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextType {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}
