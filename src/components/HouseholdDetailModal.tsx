import React from 'react';
import { 
  X, 
  Printer, 
  MapPin, 
  Users, 
  Home, 
  Phone, 
  Droplets, 
  Zap, 
  ShieldCheck, 
  Wheat, 
  Compass, 
  Calendar,
  CheckCircle,
  FileBadge
} from 'lucide-react';
import { Household, HouseholdMember, VillageSettings } from '../types';

interface HouseholdDetailModalProps {
  household: Household | null;
  members: HouseholdMember[];
  villageSettings: VillageSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const HouseholdDetailModal: React.FC<HouseholdDetailModalProps> = ({
  household,
  members,
  villageSettings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !household) return null;

  const handlePrint = () => {
    window.print();
  };

  const housingLabels: Record<string, string> = {
    wooden: 'ផ្ទះឈើ',
    concrete: 'ផ្ទះថ្ម/បេតុង',
    mixed: 'ផ្ទះឈើលើថ្មក្រោម',
    thatch_bamboo: 'ផ្ទះស្លឹក/ឬស្សី',
    zinc: 'ផ្ទះស័ង្កសី',
  };

  const waterLabels: Record<string, string> = {
    pump_well: 'អណ្តូងស្នប់',
    piped: 'ទឹកម៉ាស៊ីនរដ្ឋ/ឯកជន',
    dug_well: 'អណ្តូងជីក/លូ',
    rainwater: 'ទឹកភ្លៀង/ពាង',
    pond_river: 'ស្រះ/ត្រពាំង/ព្រែក',
    bottled: 'ទឹកបរិសុទ្ធទិញ',
  };

  const relationLabels: Record<string, string> = {
    head: 'មេគ្រួសារ',
    spouse: 'ប្តី/ប្រពន្ធ',
    child: 'កូន',
    parent: 'ឪពុក/ម្តាយ',
    grandchild: 'ចៅ',
    relative: 'សាច់ញាតិ',
    other: 'ផ្សេងៗ',
  };

  const educationLabels: Record<string, string> = {
    none: 'មិនដែលរៀន',
    primary_incomplete: 'បឋមសិក្សាមិនចប់',
    primary_completed: 'ចប់បឋមសិក្សា',
    secondary: 'ចប់អនុវិទ្យាល័យ',
    high_school: 'ចប់វិទ្យាល័យ (បាក់ឌុប)',
    vocational: 'បណ្តុះបណ្តាលវិជ្ជាជីវៈ',
    university: 'ឧត្តមសិក្សា (បរិញ្ញាបត្រ)',
    monk: 'ពុទ្ធិកសិក្សា',
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                ប័ណ្ណព័ត៌មានជំរឿនខ្នងផ្ទះ ({household.householdCode})
              </h2>
              <p className="text-xs text-slate-500">
                {household.village} · {household.groupNumber} · មេគ្រួសារ: <strong>{household.headName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពប័ណ្ណ</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible">
          
          {/* Official Print Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <h3 className="text-sm font-bold tracking-widest text-slate-600 uppercase">
              ព្រះរាជាណាចក្រកម្ពុជា · ជាតិ សាសនា ព្រះមហាក្សត្រ
            </h3>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              ប័ណ្ណស្ថិតិជំរឿនគ្រួសារកម្រិតភូមិ
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {villageSettings.villageName} · {villageSettings.communeName} · {villageSettings.districtName} · {villageSettings.provinceName}
            </p>
          </div>

          {/* Household Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-slate-500 font-medium">កូដខ្នងផ្ទះ:</span>
              <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{household.householdCode}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ក្រុមទី:</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{household.groupNumber}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">មេគ្រួសារ:</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{household.headName} ({household.headGender === 'male' ? 'ប្រុស' : 'ស្រី'})</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">លេខទូរស័ព្ទ:</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{household.headPhone || '-'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ស្ថានភាពផ្ទះ:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{housingLabels[household.housingType] || household.housingType}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ប្រភពទឹក:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{waterLabels[household.waterSource] || household.waterSource}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">បង្គន់អនាម័យ:</span>
              <p className="font-semibold text-emerald-700 mt-0.5">
                {household.sanitationLatrine === 'flush_latrine' ? 'មានបង្គន់ត្រឹមត្រូវ' : 'គ្មានបង្គន់'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ប័ណ្ណក្រីក្រ:</span>
              <p className="font-semibold text-rose-700 mt-0.5">
                {household.idPoorStatus === 'none' ? 'គ្មានប័ណ្ណក្រីក្រ' : household.idPoorStatus}
              </p>
            </div>
          </div>

          {/* Location & Coordinates */}
          {(household.gpsLat || household.addressDescription) && (
            <div className="text-xs text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>ទីតាំង: <strong>{household.addressDescription || 'ក្នុងភូមិ'}</strong></span>
              </span>
              {household.gpsLat && (
                <span className="font-mono font-bold text-emerald-800">
                  GPS: {household.gpsLat}, {household.gpsLng}
                </span>
              )}
            </div>
          )}

          {/* Agriculture Summary */}
          <div className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-wrap items-center justify-between gap-2">
            <span>ដីស្រែ/ចម្ការ: <strong>{household.agriculturalLandHectares || 0} ហ.ត</strong></span>
            <span>គោ: <strong>{household.cowsCount || 0}</strong></span>
            <span>ក្របី: <strong>{household.buffalosCount || 0}</strong></span>
            <span>ជ្រូក: <strong>{household.pigsCount || 0}</strong></span>
            <span>មាន់/ទា: <strong>{household.poultryCount || 0}</strong></span>
          </div>

          {/* Members Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>បញ្ជីសមាជិកគ្រួសារ ({members.length} នាក់)</span>
            </h4>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ល.រ</th>
                    <th className="py-2.5 px-3">ឈ្មោះ</th>
                    <th className="py-2.5 px-3">ភេទ</th>
                    <th className="py-2.5 px-3">ត្រូវជា</th>
                    <th className="py-2.5 px-3">អាយុ</th>
                    <th className="py-2.5 px-3">អប់រំ</th>
                    <th className="py-2.5 px-3">មុខរបរ</th>
                    <th className="py-2.5 px-3">សុខភាព/ពិការ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{m.fullNameKh}</td>
                      <td className="py-2 px-3">{m.gender === 'male' ? 'ប្រុស' : 'ស្រី'}</td>
                      <td className="py-2 px-3 font-medium text-slate-700">{relationLabels[m.relationToHead] || m.relationToHead}</td>
                      <td className="py-2 px-3 font-semibold">{m.age} ឆ្នាំ</td>
                      <td className="py-2 px-3 text-slate-600">{educationLabels[m.educationLevel] || m.educationLevel}</td>
                      <td className="py-2 px-3 text-slate-600">{occupationLabels[m.occupation] || m.occupation}</td>
                      <td className="py-2 px-3">
                        {m.hasDisability ? (
                          <span className="text-purple-700 font-bold">ពិការភាព</span>
                        ) : m.hasChronicIllness ? (
                          <span className="text-rose-600 font-semibold">ជំងឺរ៉ាំរ៉ៃ</span>
                        ) : (
                          <span className="text-slate-400">ធម្មតា</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Footer for Printout */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800">ហត្ថលេខាភ្នាក់ងារស្រង់ទិន្នន័យ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">({household.enumeratorName || 'ភ្នាក់ងារជំរឿន'})</p>
              <div className="h-16"></div>
              <p className="text-[11px] text-slate-400">កាលបរិច្ឆេទ: {new Date(household.createdAt).toLocaleDateString('km-KH')}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">ហត្ថលេខា និងត្រាមេភូមិ</p>
              <p className="text-[11px] text-slate-500 mt-0.5">({villageSettings.villageChiefName})</p>
              <div className="h-16"></div>
              <p className="text-[11px] text-slate-400">បានពិនិត្យ និងបញ្ជាក់ត្រឹមត្រូវ</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
