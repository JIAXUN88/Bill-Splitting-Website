import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Check, ArrowRight, Users } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import CustomSelect, { SelectOption } from './CustomSelect';

interface DepositFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName?: string;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 3000];

export default function DepositFundModal({
  isOpen,
  onClose,
  groupName = ''
}: DepositFundModalProps) {
  const { groupFundBalance, depositGroupFund, currentUser, groups } = useLedger();

  const [selectedGroup, setSelectedGroup] = useState<string>(groupName);
  const [amountStr, setAmountStr] = useState<string>('1000');
  const [depositor, setDepositor] = useState<string>(currentUser.name);
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedGroup(groupName || '');
      setDepositor(currentUser.name);
      setAmountStr('1000');
      setNotes('');
      setIsSuccess(false);
    }
  }, [isOpen, currentUser, groupName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsedAmount = Math.max(0, parseInt(amountStr, 10) || 0);
  const projectedBalance = groupFundBalance + parsedAmount;

  const handleSetPreset = (val: number) => {
    setAmountStr(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || parsedAmount <= 0) return;

    depositGroupFund(
      parsedAmount, 
      depositor, 
      notes.trim() ? `[${selectedGroup}] ${notes.trim()}` : `[${selectedGroup}] 儲值`
    );
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  const members = [
    { id: 'user_me', name: '我 (Alice)', shortName: '我' },
    { id: 'user_lin', name: '小林 (Bob)', shortName: '林' },
    { id: 'user_ming', name: '阿明 (Charlie)', shortName: '明' }
  ];

  // Available groups for fund deposit (僅列出啟用公積金的群組)
  const availableGroups = groups && groups.length > 0 
    ? groups.filter(g => g.hasReserveFund !== false)
    : [{ id: 'group_roommates', name: '小室友們', memberCount: 3, hasReserveFund: true }];

  // Dropdown options for groups
  const groupOptions: SelectOption[] = availableGroups.map((g) => ({
    value: g.name,
    label: `${g.name} (${g.memberCount || 3}人)`,
    subLabel: '公積金已啟用',
    icon: Users
  }));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#3A342E]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="deposit-fund-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#C3D3DE]/40 overflow-hidden flex flex-col font-sans transition-all transform animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF7EE] border-b border-[#C3D3DE]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#3A342E] border border-[#C3D3DE]/40 flex items-center justify-center shadow-2xs">
              <PiggyBank size={20} className="stroke-[2.2px] text-[#3A342E]" />
            </div>
            <h2 className="text-base font-bold text-[#3A342E] leading-tight">存入公積金</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉彈窗"
            className="w-8 h-8 rounded-full text-slate-500 hover:text-[#3A342E] hover:bg-[#C3D3DE]/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 sm:space-y-5">
          {/* 1. Group Selector Field (群組下拉式選單) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3A342E]">群組</label>
            <CustomSelect
              id="deposit-group-select"
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(val)}
              options={groupOptions}
              placeholder="請選擇群組"
              triggerIcon={Users}
              className="w-full"
              triggerClassName="w-full justify-between py-2.5 px-3.5 bg-white border-[#C3D3DE] rounded-xl text-xs font-semibold text-[#3A342E]"
            />
          </div>

          {/* Balance Preview Card (選取群組後即時顯示) */}
          {Boolean(selectedGroup) && (
            <div className="bg-[#FAF7EE] rounded-xl p-4 border border-[#C3D3DE]/40 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium font-sans">
                <span>目前餘額</span>
                <span>存入後餘額</span>
              </div>
              <div className="flex items-center justify-between font-sans">
                <span className="text-base font-bold text-[#3A342E]">
                  NT${groupFundBalance.toLocaleString()}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-[#3A342E]">
                  <ArrowRight size={15} className="text-slate-500" />
                  <span className="text-base font-bold text-[#3A342E]">
                    NT${projectedBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Amount Input & Preset Chips (移至群組選單與餘額卡片下方) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="deposit-amount" className="block text-xs font-bold text-[#3A342E]">
                儲值金額
              </label>
              {parsedAmount > 0 && (
                <span className="text-xs text-slate-500 font-semibold font-sans">
                  +NT${parsedAmount.toLocaleString()}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                NT$
              </span>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                step="1"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="輸入金額"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#C3D3DE] rounded-xl text-base font-bold text-[#3A342E] focus:outline-none focus:ring-2 focus:ring-[#3A342E]/20 focus:border-[#3A342E] transition-all"
              />
            </div>

            {/* Preset Amount Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium mr-0.5">常用：</span>
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetPreset(preset)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    parsedAmount === preset
                      ? 'bg-[#3A342E] text-white shadow-2xs'
                      : 'bg-[#FAF7EE] text-[#3A342E] hover:bg-[#EAE4D5]'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Depositor Picker (儲值成員 / 繳款人) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3A342E]">儲值成員 (繳款人)</label>
            <div className="grid grid-cols-3 gap-2">
              {members.map((m) => {
                const isSelected = depositor === m.name || depositor.startsWith(m.shortName);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDepositor(m.name)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7EE] text-[#3A342E] border-[#3A342E] ring-1 ring-[#3A342E]/30 font-bold'
                        : 'bg-white text-slate-500 border-[#C3D3DE]/50 hover:bg-[#FAF7EE] hover:text-[#3A342E]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-[#3A342E] text-white' : 'bg-[#FAF7EE] text-[#3A342E]'
                    }`}>
                      {m.shortName}
                    </span>
                    <span className="truncate">{m.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional Note */}
          <div className="space-y-1.5">
            <label htmlFor="deposit-notes" className="block text-xs font-bold text-[#3A342E]">
              備註說明 <span className="text-[11px] font-normal text-slate-500">(選填)</span>
            </label>
            <input
              id="deposit-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：9月份公用耗材與生活用品補貼"
              className="w-full px-3.5 py-2.5 bg-white border border-[#C3D3DE] rounded-xl text-xs text-[#3A342E] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3A342E]/20 focus:border-[#3A342E] transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#C3D3DE]/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-[#3A342E] hover:bg-[#FAF7EE] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedGroup || parsedAmount <= 0 || isSuccess}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isSuccess
                  ? 'bg-[#3A342E] text-white'
                  : selectedGroup && parsedAmount > 0
                  ? 'bg-[#3A342E] hover:bg-[#2A2520] active:bg-[#1A1613] text-white hover:shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check size={15} className="stroke-[3px]" />
                  <span>儲值成功！</span>
                </>
              ) : (
                <span>確認存入 NT${parsedAmount > 0 ? parsedAmount.toLocaleString() : '0'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
