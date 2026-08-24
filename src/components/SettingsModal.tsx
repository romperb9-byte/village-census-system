import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Building2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  RefreshCw,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { SupabaseConfig, VillageSettings } from '../types';
import { testSupabaseConnection, saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase';
import { exportDatabaseBackup, importDatabaseBackup } from '../lib/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  villageSettings: VillageSettings;
  onSaveVillageSettings: (settings: VillageSettings) => void;
  supabaseConfig: SupabaseConfig;
  onUpdateSupabaseConfig: (config: SupabaseConfig) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  villageSettings,
  onSaveVillageSettings,
  supabaseConfig,
  onUpdateSupabaseConfig,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'village' | 'backup'>('supabase');

  // Supabase state
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey || '');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Village Settings state
  const [villageForm, setVillageForm] = useState<VillageSettings>({ ...villageSettings });
  const [villageSavedMsg, setVillageSavedMsg] = useState(false);

  // Backup state
  const [copySuccess, setCopySuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndSaveSupabase = async () => {
    setTestLoading(true);
    setTestResult(null);

    const res = await testSupabaseConnection(sbUrl, sbKey);
    setTestResult(res);
    setTestLoading(false);

    if (res.success) {
      saveSupabaseConfig(sbUrl, sbKey);
      onUpdateSupabaseConfig({
        url: sbUrl,
        anonKey: sbKey,
        isConnected: true
      });
    }
  };

  const handleClearSupabase = () => {
    clearSupabaseConfig();
    setSbUrl('');
    setSbKey('');
    setTestResult(null);
    onUpdateSupabaseConfig({ url: '', anonKey: '', isConnected: false });
  };

  const handleSaveVillage = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveVillageSettings(villageForm);
    setVillageSavedMsg(true);
    setTimeout(() => setVillageSavedMsg(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `village_census_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = importDatabaseBackup(content);
      if (success) {
        setImportStatus('ទិន្នន័យត្រូវបានទាញយក (Restore) ជោគជ័យ! ទំព័រនឹង Refresh ក្នុងពេលបន្តិចទៀត...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('បរាជ័យ: ឯកសារ Backup មិនត្រឹមត្រូវ');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySql = () => {
    const sqlText = `-- 📊 SQL Schema សម្រាប់បង្កើត Database ជំរឿនលើ Supabase
-- សូមបើក Supabase Dashboard -> SQL Editor រួច Paste កូដខាងក្រោមនេះ:

CREATE TABLE IF NOT EXISTS village_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_name TEXT NOT NULL DEFAULT 'ភូមិព្រៃស្វាយ',
  commune_name TEXT NOT NULL DEFAULT 'ឃុំព្រៃទទឹង',
  district_name TEXT NOT NULL DEFAULT 'ស្រុកព្រៃកប្បាស',
  province_name TEXT NOT NULL DEFAULT 'ខេត្តតាកែវ',
  total_groups INT NOT NULL DEFAULT 10,
  village_chief_name TEXT NOT NULL DEFAULT 'លោក សុខ ម៉ាន',
  village_chief_phone TEXT NOT NULL DEFAULT '012 889 901',
  target_total_households INT NOT NULL DEFAULT 350,
  census_year TEXT NOT NULL DEFAULT '២០២៦',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enumerators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  khmer_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'enumerator',
  role_khmer TEXT NOT NULL,
  group_assigned TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  phone TEXT NOT NULL,
  target_households INT NOT NULL DEFAULT 35,
  avatar_color TEXT DEFAULT 'bg-emerald-600',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  household_code TEXT NOT NULL UNIQUE,
  group_number TEXT NOT NULL,
  village TEXT NOT NULL,
  commune TEXT NOT NULL,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  head_name TEXT NOT NULL,
  head_gender TEXT NOT NULL,
  head_phone TEXT DEFAULT '',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  address_description TEXT,
  housing_type TEXT NOT NULL DEFAULT 'wooden',
  roof_type TEXT NOT NULL DEFAULT 'zinc',
  water_source TEXT NOT NULL DEFAULT 'pump_well',
  electricity_source TEXT NOT NULL DEFAULT 'national_grid',
  sanitation_latrine TEXT NOT NULL DEFAULT 'flush_latrine',
  id_poor_status TEXT NOT NULL DEFAULT 'none',
  id_poor_card_number TEXT DEFAULT '',
  agricultural_land_hectares NUMERIC(10, 2) DEFAULT 0,
  cows_count INT DEFAULT 0,
  buffalos_count INT DEFAULT 0,
  pigs_count INT DEFAULT 0,
  poultry_count INT DEFAULT 0,
  enumerator_id TEXT REFERENCES enumerators(id) ON DELETE SET NULL,
  enumerator_name TEXT DEFAULT '',
  members_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  full_name_kh TEXT NOT NULL,
  full_name_en TEXT DEFAULT '',
  gender TEXT NOT NULL,
  relation_to_head TEXT NOT NULL,
  birth_date DATE,
  age INT NOT NULL,
  national_id TEXT DEFAULT '',
  has_national_id BOOLEAN DEFAULT FALSE,
  has_birth_certificate BOOLEAN DEFAULT TRUE,
  education_level TEXT NOT NULL DEFAULT 'primary_completed',
  occupation TEXT NOT NULL DEFAULT 'farmer',
  monthly_income_estimate NUMERIC(10, 2) DEFAULT 0,
  has_disability BOOLEAN DEFAULT FALSE,
  disability_type TEXT DEFAULT '',
  has_chronic_illness BOOLEAN DEFAULT FALSE,
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_elderly_living_alone BOOLEAN DEFAULT FALSE,
  migration_status TEXT DEFAULT 'none',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE village_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enumerators ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access village_settings" ON village_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access enumerators" ON enumerators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access households" ON households FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access household_members" ON household_members FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE village_settings, enumerators, households, household_members;`;

    navigator.clipboard.writeText(sqlText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                ការកំណត់ប្រព័ន្ធ (System Settings)
              </h2>
              <p className="text-xs text-slate-500">
                កំណត់ Supabase Database, ព័ត៌មានភូមិ និងការ Backup ទិន្នន័យ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Cloud DB</span>
          </button>

          <button
            onClick={() => setActiveTab('village')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'village'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ព័ត៌មានភូមិ & គោលដៅ</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Backup & Restore</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: Supabase Configuration */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ការរក្សាទុកទិន្នន័យលើ Cloud ជាមួយ Supabase (PostgreSQL)
                </h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  ប្រព័ន្ធនេះអាចដំណើរការដោយគ្មានអ៊ីនធឺណិត (Offline) ប៉ុន្តែប្រសិនបើលោកអ្នកចង់ឱ្យអ្នកប្រើប្រាស់ទាំង ១២ នាក់ sync ទិន្នន័យចូល Database រួមតែមួយ សូមបញ្ចូល Project URL និង Anon Key របស់ Supabase នៅខាងក្រោម៖
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public API Key:
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={testLoading}
                  onClick={handleTestAndSaveSupabase}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                  {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{testLoading ? 'កំពុងតេស្ត...' : 'តេស្ត & រក្សាទុកការភ្ជាប់'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-300"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copySuccess ? 'បាន Copy SQL Schema រួចរាល់!' : 'Copy SQL Schema សម្រាប់ Supabase'}</span>
                </button>

                {supabaseConfig.isConnected && (
                  <button
                    type="button"
                    onClick={handleClearSupabase}
                    className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold ml-auto"
                  >
                    ផ្តាច់ការភ្ជាប់
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>របៀបបង្កើត Supabase ឥតគិតថ្លៃ៖ បង្កើត Project លើ supabase.com រួចចូល SQL Editor រួច Paste SQL Schema។</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-bold"
                >
                  Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: Village Profile Settings */}
          {activeTab === 'village' && (
            <form onSubmit={handleSaveVillage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះភូមិ:
                  </label>
                  <input
                    type="text"
                    required
                    value={villageForm.villageName}
                    onChange={(e) => setVillageForm({ ...villageForm, villageName: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឃុំ / សង្កាត់:
                  </label>
                  <input
                    type="text"
                    required
                    value={villageForm.communeName}
                    onChange={(e) => setVillageForm({ ...villageForm, communeName: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ស្រុក / ខណ្ឌ:
                  </label>
                  <input
                    type="text"
                    required
                    value={villageForm.districtName}
                    onChange={(e) => setVillageForm({ ...villageForm, districtName: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ខេត្ត / រាជធានី:
                  </label>
                  <input
                    type="text"
                    required
                    value={villageForm.provinceName}
                    onChange={(e) => setVillageForm({ ...villageForm, provinceName: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះមេភូមិ / ប្រធានគម្រោង:
                  </label>
                  <input
                    type="text"
                    required
                    value={villageForm.villageChiefName}
                    onChange={(e) => setVillageForm({ ...villageForm, villageChiefName: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    លេខទូរស័ព្ទមេភូមិ:
                  </label>
                  <input
                    type="text"
                    value={villageForm.villageChiefPhone}
                    onChange={(e) => setVillageForm({ ...villageForm, villageChiefPhone: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ចំនួនក្រុមក្នុងភូមិសរុប:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={villageForm.totalGroups}
                    onChange={(e) => setVillageForm({ ...villageForm, totalGroups: parseInt(e.target.value) || 10 })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    គោលដៅខ្នងផ្ទះសរុបត្រូវស្រង់:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={villageForm.targetTotalHouseholds}
                    onChange={(e) => setVillageForm({ ...villageForm, targetTotalHouseholds: parseInt(e.target.value) || 350 })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {villageSavedMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>បានរក្សាទុកព័ត៌មានភូមិដោយជោគជ័យ!</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>រក្សាទុកព័ត៌មានភូមិ</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  ទាញយកឯកសារបម្រុងទុក (JSON Database Backup)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  ទាញយកទិន្នន័យខ្នងផ្ទះ និងសមាជិកទាំងអស់ទៅទុកក្នុងកុំព្យូទ័រ ឬទូរស័ព្ទ ដើម្បីការពារកុំឱ្យបាត់បង់ទិន្នន័យ។
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="mt-3 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  បញ្ចូលទិន្នន័យត្រឡប់មកវិញ (Restore Backup)
                </h4>
                <p className="text-xs text-slate-600 mt-1 mb-3">
                  ជ្រើសរើសឯកសារ JSON Backup ដែលបានទាញយកពីមុនដើម្បី Restore ចូលប្រព័ន្ធវិញ។
                </p>
                <label className="cursor-pointer py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>ជ្រើសរើសឯកសារ Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {importStatus && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2">{importStatus}</p>
                )}
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <h4 className="text-xs sm:text-sm font-bold text-rose-800">
                  កំណត់ទិន្នន័យឡើងវិញ (Reset to Sample Data)
                </h4>
                <p className="text-xs text-rose-600 mt-1">
                  កំណត់ទិន្នន័យទាំងអស់ត្រឡប់មកទម្រង់គំរូដើមវិញ (ទិន្នន័យខ្នងផ្ទះដែលបានបញ្ចូលនឹងត្រូវបានលុប)។
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('តើអ្នកពិតជាចង់ Reset ទិន្នន័យទាំងអស់ទៅជាគំរូដើមវិញមែនទេ?')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="mt-3 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset ទិន្នន័យទាំងអស់</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
          >
            បិទ
          </button>
        </div>

      </div>
    </div>
  );
};
