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

  const isMoreActive = ['suppliers', 'expenses', 'employees', 'settings'].includes(currentTab);

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
          <h1 
            onClick={() => onSelectTab('register')}
            style={{ fontFamily: 'Verdana, sans-serif', fontStyle: 'normal' }}
            className="text-sm sm:text-base font-bold not-italic tracking-tight text-white cursor-pointer select-none whitespace-nowrap hover:text-sky-400 transition-colors m-0 p-0 inline-block"
          >
            Nexus POS
          </h1>
        </div>

        {/* Zone 2: Navigation Links for Tablet / Desktop (Clean, responsive, non-clipped layout) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
          {/* Primary POS Tabs */}
          <button
            onClick={() => onSelectTab('register')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'register' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'inventory' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>

          <button
            onClick={() => onSelectTab('receivings')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'receivings' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Receivings</span>
          </button>

          <button
            onClick={() => onSelectTab('customers')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'customers' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>

          {/* On wider desktop screens (xl: 1280px+), show Suppliers directly */}
          <button
            onClick={() => onSelectTab('suppliers')}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'suppliers' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Suppliers</span>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'reports' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>

          {/* On 2xl screens, show Expenses directly */}
          <button
            onClick={() => onSelectTab('expenses')}
            className={`hidden 2xl:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              currentTab === 'expenses' ? 'header-nav-active' : 'header-nav-btn'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Expenses</span>
          </button>

          {/* More / Operations Dropdown (Visible on PC, unclipped, with active state indicator) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isMoreActive ? 'header-nav-active' : 'header-nav-btn'
              }`}
              title="Additional Management & Administration Tabs"
            >
              {currentTab === 'suppliers' && <Building2 className="w-3.5 h-3.5 xl:hidden" />}
              {currentTab === 'expenses' && <ReceiptText className="w-3.5 h-3.5 2xl:hidden" />}
              {currentTab === 'employees' && <ShieldCheck className="w-3.5 h-3.5" />}
              {currentTab === 'settings' && <Sliders className="w-3.5 h-3.5" />}
              {!isMoreActive && <MoreHorizontal className="w-3.5 h-3.5" />}

              <span>
                {currentTab === 'suppliers' ? 'Suppliers' :
                 currentTab === 'expenses' ? 'Expenses' :
                 currentTab === 'employees' ? 'Staff & Roles' :
                 currentTab === 'settings' ? 'Settings' : 'More'}
              </span>

              <span className={`text-[10px] transform transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {showMoreMenu && (
              <div className="header-dropdown absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-1.5 z-50 divide-y backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Operations
                  </div>
                  
                  <button
                    onClick={() => { onSelectTab('suppliers'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentTab === 'suppliers' ? 'header-dropdown-item-active' : 'header-dropdown-item'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 opacity-80" />
                      <span>Suppliers</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onSelectTab('expenses'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentTab === 'expenses' ? 'header-dropdown-item-active' : 'header-dropdown-item'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ReceiptText className="w-4 h-4 opacity-80" />
                      <span>Store Expenses</span>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Administration
                  </div>

                  <button
                    onClick={() => { onSelectTab('employees'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentTab === 'employees' ? 'header-dropdown-item-active' : 'header-dropdown-item'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 opacity-80" />
                      <span>Staff & Roles</span>
                    </div>
                    {currentUser.role !== 'admin' && (
                      <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { onSelectTab('settings'); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentTab === 'settings' ? 'header-dropdown-item-active' : 'header-dropdown-item'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 opacity-80" />
                      <span>Store Settings</span>
                    </div>
                    {currentUser.role !== 'admin' ? (
                      <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Admin Only
                      </span>
                    ) : (
                      <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
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
              className={`header-action-btn flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                firebaseUser && syncState === 'syncing' ? 'header-action-btn-syncing' : ''
              }`}
              title={firebaseUser ? `Nexus Cloud Sync: ${syncState}` : 'Sign in to enable Cloud Sync'}
            >
              {syncState === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline text-[11px]">
                {firebaseUser ? (syncState === 'syncing' ? 'Syncing' : 'Cloud') : 'Cloud Off'}
              </span>
            </button>
          )}

          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="header-action-btn p-1.5 rounded-lg text-xs transition-colors hidden lg:flex items-center"
              title="Keyboard Shortcuts (F1)"
              aria-label="Keyboard Shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="header-action-btn p-1.5 rounded-lg text-xs transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {heldSalesCount > 0 && (
            <button
              onClick={onResumeHeld}
              className="header-action-btn header-held-btn flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap font-medium"
              title={`${heldSalesCount} held sale(s)`}
            >
              <span>Held ({heldSalesCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSwitchUser}
              className="header-action-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap font-medium"
              title="Switch Staff or Lock Register"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold truncate max-w-[70px] sm:max-w-none">{currentUser.first_name}</span>
              <span className="header-badge hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
              <Lock className="w-3 h-3 ml-0.5 shrink-0 opacity-75" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="header-action-btn p-1.5 rounded-lg text-xs transition-colors"
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
        <div className="md:hidden border-t header-dropdown px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150" ref={drawerRef}>
          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-white/10">
            <button
              onClick={() => handleMobileNavClick('register')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'register' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Register</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('inventory')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'inventory' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('receivings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'receivings' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Receivings</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('customers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'customers' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('reports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'reports' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('suppliers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'suppliers' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Suppliers</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('expenses')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'expenses' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Expenses</span>
            </button>

            <button
              onClick={() => handleMobileNavClick('employees')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === 'employees' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Staff & Roles</span>
              </div>
              {currentUser.role !== 'admin' && (
                <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  Admin
                </span>
              )}
            </button>

            <button
              onClick={() => handleMobileNavClick('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold col-span-2 ${
                currentTab === 'settings' ? 'header-nav-active' : 'header-dropdown-item'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Store Settings & Country Currency</span>
              </div>
              {currentUser.role !== 'admin' ? (
                <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Admin Only
                </span>
              ) : (
                <span className="header-badge text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
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
                className="header-action-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  <span>Cloud Sync & Account</span>
                </div>
                <span className="header-badge text-[10px] font-mono px-2 py-0.5 rounded">
                  {firebaseUser ? (syncState === 'syncing' ? 'Syncing...' : 'Connected') : 'Sign In'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
