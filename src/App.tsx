import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import ExpensesView from './components/ExpensesView';
import SettlementView from './components/SettlementView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AddExpenseModal from './components/AddExpenseModal';
import { TEST_USERS } from './types';
import { LedgerProvider, useLedger } from './context/LedgerContext';

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    isQuickRecordOpen,
    setIsQuickRecordOpen,
    editingExpense,
    setEditingExpense,
    openEditExpenseModal,
    currentUser,
    setCurrentUser,
    expenses,
    handleAddExpense,
    handleDeleteExpense,
    handleUpdateExpense
  } = useLedger();

  // 頁面切換強制置頂：確保切換任何頁面時畫面立即滾動至最頂端，絕不保留前次瀏覽停留位置
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Switch view tabs safely
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DashboardView 
            onNavigate={(tab) => setActiveTab(tab)} 
            expenses={expenses}
            currentUser={currentUser}
          />
        );
      case 'details':
        return (
          <ExpensesView 
            expenses={expenses} 
            onDeleteExpense={handleDeleteExpense}
            onOpenQuickRecord={() => {
              setEditingExpense(null);
              setIsQuickRecordOpen(true);
            }}
            onEditExpense={openEditExpenseModal}
          />
        );
      case 'settlement':
        return <SettlementView />;
      case 'reports':
        return <ReportsView expenses={expenses} />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView 
            onNavigate={(tab) => setActiveTab(tab)} 
            expenses={expenses}
            currentUser={currentUser}
          />
        );
    }
  };

  return (
    <div className="min-h-screen h-auto md:h-auto overflow-visible md:overflow-visible flex flex-col bg-[#F7F2E7] text-[#3A342E] font-sans antialiased">
      
      {/* Unified Reusable Header Navigation bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onQuickRecordClick={() => {
          setEditingExpense(null);
          setIsQuickRecordOpen(true);
        }}
        currentUser={currentUser}
        onSelectUser={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(TEST_USERS[0])}
      />

      {/* Main Content Layout Container */}
      <main className="flex-grow h-auto md:h-auto overflow-visible md:overflow-visible w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-24 md:pb-8">
        {renderActiveView()}
      </main>

      {/* Shared Cohesive Footer Section */}
      <footer className="bg-[#FAF7EE] border-t border-[#C3D3DE]/30 py-6 text-xs text-[#74818E] select-none">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-bold text-sm text-[#3A342E] tracking-tight font-sans">Nagomi Ledger</span>
            <span className="opacity-80">© 2024 Nagomi Ledger. Mindful Finance. All rights reserved.</span>
          </div>
          <nav aria-label="頁尾導航" className="flex items-center gap-6 font-semibold">
            <a className="hover:text-[#3A342E] transition-colors" href="#">隱私權政策</a>
            <a className="hover:text-[#3A342E] transition-colors" href="#">使用條款</a>
            <a className="hover:text-[#3A342E] transition-colors" href="#">支援服務</a>
          </nav>
        </div>
      </footer>

      {/* Reusable Form Drawer Modal */}
      <AddExpenseModal 
        isOpen={isQuickRecordOpen}
        onClose={() => {
          setIsQuickRecordOpen(false);
          setEditingExpense(null);
        }}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
        editingExpense={editingExpense}
        currentUser={currentUser}
      />

    </div>
  );
}

export default function App() {
  return (
    <LedgerProvider>
      <AppContent />
    </LedgerProvider>
  );
}
