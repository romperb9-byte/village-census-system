import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, CheckCircle2, Filter } from 'lucide-react';
import { Household, HouseholdMember, VillageSettings } from '../types';
import { exportCensusToExcel, exportHouseholdsCSV } from '../lib/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  households: Household[];
  members: HouseholdMember[];
  villageSettings: VillageSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  households,
  members,
  villageSettings,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter if needed
  const filteredHouseholds = selectedGroup === 'all'
    ? households
    : households.filter(h => h.groupNumber === selectedGroup);

  const filteredHouseholdIds = new Set(filteredHouseholds.map(h => h.id));
  const filteredMembers = selectedGroup === 'all'
    ? members
    : members.filter(m => filteredHouseholdIds.has(m.householdId));

  const handleExportExcel = () => {
    exportCensusToExcel(filteredHouseholds, filteredMembers, villageSettings);
    setExportSuccess('ទាញយកឯកសារ Excel (.xlsx) ជោគជ័យ!');
    setTimeout(() => setExportSuccess(null), 4000);
  };

  const handleExportCSV = () => {
    exportHouseholdsCSV(filteredHouseholds);
    setExportSuccess('ទាញយកឯកសារ CSV ជោគជ័យ!');
    setTimeout(() => setExportSuccess(null), 4000);
  };

  // List unique groups
  const groupsList = Array.from(new Set(households.map(h => h.groupNumber))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ទាញយកទិន្នន័យជំរឿន (Export Census Data)
              </h2>
              <p className="text-xs text-emerald-100">
                ទាញយកជា Excel (.xlsx) ឬ CSV សម្រាប់ធ្វើរបាយការណ៍
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          {/* Group Filter */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>ជ្រើសរើសទិន្នន័យតាមក្រុម៖</span>
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">គ្រប់ក្រុមទាំងអស់ក្នុងភូមិ ({households.length} ខ្នងផ្ទះ)</option>
              {groupsList.map(g => (
                <option key={g} value={g}>{g} ({households.filter(h => h.groupNumber === g).length} ខ្នងផ្ទះ)</option>
              ))}
            </select>
          </div>

          {/* Quick Summary Preview */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-medium">ខ្នងផ្ទះត្រូវ Export</p>
              <p className="text-xl font-extrabold text-emerald-800">{filteredHouseholds.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">សមាជិកប្រជាជន</p>
              <p className="text-xl font-extrabold text-blue-800">{filteredMembers.length}</p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportExcel}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>ទាញយកជា Excel (.xlsx) - មាន ៣ សន្លឹកពេញលេញ</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>ទាញយកជា CSV (សម្រាប់ Import ចូលប្រព័ន្ធផ្សេង)</span>
            </button>
          </div>

          {exportSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{exportSuccess}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            💡 ឯកសារ Excel មានផ្ទុក៖ <strong>សន្លឹកស្ថិតិសង្ខេបភូមិ</strong>, <strong>តារាងខ្នងផ្ទះ</strong> និង <strong>តារាងសមាជិកគ្រួសារម្នាក់ៗ</strong> ជាមួយចំណងជើងជាភាសាខ្មែរត្រឹមត្រូវ។
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
          >
            បិទ
          </button>
        </div>

      </div>
    </div>
  );
};
