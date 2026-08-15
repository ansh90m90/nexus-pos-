import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  BarChart3, 
  MoreHorizontal, 
  UserCheck, 
  Lock, 
  DollarSign, 
  Building2, 
  ReceiptText, 
  Sliders, 
  ShieldCheck,
  Sun,
  Moon,
  Keyboard,
  Menu,
  X,
  Cloud,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { Employee, SyncState } from '../types/pos';
import { User as FirebaseUser } from 'firebase/auth';

export type NavTab = 
  | 'register' 
  | 'inventory' 
  | 'receivings' 
  | 'customers' 
  | 'reports' 
  | 'suppliers' 
  | 'expenses' 
  | 'cashups' 
  | 'employees' 
  | 'settings';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: Employee;
  onOpenSwitchUser: () => void;
  onLogout?: () => void;
  heldSalesCount: number;
  onResumeHeld: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenShortcuts?: () => void;
  syncState?: SyncState;
  firebaseUser?: FirebaseUser | null;
  onOpenCloudSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenSwitchUser,
  onLogout,
  heldSalesCount,
  onResumeHeld,
  theme = 'light',
  onToggleTheme,
  onOpenShortcuts,
  syncState = 'idle',
  firebaseUser = null,
  onOpenCloudSync,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setShowMobileDrawer(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = ['suppliers', 'expenses', 'cashups', 'employees', 'settings'].includes(currentTab);

  const handleMobileNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setShowMobileDrawer(false);
  };

  return (
    <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xs transition-colors">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 flex items-center justify-between h-14 gap-2 lg:gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) & Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMobileDrawer(!showMobileDrawer)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg md:hidden flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {showMobileDrawer ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span 
            onClick={() => onSelectTab('register')}
            className="text-sm sm:text-base font-bold tracking-tight text-white cursor-pointer select-none whitespace-nowrap hover:text-sky-400 transition-colors"
          >
            Nexus POS
          </span>
        </div>

        {/* Zone 2: Navigation Links for Tablet / Desktop (Clean, responsive, non-clipped layout) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
          {/* Primary POS Tabs */}
          <button
            onClick={() => onSelectTab('register')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'register'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'inventory'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>

          <button
            onClick={() => onSelectTab('receivings')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'receivings'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Receivings</span>
          </button>

          <button
            onClick={() => onSelectTab('customers')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'customers'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>

          {/* On wider desktop screens (xl: 1280px+), show Suppliers directly */}
          <button
            onClick={() => onSelectTab('suppliers')}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'suppliers'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Suppliers</span>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'reports'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>

          {/* On 2xl screens, show Expenses & Cashups directly */}
          <button
            onClick={() => onSelectTab('expenses')}
            className={`hidden 2xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'expenses'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Expenses</span>
          </button>

          <button
            onClick={() => onSelectTab('cashups')}
            className={`hidden 2xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'cashups'
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cashups</span>
          </button>

          {/* More / Operations Dropdown (Visible on PC, unclipped, with active state indicator) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isMoreActive
                  ? 'bg-sky-950 text-sky-300 border border-sky-600/70 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Additional Management & Administration Tabs"
            >
              {currentTab === 'suppliers' && <Building2 className="w-3.5 h-3.5 xl:hidden text-sky-400" />}
              {currentTab === 'expenses' && <ReceiptText className="w-3.5 h-3.5 2xl:hidden text-sky-400" />}
              {currentTab === 'cashups' && <DollarSign className="w-3.5 h-3.5 2xl:hidden text-sky-400" />}
              {currentTab === 'employees' && <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
              {currentTab === 'settings' && <Sliders className="w-3.5 h-3.5 text-amber-400" />}
              {!isMoreActive && <MoreHorizontal className="w-3.5 h-3.5" />}

              <span>
                {currentTab === 'suppliers' ? 'Suppliers' :
                 currentTab === 'expenses' ? 'Expenses' :
                 currentTab === 'cashups' ? 'Cashups' :
                 currentTab === 'employees' ? 'Staff & Roles' :
                 currentTab === 'settings' ? 'Settings' : 'More'}
              </span>

              <span className={`text-[10px] transform transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200 divide-y divide-slate-800 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Operations
                  </div>
                  
                  <button
                    onClick={() => { onSelectTab('suppliers'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentTab === 'suppliers' ? 'text-sky-400 font-bold bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>Suppliers</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onSelectTab('expenses'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentTab === 'expenses' ? 'text-sky-400 font-bold bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 text-slate-400" />
                      <span>Store Expenses</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onSelectTab('cashups'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentTab === 'cashups' ? 'text-sky-400 font-bold bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>Daily Cashups</span>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Administration
                  </div>

                  <button
                    onClick={() => { onSelectTab('employees'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentTab === 'employees' ? 'text-purple-300 font-bold bg-purple-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Staff & Roles</span>
                    </div>
                    {currentUser.role !== 'admin' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { onSelectTab('settings'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentTab === 'settings' ? 'text-amber-300 font-bold bg-amber-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>Store Settings</span>
                    </div>
                    {currentUser.role !== 'admin' ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Admin Only
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Primary Actions (Theme Toggle, Cloud Sync, Shortcuts, Cashier status & Held sales) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud Sync & Account Status Button */}
          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                firebaseUser
                  ? syncState === 'syncing'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={firebaseUser ? `Nexus Cloud Sync: ${syncState}` : 'Sign in to enable Cloud Sync'}
            >
              {syncState === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              ) : firebaseUser ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline text-[11px]">
                {firebaseUser ? (syncState === 'syncing' ? 'Syncing' : 'Cloud') : 'Cloud Off'}
              </span>
            </button>
          )}

          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs transition-colors hidden lg:flex items-center"
              title="Keyboard Shortcuts (F1)"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-sky-300" />
              )}
            </button>
          )}

          {heldSalesCount > 0 && (
            <button
              onClick={onResumeHeld}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs hover:bg-amber-500/30 transition-colors whitespace-nowrap font-medium"
              title={`${heldSalesCount} held sale(s)`}
            >
              <span>Held ({heldSalesCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSwitchUser}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors whitespace-nowrap font-medium"
              title="Switch Staff or Lock Register"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate max-w-[70px] sm:max-w-none">{currentUser.first_name}</span>
              <span className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                currentUser.role === 'admin'
                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                  : currentUser.role === 'manager'
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
              }`}>
                {currentUser.role}
              </span>
              <Lock className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700/60 rounded-lg text-xs transition-colors"
                title="Sign Out to Terminal Login Gate"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Menu for Phone Viewports */}
      {showMobileDrawer && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150" ref={drawerRef}>
          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-slate-800">
            <button
              onClick={() => handleMobileNavClick('register')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'register' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Register</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('inventory')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'inventory' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('receivings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'receivings' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Receivings</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('customers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'customers' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('reports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'reports' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('suppliers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'suppliers' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Suppliers</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('expenses')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'expenses' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Expenses</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('cashups')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'cashups' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Daily Cashups</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('employees')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'employees' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Staff & Roles</span>
              </div>
              {currentUser.role !== 'admin' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold uppercase">
                  Admin
                </span>
              )}
            </button>

            <button
              onClick={() => handleMobileNavClick('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'settings' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Store Settings</span>
              </div>
              {currentUser.role !== 'admin' ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Admin Only
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                  Admin
                </span>
              )}
            </button>
          </div>

          {onOpenCloudSync && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenCloudSync();
                  setShowMobileDrawer(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  firebaseUser
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>Cloud Sync & Account</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900">
                  {firebaseUser ? (syncState === 'syncing' ? 'Syncing...' : 'Connected') : 'Sign In'}
                </span>
              </button>
            </div>
          )}

          {onLogout && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-bold">{currentUser.first_name} {currentUser.last_name}</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-mono uppercase text-sky-400 rounded">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

