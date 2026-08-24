import React from 'react';
import { 
  Users, 
  Target, 
  CheckCircle2, 
  Clock, 
  Phone, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  BarChart2, 
  Home
} from 'lucide-react';
import { Enumerator, Household, HouseholdMember, VillageSettings } from '../types';

interface EnumeratorTrackerProps {
  enumerators: Enumerator[];
  households: Household[];
  members: HouseholdMember[];
  villageSettings: VillageSettings;
  activeUser: Enumerator;
  onSelectUser: (user: Enumerator) => void;
  onFilterByEnumerator: (enumId: string) => void;
}

export const EnumeratorTracker: React.FC<EnumeratorTrackerProps> = ({
  enumerators,
  households,
  members,
  villageSettings,
  activeUser,
  onSelectUser,
  onFilterByEnumerator,
}) => {
  // Compute stats per enumerator
  const enumeratorStats = enumerators.map((enumItem) => {
    const enumHouseholds = households.filter((h) => h.enumeratorId === enumItem.id);
    const countHh = enumHouseholds.length;
    const target = enumItem.targetHouseholds || 35;
    const percent = Math.min(100, Math.round((countHh / target) * 100));

    const enumHouseholdIds = new Set(enumHouseholds.map(h => h.id));
    const countMembers = members.filter(m => enumHouseholdIds.has(m.householdId)).length;
    const countPoor = enumHouseholds.filter(h => h.idPoorStatus === 'idpoor_1' || h.idPoorStatus === 'idpoor_2').length;

    // Get latest activity
    const sortedHh = [...enumHouseholds].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastActive = sortedHh[0] ? new Date(sortedHh[0].createdAt).toLocaleDateString('km-KH') : 'មិនទាន់មាន';

    return {
      ...enumItem,
      completedHouseholds: countHh,
      targetHouseholds: target,
      progressPercent: percent,
      totalMembersSurveyed: countMembers,
      totalPoorHouseholds: countPoor,
      lastActiveDate: lastActive,
    };
  });

  const totalCompletedAll = households.length;
  const totalTargetAll = enumerators.reduce((sum, e) => sum + e.targetHouseholds, 0);
  const totalProgressPercent = Math.min(100, Math.round((totalCompletedAll / totalTargetAll) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              ក្រុមការងារ ១២ នាក់
            </span>
            <span className="text-xs text-slate-300">
              {villageSettings.villageName} · ឆ្នាំ {villageSettings.censusYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5">
            តាមដានវឌ្ឍនភាព និងសមិទ្ធផលក្រុមការងារជំរឿន
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
            តាមដានចំនួនខ្នងផ្ទះដែលភ្នាក់ងារទាំង ១២ នាក់បានស្រង់ទិន្នន័យរួចរាល់ធៀបនឹងគោលដៅ
          </p>
        </div>

        {/* Global Progress Pill */}
        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 text-right min-w-[200px]">
          <p className="text-xs text-slate-300">វឌ្ឍនភាពទូទាំងភូមិ</p>
          <p className="text-2xl font-black text-emerald-400 mt-0.5">
            {totalCompletedAll} <span className="text-xs text-slate-300 font-normal">/ {totalTargetAll} ខ្នងផ្ទះ</span>
          </p>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of 12 Enumerator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enumeratorStats.map((enumItem) => {
          const isCurrentActive = activeUser.id === enumItem.id;
          return (
            <div
              key={enumItem.id}
              className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md p-5 flex flex-col justify-between space-y-4 ${
                isCurrentActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header: Avatar & Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl ${enumItem.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0`}>
                    {enumItem.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{enumItem.khmerName}</span>
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700">
                      {enumItem.roleKhmer}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Target className="w-3 h-3 text-slate-400" />
                      <span>{enumItem.groupAssigned}</span>
                    </p>
                  </div>
                </div>

                {isCurrentActive && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> កំពុងប្រើ
                  </span>
                )}
              </div>

              {/* Progress & Target Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">ចំនួនខ្នងផ្ទះស្រង់បាន:</span>
                  <span className="font-bold text-slate-900">
                    {enumItem.completedHouseholds} / {enumItem.targetHouseholds} ({enumItem.progressPercent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      enumItem.progressPercent >= 100
                        ? 'bg-emerald-500'
                        : enumItem.progressPercent >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${enumItem.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 border-t border-slate-200/60">
                  <span>ប្រជាជន: <strong className="text-blue-700">{enumItem.totalMembersSurveyed}</strong> នាក់</span>
                  <span>គ្រួសារក្រីក្រ: <strong className="text-rose-600">{enumItem.totalPoorHouseholds}</strong></span>
                </div>
              </div>

              {/* Card Footer: Action buttons */}
              <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>ស្រង់ចុងក្រោយ: {enumItem.lastActiveDate}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectUser(enumItem)}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    title="ប្តូរមកប្រើគណនីនេះ"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>ប្តូរ User</span>
                  </button>

                  <button
                    onClick={() => onFilterByEnumerator(enumItem.id)}
                    className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                    title="មើលខ្នងផ្ទះដែលបានស្រង់"
                  >
                    មើលបញ្ជី ({enumItem.completedHouseholds})
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
