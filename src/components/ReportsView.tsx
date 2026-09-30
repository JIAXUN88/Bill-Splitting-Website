import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  Wallet,
  Coins
} from 'lucide-react';
import { ExpenseItem } from '../types';
import { useLedger } from '../context/LedgerContext';
import { getCategoryIcon } from './ExpensesView';

interface ReportsViewProps {
  expenses?: ExpenseItem[];
}

// 統一類別顏色映射表
const CATEGORY_COLORS: Record<string, string> = {
  '餐飲': '#74818E',
  '居住': '#8B9BA6',
  '交通': '#A9B8C0',
  '日用': '#C3D3DE',
  '娛樂': '#E4ECF2',
  '其他': '#CBD5E1',
};

const PALETTE = ['#74818E', '#8B9BA6', '#A9B8C0', '#C3D3DE', '#94A3B8', '#64748B', '#F0883E'];

// 類別標準化輔助函式
export function normalizeCategory(cat?: string): string {
  if (!cat || typeof cat !== 'string') return '其他';
  const trimmed = cat.trim();
  if (trimmed.includes('餐') || trimmed.includes('食') || trimmed === 'food') return '餐飲';
  if (trimmed.includes('日') || trimmed.includes('用') || trimmed === 'grocery') return '日用';
  if (trimmed.includes('交') || trimmed.includes('車') || trimmed === 'traffic') return '交通';
  if (trimmed.includes('住') || trimmed.includes('水電') || trimmed.includes('電費') || trimmed === 'living') return '居住';
  if (trimmed.includes('樂') || trimmed.includes('休') || trimmed === 'entertainment') return '娛樂';
  return trimmed || '其他';
}

// 日期解析輔助函式 (相容 YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD 等格式)
export function parseExpenseDate(dateStr?: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split(/[-/.]/);
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }
  const dt = new Date(dateStr);
  if (!isNaN(dt.getTime())) {
    return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  }
  return null;
}

