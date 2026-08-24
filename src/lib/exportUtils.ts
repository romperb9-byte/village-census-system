import * as XLSX from 'xlsx';
import { Household, HouseholdMember, VillageSettings } from '../types';

// Translation dictionaries for human-readable exports
const HOUSING_TYPE_KH: Record<string, string> = {
  wooden: 'ផ្ទះឈើ',
  concrete: 'ផ្ទះថ្ម/បេតុង',
  mixed: 'ផ្ទះឈើលើថ្មក្រោម',
  thatch_bamboo: 'ផ្ទះស្លឹក/ឬស្សី',
  zinc: 'ផ្ទះស័ង្កសី',
};

const WATER_SOURCE_KH: Record<string, string> = {
  piped: 'ទឹកម៉ាស៊ីនរដ្ឋ/ឯកជន',
  pump_well: 'អណ្តូងស្នប់',
  dug_well: 'អណ្តូងជីក/លូ',
  rainwater: 'ទឹកភ្លៀង/ពាង',
  pond_river: 'ស្រះ/ត្រពាំង/ព្រែក',
  bottled: 'ទឹកបរិសុទ្ធទិញ',
};

const ELECTRICITY_KH: Record<string, string> = {
  national_grid: 'បណ្តាញជាតិ (EDC)',
  solar: 'ថាមពលពន្លឺព្រះអាទិត្យ (Solar)',
  battery: 'អាគុយ',
  generator: 'ម៉ាស៊ីនភ្លើង',
  none: 'គ្មាន',
};

const LATRINE_KH: Record<string, string> = {
  flush_latrine: 'បង្គន់ចាក់ទឹក/អនាម័យ',
  pit_latrine: 'បង្គន់ជីក/រណ្តៅ',
  shared: 'ប្រើរួមគ្នាជាមួយអ្នកដទៃ',
  none: 'គ្មានបង្គន់',
};

const IDPOOR_KH: Record<string, string> = {
  none: 'គ្មានប័ណ្ណក្រីក្រ',
  idpoor_1: 'ក្រីក្រកម្រិត១ (ក្រខ្លាំង)',
  idpoor_2: 'ក្រីក្រកម្រិត២ (ក្រមធ្យម)',
  vulnerable: 'គ្រួសារងាយរងហានិភ័យ',
};

const RELATION_KH: Record<string, string> = {
  head: 'មេគ្រួសារ',
  spouse: 'ប្តី/ប្រពន្ធ',
  child: 'កូន',
  parent: 'ឪពុក/ម្តាយ',
  grandchild: 'ចៅ',
  relative: 'សាច់ញាតិ',
  other: 'ផ្សេងៗ',
};

const EDUCATION_KH: Record<string, string> = {
  none: 'មិនដែលរៀន',
  primary_incomplete: 'បឋមសិក្សាមិនចប់',
  primary_completed: 'ចប់បឋមសិក្សា (ថ្នាក់ទី៦)',
  secondary: 'ចប់អនុវិទ្យាល័យ (ថ្នាក់ទី៩)',
  high_school: 'ចប់វិទ្យាល័យ (បាក់ឌុប)',
  vocational: 'បណ្តុះបណ្តាលវិជ្ជាជីវៈ',
  university: 'ឧត្តមសិក្សា (បរិញ្ញាបត្រ)',
  monk: 'ពុទ្ធិកសិក្សា',
};

const OCCUPATION_KH: Record<string, string> = {
  farmer: 'កសិករ (ធ្វើស្រែ/ចម្ការ)',
  factory_worker: 'កម្មកររោងចក្រ',
  construction: 'កម្មករសំណង់',
  business_trade: 'អាជីវករ/លក់ដូរ',
  government_civil: 'មន្ត្រីរាជការ/កងកម្លាំង',
  private_company: 'បុគ្គលិកក្រុមហ៊ុនឯកជន',
  student: 'សិស្ស/និស្សិត',
  child_preschool: 'កុមារតូច (មិនទាន់ចូលរៀន)',
  housewife: 'មេផ្ទះ',
  elderly_retired: 'មនុស្សចាស់/ចូលនិវត្តន៍',
  unemployed: 'គ្មានការងារធ្វើ',
  other: 'ផ្សេងៗ',
};

