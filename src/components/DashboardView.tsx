import React, { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Users, 
  Utensils, 
  Car, 
  DollarSign, 
  Music,
  PiggyBank,
  Plus,
  Compass
} from 'lucide-react';
import { ActiveTab, ExpenseItem, AppUser } from '../types';
import { useLedger } from '../context/LedgerContext';
import DepositFundModal from './DepositFundModal';
import { getCategoryIcon } from './ExpensesView';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  expenses: ExpenseItem[];
  currentUser: AppUser;
}

// Helpers to match expense records and split members with the current active user
function isUserMember(memberName: string, user: AppUser): boolean {
  if (user.id === 'user_me') {
    return (
      memberName === '我' ||
      memberName === '自己' ||
      memberName === '個人獨資' ||
      memberName.includes('Alice')
    );
  }
  if (user.id === 'user_lin') {
    return memberName === '小林' || memberName.includes('Bob');
  }
  if (user.id === 'user_ming') {
    return memberName === '阿明' || memberName.includes('Charlie');
  }
  return false;
}

function isUserPayer(payerString: string, user: AppUser): boolean {
  if (user.id === 'user_me') {
    return (
      payerString.includes('自己') ||
      payerString.includes('我') ||
      payerString.includes('個人支出') ||
      payerString.includes('Alice')
    );
  }
  if (user.id === 'user_lin') {
    return payerString.includes('小林') || payerString.includes('Bob');
  }
  if (user.id === 'user_ming') {
    return payerString.includes('阿明') || payerString.includes('Charlie');
  }
  return false;
}

