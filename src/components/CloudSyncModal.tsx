import React, { useState } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  LogIn, 
  X, 
  Laptop, 
  ArrowRightLeft
} from 'lucide-react';
import { UserAccount, SyncState } from '../types/pos';
import { User as FirebaseUser } from 'firebase/auth';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  userAccount?: UserAccount | null;
  syncState: SyncState;
  lastSyncedAt: string | null;
  syncError: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onPushToCloud: () => Promise<void>;
  onPullFromCloud: () => Promise<void>;
  onFullSync: () => Promise<void>;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  itemCount: number;
  salesCount: number;
  customersCount: number;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncState,
  lastSyncedAt,
  syncError,
  onLogin,
  onLogout,
  onPushToCloud,
  onPullFromCloud,
  onFullSync,
  autoSyncEnabled,
  onToggleAutoSync,
  itemCount,
  salesCount,
  customersCount,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (action: () => Promise<void>, msg: string) => {
    setIsProcessing(true);
    setActionSuccessMessage(null);
    try {
      await action();
      setActionSuccessMessage(msg);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Nexus Cloud Sync & Account</h2>
              <p className="text-[11px] text-slate-400">Multi-device real-time sync & cloud backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* Account Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Account Status
              </span>
              {currentUser ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Local Mode (Offline)
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Nexus User'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAction(onLogout, 'Signed out of cloud sync')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sign in with Google to enable automatic cloud backup, live inventory synchronization across multiple devices, and remote reporting.
                </p>
                <button
                  onClick={() => handleAction(onLogin, 'Successfully connected to Nexus Cloud!')}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Status Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-750 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {syncState === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
                ) : syncState === 'synced' ? (
                  <Cloud className="w-4 h-4 text-emerald-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {syncState === 'syncing' ? 'Syncing data with cloud...' : syncState === 'synced' ? 'All records up to date' : 'Local Storage Only'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Never'}
              </p>
            </div>

            {/* Quick Auto-sync toggle */}
            {currentUser && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Live Sync</span>
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={e => onToggleAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            )}
          </div>

          {/* Feedback messages */}
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Data Summary Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Catalog Items</div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{itemCount}</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Customers</div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{customersCount}</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Total Sales</div>
              <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{salesCount}</div>
            </div>
          </div>

          {/* Cloud Action Buttons */}
          {currentUser && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Sync Operations
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction(onPushToCloud, 'Successfully uploaded local data to Cloud database!')}
                  disabled={isProcessing}
                  className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 transition-colors text-left font-semibold text-xs"
                >
                  <CloudUpload className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">Backup to Cloud</div>
                    <div className="text-[10px] text-slate-500 font-normal">Push local records to cloud</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onPullFromCloud, 'Successfully downloaded cloud catalog & records!')}
                  disabled={isProcessing}
                  className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 transition-colors text-left font-semibold text-xs"
                >
                  <CloudDownload className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-slate-900 dark:text-white font-bold">Restore from Cloud</div>
                    <div className="text-[10px] text-slate-500 font-normal">Pull remote items & updates</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => handleAction(onFullSync, 'Complete 2-way cloud synchronization finished!')}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Perform Full 2-Way Sync Now</span>
              </button>
            </div>
          )}

          {/* Multi-Device Architecture Note */}
          <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/50 rounded-xl text-[11px] text-sky-900 dark:text-sky-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Laptop className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Multi-Terminal Cloud Architecture</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-sky-800 dark:text-sky-400">
              Nexus POS uses an offline-first distributed architecture. If your Internet disconnects, the register seamlessly stores sales locally in IndexedDB and automatically syncs when connectivity returns.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
