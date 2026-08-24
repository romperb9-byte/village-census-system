import { Household, HouseholdMember, Enumerator, VillageSettings } from '../types';
import { INITIAL_ENUMERATORS } from '../data/enumeratorsData';
import { INITIAL_HOUSEHOLDS, INITIAL_MEMBERS, INITIAL_VILLAGE_SETTINGS } from '../data/initialVillageData';
import { getSupabaseClient } from './supabase';

const STORAGE_KEYS = {
  HOUSEHOLDS: 'village_census_households',
  MEMBERS: 'village_census_members',
  ENUMERATORS: 'village_census_enumerators',
  SETTINGS: 'village_census_settings',
  ACTIVE_USER: 'village_census_active_user',
  LAST_SYNC: 'village_census_last_sync'
};

// Initial data loader
export function initializeLocalDatabase(): void {
  if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)) {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(INITIAL_HOUSEHOLDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENUMERATORS)) {
    localStorage.setItem(STORAGE_KEYS.ENUMERATORS, JSON.stringify(INITIAL_ENUMERATORS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_VILLAGE_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(INITIAL_ENUMERATORS[0]));
  }
}

// Active User
export function getActiveUser(): Enumerator {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_ENUMERATORS[0];
}

export function setActiveUser(user: Enumerator): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
}

// Enumerators
export function getEnumerators(): Enumerator[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENUMERATORS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_ENUMERATORS;
}

export function saveEnumerators(enumerators: Enumerator[]): void {
  localStorage.setItem(STORAGE_KEYS.ENUMERATORS, JSON.stringify(enumerators));
}

// Village Settings
export function getVillageSettings(): VillageSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_VILLAGE_SETTINGS;
}

export function saveVillageSettings(settings: VillageSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Households
export function getHouseholds(): Household[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveHouseholds(households: Household[]): void {
  localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));
}

// Members
export function getMembers(): HouseholdMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveMembers(members: HouseholdMember[]): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

// Get members for a specific household
export function getHouseholdMembers(householdId: string): HouseholdMember[] {
  const members = getMembers();
  return members.filter(m => m.householdId === householdId);
}

// Add or Update Household + Members
export async function saveHouseholdWithMembers(
  household: Household,
  members: HouseholdMember[]
): Promise<{ success: boolean; household: Household }> {
  // 1. Update local storage
  const households = getHouseholds();
  const allMembers = getMembers();

  household.membersCount = members.length;
  household.updatedAt = new Date().toISOString();
  if (!household.createdAt) {
    household.createdAt = new Date().toISOString();
  }

  const existingHhIndex = households.findIndex(h => h.id === household.id);
  if (existingHhIndex >= 0) {
    households[existingHhIndex] = { ...household, synced: false };
  } else {
    households.unshift({ ...household, synced: false });
  }
  saveHouseholds(households);

  // Remove old members of this household & append new
  const otherMembers = allMembers.filter(m => m.householdId !== household.id);
  const updatedMembersList = [...otherMembers, ...members];
  saveMembers(updatedMembersList);

  // 2. Try syncing to Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      // Upsert household
      const { error: hhError } = await client
        .from('households')
        .upsert({
          id: household.id,
          household_code: household.householdCode,
          group_number: household.groupNumber,
          village: household.village,
          commune: household.commune,
          district: household.district,
          province: household.province,
          head_name: household.headName,
          head_gender: household.headGender,
          head_phone: household.headPhone,
          gps_lat: household.gpsLat,
          gps_lng: household.gpsLng,
          address_description: household.addressDescription,
          housing_type: household.housingType,
          roof_type: household.roofType,
          water_source: household.waterSource,
          electricity_source: household.electricitySource,
          sanitation_latrine: household.sanitationLatrine,
          id_poor_status: household.idPoorStatus,
          id_poor_card_number: household.idPoorCardNumber,
          agricultural_land_hectares: household.agriculturalLandHectares,
          cows_count: household.cowsCount,
          buffalos_count: household.buffalosCount,
          pigs_count: household.pigsCount,
          poultry_count: household.poultryCount,
          enumerator_id: household.enumeratorId,
          enumerator_name: household.enumeratorName,
          members_count: members.length,
          is_verified: household.isVerified,
          notes: household.notes,
          created_at: household.createdAt,
          updated_at: household.updatedAt,
        });

      if (!hhError) {
        // Delete old members on Supabase for this household
        await client.from('household_members').delete().eq('household_id', household.id);
        
        // Insert new members
        if (members.length > 0) {
          const dbMembers = members.map(m => ({
            id: m.id,
            household_id: m.householdId,
            full_name_kh: m.fullNameKh,
            full_name_en: m.fullNameEn,
            gender: m.gender,
            relation_to_head: m.relationToHead,
            birth_date: m.birthDate,
            age: m.age,
            national_id: m.nationalId,
            has_national_id: m.hasNationalId,
            has_birth_certificate: m.hasBirthCertificate,
            education_level: m.educationLevel,
            occupation: m.occupation,
            monthly_income_estimate: m.monthlyIncomeEstimate,
            has_disability: m.hasDisability,
            disability_type: m.disabilityType,
            has_chronic_illness: m.hasChronicIllness,
            is_pregnant: m.isPregnant,
            is_elderly_living_alone: m.isElderlyLivingAlone,
            migration_status: m.migrationStatus,
            notes: m.notes,
            created_at: m.createdAt,
          }));
          await client.from('household_members').insert(dbMembers);
        }

        // Mark as synced locally
        const syncedHouseholds = getHouseholds();
        const found = syncedHouseholds.find(h => h.id === household.id);
        if (found) {
          found.synced = true;
          saveHouseholds(syncedHouseholds);
        }
      }
    } catch (err) {
      console.warn('Sync failed during save, will sync later:', err);
    }
  }

  return { success: true, household };
}