export default function DashboardView({ onNavigate, expenses, currentUser }: DashboardViewProps) {
  const { groupFundBalance, enableReserveFund, setSelectedExpenseGroupFilter } = useLedger();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositGroupName, setDepositGroupName] = useState('小室友們');

  // Handle clicking group card: navigate to details and filter by that group
  const handleGroupCardClick = (groupName: string) => {
    setSelectedExpenseGroupFilter(groupName);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('group', groupName);
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
    onNavigate('details');
  };

  // 1. 個人總支出: 依據當前登入者所分攤或獨資之所有支出項目累計
  const totalPersonalExpense = expenses.reduce((sum, item) => {
    if (item.splitMembers && item.splitMembers.length > 0) {
      const userSplit = item.splitMembers.find(m => isUserMember(m.name, currentUser));
      if (userSplit) {
        return sum + userSplit.amount;
      }
      return sum;
    }
    // 若無拆帳名單，且由當前使用者獨資代付，則全額認列
    if (isUserPayer(item.payer, currentUser)) {
      return sum + item.amount;
    }
    return sum;
  }, 0);

  // 2. 總應收金額: 當前登入者為代墊人，且尚未結算 (isLocked: false) 之他人應分攤總額
  const totalReceivable = expenses.reduce((sum, item) => {
    if (item.isLocked) return sum;
    if (isUserPayer(item.payer, currentUser) && item.payer !== '公積金支付') {
      if (item.splitMembers && item.splitMembers.length > 0) {
        const othersShare = item.splitMembers
          .filter(m => !isUserMember(m.name, currentUser))
          .reduce((s, m) => s + m.amount, 0);
        return sum + othersShare;
      }
    }
    return sum;
  }, 0);

  // 3. 總應付金額: 由他人代墊，尚未結算 (isLocked: false) 且當前登入者應分攤之款項
  const totalPayable = expenses.reduce((sum, item) => {
    if (item.isLocked) return sum;
    if (!isUserPayer(item.payer, currentUser) && item.payer !== '公積金支付') {
      if (item.splitMembers && item.splitMembers.length > 0) {
        const myShare = item.splitMembers.find(m => isUserMember(m.name, currentUser));
        if (myShare) {
          return sum + myShare.amount;
        }
      }
    }
    return sum;
  }, 0);

  // 計算「小室友們」群組之未抵銷待結算金額 (以 currentUser 視角，嚴格遵循無強制雙向抵銷原則)
  const roommatesReceivable = expenses
    .filter(i => !i.isLocked && (i.groupName === '小室友們' || !i.groupName) && isUserPayer(i.payer, currentUser) && i.payer !== '公積金支付')
    .reduce((sum, item) => {
      if (!item.splitMembers || item.splitMembers.length === 0) return sum;
      return sum + item.splitMembers
        .filter(m => !isUserMember(m.name, currentUser))
        .reduce((s, m) => s + m.amount, 0);
    }, 0);

  const roommatesPayable = expenses
    .filter(i => !i.isLocked && (i.groupName === '小室友們' || !i.groupName) && !isUserPayer(i.payer, currentUser) && i.payer !== '公積金支付')
    .reduce((sum, item) => {
      if (!item.splitMembers || item.splitMembers.length === 0) return sum;
      const myShare = item.splitMembers.find(m => isUserMember(m.name, currentUser));
      return sum + (myShare ? myShare.amount : 0);
    }, 0);

  // 群組累積總支出 (不分個人，群組全體總花費)
  const roommatesTotalExpense = expenses
    .filter(i => (i.groupName === '小室友們' || !i.groupName))
    .reduce((sum, item) => sum + item.amount, 0);

  const taipeiTotalExpense = expenses
    .filter(i => i.groupName === '台北一日遊')
    .reduce((sum, item) => sum + item.amount, 0);

  // 首頁群組卡片列表：僅呈現「小室友們」與「台北一日遊」兩個 MVP 測試群組
  const groups = [
    { 
      name: '小室友們', 
      members: 3, 
      totalExpense: roommatesTotalExpense,
      hasReserveFund: enableReserveFund,
      icon: Users, 
      color: '#8FB96C',
      memberInitials: ['我', '林', '明']
    },
    { 
      name: '台北一日遊', 
      members: 3, 
      totalExpense: taipeiTotalExpense,
      hasReserveFund: false,
      icon: Compass, 
      color: '#74818E',
      memberInitials: ['我', '林', '明']
    }
  ];

  // Category proportions
  const categoryRatios = [
    { label: '食', percent: 45, color: '#74818E' },
    { label: '住', percent: 20, color: '#8B95A0' },
    { label: '行', percent: 15, color: '#A2ABB2' },
    { label: '衣', percent: 10, color: '#B9C1C4' },
    { label: '樂', percent: 10, color: '#D0D7D6' }
  ];

  const currentDisplayName = currentUser.name.split(' ')[0];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section with User Context Greeting */}
      <section className="text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#C3D3DE]/30">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3A342E] tracking-tight mb-1 font-sans">
            午安，{currentUser.name}！
          </h1>
          <p className="text-xs sm:text-sm text-[#74818E] font-medium font-sans">
            今日也要保持愉悅的心情管理財務 · 財務概覽儀表板
          </p>
        </div>

        <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 bg-white/80 rounded-full border border-[#C3D3DE]/50 text-xs text-[#74818E] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#8FB96C]"></span>
          <span>當前身分：<strong className="text-[#3A342E]">{currentDisplayName}</strong> ({currentUser.role})</span>
        </div>
      </section>

      {/* Row 1: Core Dynamic Metrics (Bound to currentUser) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Metric 1: 個人總支出 */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F0883E]/5 rounded-bl-full pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xs font-semibold text-[#74818E] uppercase tracking-wider">個人總支出</h2>
              <span className="text-[10px] text-[#74818E]/80 font-sans">由 {currentDisplayName} 分攤之累計金額</span>
            </div>
            <Wallet className="text-[#F0883E] w-5 h-5 shrink-0" />
          </div>
          <div className="mt-5 sm:mt-6">
            <span className="text-3xl md:text-4xl font-extrabold text-[#F0883E] tracking-tight font-sans">
              NT${totalPersonalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 2: 總應收金額 */}
        <div 
          className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 text-left cursor-default select-text group hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xs font-semibold text-[#74818E] uppercase tracking-wider">總應收金額</h2>
              <span className="text-[10px] text-[#74818E]/80 font-sans">他人應付款給 {currentDisplayName}</span>
            </div>
            <TrendingDown className="text-[#8FB96C] w-5 h-5 shrink-0" />
          </div>
          <div className="mt-5 sm:mt-6">
            <span className="text-3xl md:text-4xl font-extrabold text-[#3A342E] tracking-tight font-sans">
              NT${totalReceivable.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 3: 總應付金額 */}
        <div 
          className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 text-left cursor-default select-text group hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xs font-semibold text-[#74818E] uppercase tracking-wider">總應付金額</h2>
              <span className="text-[10px] text-[#74818E]/80 font-sans">{currentDisplayName} 應付款給他人</span>
            </div>
            <TrendingUp className="text-[#C1503B] w-5 h-5 shrink-0" />
          </div>
          <div className="mt-5 sm:mt-6">
            <span className="text-3xl md:text-4xl font-extrabold text-[#3A342E] tracking-tight font-sans">
              NT${totalPayable.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Row 2: Groups */}
      <section className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#3A342E] font-sans">群組</h2>
          
          {/* Unified Deposit Fund Entry Button */}
          <button
            type="button"
            id="btn-unified-deposit-fund"
            onClick={() => {
              setDepositGroupName('');
              setIsDepositModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#3A342E] bg-[#FAF7EE] hover:bg-[#F2ECE0] active:bg-[#EAE0D0] border border-[#C3D3DE]/80 rounded-lg shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3A342E]/15"
          >
            <Plus size={14} className="stroke-[2.5px] text-[#3A342E]" />
            <span>存入公積金</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {groups.map((grp, idx) => {
            const GroupIcon = grp.icon;

            return (
              <div 
                key={idx}
                id={`group-card-${grp.name}`}
                onClick={() => handleGroupCardClick(grp.name)}
                className="bg-[#FAF7EE]/50 hover:bg-[#FAF7EE] rounded-xl p-4 sm:p-5 border border-[#C3D3DE]/40 hover:border-[#74818E]/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between min-h-[148px] group"
              >
                {/* Top Row: Left is Group Name & Count, Right is Fund Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#C3D3DE]/40 flex items-center justify-center text-[#3A342E] group-hover:bg-[#3A342E] group-hover:text-white transition-colors shrink-0">
                      <GroupIcon size={16} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <h3 className="text-sm font-bold text-[#3A342E] whitespace-nowrap">
                        {grp.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-normal font-sans shrink-0">({grp.members}人)</span>
                    </div>
                  </div>

                  {grp.hasReserveFund && (
                    <div className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md font-medium font-sans border border-[#C3D3DE]/40 shrink-0">
                      公積金 NT${groupFundBalance.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Left is Core Metric (總支出 + NT$XXX), Right is Member Avatars */}
                <div className="flex items-end justify-between gap-3 mt-5 pt-1">
                  {/* Left Bottom: Highest visual hierarchy - Core Financial Metric */}
                  <div>
                    <span className="block text-xs text-slate-500 font-medium font-sans mb-0.5">
                      總支出
                    </span>
                    <span className="text-2xl font-bold text-[#3A342E] tracking-tight font-sans">
                      NT${grp.totalExpense.toLocaleString()}
                    </span>
                  </div>

                  {/* Right Bottom: Overlapping Member Avatars */}
                  <div className="hidden md:hidden lg:flex -space-x-1.5 overflow-hidden pb-0.5" title="群組成員">
                    {grp.memberInitials.map((initial, mIdx) => (
                      <div 
                        key={mIdx}
                        className="w-6 h-6 rounded-full bg-white border border-[#C3D3DE]/60 flex items-center justify-center text-[10px] font-bold text-[#3A342E] font-sans shadow-2xs"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Row 3: Split View (Activity Feed & Category Proportions) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {/* Left: Recent Activity Feed */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#3A342E] font-sans">最新消費動態</h2>
            <button 
              onClick={() => onNavigate('details')}
              className="text-xs font-semibold text-[#74818E] hover:underline focus:outline-none cursor-pointer"
            >
              查看所有明細
            </button>
          </div>

          <div className="flex flex-col divide-y divide-gray-50">
            {expenses.slice(0, 4).map((item) => {
              const isPaidByMe = isUserPayer(item.payer, currentUser);
              const CategoryIcon = getCategoryIcon(item.category);
              return (
                <div 
                  key={item.id}
                  onClick={() => onNavigate('details')}
                  className="flex justify-between items-center py-3 hover:bg-[#F7F2E7]/30 transition-colors px-1 rounded-lg cursor-pointer group"
                  title="點擊導向支出明細頁"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C3D3DE]/20 group-hover:bg-[#74818E]/10 flex items-center justify-center text-[#74818E] transition-colors">
                      <CategoryIcon size={15} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#3A342E] group-hover:text-[#74818E] transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#74818E] font-medium mt-0.5 font-sans">
                        {item.date} · {item.payer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold font-sans text-[#3A342E]">
                      NT${item.amount.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-[#74818E] font-sans">
                      {item.groupName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Consumption Category Proportions */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#3A342E] font-sans">消費類別比例</h2>
            <span className="text-xs text-[#74818E] font-bold uppercase tracking-wider font-sans">本月分析</span>
          </div>

          <div className="flex-grow flex flex-col justify-center gap-3.5 py-1">
            {categoryRatios.map((cat, cIdx) => (
              <div key={cIdx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#3A342E] font-medium">{cat.label}</span>
                  <span className="text-[#74818E] font-sans">{cat.percent}%</span>
                </div>
                <div className="w-full h-2 bg-[#F7F2E7] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deposit Fund Modal */}
      <DepositFundModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        groupName={depositGroupName}
      />

    </div>
  );
}
