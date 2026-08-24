import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  Home, 
  Users, 
  MapPin, 
  ShieldAlert, 
  Plus,
  ArrowUpDown,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Household, HouseholdMember, VillageSettings, Enumerator } from '../types';
import { HouseholdDetailModal } from './HouseholdDetailModal';
import { getHouseholdMembers } from '../lib/db';

interface HouseholdListProps {
  households: Household[];
  members: HouseholdMember[];
  villageSettings: VillageSettings;
  activeUser: Enumerator;
  onEdit: (household: Household) => void;
  onDelete: (householdId: string) => void;
  onNavigateToForm: () => void;
  onOpenExport: () => void;
}

export const HouseholdList: React.FC<HouseholdListProps> = ({
  households,
  members,
  villageSettings,
  activeUser,
  onEdit,
  onDelete,
  onNavigateToForm,
  onOpenExport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [povertyFilter, setPovertyFilter] = useState('all');
  const [enumeratorFilter, setEnumeratorFilter] = useState('all');
  const [selectedHhForDetail, setSelectedHhForDetail] = useState<Household | null>(null);

  // Filter Logic
  const filteredList = households.filter((h) => {
    // Search query matches head name, code, phone, or member name
    const q = searchTerm.toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      const matchHead = h.headName.toLowerCase().includes(q);
      const matchCode = h.householdCode.toLowerCase().includes(q);
      const matchPhone = (h.headPhone || '').includes(q);
      
      // Check members
      const hhMembers = members.filter(m => m.householdId === h.id);
      const matchMembers = hhMembers.some(m => m.fullNameKh.toLowerCase().includes(q) || (m.fullNameEn || '').toLowerCase().includes(q));

      matchesSearch = matchHead || matchCode || matchPhone || matchMembers;
    }

    const matchesGroup = groupFilter === 'all' || h.groupNumber === groupFilter;
    const matchesPoverty = povertyFilter === 'all' || h.idPoorStatus === povertyFilter;
    const matchesEnumerator = enumeratorFilter === 'all' || h.enumeratorId === enumeratorFilter;

    return matchesSearch && matchesGroup && matchesPoverty && matchesEnumerator;
  });

  const handleDelete = (h: Household) => {
    if (window.confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យខ្នងផ្ទះ "${h.householdCode} - ${h.headName}" មែនទេ?`)) {
      onDelete(h.id);
    }
  };

  const povertyBadge = (status: string) => {
    switch (status) {
      case 'idpoor_1':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ក្រ១ (ក្រខ្លាំង)</span>;
      case 'idpoor_2':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ក្រ២ (ក្រមធ្យម)</span>;
      case 'vulnerable':
        return <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">ងាយរងគ្រោះ</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">ធម្មតា</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fadeIn">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            បញ្ជីខ្នងផ្ទះ & គ្រួសារក្នុងភូមិ
          </h2>
          <p className="text-xs text-slate-500">
            បង្ហាញ {filteredList.length} ក្នុងចំណោម {households.length} ខ្នងផ្ទះសរុប ({villageSettings.villageName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenExport}
            className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onNavigateToForm}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ ស្រង់ទិន្នន័យថ្មី</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ, លេខកូដ, ទូរស័ព្ទ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 pl-9 pr-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">គ្រប់ក្រុមទាំងអស់</option>
              {Array.from({ length: villageSettings.totalGroups || 10 }, (_, i) => {
                const g = `ក្រុមទី${i + 1}`;
                return <option key={g} value={g}>{g}</option>;
              })}
            </select>
          </div>

          {/* Poverty Filter */}
          <div>
            <select
              value={povertyFilter}
              onChange={(e) => setPovertyFilter(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">គ្រប់កម្រិតជីវភាព</option>
              <option value="none">ធម្មតា (គ្មានប័ណ្ណក្រីក្រ)</option>
              <option value="idpoor_1">ក្រីក្រកម្រិត១ (ក្រខ្លាំង)</option>
              <option value="idpoor_2">ក្រីក្រកម្រិត២ (ក្រមធ្យម)</option>
              <option value="vulnerable">គ្រួសារងាយរងហានិភ័យ</option>
            </select>
          </div>

          {/* Enumerator Filter */}
          <div>
            <select
              value={enumeratorFilter}
              onChange={(e) => setEnumeratorFilter(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">គ្រប់អ្នកស្រង់ទិន្នន័យ (១២ នាក់)</option>
              {Array.from(new Set(households.map(h => h.enumeratorId))).map(enumId => {
                const hMatch = households.find(h => h.enumeratorId === enumId);
                return (
                  <option key={enumId} value={enumId}>
                    {hMatch?.enumeratorName || enumId}
                  </option>
                );
              })}
            </select>
          </div>

        </div>
      </div>

      {/* Households Table / Card View */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">មិនមានទិន្នន័យខ្នងផ្ទះត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ</h3>
          <p className="text-xs text-slate-500 mt-1">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬចុចស្រង់ទិន្នន័យថ្មី</p>
          <button
            onClick={onNavigateToForm}
            className="mt-4 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ស្រង់ទិន្នន័យខ្នងផ្ទះថ្មី</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">កូដ / ក្រុម</th>
                  <th className="py-3 px-4">មេគ្រួសារ</th>
                  <th className="py-3 px-4">សមាជិក</th>
                  <th className="py-3 px-4">កម្រិតជីវភាព</th>
                  <th className="py-3 px-4">បង្គន់/ទឹក</th>
                  <th className="py-3 px-4">អ្នកស្រង់</th>
                  <th className="py-3 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((h) => {
                  const hhMembers = members.filter(m => m.householdId === h.id);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Group */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-800 block">{h.householdCode}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{h.groupNumber}</span>
                      </td>

                      {/* Head Info */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{h.headName}</span>
                        <span className="text-[11px] text-slate-500">
                          {h.headGender === 'male' ? 'ប្រុស' : 'ស្រី'} {h.headPhone ? `· 📞 ${h.headPhone}` : ''}
                        </span>
                      </td>

                      {/* Members Count */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{hhMembers.length || h.membersCount || 0} នាក់</span>
                        </span>
                      </td>

                      {/* Poverty Status */}
                      <td className="py-3 px-4">
                        {povertyBadge(h.idPoorStatus)}
                        {h.idPoorCardNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            {h.idPoorCardNumber}
                          </span>
                        )}
                      </td>

                      {/* Latrine & Water */}
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium block ${h.sanitationLatrine === 'flush_latrine' ? 'text-teal-700' : 'text-rose-600'}`}>
                          {h.sanitationLatrine === 'flush_latrine' ? '✅ មានបង្គន់' : '❌ គ្មានបង្គន់'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {h.housingType === 'concrete' ? 'ផ្ទះថ្ម' : h.housingType === 'wooden' ? 'ផ្ទះឈើ' : 'ផ្ទះស្លឹក/ស័ង្កសី'}
                        </span>
                      </td>

                      {/* Enumerator */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-700 block line-clamp-1">{h.enumeratorName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleDateString('km-KH')}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedHhForDetail(h)}
                            title="មើលលម្អិត & បោះពុម្ពប័ណ្ណគ្រួសារ"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEdit(h)}
                            title="កែប្រែទិន្នន័យ"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(h)}
                            title="លុបទិន្នន័យខ្នងផ្ទះនេះ"
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Household Detail & Print Modal */}
      {selectedHhForDetail && (
        <HouseholdDetailModal
          isOpen={Boolean(selectedHhForDetail)}
          onClose={() => setSelectedHhForDetail(null)}
          household={selectedHhForDetail}
          members={members.filter(m => m.householdId === selectedHhForDetail.id)}
          villageSettings={villageSettings}
        />
      )}

    </div>
  );
};
