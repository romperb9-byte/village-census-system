// Types for Village Census & Demographics Management System

export type UserRole = 'admin' | 'validator' | 'enumerator';

export interface Enumerator {
  id: string;
  name: string;
  khmerName: string;
  role: UserRole;
  roleKhmer: string;
  groupAssigned: string; // e.g. "ក្រុមទី១", "ក្រុមទាំងអស់"
  pin: string; // 4-digit fast login PIN
  phone: string;
  targetHouseholds: number;
  avatarColor: string;
  isActive: boolean;
}

export type HousingType = 'wooden' | 'concrete' | 'mixed' | 'thatch_bamboo' | 'zinc';
export type RoofType = 'tile' | 'zinc' | 'thatch' | 'concrete';
export type WaterSource = 'piped' | 'pump_well' | 'dug_well' | 'rainwater' | 'pond_river' | 'bottled';
export type ElectricitySource = 'national_grid' | 'solar' | 'battery' | 'generator' | 'none';
export type LatrineType = 'flush_latrine' | 'pit_latrine' | 'shared' | 'none';
export type IDPoorStatus = 'none' | 'idpoor_1' | 'idpoor_2' | 'vulnerable';

export interface Household {
  id: string;
  householdCode: string; // e.g. "HH-01-001"
  groupNumber: string; // e.g. "ក្រុមទី១"
  village: string;
  commune: string;
  district: string;
  province: string;
  
  // Head of household
  headName: string;
  headGender: 'male' | 'female';
  headPhone: string;
  
  // Geolocation & Address
  gpsLat?: number | null;
  gpsLng?: number | null;
  addressDescription?: string;
  
  // Living conditions & Sanitation
  housingType: HousingType;
  roofType: RoofType;
  waterSource: WaterSource;
  electricitySource: ElectricitySource;
  sanitationLatrine: LatrineType;
  
  // Socio-economic & IDPoor
  idPoorStatus: IDPoorStatus;
  idPoorCardNumber?: string;
  
  // Agriculture & Livestock
  agriculturalLandHectares: number;
  cowsCount: number;
  buffalosCount: number;
  pigsCount: number;
  poultryCount: number;
  
  // Enumerator & Metadata
  enumeratorId: string;
  enumeratorName: string;
  membersCount?: number;
  isVerified?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean; // True if synced with Supabase
}

export type Gender = 'male' | 'female';
export type RelationToHead = 'head' | 'spouse' | 'child' | 'parent' | 'grandchild' | 'relative' | 'other';
export type EducationLevel = 'none' | 'primary_incomplete' | 'primary_completed' | 'secondary' | 'high_school' | 'vocational' | 'university' | 'monk';
export type OccupationType = 'farmer' | 'factory_worker' | 'construction' | 'business_trade' | 'government_civil' | 'private_company' | 'student' | 'child_preschool' | 'housewife' | 'elderly_retired' | 'unemployed' | 'other';
export type MigrationType = 'none' | 'domestic_phnom_penh' | 'domestic_province' | 'international_thailand' | 'international_korea' | 'international_japan' | 'international_other';

export interface HouseholdMember {
  id: string;
  householdId: string;
  fullNameKh: string;
  fullNameEn?: string;
  gender: Gender;
  relationToHead: RelationToHead;
  birthDate?: string; // YYYY-MM-DD
  age: number;
  
  // Legal Docs
  nationalId?: string;
  hasNationalId: boolean;
  hasBirthCertificate: boolean;
  
  // Education & Work
  educationLevel: EducationLevel;
  occupation: OccupationType;
  monthlyIncomeEstimate?: number;
  
  // Health & Vulnerabilities
  hasDisability: boolean;
  disabilityType?: string;
  hasChronicIllness: boolean;
  isPregnant: boolean;
  isElderlyLivingAlone: boolean;
  
  // Migration
  migrationStatus: MigrationType;
  
  notes?: string;
  createdAt: string;
}

export interface VillageSettings {
  villageName: string;
  communeName: string;
  districtName: string;
  provinceName: string;
  totalGroups: number;
  villageChiefName: string;
  villageChiefPhone: string;
  targetTotalHouseholds: number;
  censusYear: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
}
