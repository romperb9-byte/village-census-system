import React from 'react';
import { 
  Users, 
  BarChart3, 
  ClipboardPlus, 
  ListOrdered, 
  Download, 
  Settings, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  Home,
  CheckCircle2
} from 'lucide-react';
import { Enumerator, SyncStatus, VillageSettings } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'form' | 'households' | 'enumerators';
  setActiveTab: (tab: 'dashboard' | 'form' | 'households' | 'enumerators') => void;
  activeUser: Enumerator;
  syncStatus: SyncStatus;
  villageSettings: VillageSettings;
  onOpenUserSelector: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  syncStatus,
  villageSettings,
  onOpenUserSelector,
  onOpenSettings,
  onOpenExport,
  onSync,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Top Banner with Village Name & Quick Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Village Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                  ប្រព័ន្ធជំរឿនស្ថិតិកម្រិតភូមិ
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {villageSettings.villageName}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {villageSettings.communeName} · {villageSettings.districtName} · {villageSettings.provinceName}
              </p>
            </div>
          </div>

          {/* Right Controls: Sync Button, Active User, Settings */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={syncStatus.isSyncing}
              title="ចុចដើម្បី Sync ទិន្នន័យទៅ Supabase"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                syncStatus.isSyncing
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                  : syncStatus.pendingCount > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-amber-500/20 animate-bounce-short'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {syncStatus.isSyncing ? 'កំពុង Sync...' : syncStatus.pendingCount > 0 ? `Sync (${syncStatus.pendingCount})` : 'Sync រួចរាល់'}
              </span>
              {syncStatus.pendingCount > 0 && (
                <span className="sm:hidden bg-white text-amber-700 rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {syncStatus.pendingCount}
                </span>
              )}
            </button>

            {/* User Profile Selector (1 of 12) */}
            <button
              onClick={onOpenUserSelector}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-all border border-slate-200"
              title="ចុចដើម្បីប្តូរអ្នកប្រើប្រាស់ទាំង ១២ នាក់"
            >
              <div className={`w-6 h-6 rounded-full ${activeUser.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center text-[10px] font-bold shadow-xs`}>
                {activeUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold leading-tight line-clamp-1">{activeUser.khmerName}</p>
                <p className="text-[10px] text-slate-500">{activeUser.groupAssigned}</p>
              </div>
              <UserCheck className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Export Button */}
            <button
              onClick={onOpenExport}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="ទាញយកទិន្នន័យ Excel / CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="ការកំណត់ Supabase & ភូមិ"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-100 py-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ផ្ទាំងស្ថិតិភូមិ (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'form'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPlus className="w-4 h-4" />
            <span>+ ស្រង់ទិន្នន័យថ្មី</span>
          </button>

          <button
            onClick={() => setActiveTab('households')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'households'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>បញ្ជីខ្នងផ្ទះ & គ្រួសារ</span>
          </button>

          <button
            onClick={() => setActiveTab('enumerators')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'enumerators'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ក្រុមការងារទាំង ១២ នាក់</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
