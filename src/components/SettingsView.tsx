import React, { useState } from 'react';
import { 
  Users, 
  Home as HomeIcon, 
  Upload, 
  Copy, 
  RefreshCw, 
  Shield, 
  Info, 
  Download, 
  LogOut, 
  Check, 
  ChevronRight,
  Settings,
  BellRing
} from 'lucide-react';
import { Member } from '../types';
import { useLedger } from '../context/LedgerContext';

export default function SettingsView() {
  const { resetToDefaultData, enableReserveFund, setEnableReserveFund } = useLedger();
  const [resetFeedback, setResetFeedback] = useState(false);
  const [groupName, setGroupName] = useState('小室友們');
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState('A3F9K2');
  
  // Low watermark alert
  const [lowWatermark, setLowWatermark] = useState('500');

  // Interactive notifications state
  const [notifyExpenseChange, setNotifyExpenseChange] = useState(true);
  const [notifySettleStatus, setNotifySettleStatus] = useState(true);

  // Initial members data (固定 3 位成員)
  const [members, setMembers] = useState<Member[]>([
    { name: '我 (Alice)', role: 'Owner', joinDate: '2024/01/01', avatarText: '我' },
    { name: '小林 (Bob)', role: 'Member', joinDate: '2024/01/05', avatarText: '林' },
    { name: '阿明 (Charlie)', role: 'Member', joinDate: '2024/02/10', avatarText: '明' }
  ]);

  // Handle invitation link copying
  const handleCopyCode = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(`https://nagomiledger.app/join?code=${inviteCode}`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle invite code regeneration
  const handleRegenerateCode = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setInviteCode(code);
      setIsRegenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* Breadcrumb Title Section */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#74818E] mb-1 font-sans">
          <span>群組管理</span>
          <ChevronRight size={12} />
          <span>設定</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#3A342E] tracking-tight font-sans">{groupName} - 群組設定</h1>
            <p className="text-xs text-[#74818E] font-medium mt-1">管理群組資訊、成員名單、公積金規則及偏好通知。</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#C3D3DE]/40 text-[#3A342E] font-bold font-sans self-start">
            <Shield size={12} className="text-[#74818E]" /> Owner 視角
          </span>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: Group Basic Profile Details */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-[#C3D3DE]/30">
          <h2 className="text-sm font-bold text-[#3A342E] pb-3 mb-5 border-b border-[#F7F2E7] flex items-center gap-2 font-sans">
            <HomeIcon className="text-[#74818E]" size={18} />
            群組基本資料
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Avatar upload wrapper */}
            <div className="flex flex-col items-center sm:items-start select-none">
              <span className="text-xs font-bold text-[#74818E] mb-2">群組代表圖示</span>
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-xl bg-[#F7F2E7] border-2 border-dashed border-[#C3D3DE] flex flex-col items-center justify-center text-[#74818E] hover:border-[#74818E] transition-colors duration-150">
                  <HomeIcon size={28} className="text-[#74818E] mb-1" />
                  <span className="text-[10px] font-bold">更換圖片</span>
                </div>
                <div className="absolute inset-0 bg-[#3A342E]/15 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>
              </div>
              <span className="text-[10px] text-[#74818E] mt-2 font-sans text-center sm:text-left">
                建議尺寸 200x200 像素
              </span>
            </div>

            {/* Name and invitation parameters */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#74818E] font-sans">
                  群組名稱 <span className="text-[#C1503B]">*</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-[#C3D3DE] focus:outline-none focus:border-[#74818E] text-[#3A342E] bg-white font-sans font-semibold" 
                    placeholder="請輸入群組名稱" 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <span className="inline-flex items-center px-2.5 py-1 text-xs text-[#74818E] bg-[#F7F2E7] rounded-lg font-bold">
                    已儲存
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#74818E] font-sans">邀請碼管理</label>
                <div className="p-4 bg-[#F7F2E7]/50 rounded-xl border border-[#C3D3DE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#74818E]">群組加入代碼：</span>
                    <span className="font-mono text-sm font-bold tracking-widest text-[#3A342E] bg-white px-2.5 py-1 rounded border border-[#C3D3DE]">
                      {inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 text-xs font-bold text-[#74818E] bg-white border border-[#C3D3DE] rounded-lg hover:bg-[#F7F2E7] transition-colors flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      {isCopied ? <Check size={12} className="text-[#8FB96C]" /> : <Copy size={12} />}
                      {isCopied ? '已複製！' : '複製連結'}
                    </button>
                    <button 
                      onClick={handleRegenerateCode}
                      disabled={isRegenerating}
                      className="px-3 py-1.5 text-xs font-bold text-[#74818E] bg-white border border-[#C3D3DE] rounded-lg hover:bg-[#F7F2E7] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      type="button"
                    >
                      <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                      重新生成
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Member Management */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-[#C3D3DE]/30">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F7F2E7]">
            <h2 className="text-sm font-bold text-[#3A342E] flex items-center gap-2 font-sans">
              <Users className="text-[#74818E]" size={18} />
              成員管理 ({members.length})
            </h2>
            <span className="text-xs text-[#74818E] font-semibold">目前角色權限分配</span>
          </div>

          <div className="divide-y divide-[#F7F2E7] font-sans">
            {members.map((member, idx) => {
              const isOwner = member.role === 'Owner';
              return (
                <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-gray-50/30 px-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      isOwner ? 'bg-[#C3D3DE]/60 text-[#3A342E]' : 'bg-[#F7F2E7] text-[#74818E] border border-[#C3D3DE]/30'
                    }`}>
                      {member.avatarText}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#3A342E] flex items-center gap-2">
                        <span>{member.name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isOwner ? 'bg-[#74818E] text-white' : 'bg-[#C3D3DE] text-[#3A342E]'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#74818E] font-medium mt-0.5">
                        {isOwner ? '建立者 · 完整群組設定管理權限' : '成員 · 記帳與結算參與者'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[#74818E]">
                    加入於 {member.joinDate}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#F7F2E7] flex items-center gap-2 text-xs text-[#74818E] font-medium font-sans">
            <Info size={14} className="text-[#74818E] shrink-0" />
            <span>輸入邀請碼即可直接加入群組，無需管理者二次審核</span>
          </div>
        </section>

        {/* Section 3: Reserve Fund & Notifications Settings */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-[#C3D3DE]/30">
          <h2 className="text-sm font-bold text-[#3A342E] pb-3 mb-5 border-b border-[#F7F2E7] flex items-center gap-2 font-sans">
            <Settings className="text-[#74818E]" size={18} />
            公積金與通知設定
          </h2>
          
          <div className="space-y-5">
            {/* Reserve fund switch */}
            <div className="p-4 rounded-xl bg-[#F7F2E7]/40 border border-[#C3D3DE]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="text-sm font-bold text-[#3A342E] block">啟用公積金功能</span>
                  <span className="text-xs text-[#74818E] font-medium mt-1 block">
                    開啟後，記帳時可選擇「公積金支付」，並於報表統計中追蹤成員預付累計。
                  </span>
                </div>
                {/* Switch widget */}
                <button
                  type="button"
                  onClick={() => setEnableReserveFund(!enableReserveFund)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                    enableReserveFund ? 'bg-[#74818E]' : 'bg-[#C3D3DE]'
                  }`}
                >
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform shadow-xs ${
                    enableReserveFund ? 'left-[22px]' : 'left-[2px]'
                  }`} />
                </button>
              </div>

              {/* Watermark setting input fields */}
              <div className={`pt-3.5 border-t border-[#C3D3DE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity duration-200 ${
                enableReserveFund ? 'opacity-100' : 'opacity-40 pointer-events-none'
              }`}>
                <div className="text-left font-sans">
                  <label className="text-xs font-bold text-[#3A342E] block">低水位提醒門檻</label>
                  <span className="text-[10px] text-[#74818E] font-medium mt-0.5 block">
                    當公積金總餘額低於此門檻時，全群組成員將收到儲值提醒通知。
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#74818E] font-sans">$</span>
                  <input 
                    type="number" 
                    disabled={!enableReserveFund}
                    value={lowWatermark}
                    onChange={(e) => setLowWatermark(e.target.value)}
                    className="w-28 px-3 py-1.5 text-sm font-semibold text-[#3A342E] bg-white border border-[#C3D3DE] rounded-lg text-right font-sans focus:outline-none focus:border-[#74818E]"
                  />
                </div>
              </div>
            </div>

            {/* Notification preference check lists */}
            <div className="pt-2 space-y-3 font-sans">
              <span className="text-[11px] font-bold text-[#74818E] uppercase tracking-wider block flex items-center gap-1.5">
                <BellRing size={12} /> 通知偏好設定
              </span>
              
              <div className="flex items-center justify-between py-2 border-b border-[#F7F2E7]">
                <div className="text-left">
                  <span className="text-sm font-semibold text-[#3A342E] block">記帳變更通知</span>
                  <span className="text-[11px] text-[#74818E] font-medium mt-0.5 block">
                    群組內新增、修改或刪除支出項目時發送即時系統通知
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyExpenseChange(!notifyExpenseChange)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                    notifyExpenseChange ? 'bg-[#74818E]' : 'bg-[#C3D3DE]'
                  }`}
                >
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform shadow-xs ${
                    notifyExpenseChange ? 'left-[22px]' : 'left-[2px]'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="text-left">
                  <span className="text-sm font-semibold text-[#3A342E] block">審核狀態通知</span>
                  <span className="text-[11px] text-[#74818E] font-medium mt-0.5 block">
                    結算鎖定、核准與已結清狀態變更時發送即時對帳通知
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifySettleStatus(!notifySettleStatus)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                    notifySettleStatus ? 'bg-[#74818E]' : 'bg-[#C3D3DE]'
                  }`}
                >
                  <span className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform shadow-xs ${
                    notifySettleStatus ? 'left-[22px]' : 'left-[2px]'
                  }`} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Section 4: Advanced Data exporting & Safe leaving boundaries */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-[#C3D3DE]/30 space-y-4">
          <h2 className="text-sm font-bold text-[#3A342E] pb-3 mb-2 border-b border-[#F7F2E7] flex items-center gap-2 font-sans">
            <Shield className="text-[#74818E]" size={18} />
            進階管理與安全邊界
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-[#F7F2E7] font-sans">
            <div className="text-left">
              <span className="text-sm font-semibold text-[#3A342E] block">匯出資料</span>
              <span className="text-xs text-[#74818E] font-medium mt-0.5 block">
                下載本群組的所有支出明細與結算紀錄為標準 CSV 格式。
              </span>
            </div>
            <button 
              className="px-4 py-2 text-xs font-bold text-[#74818E] bg-white border border-[#C3D3DE] rounded-lg hover:bg-[#F7F2E7] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer font-sans" 
              type="button"
            >
              <Download size={12} />
              匯出 CSV
            </button>
          </div>

          {/* Reset Mock Data to 3 initial items */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-[#F7F2E7] font-sans">
            <div className="text-left">
              <span className="text-sm font-semibold text-[#3A342E] block">重置為初始 Mock Data (3 筆原始狀態)</span>
              <span className="text-xs text-[#74818E] font-medium mt-0.5 block">
                一鍵清除本機暫存，重置為小林代墊晚餐($200)、阿明代墊衛生紙($150)、Alice代墊計程車($240)之未鎖定、未結算狀態。
              </span>
            </div>
            <button 
              onClick={() => {
                resetToDefaultData();
                setResetFeedback(true);
                setTimeout(() => setResetFeedback(false), 2500);
              }}
              className="px-4 py-2 text-xs font-bold text-[#74818E] hover:text-[#3A342E] bg-white border border-[#C3D3DE] hover:border-[#74818E] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer font-sans shrink-0" 
              type="button"
            >
              <RefreshCw size={12} className={resetFeedback ? 'animate-spin text-[#8FB96C]' : ''} />
              {resetFeedback ? '已恢復 3 筆原始資料' : '重置原始資料'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 font-sans">
            <div className="text-left">
              <span className="text-sm font-semibold text-[#3A342E] block">群組身分操作</span>
              <span className="text-xs text-[#74818E] font-medium mt-0.5 block">
                需等帳目歸零或全數對帳結清後方可安全退出群組。
              </span>
            </div>
            <button 
              className="px-4 py-2 text-xs font-bold text-[#74818E] bg-white border border-[#C3D3DE] hover:border-[#74818E] hover:text-[#3A342E] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer font-sans" 
              type="button"
            >
              <LogOut size={12} />
              🚪 離開群組
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
