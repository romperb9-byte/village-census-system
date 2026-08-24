import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  Users, 
  Wheat, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save, 
  Compass, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  Phone,
  UserPlus
} from 'lucide-react';
import { 
  Household, 
  HouseholdMember, 
  Enumerator, 
  VillageSettings, 
  HousingType, 
  RoofType, 
  WaterSource, 
  ElectricitySource, 
  LatrineType, 
  IDPoorStatus,
  Gender,
  RelationToHead,
  EducationLevel,
  OccupationType,
  MigrationType
} from '../types';

interface CensusFormProps {
  activeUser: Enumerator;
  villageSettings: VillageSettings;
  onSave: (household: Household, members: HouseholdMember[]) => void;
  onCancel: () => void;
  existingHousehold?: Household | null;
  existingMembers?: HouseholdMember[];
}

export const CensusForm: React.FC<CensusFormProps> = ({
  activeUser,
  villageSettings,
  onSave,
  onCancel,
  existingHousehold,
  existingMembers = [],
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Household Form State
  const [hhData, setHhData] = useState<Household>(() => {
    if (existingHousehold) return { ...existingHousehold };
    
    // Auto-generate code
    const groupNum = activeUser.groupAssigned.includes('ក្រុមទី')
      ? activeUser.groupAssigned.replace('ក្រុមទី', '').padStart(2, '0')
      : '01';
    const randCode = Math.floor(100 + Math.random() * 900);
    const code = `HH-${groupNum}-${randCode}`;

    return {
      id: `hh-${Date.now()}`,
      householdCode: code,
      groupNumber: activeUser.groupAssigned.startsWith('ក្រុមទី') ? activeUser.groupAssigned : 'ក្រុមទី១',
      village: villageSettings.villageName,
      commune: villageSettings.communeName,
      district: villageSettings.districtName,
      province: villageSettings.provinceName,
      headName: '',
      headGender: 'male',
      headPhone: '',
      gpsLat: null,
      gpsLng: null,
      addressDescription: '',
      housingType: 'wooden',
      roofType: 'zinc',
      waterSource: 'pump_well',
      electricitySource: 'national_grid',
      sanitationLatrine: 'flush_latrine',
      idPoorStatus: 'none',
      idPoorCardNumber: '',
      agriculturalLandHectares: 0,
      cowsCount: 0,
      buffalosCount: 0,
      pigsCount: 0,
      poultryCount: 0,
      enumeratorId: activeUser.id,
      enumeratorName: activeUser.khmerName,
      membersCount: 1,
      isVerified: false,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };
  });

  // Members Form State
  const [membersList, setMembersList] = useState<HouseholdMember[]>(() => {
    if (existingMembers && existingMembers.length > 0) return [...existingMembers];

    // Default 1 head member
    return [
      {
        id: `mem-${Date.now()}-1`,
        householdId: hhData.id,
        fullNameKh: '',
        fullNameEn: '',
        gender: 'male',
        relationToHead: 'head',
        birthDate: '',
        age: 40,
        nationalId: '',
        hasNationalId: true,
        hasBirthCertificate: true,
        educationLevel: 'primary_completed',
        occupation: 'farmer',
        monthlyIncomeEstimate: 200,
        hasDisability: false,
        disabilityType: '',
        hasChronicIllness: false,
        isPregnant: false,
        isElderlyLivingAlone: false,
        migrationStatus: 'none',
        createdAt: new Date().toISOString(),
      }
    ];
  });

  // GPS Auto-capture
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('ឧបករណ៍របស់លោកអ្នកមិនគាំទ្រ GPS ទេ');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHhData(prev => ({
          ...prev,
          gpsLat: Number(pos.coords.latitude.toFixed(6)),
          gpsLng: Number(pos.coords.longitude.toFixed(6))
        }));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`មិនអាចចាប់ GPS: ${err.message} (សូមបើក Location Permission)`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Add Member
  const handleAddMember = () => {
    const newMember: HouseholdMember = {
      id: `mem-${Date.now()}-${membersList.length + 1}`,
      householdId: hhData.id,
      fullNameKh: '',
      fullNameEn: '',
      gender: 'female',
      relationToHead: membersList.length === 1 ? 'spouse' : 'child',
      birthDate: '',
      age: 20,
      nationalId: '',
      hasNationalId: false,
      hasBirthCertificate: true,
      educationLevel: 'secondary',
      occupation: 'student',
      monthlyIncomeEstimate: 0,
      hasDisability: false,
      hasChronicIllness: false,
      isPregnant: false,
      isElderlyLivingAlone: false,
      migrationStatus: 'none',
      createdAt: new Date().toISOString(),
    };
    setMembersList([...membersList, newMember]);
  };

  // Remove Member
  const handleRemoveMember = (idx: number) => {
    if (membersList.length <= 1) {
      alert('ខ្នងផ្ទះត្រូវតែមានសមាជិកយ៉ាងតិច ១ នាក់ (មេគ្រួសារ)');
      return;
    }
    const updated = membersList.filter((_, i) => i !== idx);
    setMembersList(updated);
  };

  // Update Member field
  const handleUpdateMember = (index: number, field: keyof HouseholdMember, val: any) => {
    const updated = [...membersList];
    updated[index] = { ...updated[index], [field]: val };
    
    // Sync head name if member[0] is modified
    if (index === 0 && field === 'fullNameKh') {
      setHhData(prev => ({ ...prev, headName: val }));
    }
    if (index === 0 && field === 'gender') {
      setHhData(prev => ({ ...prev, headGender: val }));
    }

    setMembersList(updated);
  };

  // Final Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hhData.headName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះមេគ្រួសារ!');
      setCurrentStep(1);
      return;
    }

    // Ensure member 0 matches head
    const finalMembers = [...membersList];
    if (finalMembers[0]) {
      finalMembers[0].fullNameKh = hhData.headName;
      finalMembers[0].gender = hhData.headGender;
      finalMembers[0].relationToHead = 'head';
    }

    onSave(hhData, finalMembers);
  };

  const steps = [
    { num: 1, title: '១. ព័ត៌មានទូទៅខ្នងផ្ទះ', icon: Home },
    { num: 2, title: '២. ទីតាំង & ស្ថានភាពផ្ទះ', icon: MapPin },
    { num: 3, title: '៣. ជីវភាព & កសិកម្ម', icon: Wheat },
    { num: 4, title: '៤. បញ្ជីសមាជិកគ្រួសារ', icon: Users },
    { num: 5, title: '៥. ផ្ទៀងផ្ទាត់ & រក្សាទុក', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ទម្រង់ជំរឿនផ្លូវការ · {hhData.village}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1.5">
            {existingHousehold ? 'កែប្រែទិន្នន័យខ្នងផ្ទះ' : 'ស្រង់ទិន្នន័យខ្នងផ្ទះថ្មី'} ({hhData.householdCode})
          </h2>
          <p className="text-xs text-slate-500">
            ភ្នាក់ងារស្រង់: <strong>{activeUser.khmerName}</strong> ({activeUser.groupAssigned})
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>រក្សាទុក</span>
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-6">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`p-2 sm:p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1" />
              <span className="text-[10px] sm:text-xs font-bold truncate w-full">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* STEP 1: General Info */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-600" />
                <span>ព័ត៌មានទូទៅខ្នងផ្ទះ</span>
              </h3>
              <p className="text-xs text-slate-500">បញ្ចូលលេខកូដខ្នងផ្ទះ ក្រុម និងព័ត៌មានមេគ្រួសារ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខកូដខ្នងផ្ទះ (Household Code) *
                </label>
                <input
                  type="text"
                  required
                  value={hhData.householdCode}
                  onChange={(e) => setHhData({ ...hhData, householdCode: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ក្រុមទី (Group Number) *
                </label>
                <select
                  value={hhData.groupNumber}
                  onChange={(e) => setHhData({ ...hhData, groupNumber: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {Array.from({ length: villageSettings.totalGroups || 10 }, (_, i) => {
                    const g = `ក្រុមទី${i + 1}`;
                    return <option key={g} value={g}>{g}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះមេគ្រួសារ (Head of Household) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. សេង ហេង"
                  value={hhData.headName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHhData({ ...hhData, headName: val });
                    if (membersList[0]) {
                      handleUpdateMember(0, 'fullNameKh', val);
                    }
                  }}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ភេទមេគ្រួសារ *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHhData({ ...hhData, headGender: 'male' });
                      handleUpdateMember(0, 'gender', 'male');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      hhData.headGender === 'male'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ប្រុស (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHhData({ ...hhData, headGender: 'female' });
                      handleUpdateMember(0, 'gender', 'female');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      hhData.headGender === 'female'
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ស្រី (Female)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខទូរស័ព្ទមេគ្រួសារ:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="012 345 678"
                    value={hhData.headPhone}
                    onChange={(e) => setHhData({ ...hhData, headPhone: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2.5 pl-9 pr-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ភ្នាក់ងារទទួលបន្ទុកស្រង់:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${activeUser.khmerName} (${activeUser.roleKhmer})`}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location, Housing & Sanitation */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>ទីតាំងភូមិសាស្ត្រ & ស្ថានភាពផ្ទះសម្បែង</span>
              </h3>
              <p className="text-xs text-slate-500">កត់ត្រាកូអរដោនេ GPS, ប្រភេទផ្ទះ, ប្រភពទឹក និងបង្គន់</p>
            </div>

            {/* GPS Capture Widget */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>កូអរដោនេទីតាំង GPS (Geolocation)</span>
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {hhData.gpsLat && hhData.gpsLng ? (
                    <span className="font-mono font-bold">
                      Lat: {hhData.gpsLat} · Lng: {hhData.gpsLng}
                    </span>
                  ) : (
                    'មិនទាន់បានចាប់យកកូអរដោនេនៅឡើយទេ'
                  )}
                </p>
                {gpsError && <p className="text-xs text-rose-600 mt-1">{gpsError}</p>}
              </div>

              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleCaptureGPS}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Compass className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'កំពុងចាប់ GPS...' : '📍 ចាប់យកទីតាំងឥឡូវនេះ'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ចំណាំទីតាំង / ផ្ទះក្បែរចំណុចសម្គាល់ណា:
                </label>
                <input
                  type="text"
                  placeholder="ឧ. ខាងត្បូងវត្តព្រៃស្វាយ ចម្ងាយ ១០០ម ជាប់ផ្លូវលំ"
                  value={hhData.addressDescription || ''}
                  onChange={(e) => setHhData({ ...hhData, addressDescription: e.target.value })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ប្រភេទផ្ទះ (Housing Type):
                </label>
                <select
                  value={hhData.housingType}
                  onChange={(e) => setHhData({ ...hhData, housingType: e.target.value as HousingType })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="wooden">ផ្ទះឈើ</option>
                  <option value="concrete">ផ្ទះថ្ម / បេតុង</option>
                  <option value="mixed">ផ្ទះឈើលើថ្មក្រោម</option>
                  <option value="thatch_bamboo">ផ្ទះស្លឹក / ឬស្សី</option>
                  <option value="zinc">ផ្ទះស័ង្កសី</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ប្រភេទដំបូល (Roof Type):
                </label>
                <select
                  value={hhData.roofType}
                  onChange={(e) => setHhData({ ...hhData, roofType: e.target.value as RoofType })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="zinc">ស័ង្កសី</option>
                  <option value="tile">ក្បឿង</option>
                  <option value="concrete">បេតុង</option>
                  <option value="thatch">ស្លឹក / ស្បូវ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ប្រភពទឹកប្រើប្រាស់ចម្បង:
                </label>
                <select
                  value={hhData.waterSource}
                  onChange={(e) => setHhData({ ...hhData, waterSource: e.target.value as WaterSource })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pump_well">អណ្តូងស្នប់</option>
                  <option value="piped">ទឹកម៉ាស៊ីនរដ្ឋ / ឯកជន</option>
                  <option value="dug_well">អណ្តូងជីក / លូ</option>
                  <option value="rainwater">ទឹកភ្លៀង / ពាង</option>
                  <option value="pond_river">ស្រះ / ត្រពាំង / ព្រែក</option>
                  <option value="bottled">ទឹកបរិសុទ្ធទិញ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ប្រភពថាមពល / អគ្គិសនី:
                </label>
                <select
                  value={hhData.electricitySource}
                  onChange={(e) => setHhData({ ...hhData, electricitySource: e.target.value as ElectricitySource })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="national_grid">បណ្តាញជាតិ (EDC)</option>
                  <option value="solar">ថាមពលសូឡា (Solar)</option>
                  <option value="battery">អាគុយ</option>
                  <option value="generator">ម៉ាស៊ីនភ្លើង</option>
                  <option value="none">គ្មានអគ្គិសនីប្រើ</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  បង្គន់អនាម័យ (Sanitation):
                </label>
                <select
                  value={hhData.sanitationLatrine}
                  onChange={(e) => setHhData({ ...hhData, sanitationLatrine: e.target.value as LatrineType })}
                  className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-800"
                >
                  <option value="flush_latrine">✅ មានបង្គន់ចាក់ទឹក / បង្គន់អនាម័យត្រឹមត្រូវ</option>
                  <option value="pit_latrine">⚠️ បង្គន់ជីករណ្តៅ</option>
                  <option value="shared">👥 ប្រើរួមគ្នាជាមួយអ្នកជិតខាង</option>
                  <option value="none">❌ គ្មានបង្គន់អនាម័យប្រើប្រាស់</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Socio-economic & Agriculture */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wheat className="w-5 h-5 text-emerald-600" />
                <span>ជីវភាព & កសិកម្ម / សត្វពាហនៈ</span>
              </h3>
              <p className="text-xs text-slate-500">កត់ត្រាកម្រិតប័ណ្ណក្រីក្រ ដីកសិកម្ម និងចំនួនសត្វចិញ្ចឹម</p>
            </div>

            {/* IDPoor Section */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold text-amber-900">
                ស្ថានភាពប័ណ្ណក្រីក្រ (IDPoor Card Status)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'គ្មានប័ណ្ណក្រីក្រ' },
                  { id: 'idpoor_1', label: 'ក្រីក្រកម្រិត១ (ក្រខ្លាំង)' },
                  { id: 'idpoor_2', label: 'ក្រីក្រកម្រិត២ (ក្រមធ្យម)' },
                  { id: 'vulnerable', label: 'គ្រួសារងាយរងហានិភ័យ' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHhData({ ...hhData, idPoorStatus: item.id as IDPoorStatus })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      hhData.idPoorStatus === item.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {hhData.idPoorStatus !== 'none' && (
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    លេខកូដប័ណ្ណក្រីក្រ (IDPoor Card ID):
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. TK-PK-2024-00123"
                    value={hhData.idPoorCardNumber || ''}
                    onChange={(e) => setHhData({ ...hhData, idPoorCardNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Agriculture & Livestock */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ដីស្រែ/ចម្ការ (ហ.ត):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hhData.agriculturalLandHectares}
                  onChange={(e) => setHhData({ ...hhData, agriculturalLandHectares: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  គោ (ក្បាល):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hhData.cowsCount}
                  onChange={(e) => setHhData({ ...hhData, cowsCount: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ក្របី (ក្បាល):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hhData.buffalosCount}
                  onChange={(e) => setHhData({ ...hhData, buffalosCount: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ជ្រូក (ក្បាល):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hhData.pigsCount}
                  onChange={(e) => setHhData({ ...hhData, pigsCount: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  មាន់/ទា (ក្បាល):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hhData.poultryCount}
                  onChange={(e) => setHhData({ ...hhData, poultryCount: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                កំណត់សម្គាល់បន្ថែមពីខ្នងផ្ទះនេះ:
              </label>
              <textarea
                rows={2}
                placeholder="ឧ. ស្នើសុំជំនួយស្បៀង, ផ្ទះចាស់ទ្រុឌទ្រោម, ..."
                value={hhData.notes || ''}
                onChange={(e) => setHhData({ ...hhData, notes: e.target.value })}
                className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Household Members List */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>បញ្ជីសមាជិកគ្រួសារ ({membersList.length} នាក់)</span>
                </h3>
                <p className="text-xs text-slate-500">បញ្ចូលព័ត៌មានលម្អិតរបស់សមាជិកម្នាក់ៗក្នុងផ្ទះ</p>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ បន្ថែមសមាជិក</span>
              </button>
            </div>

            {/* Members Cards Accordion */}
            <div className="space-y-4">
              {membersList.map((member, idx) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                      #{idx + 1} {idx === 0 ? '· មេគ្រួសារ (Head)' : ''}
                    </span>

                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>លុប</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ឈ្មោះសមាជិក (ខ្មែរ) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ឧ. សេង ពិសិដ្ឋ"
                        value={member.fullNameKh}
                        onChange={(e) => handleUpdateMember(idx, 'fullNameKh', e.target.value)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ភេទ:
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleUpdateMember(idx, 'gender', e.target.value as Gender)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="male">ប្រុស (Male)</option>
                        <option value="female">ស្រី (Female)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ទំនាក់ទំនងជាមួយមេគ្រួសារ:
                      </label>
                      <select
                        value={member.relationToHead}
                        disabled={idx === 0}
                        onChange={(e) => handleUpdateMember(idx, 'relationToHead', e.target.value as RelationToHead)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="head">មេគ្រួសារ</option>
                        <option value="spouse">ប្តី / ប្រពន្ធ</option>
                        <option value="child">កូនបង្កើត / កូនចិញ្ចឹម</option>
                        <option value="parent">ឪពុក / ម្តាយ</option>
                        <option value="grandchild">ចៅ</option>
                        <option value="relative">សាច់ញាតិ</option>
                        <option value="other">ផ្សេងៗ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        អាយុ (Age):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={member.age}
                        onChange={(e) => handleUpdateMember(idx, 'age', parseInt(e.target.value) || 0)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        កម្រិតវប្បធម៌ / ការសិក្សា:
                      </label>
                      <select
                        value={member.educationLevel}
                        onChange={(e) => handleUpdateMember(idx, 'educationLevel', e.target.value as EducationLevel)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="none">មិនដែលរៀន</option>
                        <option value="primary_incomplete">បឋមសិក្សាមិនចប់</option>
                        <option value="primary_completed">ចប់បឋមសិក្សា (ថ្នាក់ទី៦)</option>
                        <option value="secondary">ចប់អនុវិទ្យាល័យ (ថ្នាក់ទី៩)</option>
                        <option value="high_school">ចប់វិទ្យាល័យ (បាក់ឌុប)</option>
                        <option value="vocational">បណ្តុះបណ្តាលវិជ្ជាជីវៈ</option>
                        <option value="university">ឧត្តមសិក្សា (បរិញ្ញាបត្រ)</option>
                        <option value="monk">ពុទ្ធិកសិក្សា</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        មុខរបរបច្ចុប្បន្ន:
                      </label>
                      <select
                        value={member.occupation}
                        onChange={(e) => handleUpdateMember(idx, 'occupation', e.target.value as OccupationType)}
                        className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="farmer">កសិករ</option>
                        <option value="factory_worker">កម្មកររោងចក្រ</option>
                        <option value="construction">កម្មករសំណង់</option>
                        <option value="business_trade">អាជីវករ / លក់ដូរ</option>
                        <option value="government_civil">មន្ត្រីរាជការ / កងកម្លាំង</option>
                        <option value="private_company">បុគ្គលិកក្រុមហ៊ុនឯកជន</option>
                        <option value="student">សិស្ស / និស្សិត</option>
                        <option value="child_preschool">កុមារតូច (មិនទាន់ចូលរៀន)</option>
                        <option value="housewife">មេផ្ទះ</option>
                        <option value="elderly_retired">មនុស្សចាស់ / ចូលនិវត្តន៍</option>
                        <option value="unemployed">គ្មានការងារធ្វើ</option>
                        <option value="other">ផ្សេងៗ</option>
                      </select>
                    </div>
                  </div>

                  {/* Vulnerability & Migration Checkboxes */}
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-700 border-t border-slate-200">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.hasNationalId}
                        onChange={(e) => handleUpdateMember(idx, 'hasNationalId', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>មានអត្តសញ្ញាណប័ណ្ណ</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.hasBirthCertificate}
                        onChange={(e) => handleUpdateMember(idx, 'hasBirthCertificate', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>មានសំបុត្រកំណើត</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.hasDisability}
                        onChange={(e) => handleUpdateMember(idx, 'hasDisability', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-purple-700 font-semibold">មានពិការភាព</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.hasChronicIllness}
                        onChange={(e) => handleUpdateMember(idx, 'hasChronicIllness', e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-rose-700 font-semibold">មានជំងឺរ៉ាំរ៉ៃ</span>
                    </label>

                    {member.gender === 'female' && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.isPregnant}
                          onChange={(e) => handleUpdateMember(idx, 'isPregnant', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-pink-700 font-semibold">ស្ត្រីមានផ្ទៃពោះ</span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Review & Save */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>ត្រួតពិនិត្យ និងរក្សាទុកទិន្នន័យជំរឿន</span>
              </h3>
              <p className="text-xs text-slate-500">ផ្ទៀងផ្ទាត់ព័ត៌មានមុននឹងបញ្ជូនទៅកាន់ Database</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">កូដខ្នងផ្ទះ:</span>
                  <p className="font-bold text-slate-800 font-mono">{hhData.householdCode}</p>
                </div>
                <div>
                  <span className="text-slate-500">ក្រុម:</span>
                  <p className="font-bold text-slate-800">{hhData.groupNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">មេគ្រួសារ:</span>
                  <p className="font-bold text-slate-800">{hhData.headName} ({hhData.headGender === 'male' ? 'ប្រុស' : 'ស្រី'})</p>
                </div>
                <div>
                  <span className="text-slate-500">ទូរស័ព្ទ:</span>
                  <p className="font-bold text-slate-800">{hhData.headPhone || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">សមាជិកសរុប:</span>
                  <p className="font-bold text-emerald-700">{membersList.length} នាក់</p>
                </div>
                <div>
                  <span className="text-slate-500">កម្រិតជីវភាព:</span>
                  <p className="font-bold text-amber-700">{hhData.idPoorStatus}</p>
                </div>
                <div>
                  <span className="text-slate-500">បង្គន់អនាម័យ:</span>
                  <p className="font-bold text-teal-700">{hhData.sanitationLatrine === 'flush_latrine' ? 'មានបង្គន់' : 'គ្មានបង្គន់'}</p>
                </div>
                <div>
                  <span className="text-slate-500">ទីតាំង GPS:</span>
                  <p className="font-mono text-[11px] text-slate-700">
                    {hhData.gpsLat ? `${hhData.gpsLat}, ${hhData.gpsLng}` : 'គ្មាន GPS'}
                  </p>
                </div>
              </div>

              {/* Members Preview */}
              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-xs font-bold text-slate-700 mb-2">បញ្ជីឈ្មោះសមាជិក៖</h4>
                <div className="flex flex-wrap gap-1.5">
                  {membersList.map((m, i) => (
                    <span key={m.id} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-800">
                      {i + 1}. {m.fullNameKh || '(គ្មានឈ្មោះ)'} ({m.age} ឆ្នាំ)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                ទិន្នន័យនឹងត្រូវបានរក្សាទុកក្នុង <strong>Local Database</strong> ភ្លាមៗ (ទោះគ្មានអ៊ីនធឺណិត) និងធ្វើសមកាលកម្មទៅ <strong>Supabase</strong> ដោយស្វ័យប្រវត្តិ។
              </span>
            </div>
          </div>
        )}

        {/* Wizard Step Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ក្រោយ</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <span>បន្ទាប់</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all animate-pulse"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកទិន្នន័យជំរឿន (Save Record)</span>
            </button>
          )}
        </div>

      </form>

    </div>
  );
};
