import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ClipboardList, 
  Scale, 
  BarChart3, 
  Settings, 
  Bell, 
  Plus, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Check, 
  CheckCircle,
  FlaskConical,
  RotateCcw
} from 'lucide-react';
import { ActiveTab, AppUser, TEST_USERS } from '../types';
import { useLedger } from '../context/LedgerContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickRecordClick: () => void;
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
  onLogout?: () => void;
  onResetData?: () => void;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onQuickRecordClick,
  currentUser,
  onSelectUser,
  onLogout,
  onResetData
}: NavbarProps) {
  const { 
    resetToDefaultData, 
    userNotifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    isQuickRecordOpen
  } = useLedger();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
  };

  // Refs for click outside handling
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'details' as ActiveTab, label: '支出明細', icon: ClipboardList },
    { id: 'settlement' as ActiveTab, label: '結算中心', icon: Scale },
    { id: 'reports' as ActiveTab, label: '報表統計', icon: BarChart3 },
  ];

  // Click outside listener for Notification Dropdown
  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Click outside listener for Avatar Dropdown
  useEffect(() => {
    if (!isAvatarDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAvatarDropdownOpen]);

  const handleProfileSettingsClick = () => {
    setIsAvatarDropdownOpen(false);
    setProfileFeedback(`已開啟【${currentUser.name}】的個人資料設定`);
    setTimeout(() => setProfileFeedback(null), 3000);
  };

  const handleLogoutClick = () => {
    setIsAvatarDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
    setProfileFeedback('已模擬登出，請點選右上角頭像切換測試身分');
    setTimeout(() => setProfileFeedback(null), 3500);
  };

  const handleGroupSettingsClick = () => {
    setIsAvatarDropdownOpen(false);
    setActiveTab('settings');
  };

  const handleSwitchUser = (user: AppUser) => {
    setIsAvatarDropdownOpen(false);
    onSelectUser(user);
    setProfileFeedback(`已切換為：${user.name}`);
    setTimeout(() => setProfileFeedback(null), 2500);
  };

  const handleResetDataClick = () => {
    setIsAvatarDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onResetData) {
      onResetData();
    } else {
      resetToDefaultData();
    }
    setProfileFeedback('已恢復預設 3 筆測試帳款');
    setTimeout(() => setProfileFeedback(null), 3000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F7F2E7]/95 backdrop-blur-md border-b border-[#C3D3DE]/40 shadow-2xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="navbar-brand"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/60 flex items-center justify-center p-1 border border-[#C3D3DE]/60 shadow-2xs group-hover:scale-105 transition-transform">
              <img 
                alt="Nagomi Ledger Logo" 
                className="w-full h-full object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMzqi-VWFRanu2EN9vHiW-sdVCksaGuF8lJsKIjV3u1Y5bp6XdQjRKtaNmZYSQp_XxqSsCfqoNZ_FCuPs8gz72Whd_m-V1I3KaVXJcUpJNPivRuOT6numrb2SUb6oVz1czUoudYg5PJMoDfEz1N7DEqyxyqKejZZfsUHH--oQfZs3FeIUishtDvMFHC1TZSpBauxLyZHjaGzhDpYSoUxC6tq3zAp58_M4M4sGKjDkhfIaD7-5JKimPYB-Yw-bSXV5dy80"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#3A342E] group-hover:text-[#74818E] transition-colors font-sans">
                Nagomi Ledger
              </span>
              <span className="text-[9px] text-[#74818E] font-medium -mt-1 hidden sm:inline tracking-wider">
                和風分帳 · 家計簿
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="全站主要分頁導航" className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-full relative transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive 
                      ? 'text-[#3A342E] font-semibold bg-white/70 shadow-xs border border-[#C3D3DE]/40' 
                      : 'text-[#74818E] hover:text-[#3A342E] hover:bg-white/30'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#3A342E]' : 'text-[#74818E]'} />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#74818E] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Items - Clean & Spaced */}
          <div className="flex items-center gap-3">
            
            {/* Notification Popover */}
            <div className="relative" ref={notificationDropdownRef}>
              <button 
                id="notification-bell-btn"
                aria-label="查看通知" 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsAvatarDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                  isNotificationOpen
                    ? 'text-[#3A342E] bg-white/70 shadow-2xs ring-2 ring-[#74818E]/30'
                    : 'text-[#74818E] hover:text-[#3A342E] hover:bg-white/50'
                }`}
                type="button"
              >
                <Bell size={19} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F0883E] rounded-full ring-2 ring-[#F7F2E7]" />
                )}
              </button>

              {/* Notification Popover Window */}
              {isNotificationOpen && (
                <div className="absolute right-0 sm:-right-8 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#C3D3DE]/60 z-30 py-2 divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Popover Header */}
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell size={14} className="text-[#74818E]" />
                      <span className="text-xs font-bold text-[#3A342E] font-sans">即時通知</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="text-[10px] bg-[#C1503B]/10 text-[#C1503B] px-2 py-0.2 rounded-full font-bold">
                          {unreadNotificationsCount} 則未讀
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 ? (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-[#74818E] hover:text-[#3A342E] font-bold font-sans transition-colors cursor-pointer hover:underline"
                      >
                        標示為已讀
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#74818E]/70 font-bold font-sans">
                        全部已讀
                      </span>
                    )}
                  </div>

                  {/* Notification Items List */}
                  <div className="py-1 max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {userNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#74818E]/70 font-sans">
                        目前沒有任何通知
                      </div>
                    ) : (
                      userNotifications.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            markNotificationAsRead(item.id);
                            setIsNotificationOpen(false);
                            if (item.targetTab) {
                              setActiveTab(item.targetTab);
                            }
                          }}
                          className={`px-4 py-3 hover:bg-[#F7F4EF]/60 transition-colors cursor-pointer group flex items-start gap-2.5 ${
                            item.unread ? 'bg-[#F7F4EF]/30' : ''
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                            item.sender === '林' 
                              ? 'bg-[#8FB96C]/20 text-[#8FB96C]' 
                              : item.sender === '明'
                              ? 'bg-[#74818E]/20 text-[#74818E]'
                              : item.sender === '我' || item.sender === 'A'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.sender}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <div className="text-xs font-bold text-[#3A342E] group-hover:text-[#74818E] transition-colors font-sans truncate">
                                {item.title}
                              </div>
                              {item.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F0883E] shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#74818E] mt-0.5 font-sans leading-tight">
                              {item.desc}
                            </div>
                            <div className="text-[9px] text-[#74818E]/70 mt-1">{item.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Test Data Button (Desktop Ghost/Outline Style) */}
            <button
              type="button"
              id="reset-data-btn"
              onClick={handleResetDataClick}
              title="重置測試資料 (恢復為預設 3 筆初始支出)"
              className="hidden lg:inline-flex items-center px-3 py-2 text-xs font-medium text-[#74818E] hover:text-[#3A342E] hover:bg-[#C3D3DE]/30 active:bg-[#C3D3DE]/50 border border-[#C3D3DE]/60 rounded-lg transition-all gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw size={14} className="text-[#74818E]" />
              <span>重置資料</span>
            </button>

            {/* Quick Record Button (Desktop) - Direct Trigger */}
            <button 
              type="button"
              id="quick-record-btn"
              onClick={onQuickRecordClick}
              className="hidden lg:inline-flex items-center px-3.5 py-2 bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-[#F8FAFC] text-sm font-medium rounded-lg shadow-2xs transition-all duration-150 gap-1.5 focus:outline-none cursor-pointer"
            >
              <Plus size={15} />
              <span>快速記帳</span>
            </button>

            {/* Profile Avatar Trigger & Consolidated Dropdown Menu */}
            <div className="relative" ref={avatarDropdownRef}>
              <button 
                id="avatar-btn"
                onClick={() => {
                  setIsAvatarDropdownOpen(!isAvatarDropdownOpen);
                  setIsNotificationOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  isAvatarDropdownOpen || activeTab === 'settings'
                    ? 'border-[#74818E] ring-2 ring-[#74818E]/30' 
                    : 'border-[#C3D3DE] hover:border-[#74818E]'
                }`}
                title={`目前登入: ${currentUser.name} (點擊展開設定與切換身分)`}
              >
                <div className={`w-full h-full ${currentUser.avatarBg} text-white text-xs font-bold flex items-center justify-center font-sans select-none`}>
                  {currentUser.avatarText}
                </div>
              </button>

              {/* Integrated Profile & Dev Switcher Dropdown Menu */}
              {isAvatarDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#C3D3DE]/60 z-30 py-1 divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Section 1: Current Login Status Header */}
                  <div className="px-4 py-3 bg-[#FAF7EE] rounded-t-xl">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${currentUser.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                        {currentUser.avatarText}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#3A342E] truncate font-sans">
                            {currentUser.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            currentUser.role === 'Owner' 
                              ? 'bg-[#74818E] text-white' 
                              : 'bg-[#C3D3DE] text-[#3A342E]'
                          }`}>
                            {currentUser.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#74818E] truncate mt-0.5">
                          {currentUser.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: [DEV] Quick Switch Personas (固定 3 位成員) */}
                  <div className="py-2 px-1">
                    <div className="px-3 pb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#74818E] flex items-center gap-1.5 tracking-wider">
                        <FlaskConical size={13} className="text-[#F0883E]" />
                        [DEV] 快速切換測試身分
                      </span>
                      <span className="text-[9px] text-[#74818E]/80 bg-[#F7F2E7] px-1.5 py-0.2 rounded font-sans">
                        即時生效
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {TEST_USERS.map((user) => {
                        const isSelected = user.id === currentUser.id;
                        return (
                          <button
                            key={user.id}
                            onClick={() => {
                              handleSwitchUser(user);
                              setIsAvatarDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-[#F7F2E7] font-bold text-[#3A342E]' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-5 h-5 rounded-full ${user.avatarBg} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                {user.avatarText}
                              </div>
                              <span className="truncate">{user.name}</span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-[#8FB96C] shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Navigation & Profile Settings */}
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        handleGroupSettingsClick();
                        setIsAvatarDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#3A342E] hover:bg-[#F7F2E7] transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Settings size={14} className="text-[#74818E]" />
                      群組設定
                    </button>

                    <button 
                      onClick={() => {
                        handleProfileSettingsClick();
                        setIsAvatarDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#3A342E] hover:bg-[#F7F2E7] transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <User size={14} className="text-[#74818E]" />
                      個人資料設定
                    </button>
                  </div>

                  {/* Section 4: Dev & Reset Actions */}
                  <div className="py-1">
                    <button 
                      onClick={handleResetDataClick}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#74818E] hover:bg-[#F7F2E7] hover:text-[#3A342E] transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <RotateCcw size={14} className="text-[#74818E]" />
                      重置測試資料 (預設 3 筆)
                    </button>
                  </div>

                  {/* Section 5: Logout */}
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        handleLogoutClick();
                        setIsAvatarDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#C1503B] hover:bg-[#C1503B]/5 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut size={14} className="text-[#C1503B]" />
                      登出
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Mobile Menu Toggle button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsAvatarDropdownOpen(false);
                setIsNotificationOpen(false);
              }}
              className="p-2 text-[#74818E] hover:text-[#3A342E] hover:bg-white/40 rounded-full transition-colors lg:hidden focus:outline-none cursor-pointer"
              aria-label={isMobileMenuOpen ? "關閉選單" : "開啟選單"}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu with Smooth Slide Transition (Absolute Floating Overlay) */}
        <div
          id="mobile-nav-menu"
          className={`absolute top-full left-0 w-full lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#FAF7EE] shadow-xl z-50 ${
            isMobileMenuOpen
              ? 'max-h-96 opacity-100 border-b border-[#C3D3DE]/40 translate-y-0 pointer-events-auto'
              : 'max-h-0 opacity-0 border-b-0 pointer-events-none -translate-y-2'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="px-5 py-4 flex flex-col space-y-1">
            {/* Quick Record Button */}
            <button
              type="button"
              id="mobile-quick-record-btn"
              onClick={() => {
                onQuickRecordClick();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 text-base rounded-xl transition-colors cursor-pointer bg-[#606D7A] text-[#F8FAFC] hover:bg-[#475569] font-medium shadow-2xs mb-2"
            >
              <Plus size={20} />
              <span>快速記帳</span>
            </button>

            {/* Navigation Tab Links */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`mobile-nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-base rounded-xl transition-colors cursor-pointer ${
                    isActive 
                      ? 'text-[#3A342E] font-bold bg-[#74818E]/10' 
                      : 'text-[#74818E] hover:text-[#3A342E] hover:bg-black/5 font-medium'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-[#3A342E]' : 'text-[#74818E]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Group Settings Link */}
            <button
              type="button"
              id="mobile-nav-settings"
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-base rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings' 
                  ? 'text-[#3A342E] font-bold bg-[#74818E]/10' 
                  : 'text-[#74818E] hover:text-[#3A342E] hover:bg-black/5 font-medium'
              }`}
            >
              <Settings size={20} className={activeTab === 'settings' ? 'text-[#3A342E]' : 'text-[#74818E]'} />
              <span>群組設定</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Toast */}
        {profileFeedback && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#3A342E] text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 z-[70] animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle size={14} className="text-[#8FB96C]" />
            <span>{profileFeedback}</span>
          </div>
        )}
      </header>

      {/* Mobile Menu Backdrop for Closing on Tap Outside */}
      <div 
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Mobile/Tablet Floating Action Button (FAB) for Quick Record (< lg) mounted directly to document.body via Portal */}
      {!isQuickRecordOpen && typeof document !== 'undefined' && createPortal(
        <button
          type="button"
          id="quick-record-fab"
          onClick={onQuickRecordClick}
          aria-label="快速記帳"
          className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-[#606D7A] hover:bg-[#475569] active:bg-[#334155] text-white shadow-xl active:scale-95 transition-all duration-150 cursor-pointer"
          title="快速記帳"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>,
        document.body
      )}
    </>
  );
}
