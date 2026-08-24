import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  UserCheck, 
  Sparkles, 
  HeartHandshake, 
  Droplets, 
  ShieldAlert, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  CheckCircle,
  Clock,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Household, HouseholdMember, VillageSettings, Enumerator } from '../types';

interface DashboardProps {
  households: Household[];
  members: HouseholdMember[];
  villageSettings: VillageSettings;
  enumerators: Enumerator[];
  onNavigateToForm: () => void;
  onNavigateToHouseholds: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  households,
  members,
  villageSettings,
  enumerators,
  onNavigateToForm,
  onNavigateToHouseholds,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Filter calculations
  const filteredHouseholds = selectedGroupFilter === 'all'
    ? households
    : households.filter(h => h.groupNumber === selectedGroupFilter);

  const filteredHhIds = new Set(filteredHouseholds.map(h => h.id));
  const filteredMembers = selectedGroupFilter === 'all'
    ? members
    : members.filter(m => filteredHhIds.has(m.householdId));

  // Totals
  const totalHh = filteredHouseholds.length;
  const targetHh = villageSettings.targetTotalHouseholds || 350;
  const progressPercent = Math.min(100, Math.round((totalHh / targetHh) * 100));

  const totalPop = filteredMembers.length;
  const maleCount = filteredMembers.filter(m => m.gender === 'male').length;
  const femaleCount = filteredMembers.filter(m => m.gender === 'female').length;
  const femalePercent = totalPop ? Math.round((femaleCount / totalPop) * 100) : 0;

  // IDPoor stats
  const idpoor1Count = filteredHouseholds.filter(h => h.idPoorStatus === 'idpoor_1').length;
  const idpoor2Count = filteredHouseholds.filter(h => h.idPoorStatus === 'idpoor_2').length;
  const vulnerableCount = filteredHouseholds.filter(h => h.idPoorStatus === 'vulnerable').length;
  const nonIdpoorCount = filteredHouseholds.filter(h => h.idPoorStatus === 'none').length;
  const totalPoorHh = idpoor1Count + idpoor2Count;
  const poorPercent = totalHh ? Math.round((totalPoorHh / totalHh) * 100) : 0;

  // Sanitation & Water stats
  const withLatrine = filteredHouseholds.filter(h => h.sanitationLatrine === 'flush_latrine').length;
  const latrinePercent = totalHh ? Math.round((withLatrine / totalHh) * 100) : 0;

  const withCleanWater = filteredHouseholds.filter(
    h => h.waterSource === 'piped' || h.waterSource === 'pump_well' || h.waterSource === 'bottled'
  ).length;
  const cleanWaterPercent = totalHh ? Math.round((withCleanWater / totalHh) * 100) : 0;

  // Vulnerable individuals
  const disabledCount = filteredMembers.filter(m => m.hasDisability).length;
  const chronicCount = filteredMembers.filter(m => m.hasChronicIllness).length;
  const pregnantCount = filteredMembers.filter(m => m.isPregnant).length;
  const elderlyCount = filteredMembers.filter(m => m.age >= 60).length;

  // 1. Age Distribution Chart Data
  const ageData = [
    { name: '០-៥ ឆ្នាំ (កុមារតូច)', count: filteredMembers.filter(m => m.age <= 5).length, fill: '#38bdf8' },
    { name: '៦-១៤ ឆ្នាំ (បឋម/អនុ)', count: filteredMembers.filter(m => m.age >= 6 && m.age <= 14).length, fill: '#818cf8' },
    { name: '១៥-២៤ ឆ្នាំ (យុវជន)', count: filteredMembers.filter(m => m.age >= 15 && m.age <= 24).length, fill: '#34d399' },
    { name: '២៥-៥៩ ឆ្នាំ (វ័យធ្វើការ)', count: filteredMembers.filter(m => m.age >= 25 && m.age <= 59).length, fill: '#10b981' },
    { name: '៦០+ ឆ្នាំ (មនុស្សចាស់)', count: filteredMembers.filter(m => m.age >= 60).length, fill: '#f59e0b' },
  ];

  // 2. IDPoor Pie Chart Data
  const idPoorData = [
    { name: 'ធម្មតា (មិនក្រីក្រ)', value: nonIdpoorCount, color: '#10b981' },
    { name: 'ក្រីក្រកម្រិត១ (ក្រខ្លាំង)', value: idpoor1Count, color: '#ef4444' },
    { name: 'ក្រីក្រកម្រិត២ (ក្រមធ្យម)', value: idpoor2Count, color: '#f97316' },
    { name: 'ងាយរងហានិភ័យ', value: vulnerableCount, color: '#eab308' },
  ].filter(d => d.value > 0);

  // 3. Occupation Distribution
  const occupationMap: Record<string, number> = {};
  filteredMembers.forEach(m => {
    const occ = m.occupation || 'other';
    occupationMap[occ] = (occupationMap[occ] || 0) + 1;
  });

  const occupationLabels: Record<string, string> = {
    farmer: 'កសិករ',
    factory_worker: 'កម្មកររោងចក្រ',
    construction: 'សំណង់',
    business_trade: 'លក់ដូរ/អាជីវករ',
    government_civil: 'មន្ត្រីរាជការ',
    private_company: 'បុគ្គលិកឯកជន',
    student: 'សិស្ស/និស្សិត',
    child_preschool: 'កុមារតូច',
    housewife: 'មេផ្ទះ',
    elderly_retired: 'ចូលនិវត្តន៍',
    unemployed: 'គ្មានការងារ',
    other: 'ផ្សេងៗ',
  };