const MIGRATION_KH: Record<string, string> = {
  none: 'នៅក្នុងភូមិ',
  domestic_phnom_penh: 'ភ្នំពេញ',
  domestic_province: 'ខេត្តផ្សេងក្នុងប្រទេស',
  international_thailand: 'ប្រទេសថៃ',
  international_korea: 'ប្រទេសកូរ៉េ',
  international_japan: 'ប្រទេសជប៉ុន',
  international_other: 'ប្រទេសក្រៅផ្សេងៗ',
};

export function exportCensusToExcel(
  households: Household[],
  members: HouseholdMember[],
  settings: VillageSettings
): void {
  // 1. Households Sheet Data
  const householdsData = households.map((h, idx) => ({
    'ល.រ': idx + 1,
    'កូដខ្នងផ្ទះ': h.householdCode,
    'ក្រុម': h.groupNumber,
    'ឈ្មោះមេគ្រួសារ': h.headName,
    'ភេទ': h.headGender === 'male' ? 'ប្រុស' : 'ស្រី',
    'លេខទូរស័ព្ទ': h.headPhone || '-',
    'ចំនួនសមាជិក': h.membersCount || 0,
    'កម្រិតជីវភាព': IDPOOR_KH[h.idPoorStatus] || h.idPoorStatus,
    'លេខប័ណ្ណក្រីក្រ': h.idPoorCardNumber || '-',
    'ប្រភេទផ្ទះ': HOUSING_TYPE_KH[h.housingType] || h.housingType,
    'ប្រភពទឹក': WATER_SOURCE_KH[h.waterSource] || h.waterSource,
    'អគ្គិសនី': ELECTRICITY_KH[h.electricitySource] || h.electricitySource,
    'បង្គន់អនាម័យ': LATRINE_KH[h.sanitationLatrine] || h.sanitationLatrine,
    'ដីកសិកម្ម (ហ.ត)': h.agriculturalLandHectares || 0,
    'គោ (ក្បាល)': h.cowsCount || 0,
    'ក្របី (ក្បាល)': h.buffalosCount || 0,
    'ជ្រូក (ក្បាល)': h.pigsCount || 0,
    'មាន់/ទា (ក្បាល)': h.poultryCount || 0,
    'ទីតាំង GPS': h.gpsLat && h.gpsLng ? `${h.gpsLat}, ${h.gpsLng}` : '-',
    'ទីតាំងភូមិសាស្ត្រ': h.addressDescription || '-',
    'ភ្នាក់ងារស្រង់': h.enumeratorName || '-',
    'កាលបរិច្ឆេទស្រង់': new Date(h.createdAt).toLocaleDateString('km-KH'),
    'កំណត់សម្គាល់': h.notes || '-'
  }));

  // 2. Members Sheet Data
  const membersData = members.map((m, idx) => {
    const parentHh = households.find(h => h.id === m.householdId);
    return {
      'ល.រ': idx + 1,
      'កូដខ្នងផ្ទះ': parentHh ? parentHh.householdCode : '-',
      'ក្រុម': parentHh ? parentHh.groupNumber : '-',
      'ឈ្មោះមេគ្រួសារ': parentHh ? parentHh.headName : '-',
      'ឈ្មោះសមាជិក (ខ្មែរ)': m.fullNameKh,
      'ឈ្មោះសមាជិក (ឡាតាំង)': m.fullNameEn || '-',
      'ភេទ': m.gender === 'male' ? 'ប្រុស' : 'ស្រី',
      'ទំនាក់ទំនង': RELATION_KH[m.relationToHead] || m.relationToHead,
      'អាយុ': m.age,
      'ថ្ងៃខែឆ្នាំកំណើត': m.birthDate || '-',
      'អត្តសញ្ញាណប័ណ្ណ': m.hasNationalId ? (m.nationalId || 'មាន') : 'គ្មាន',
      'សំបុត្រកំណើត': m.hasBirthCertificate ? 'មាន' : 'គ្មាន',
      'កម្រិតវប្បធម៌': EDUCATION_KH[m.educationLevel] || m.educationLevel,
      'មុខរបរបច្ចុប្បន្ន': OCCUPATION_KH[m.occupation] || m.occupation,
      'ចំណូលប៉ាន់ស្មាន ($)': m.monthlyIncomeEstimate || 0,
      'ពិការភាព': m.hasDisability ? (m.disabilityType || 'មានពិការភាព') : 'គ្មាន',
      'ជំងឺរ៉ាំរ៉ៃ': m.hasChronicIllness ? 'មាន' : 'គ្មាន',
      'ស្ត្រីមានផ្ទៃពោះ': m.isPregnant ? 'បាទ/ចាស' : 'ទេ',
      'ចំណាកស្រុក': MIGRATION_KH[m.migrationStatus] || m.migrationStatus,
      'កំណត់សម្គាល់': m.notes || '-'
    };
  });

  // 3. Village Summary Stats Sheet Data
  const totalHouseholds = households.length;
  const totalPopulation = members.length;
  const totalMale = members.filter(m => m.gender === 'male').length;
  const totalFemale = members.filter(m => m.gender === 'female').length;
  const idpoor1Count = households.filter(h => h.idPoorStatus === 'idpoor_1').length;
  const idpoor2Count = households.filter(h => h.idPoorStatus === 'idpoor_2').length;
  const withLatrineCount = households.filter(h => h.sanitationLatrine === 'flush_latrine').length;

  const summaryData = [
    { 'សូចនាករស្ថិតិ': 'ឈ្មោះភូមិ', 'ចំនួន': settings.villageName },
    { 'សូចនាករស្ថិតិ': 'ឃុំ/សង្កាត់', 'ចំនួន': settings.communeName },
    { 'សូចនាករស្ថិតិ': 'ស្រុក/ខណ្ឌ', 'ចំនួន': settings.districtName },
    { 'សូចនាករស្ថិតិ': 'ខេត្ត/រាជធានី', 'ចំនួន': settings.provinceName },
    { 'សូចនាករស្ថិតិ': 'មេភូមិទទួលបន្ទុក', 'ចំនួន': settings.villageChiefName },
    { 'សូចនាករស្ថិតិ': 'ឆ្នាំជំរឿន', 'ចំនួន': settings.censusYear },
    { 'សូចនាករស្ថិតិ': 'ខ្នងផ្ទះសរុបដែលបានស្រង់', 'ចំនួន': totalHouseholds },
    { 'សូចនាករស្ថិតិ': 'ប្រជាជនសរុប (នាក់)', 'ចំនួន': totalPopulation },
    { 'សូចនាករស្ថិតិ': 'ប្រុស (នាក់)', 'ចំនួន': totalMale },
    { 'សូចនាករស្ថិតិ': 'ស្រី (នាក់)', 'ចំនួន': totalFemale },
    { 'សូចនាករស្ថិតិ': 'គ្រួសារក្រីក្រកម្រិត១ (ក្រ១)', 'ចំនួន': idpoor1Count },
    { 'សូចនាករស្ថិតិ': 'គ្រួសារក្រីក្រកម្រិត២ (ក្រ២)', 'ចំនួន': idpoor2Count },
    { 'សូចនាករស្ថិតិ': 'ខ្នងផ្ទះមានបង្គន់អនាម័យត្រឹមត្រូវ', 'ចំនួន': `${withLatrineCount} (${totalHouseholds ? Math.round((withLatrineCount / totalHouseholds) * 100) : 0}%)` },
  ];

  // Build Workbook
  const wb = XLSX.utils.book_new();

  const wsHouseholds = XLSX.utils.json_to_sheet(householdsData);
  const wsMembers = XLSX.utils.json_to_sheet(membersData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'ស្ថិតិសង្ខេបភូមិ');
  XLSX.utils.book_append_sheet(wb, wsHouseholds, 'ទិន្នន័យខ្នងផ្ទះ');
  XLSX.utils.book_append_sheet(wb, wsMembers, 'ទិន្នន័យសមាជិកភូមិ');

  const fileName = `របាយការណ៍ជំរឿន_${settings.villageName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportHouseholdsCSV(households: Household[]): void {
  const ws = XLSX.utils.json_to_sheet(households);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `households_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