export default function ReportsView({ expenses: propExpenses }: ReportsViewProps) {
  const ledger = useLedger();
  const rawExpenses = propExpenses || ledger?.expenses || [];
  const memberBalances = ledger?.memberBalances || [];
  const groupFundBalance = ledger?.groupFundBalance ?? 0;

  // 決定初始年份與月份：預設搜尋現存資料之最新月份，若無則預設為 2024年5月 (對齊 UAT 初始資料)
  const initialYearMonth = useMemo(() => {
    if (Array.isArray(rawExpenses) && rawExpenses.length > 0) {
      for (const exp of rawExpenses) {
        const parsed = parseExpenseDate(exp?.date);
        if (parsed) {
          return { year: parsed.year, month: parsed.month };
        }
      }
    }
    return { year: 2024, month: 5 };
  }, [rawExpenses]);

  const [selectedYear, setSelectedYear] = useState<number>(initialYearMonth.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialYearMonth.month);
  const [activeDay, setActiveDay] = useState<number>(20);
  const [panelState, setPanelState] = useState<'A' | 'B'>('A');

  // 當初始年月變化時同步更新
  useEffect(() => {
    if (initialYearMonth.year && initialYearMonth.month) {
      setSelectedYear(initialYearMonth.year);
      setSelectedMonth(initialYearMonth.month);
    }
  }, [initialYearMonth.year, initialYearMonth.month]);

  // 切換月份函式
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(y => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(y => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // 1. 篩選當月支出
  const monthExpenses = useMemo(() => {
    if (!Array.isArray(rawExpenses)) return [];
    return rawExpenses.filter(exp => {
      if (!exp || !exp.date) return false;
      const parsed = parseExpenseDate(exp.date);
      if (!parsed) return false;
      return parsed.year === selectedYear && parsed.month === selectedMonth;
    });
  }, [rawExpenses, selectedYear, selectedMonth]);

  // 2. 消費月曆中心連動 (ConsumptionCalendar) - 每日支出加總與明細字典
  const dailySpendingMap = useMemo(() => {
    const map: Record<number, { total: number; items: ExpenseItem[] }> = {};
    monthExpenses.forEach(exp => {
      const parsed = parseExpenseDate(exp.date);
      if (!parsed) return;
      const day = parsed.day;
      const amt = typeof exp.amount === 'number' && !isNaN(exp.amount) ? exp.amount : parseFloat(String(exp.amount || 0)) || 0;
      if (amt <= 0 && (!exp.name || exp.name.trim() === '')) return;

      if (!map[day]) {
        map[day] = { total: 0, items: [] };
      }
      map[day].total += amt;
      map[day].items.push(exp);
    });
    return map;
  }, [monthExpenses]);

  // 當月份切換時，自動將選中日期更新為當月有支出的第一天（若無則保留當前或設為 1）
  useEffect(() => {
    const spendingDays = Object.keys(dailySpendingMap).map(Number).filter(d => (dailySpendingMap[d]?.total || 0) > 0);
    if (spendingDays.length > 0) {
      if (!spendingDays.includes(activeDay)) {
        setActiveDay(spendingDays[0]);
      }
    } else {
      setActiveDay(1);
      setPanelState('A');
    }
  }, [selectedYear, selectedMonth, dailySpendingMap]);

  // 月曆日期格數動態計算
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // 月曆第一天星期幾 (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1).getDay();
  }, [selectedYear, selectedMonth]);

  // 前一個月補齊天數
  const previousMonthDays = useMemo(() => {
    const prevMonthLastDate = new Date(selectedYear, selectedMonth - 1, 0).getDate();
    return Array.from(
      { length: firstDayOfWeek },
      (_, i) => prevMonthLastDate - firstDayOfWeek + 1 + i
    );
  }, [selectedYear, selectedMonth, firstDayOfWeek]);

  // 下一個月補齊天數 (填滿完整 7 欄網格)
  const nextMonthDays = useMemo(() => {
    const totalRendered = previousMonthDays.length + daysInMonth;
    const remainder = totalRendered % 7;
    const count = remainder === 0 ? 0 : 7 - remainder;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [previousMonthDays.length, daysInMonth]);

  // 點擊月曆日期
  const handleDayClick = (day: number) => {
    const dayData = dailySpendingMap[day];
    if (dayData && dayData.items.length > 0) {
      setActiveDay(day);
      setPanelState('B');
    }
  };

  // 3. 全月支出占比連動 (CategoryExpensesDonut) - 依類別動態加總與百分比計算
  const { categoryStats, monthTotal } = useMemo(() => {
    const catMap: Record<string, number> = {};
    let total = 0;

    monthExpenses.forEach(exp => {
      const amt = typeof exp.amount === 'number' && !isNaN(exp.amount) ? exp.amount : parseFloat(String(exp.amount || 0)) || 0;
      if (amt <= 0) return;
      total += amt;
      const cat = normalizeCategory(exp.category);
      catMap[cat] = (catMap[cat] || 0) + amt;
    });

    const sorted = Object.entries(catMap)
      .map(([cat, amount], index) => {
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        const roundedPercent = Math.round(percentage);
        return {
          name: cat,
          amount,
          percentage,
          percentStr: `${roundedPercent}%`,
          color: CATEGORY_COLORS[cat] || PALETTE[index % PALETTE.length],
          formattedAmount: `NT$${amount.toLocaleString()}`
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      categoryStats: sorted,
      monthTotal: total
    };
  }, [monthExpenses]);

  // 當前選中日期的明細資料
  const selectedDayData = useMemo(() => {
    return dailySpendingMap[activeDay] || { total: 0, items: [] };
  }, [dailySpendingMap, activeDay]);

  // 4. 動態計算季度趨勢區 (近三個月各項消費比重分析)
  const quarterlySpending = useMemo(() => {
    const quarters = [];
    const baseDate = new Date(selectedYear, selectedMonth - 1, 1);

    for (let offset = 2; offset >= 0; offset--) {
      const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - offset, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth() + 1;
      const isCurrent = offset === 0;

      // 篩選該月份的支出
      const exps = (rawExpenses || []).filter(e => {
        const p = parseExpenseDate(e?.date);
        return p && p.year === y && p.month === m;
      });

      const total = exps.reduce((sum, e) => {
        const val = typeof e.amount === 'number' && !isNaN(e.amount) ? e.amount : parseFloat(String(e.amount || 0)) || 0;
        return sum + (val > 0 ? val : 0);
      }, 0);

      // 計算該月份類別比例
      const catTotals: Record<string, number> = {};
      exps.forEach(e => {
        const val = typeof e.amount === 'number' && !isNaN(e.amount) ? e.amount : parseFloat(String(e.amount || 0)) || 0;
        if (val > 0) {
          const c = normalizeCategory(e.category);
          catTotals[c] = (catTotals[c] || 0) + val;
        }
      });

      quarters.push({
        year: y,
        month: m,
        label: isCurrent ? `${m}月 (本月)` : `${m}月`,
        total,
        totalStr: `NT$${total.toLocaleString()}`,
        active: isCurrent,
        catTotals
      });
    }

    // 計算最大月份金額以按比例調整長條圖高度
    const maxVal = Math.max(...quarters.map(q => q.total), 1);

    return {
      quarters: quarters.map(q => ({
        ...q,
        heightPercent: Math.max(Math.round((q.total / maxVal) * 100), 12)
      })),
      quarterlyTotal: quarters.reduce((s, q) => s + q.total, 0)
    };
  }, [rawExpenses, selectedYear, selectedMonth]);

  // 5. 成員累計代墊與貢獻度分析 (自真實 memberBalances 計算)
  const memberContributions = useMemo(() => {
    const totalPaid = memberBalances.reduce((sum, m) => sum + (m.paidAmount || 0), 0);
    const colors = ['#F0883E', '#74818E', '#8B9BA6'];
    const barColors = ['bg-[#F0883E]', 'bg-[#74818E]', 'bg-[#8B9BA6]'];

    const members = memberBalances.map((m, idx) => {
      const paid = m.paidAmount || 0;
      const percentNum = totalPaid > 0 ? (paid / totalPaid) * 100 : 0;
      return {
        id: m.userId,
        name: m.userName.split(' ')[0] || m.userName,
        amount: `NT$${paid.toLocaleString()}`,
        percent: `${percentNum.toFixed(1)}%`,
        percentNum,
        color: colors[idx % colors.length],
        barColor: barColors[idx % barColors.length]
      };
    });

    return {
      totalPaid,
      members
    };
  }, [memberBalances]);

  // Donut Chart 環狀圖 SVG 參數計算 (直徑 80, 圓周長 C ≈ 251.327)
  const CIRCUMFERENCE = 2 * Math.PI * 40;
  let cumulativeDonutOffset = 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Month Navigator */}
      <section className="flex justify-center items-center">
        <div className="inline-flex items-center bg-white border border-[#C3D3DE]/40 rounded-full p-1 shadow-xs space-x-3">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F2E7] text-[#74818E] transition-colors cursor-pointer"
            aria-label="前一個月份"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-[#3A342E] px-2 tracking-wide font-sans select-none min-w-[100px] text-center">
            {selectedYear}年{selectedMonth}月
          </span>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F2E7] text-[#74818E] transition-colors cursor-pointer"
            aria-label="下一個月份"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Row 1: Calendar and Dynamic Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Side: Consumption Calendar (Occupies 2/3) */}
        <section className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#3A342E] font-sans">消費月曆中心</h2>
                <span className="text-[10px] text-[#74818E] font-bold bg-[#F7F2E7] px-2.5 py-1 rounded-full">
                  每日記帳彙整
                </span>
              </div>
              <span className="text-[11px] text-[#74818E] hidden sm:inline font-sans">
                點選有記帳之日期可檢視明細
              </span>
            </div>

            {/* Calendar Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#74818E] py-2 border-b border-gray-100 font-sans">
              <div>日</div>
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div>六</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-3 text-center text-xs">
              {/* Previous month grey placeholder items */}
              {previousMonthDays.map(d => (
                <div key={`prev-${d}`} className="h-14 p-1 rounded-lg flex flex-col justify-between text-gray-300 cursor-default select-none">
                  <span className="font-medium text-left ml-1 font-sans">{d}</span>
                </div>
              ))}

              {/* Current Month Active Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dayData = dailySpendingMap[day];
                const hasSpending = Boolean(dayData && dayData.total > 0);
                const isActive = activeDay === day;

                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => hasSpending && handleDayClick(day)}
                    className={`h-14 p-1 rounded-lg flex flex-col justify-between transition-all select-none ${
                      hasSpending 
                        ? isActive
                          ? 'bg-[#F0883E]/10 border-2 border-[#F0883E] ring-2 ring-[#F0883E]/20 shadow-xs cursor-pointer'
                          : 'bg-[#F7F2E7]/70 hover:bg-[#F7F2E7] border border-[#C3D3DE]/30 cursor-pointer hover:scale-[1.02]'
                        : 'text-gray-400 cursor-default'
                    }`}
                  >
                    <span className={`text-left ml-1 font-sans ${
                      hasSpending 
                        ? isActive 
                          ? 'font-bold text-[#F0883E]' 
                          : 'font-semibold text-[#3A342E]'
                        : 'font-medium'
                    }`}>
                      {day}
                    </span>
                    {hasSpending ? (
                      <span className={`text-[10px] font-sans truncate text-center font-bold px-0.5 ${
                        isActive ? 'text-[#F0883E]' : 'text-[#3A342E]/70'
                      }`}>
                        ${dayData.total.toLocaleString()}
                      </span>
                    ) : (
                      <span className="h-3" />
                    )}
                  </div>
                );
              })}

              {/* Next month placeholder items */}
              {nextMonthDays.map(d => (
                <div key={`next-${d}`} className="h-14 p-1 rounded-lg flex flex-col justify-between text-gray-300 cursor-default select-none font-sans">
                  <span className="font-medium text-left ml-1">{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Switch Helper Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#74818E] font-medium font-sans">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F0883E]" />
              已選中日期：<strong className="text-[#3A342E] font-bold">{selectedMonth}月{activeDay}日</strong>
              {dailySpendingMap[activeDay] && (
                <span className="text-[#F0883E] font-bold ml-1">
                  (NT${dailySpendingMap[activeDay].total.toLocaleString()})
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPanelState('A')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  panelState === 'A' 
                    ? 'bg-[#F0883E]/15 text-[#F0883E] font-bold' 
                    : 'bg-[#F7F2E7] text-[#74818E] hover:bg-gray-100'
                }`}
              >
                全月占比
              </button>
              <button 
                onClick={() => setPanelState('B')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  panelState === 'B' 
                    ? 'bg-[#F0883E]/15 text-[#F0883E] font-bold' 
                    : 'bg-[#F7F2E7] text-[#74818E] hover:bg-gray-100'
                }`}
              >
                當日明細
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Dynamic Dashboard side panel (Category Percentages vs Day Details) */}
        <section className="lg:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col justify-between transition-all">
          {panelState === 'A' ? (
            /* STATE A: Full Month Expenditures percentages (SVG Donut Chart) */
            <div className="flex flex-col items-center w-full animate-in fade-in duration-150">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#3A342E] font-sans">全月支出占比</h2>
                <span className="text-[10px] text-[#74818E] font-bold bg-[#F7F2E7] px-2 py-0.5 rounded-full">
                  類別彙整
                </span>
              </div>

              {/* Donut Chart SVG (動態加總計算區塊長度與 offset) */}
              <div className="relative w-44 h-44 flex items-center justify-center my-2 shrink-0">
                <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                  {monthTotal <= 0 ? (
                    /* 無支出時顯示灰階底圓 */
                    <circle 
                      cx="50" 
                      cy="50" 
                      fill="transparent" 
                      r="40" 
                      stroke="#E4ECF2" 
                      strokeWidth="18" 
                    />
                  ) : (
                    categoryStats.map((cat) => {
                      const strokeLength = (cat.amount / monthTotal) * CIRCUMFERENCE;
                      const offset = -cumulativeDonutOffset;
                      cumulativeDonutOffset += strokeLength;
                      return (
                        <circle
                          key={cat.name}
                          cx="50"
                          cy="50"
                          fill="transparent"
                          r="40"
                          stroke={cat.color}
                          strokeDasharray={`${strokeLength} ${CIRCUMFERENCE}`}
                          strokeDashoffset={offset}
                          strokeWidth="18"
                        />
                      );
                    })
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-[#74818E] font-sans font-bold">本月總額</span>
                  <span className="text-lg font-black text-[#3A342E] tracking-tight font-sans">
                    ${monthTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Category Legends list (依金額由大到小排序) */}
              <div className="w-full flex flex-col space-y-2 mt-4 pt-3 border-t border-gray-100 font-sans">
                {categoryStats.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#74818E]">
                    本月尚無支出紀錄
                  </div>
                ) : (
                  categoryStats.map((leg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-[#F7F2E7]/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: leg.color }} />
                        <span className="text-[#3A342E] font-semibold">{leg.name}</span>
                      </div>
                      <div>
                        <span className="text-[#3A342E] font-bold">{leg.formattedAmount}</span>
                        <span className="text-[#74818E] text-[10px] ml-1.5 font-sans">({leg.percentStr})</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* STATE B: Selected Day's Expenditures detailed feed */
            <div className="flex flex-col w-full animate-in fade-in duration-150">
              <div className="mb-4 text-left">
                <button 
                  onClick={() => setPanelState('A')}
                  className="inline-flex items-center text-[10px] font-bold text-[#74818E] hover:text-[#3A342E] bg-[#F7F2E7] hover:bg-[#C3D3DE]/40 px-3 py-1.5 rounded-full transition-all group cursor-pointer"
                >
                  <ArrowLeft size={12} className="mr-1 group-hover:-translate-x-0.5 transition-transform" />
                  返回全月圖表
                </button>
              </div>

              {/* Detail Header */}
              <div className="flex items-baseline justify-between pb-3 border-b border-gray-100 mb-4 text-left font-sans">
                <div>
                  <h2 className="text-base font-extrabold text-[#3A342E]">{selectedMonth}月{activeDay}日 支出明細</h2>
                  <p className="text-[10px] text-[#74818E] mt-0.5">
                    當日共有 {selectedDayData.items.length} 筆記帳紀錄
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#74818E] block">當日總額</span>
                  <span className="text-base font-extrabold text-[#F0883E]">
                    NT${selectedDayData.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col space-y-2.5 w-full max-h-[300px] overflow-y-auto pr-0.5">
                {selectedDayData.items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#74818E]">
                    當日無記帳明細，請點選月曆上有標註金額的日期
                  </div>
                ) : (
                  selectedDayData.items.map((it, idx) => {
                    const ItemIcon = getCategoryIcon(it.category);
                    const normalizedCat = normalizeCategory(it.category);
                    const catColor = CATEGORY_COLORS[normalizedCat] || '#74818E';
                    const itemAmount = typeof it.amount === 'number' && !isNaN(it.amount) ? it.amount : parseFloat(String(it.amount || 0)) || 0;

                    return (
                      <div key={it.id || idx} className="p-3 bg-white rounded-lg border border-[#C3D3DE]/30 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-full bg-[#F7F2E7] flex items-center justify-center text-[#74818E] shrink-0">
                            <ItemIcon size={14} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#3A342E]">{it.name || '未命名開支'}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                              <span className="text-[10px] text-[#74818E] font-medium font-sans">{normalizedCat}</span>
                              {it.groupName && (
                                <span className="text-[10px] text-slate-400 font-sans">· {it.groupName}</span>
                              )}
                              {it.payer && (
                                <span className="text-[10px] text-slate-400 font-sans">· {it.payer}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#3A342E] font-sans whitespace-nowrap ml-2">
                          NT${itemAmount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100 text-center font-sans">
                <p className="text-[10px] text-[#74818E] font-medium">
                  點選月曆其他有金額之日期可即時更換檢視
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Row 2: Trend bar charts & Reserve Fund contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Card: Stacked quarterly bar charts (動態真實加總) */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 text-left">
              <div>
                <h2 className="text-base font-bold text-[#3A342E] font-sans">季度類別趨勢區</h2>
                <p className="text-[11px] text-[#74818E] font-medium mt-0.5">近三個月各項消費比重分析</p>
              </div>
              <div className="text-right font-sans">
                <span className="text-[10px] text-[#74818E] block">季度累計支出</span>
                <p className="text-sm font-bold text-[#F0883E]">
                  ${quarterlySpending.quarterlyTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Stacked Bar charts display */}
            <div className="pt-4 pb-2">
              <div className="h-44 flex items-end justify-around border-b border-gray-100 px-6 sm:px-12">
                {quarterlySpending.quarters.map((qs, idx) => (
                  <div key={idx} className="flex flex-col items-center group w-16 sm:w-20">
                    <span className={`text-[10px] font-bold mb-2 font-sans ${qs.active ? 'text-[#F0883E]' : 'text-[#74818E]'}`}>
                      {qs.totalStr}
                    </span>
                    <div 
                      className={`w-full rounded-t flex flex-col-reverse overflow-hidden shadow-2xs transition-all ${
                        qs.active ? 'ring-2 ring-[#F0883E]/40' : ''
                      }`}
                      style={{ height: `${qs.heightPercent * 1.3}px`, minHeight: '16px' }}
                    >
                      {/* Segment colors dynamically proportioned */}
                      {qs.total > 0 ? (
                        <>
                          <div 
                            style={{ height: `${((qs.catTotals['餐飲'] || 0) / qs.total) * 100}%` }} 
                            className="bg-[#74818E]" 
                            title={`餐飲: NT$${(qs.catTotals['餐飲'] || 0).toLocaleString()}`} 
                          />
                          <div 
                            style={{ height: `${((qs.catTotals['居住'] || 0) / qs.total) * 100}%` }} 
                            className="bg-[#8B9BA6]" 
                            title={`居住: NT$${(qs.catTotals['居住'] || 0).toLocaleString()}`} 
                          />
                          <div 
                            style={{ height: `${((qs.catTotals['交通'] || 0) / qs.total) * 100}%` }} 
                            className="bg-[#A9B8C0]" 
                            title={`交通: NT$${(qs.catTotals['交通'] || 0).toLocaleString()}`} 
                          />
                          <div 
                            style={{ height: `${((qs.catTotals['日用'] || 0) / qs.total) * 100}%` }} 
                            className="bg-[#C3D3DE]" 
                            title={`日用: NT$${(qs.catTotals['日用'] || 0).toLocaleString()}`} 
                          />
                          <div 
                            style={{ height: `${((qs.catTotals['娛樂'] || 0) / qs.total) * 100}%` }} 
                            className="bg-[#E4ECF2]" 
                            title={`娛樂: NT$${(qs.catTotals['娛樂'] || 0).toLocaleString()}`} 
                          />
                        </>
                      ) : (
                        <div className="h-full bg-slate-100" title="無支出" />
                      )}
                    </div>
                    <span className={`mt-3 text-xs ${qs.active ? 'font-bold text-[#F0883E]' : 'text-[#3A342E]'}`}>
                      {qs.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-2 text-[10px] text-gray-600 font-sans font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#74818E]" />
              <span>餐飲</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#8B9BA6]" />
              <span>居住</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#A9B8C0]" />
              <span>交通</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#C3D3DE]" />
              <span>日用</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#E4ECF2] border border-[#C3D3DE]" />
              <span>娛樂</span>
            </div>
          </div>
        </section>

        {/* Right Card: Members Contribution & Fund status (動態真實成員統計) */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#C3D3DE]/30 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4 text-left">
              <div>
                <h2 className="text-base font-bold text-[#3A342E] font-sans">成員代墊與公積金概況</h2>
                <p className="text-[11px] text-[#74818E] font-medium mt-0.5 font-sans">全體成員代墊總額與公積金池狀態</p>
              </div>
              <div className="mt-2 sm:mt-0 font-sans text-right">
                <span className="text-xs text-[#74818E] font-semibold">公積金餘額: </span>
                <span className="text-base font-bold text-[#3A342E]">
                  NT${groupFundBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Contribution lists with progress bars */}
            <div className="flex flex-col space-y-3.5 pt-1 font-sans">
              {memberContributions.members.map((member) => (
                <div key={member.id} className="bg-[#F7F2E7]/40 rounded-xl p-3.5 border border-[#C3D3DE]/20 shadow-2xs flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C3D3DE]/40 text-[#74818E] flex items-center justify-center text-xs font-black">
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#3A342E]">{member.name}</h3>
                        <p className="text-[10px] text-[#74818E] font-medium mt-0.5">個人代墊總額</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#3A342E]">{member.amount}</span>
                      <p className="text-[10px] text-[#74818E] font-medium">佔比 {member.percent}</p>
                    </div>
                  </div>
                  <div className="w-full bg-[#C3D3DE]/30 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${member.barColor}`} 
                      style={{ width: `${Math.min(member.percentNum, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-[#74818E] font-semibold text-center font-sans">
            成員累計代墊總計：NT${memberContributions.totalPaid.toLocaleString()} · 帳務即時連動
          </div>
        </section>

      </div>

    </div>
  );
}