  const topOccupationsData = Object.entries(occupationMap)
    .map(([key, count]) => ({
      name: occupationLabels[key] || key,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 4. Group Progress Breakdown
  const groupCounts: Record<string, number> = {};
  households.forEach(h => {
    groupCounts[h.groupNumber] = (groupCounts[h.groupNumber] || 0) + 1;
  });

  const groupChartData = Array.from({ length: villageSettings.totalGroups || 10 }, (_, i) => {
    const grpName = `ក្រុមទី${i + 1}`;
    return {
      name: grpName,
      households: groupCounts[grpName] || 0
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Village Banner & Group Filter */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              ជំរឿនស្ថិតិផ្លូវការ ឆ្នាំ {villageSettings.censusYear}
            </span>
            <span className="text-xs text-emerald-200">
              មេភូមិ: <strong>{villageSettings.villageChiefName}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {villageSettings.villageName}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
            {villageSettings.communeName} · {villageSettings.districtName} · {villageSettings.provinceName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter by Group */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-1 border border-white/20">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all" className="text-slate-800">បង្ហាញគ្រប់ក្រុមទាំងអស់ ({households.length} ខ្នងផ្ទះ)</option>
              {Array.from({ length: villageSettings.totalGroups || 10 }, (_, i) => {
                const gName = `ក្រុមទី${i + 1}`;
                return (
                  <option key={gName} value={gName} className="text-slate-800">
                    {gName} ({households.filter(h => h.groupNumber === gName).length} ខ្នងផ្ទះ)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={onNavigateToForm}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <span>+ ស្រង់ទិន្នន័យថ្មី</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Households Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ខ្នងផ្ទះបានស្រង់</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-800">{totalHh}</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {progressPercent}% នៃ {targetHh}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Population Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ប្រជាជនសរុប</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-800">{totalPop}</p>
            <span className="text-xs font-semibold text-slate-500">នាក់</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>ប្រុស: <strong className="text-blue-700">{maleCount}</strong></span>
            <span>ស្រី: <strong className="text-pink-600">{femaleCount}</strong> ({femalePercent}%)</span>
          </div>
        </div>

        {/* IDPoor / Poverty Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">គ្រួសារក្រីក្រ</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-rose-700">{totalPoorHh}</p>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {poorPercent}% នៃខ្នងផ្ទះ
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span className="text-rose-600 font-semibold">ក្រ១: {idpoor1Count}</span>
            <span className="text-amber-600 font-semibold">ក្រ២: {idpoor2Count}</span>
            <span className="text-yellow-600 font-semibold">ងាយរង: {vulnerableCount}</span>
          </div>
        </div>

        {/* Sanitation & Latrine Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">បង្គន់អនាម័យ</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-3xl font-black text-teal-800">{latrinePercent}%</p>
            <span className="text-xs font-semibold text-slate-500">{withLatrine} / {totalHh} ផ្ទះ</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span>ទឹកស្អាត: <strong className="text-teal-700">{cleanWaterPercent}%</strong></span>
            <span>គ្មានបង្គន់: <strong className="text-rose-600">{totalHh - withLatrine}</strong></span>
          </div>
        </div>

      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Age Pyramid / Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                ស្ថិតិកម្រិតអាយុប្រជាជនក្នុងភូមិ
              </h3>
            </div>
            <span className="text-xs text-slate-500">គិតជាចំនួននាក់</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: IDPoor Poverty Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                សមាមាត្រកម្រិតជីវភាព & ប័ណ្ណក្រីក្រ
              </h3>
            </div>
            <span className="text-xs text-slate-500">គិតជាខ្នងផ្ទះ</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {idPoorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={idPoorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {idPoorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">មិនទាន់មានទិន្នន័យ</p>
            )}
          </div>
        </div>

        {/* Chart 3: Top Occupations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                មុខរបរចម្បងរបស់ប្រជាពលរដ្ឋ
              </h3>
            </div>
            <span className="text-xs text-slate-500">៦ មុខរបរច្រើនជាងគេ</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topOccupationsData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Progress by Village Groups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                ចំនួនខ្នងផ្ទះស្រង់បានតាមក្រុមនីមួយៗ
              </h3>
            </div>
            <span className="text-xs text-slate-500">ក្រុមទី១ ដល់ ក្រុមទី១០</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="households" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Vulnerable Groups & Special Statistics Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-rose-500" />
          <span>ស្ថិតិជនងាយរងគ្រោះ និងសុខុមាលភាពក្នុងភូមិ</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-700 font-semibold">ជនមានពិការភាព</p>
            <p className="text-xl font-bold text-purple-900 mt-1">{disabledCount} នាក់</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-xs text-rose-700 font-semibold">ជំងឺរ៉ាំរ៉ៃ</p>
            <p className="text-xl font-bold text-rose-900 mt-1">{chronicCount} នាក់</p>
          </div>
          <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
            <p className="text-xs text-pink-700 font-semibold">ស្ត្រីមានផ្ទៃពោះ</p>
            <p className="text-xl font-bold text-pink-900 mt-1">{pregnantCount} នាក់</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700 font-semibold">មនុស្សចាស់ (៦០+)</p>
            <p className="text-xl font-bold text-amber-900 mt-1">{elderlyCount} នាក់</p>
          </div>
        </div>
      </div>

    </div>
  );
};
