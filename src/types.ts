export type ActiveTab = 'home' | 'details' | 'settlement' | 'reports' | 'settings';

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  balance: number;
  icon: string;
  hasReserveFund?: boolean;
}

export interface Member {
  name: string;
  role: 'Owner' | 'Member';
  joinDate: string;
  avatarText: string;
  avatarColor?: string;
}

export interface AppUser {
  id: string;
  name: string;
  shortName: string;
  role: 'Owner' | 'Member';
  avatarText: string;
  avatarBg: string;
  description: string;
}

export const TEST_USERS: AppUser[] = [
  {
    id: 'user_me',
    name: '我 (Alice)',
    shortName: '我',
    role: 'Owner',
    avatarText: '我',
    avatarBg: 'bg-[#74818E]',
    description: '群組建立者 · 主要代墊人'
  },
  {
    id: 'user_lin',
    name: '小林 (Bob)',
    shortName: '林',
    role: 'Member',
    avatarText: '林',
    avatarBg: 'bg-[#8B9BA6]',
    description: '債權人 · 聚餐代墊待收款'
  },
  {
    id: 'user_ming',
    name: '阿明 (Charlie)',
    shortName: '明',
    role: 'Member',
    avatarText: '明',
    avatarBg: 'bg-[#C3D3DE]',
    description: '分攤成員 · 室友合租分擔者'
  }
];

export type PaymentMethod = 'PERSONAL_ADVANCE' | 'OFFICIAL_FUND';
export type ExpenseStatus = 'UNPAID' | 'PENDING' | 'SETTLED' | 'REJECTED';

export interface ExpenseItem {
  id: string;
  name: string;
  date: string;
  groupName: string;
  payer: string;
  amount: number;
  category: string;
  notes?: string;
  splitMembers: { name: string; amount: number; memberId?: string; settled?: boolean }[];
  logs: { date: string; text: string; author: string }[];
  isLocked: boolean;
  paymentMethod?: PaymentMethod;
  status?: ExpenseStatus;
  relatedSettlementId?: string;
  rejectReason?: string;
}

export interface SettlementItem {
  id: string;
  date: string;
  name: string;
  person: string;
  amount: number;
  type: 'receivable' | 'payable'; // receivable = 應收, payable = 應付
  status: 'unsettled' | 'pending' | 'rejected'; // unsettled = 未結清, pending = 待確認, rejected = 被退回
  rejectReason?: string;
}

export type SettlementOrderStatus = 'PENDING' | 'SETTLED' | 'REJECTED';

export interface SettlementOrder {
  id: string;
  title: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  status: SettlementOrderStatus;
  relatedExpenseIds: string[];
  createdAt: string;
  notes?: string;
  proofUrl?: string;
  rejectReason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  operatorId: string;
  operatorName: string;
  operatorAvatarText: string;
  relatedId?: string;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  paidAmount: number;      // 個人代墊總額
  shouldPayAmount: number; // 個人應分攤總額 (個人總支出)
  netBalance: number;      // 淨額 (保留相容性)
  totalReceivable: number; // 總應收金額 (他人欠款，不強制抵銷)
  totalPayable: number;    // 總應付金額 (個人欠款，不強制抵銷)
}

export interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  relatedExpenseIds: string[];
}

export interface AppNotification {
  id: string;
  recipientId: string; // Target user id (e.g., 'user_lin', 'user_me', 'user_ming') or 'all'
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  sender: string; // Avatar text or short name, e.g. '我', '林', '明', '統'
  targetTab: ActiveTab;
  relatedOrderId?: string;
  createdAt?: number;
}

