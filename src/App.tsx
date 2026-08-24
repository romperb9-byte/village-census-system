import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CensusForm } from './components/CensusForm';
import { HouseholdList } from './components/HouseholdList';
import { EnumeratorTracker } from './components/EnumeratorTracker';
import { UserSelectorModal } from './components/UserSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { 
  Enumerator, 
  Household, 
  HouseholdMember, 
  VillageSettings, 
  SupabaseConfig, 
  SyncStatus 
} from './types';
import { 
  initializeLocalDatabase, 
  getActiveUser, 
  setActiveUser as saveActiveUserToStorage,
  getEnumerators, 
  saveEnumerators,
  getVillageSettings, 
  saveVillageSettings,
  getHouseholds, 
  getMembers, 
  saveHouseholdWithMembers, 
  deleteHousehold, 
  syncAllWithSupabase 
} from './lib/db';
import { getSavedSupabaseConfig } from './lib/supabase';
import { INITIAL_HOUSEHOLDS, INITIAL_MEMBERS, INITIAL_VILLAGE_SETTINGS } from './data/initialVillageData';
import { INITIAL_ENUMERATORS } from './data/enumeratorsData';

export const App: React.FC = () => {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'households' | 'enumerators'>('dashboard');
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // App Data
  const [activeUser, setActiveUser] = useState<Enumerator>(() => {
    initializeLocalDatabase();
    return getActiveUser();
  });
  const [enumerators, setEnumerators] = useState<Enumerator[]>(() => getEnumerators());
  const [villageSettings, setVillageSettings] = useState<VillageSettings>(() => getVillageSettings());
  const [households, setHouseholds] = useState<Household[]>(() => getHouseholds());
  const [members, setMembers] = useState<HouseholdMember[]>(() => getMembers());

  // Supabase & Sync State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSavedSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncedAt: localStorage.getItem('village_census_last_sync'),
    pendingCount: 0
  });

  // Editing State
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [editingMembers, setEditingMembers] = useState<HouseholdMember[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Online / Offline Listeners & Pending Count Calculation
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsyncedCount = households.filter(h => !h.synced).length;
    setSyncStatus(prev => ({ ...prev, pendingCount: unsyncedCount }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [households]);

  // Handle Switch User (1 of 12)
  const handleSelectUser = (user: Enumerator) => {
    setActiveUser(user);
    saveActiveUserToStorage(user);
    showToast(`បានប្តូរទៅកាន់គណនី: ${user.khmerName}`);
  };

  // Handle Save Village Settings
  const handleSaveVillageSettings = (settings: VillageSettings) => {
    setVillageSettings(settings);
    saveVillageSettings(settings);
    showToast('បានកែប្រែព័ត៌មានភូមិជោគជ័យ!');
  };

  // Handle Save Census Form
  const handleSaveCensusForm = async (household: Household, memberList: HouseholdMember[]) => {
    try {
      const res = await saveHouseholdWithMembers(household, memberList);
      
      // Update local state
      const updatedHouseholds = getHouseholds();
      const updatedMembers = getMembers();
      setHouseholds(updatedHouseholds);
      setMembers(updatedMembers);

      setEditingHousehold(null);
      setEditingMembers([]);
      setActiveTab('households');

      showToast(`រក្សាទុកទិន្នន័យខ្នងផ្ទះ "${household.householdCode} - ${household.headName}" ជោគជ័យ!`);
    } catch (err: any) {
      showToast(`កំហុសក្នុងការរក្សាទុក: ${err.message}`, 'error');
    }
  };

  // Handle Edit Household
  const handleEditHousehold = (household: Household) => {
    const hhMembers = members.filter(m => m.householdId === household.id);
    setEditingHousehold(household);
    setEditingMembers(hhMembers);
    setActiveTab('form');
  };

  // Handle Delete Household
  const handleDeleteHousehold = async (householdId: string) => {
    await deleteHousehold(householdId);
    setHouseholds(getHouseholds());
    setMembers(getMembers());
    showToast('បានលុបទិន្នន័យខ្នងផ្ទះរួចរាល់!');
  };

  // Handle Manual Sync
  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const result = await syncAllWithSupabase();
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      pendingCount: getHouseholds().filter(h => !h.synced).length
    }));

    if (result.success) {
      setHouseholds(getHouseholds());
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'info');
    }
  };

  // Handle Reset to Default Sample Data
  const handleResetData = () => {
    localStorage.clear();
    setHouseholds(INITIAL_HOUSEHOLDS);
    setMembers(INITIAL_MEMBERS);
    setEnumerators(INITIAL_ENUMERATORS);
    setVillageSettings(INITIAL_VILLAGE_SETTINGS);
    setActiveUser(INITIAL_ENUMERATORS[0]);
    initializeLocalDatabase();
    showToast('បាន Reset ទិន្នន័យត្រឡប់មកគំរូដើម!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white font-khmer">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-fadeIn">
          <div className={`py-2.5 px-4 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-800 text-white border-rose-700'
              : 'bg-slate-800 text-white border-slate-700'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeUser={activeUser}
        syncStatus={syncStatus}
        villageSettings={villageSettings}
        onOpenUserSelector={() => setIsUserSelectorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSync={handleSync}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            households={households}
            members={members}
            villageSettings={villageSettings}
            enumerators={enumerators}
            onNavigateToForm={() => {
              setEditingHousehold(null);
              setEditingMembers([]);
              setActiveTab('form');
            }}
            onNavigateToHouseholds={() => setActiveTab('households')}
          />
        )}

        {activeTab === 'form' && (
          <CensusForm
            activeUser={activeUser}
            villageSettings={villageSettings}
            existingHousehold={editingHousehold}
            existingMembers={editingMembers}
            onSave={handleSaveCensusForm}
            onCancel={() => {
              setEditingHousehold(null);
              setEditingMembers([]);
              setActiveTab('households');
            }}
          />
        )}

        {activeTab === 'households' && (
          <HouseholdList
            households={households}
            members={members}
            villageSettings={villageSettings}
            activeUser={activeUser}
            onEdit={handleEditHousehold}
            onDelete={handleDeleteHousehold}
            onNavigateToForm={() => {
              setEditingHousehold(null);
              setEditingMembers([]);
              setActiveTab('form');
            }}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}

        {activeTab === 'enumerators' && (
          <EnumeratorTracker
            enumerators={enumerators}
            households={households}
            members={members}
            villageSettings={villageSettings}
            activeUser={activeUser}
            onSelectUser={handleSelectUser}
            onFilterByEnumerator={(enumId) => {
              setActiveTab('households');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <p>
          ប្រព័ន្ធជំរឿនស្ថិតិកម្រិតភូមិ (Village Census System) © {villageSettings.censusYear} · រក្សាសិទ្ធិគ្រប់យ៉ាង
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          គាំទ្រទាំង Online/Offline Sync ជាមួយ Supabase PostgreSQL & Deploy តាមរយៈ GitHub
        </p>
      </footer>

      {/* Modals */}
      <UserSelectorModal
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        enumerators={enumerators}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        villageSettings={villageSettings}
        onSaveVillageSettings={handleSaveVillageSettings}
        supabaseConfig={supabaseConfig}
        onUpdateSupabaseConfig={setSupabaseConfig}
        onResetData={handleResetData}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        households={households}
        members={members}
        villageSettings={villageSettings}
      />

    </div>
  );
};