// Delete Household
export async function deleteHousehold(householdId: string): Promise<boolean> {
  const households = getHouseholds().filter(h => h.id !== householdId);
  saveHouseholds(households);

  const members = getMembers().filter(m => m.householdId !== householdId);
  saveMembers(members);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('household_members').delete().eq('household_id', householdId);
      await client.from('households').delete().eq('id', householdId);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  return true;
}

// Sync all local records with Supabase
export async function syncAllWithSupabase(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      syncedCount: 0,
      message: 'សូមកំណត់ Supabase URL & Key ក្នុង Settings ជាមុនសិន'
    };
  }

  try {
    const households = getHouseholds();
    const members = getMembers();

    // 1. Fetch remote data to merge or push local data
    const { data: remoteHh, error: fetchErr } = await client
      .from('households')
      .select('*');

    if (fetchErr) {
      throw new Error(`បរាជ័យទាញយកទិន្នន័យ: ${fetchErr.message}`);
    }

    // 2. Push unsynced local households
    let count = 0;
    for (const h of households) {
      const { error: pushErr } = await client.from('households').upsert({
        id: h.id,
        household_code: h.householdCode,
        group_number: h.groupNumber,
        village: h.village,
        commune: h.commune,
        district: h.district,
        province: h.province,
        head_name: h.headName,
        head_gender: h.headGender,
        head_phone: h.headPhone,
        gps_lat: h.gpsLat,
        gps_lng: h.gpsLng,
        address_description: h.addressDescription,
        housing_type: h.housingType,
        roof_type: h.roofType,
        water_source: h.waterSource,
        electricity_source: h.electricitySource,
        sanitation_latrine: h.sanitationLatrine,
        id_poor_status: h.idPoorStatus,
        id_poor_card_number: h.idPoorCardNumber,
        agricultural_land_hectares: h.agriculturalLandHectares,
        cows_count: h.cowsCount,
        buffalos_count: h.buffalosCount,
        pigs_count: h.pigsCount,
        poultry_count: h.poultryCount,
        enumerator_id: h.enumeratorId,
        enumerator_name: h.enumeratorName,
        members_count: h.membersCount,
        is_verified: h.isVerified,
        notes: h.notes,
        created_at: h.createdAt,
        updated_at: h.updatedAt,
      });

      if (!pushErr) {
        h.synced = true;
        count++;
      }
    }

    // 3. Push members
    if (members.length > 0) {
      const dbMembers = members.map(m => ({
        id: m.id,
        household_id: m.householdId,
        full_name_kh: m.fullNameKh,
        full_name_en: m.fullNameEn,
        gender: m.gender,
        relation_to_head: m.relationToHead,
        birth_date: m.birthDate,
        age: m.age,
        national_id: m.nationalId,
        has_national_id: m.hasNationalId,
        has_birth_certificate: m.hasBirthCertificate,
        education_level: m.educationLevel,
        occupation: m.occupation,
        monthly_income_estimate: m.monthlyIncomeEstimate,
        has_disability: m.hasDisability,
        disability_type: m.disabilityType,
        has_chronic_illness: m.hasChronicIllness,
        is_pregnant: m.isPregnant,
        is_elderly_living_alone: m.isElderlyLivingAlone,
        migration_status: m.migrationStatus,
        notes: m.notes,
        created_at: m.createdAt,
      }));

      await client.from('household_members').upsert(dbMembers);
    }

    saveHouseholds(households);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    return {
      success: true,
      syncedCount: count,
      message: `ធ្វើសមកាលកម្ម (Sync) ជោគជ័យចំនួន ${count} ខ្នងផ្ទះ!`
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      message: `ការ Sync មានបញ្ហា: ${err.message || 'Error syncing'}`
    };
  }
}

// Backup & Restore helpers
export function exportDatabaseBackup(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: getVillageSettings(),
    enumerators: getEnumerators(),
    households: getHouseholds(),
    members: getMembers()
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.households && parsed.members) {
      saveHouseholds(parsed.households);
      saveMembers(parsed.members);
      if (parsed.settings) saveVillageSettings(parsed.settings);
      if (parsed.enumerators) saveEnumerators(parsed.enumerators);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
