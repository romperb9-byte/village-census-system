-- ==============================================================================
-- 📊 កូដបង្កើតតារាង DATABASE ជំរឿនស្ថិតិកម្រិតភូមិ (VILLAGE CENSUS SYSTEM FOR SUPABASE)
-- សម្រាប់ក្រុមការងារ ១២ នាក់ | PostgreSQL / Supabase
-- ==============================================================================

-- 1. បង្កើត TABLE កំណត់ព័ត៌មានភូមិ (Village Settings)
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

-- 2. បង្កើត TABLE បញ្ជីភ្នាក់ងារស្រង់ទិន្នន័យ ១២ នាក់ (12 Enumerators)
CREATE TABLE IF NOT EXISTS enumerators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  khmer_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'enumerator', -- 'admin', 'validator', 'enumerator'
  role_khmer TEXT NOT NULL,
  group_assigned TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  phone TEXT NOT NULL,
  target_households INT NOT NULL DEFAULT 35,
  avatar_color TEXT DEFAULT 'bg-emerald-600',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. បង្កើត TABLE ខ្នងផ្ទះ / គ្រួសារ (Households)
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  household_code TEXT NOT NULL UNIQUE,
  group_number TEXT NOT NULL,
  village TEXT NOT NULL,
  commune TEXT NOT NULL,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  
  -- មេគ្រួសារ
  head_name TEXT NOT NULL,
  head_gender TEXT NOT NULL, -- 'male' / 'female'
  head_phone TEXT DEFAULT '',
  
  -- ទីតាំង & GPS
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  address_description TEXT,
  
  -- ស្ថានភាពរស់នៅ & អនាម័យ
  housing_type TEXT NOT NULL DEFAULT 'wooden',
  roof_type TEXT NOT NULL DEFAULT 'zinc',
  water_source TEXT NOT NULL DEFAULT 'pump_well',
  electricity_source TEXT NOT NULL DEFAULT 'national_grid',
  sanitation_latrine TEXT NOT NULL DEFAULT 'flush_latrine',
  
  -- ជីវភាព & ប័ណ្ណក្រីក្រ
  id_poor_status TEXT NOT NULL DEFAULT 'none',
  id_poor_card_number TEXT DEFAULT '',
  
  -- កសិកម្ម និងសត្វពាហនៈ
  agricultural_land_hectares NUMERIC(10, 2) DEFAULT 0,
  cows_count INT DEFAULT 0,
  buffalos_count INT DEFAULT 0,
  pigs_count INT DEFAULT 0,
  poultry_count INT DEFAULT 0,
  
  -- អ្នកស្រង់ & កាលបរិច្ឆេទ
  enumerator_id TEXT REFERENCES enumerators(id) ON DELETE SET NULL,
  enumerator_name TEXT DEFAULT '',
  members_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. បង្កើត TABLE សមាជិកគ្រួសារម្នាក់ៗ (Household Members)
CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  full_name_kh TEXT NOT NULL,
  full_name_en TEXT DEFAULT '',
  gender TEXT NOT NULL, -- 'male' / 'female'
  relation_to_head TEXT NOT NULL, -- 'head', 'spouse', 'child', 'parent', etc.
  birth_date DATE,
  age INT NOT NULL,
  
  -- ឯកសារច្បាប់
  national_id TEXT DEFAULT '',
  has_national_id BOOLEAN DEFAULT FALSE,
  has_birth_certificate BOOLEAN DEFAULT TRUE,
  
  -- ការអប់រំ និងមុខរបរ
  education_level TEXT NOT NULL DEFAULT 'primary_completed',
  occupation TEXT NOT NULL DEFAULT 'farmer',
  monthly_income_estimate NUMERIC(10, 2) DEFAULT 0,
  
  -- សុខភាព & ងាយរងគ្រោះ
  has_disability BOOLEAN DEFAULT FALSE,
  disability_type TEXT DEFAULT '',
  has_chronic_illness BOOLEAN DEFAULT FALSE,
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_elderly_living_alone BOOLEAN DEFAULT FALSE,
  
  -- ចំណាកស្រុក
  migration_status TEXT DEFAULT 'none',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- បង្កើត INDEX ដើម្បីឱ្យការ Search & Filter មានល្បឿនលឿនបំផុត
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_households_group ON households(group_number);
CREATE INDEX IF NOT EXISTS idx_households_idpoor ON households(id_poor_status);
CREATE INDEX IF NOT EXISTS idx_households_enumerator ON households(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_gender ON household_members(gender);
CREATE INDEX IF NOT EXISTS idx_members_occupation ON household_members(occupation);

-- ==============================================================================
-- បើក ROW LEVEL SECURITY (RLS) និងគោលការណ៍ (POLICIES) អនុញ្ញាតឱ្យ Read/Write
-- ==============================================================================
ALTER TABLE village_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enumerators ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- បង្កើត Policies សម្រាប់សាធារណៈ (Anon Key) និង Authenticated
DROP POLICY IF EXISTS "Public access village_settings" ON village_settings;
CREATE POLICY "Public access village_settings" ON village_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access enumerators" ON enumerators;
CREATE POLICY "Public access enumerators" ON enumerators FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access households" ON households;
CREATE POLICY "Public access households" ON households FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access household_members" ON household_members;
CREATE POLICY "Public access household_members" ON household_members FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- បញ្ចូលបញ្ជីក្រុមការងារ ១២ នាក់ដំបូង (12 Enumerators Initial Seed)
-- ==============================================================================
INSERT INTO enumerators (id, name, khmer_name, role, role_khmer, group_assigned, pin, phone, target_households, avatar_color)
VALUES
  ('enum-01', 'Sok Mean', 'លោក សុខ ម៉ាន (មេភូមិ)', 'admin', 'មេភូមិ / អ្នកគ្រប់គ្រង', 'គ្រប់ក្រុម (ទូទាំងភូមិ)', '1234', '012 889 901', 50, 'bg-emerald-600'),
  ('enum-02', 'Chan Dara', 'លោក ចាន់ ដារ៉ា (អនុភូមិ)', 'validator', 'អនុភូមិ / អ្នកផ្ទៀងផ្ទាត់', 'គ្រប់ក្រុម (ទូទាំងភូមិ)', '1122', '098 776 655', 50, 'bg-blue-600'),
  ('enum-03', 'Keo Bopha', 'កញ្ញា កែវ បុប្ផា', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី១', '1001', '085 112 233', 35, 'bg-purple-600'),
  ('enum-04', 'Heng Piseth', 'លោក ហេង ពិសិដ្ឋ', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី២', '1002', '016 223 344', 35, 'bg-indigo-600'),
  ('enum-05', 'Nhem Chenda', 'អ្នកស្រី ញ៉ែម ចិន្តា', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៣', '1003', '070 334 455', 35, 'bg-pink-600'),
  ('enum-06', 'Mao Rath', 'លោក ម៉ៅ រ័ត្ន', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៤', '1004', '096 445 566', 35, 'bg-teal-600'),
  ('enum-07', 'Long Vanna', 'កញ្ញា ឡុង វណ្ណា', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៥', '1005', '017 556 677', 35, 'bg-amber-600'),
  ('enum-08', 'Sarom Visal', 'លោក សារ៉ុម វិសាល', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៦', '1006', '088 667 788', 35, 'bg-cyan-600'),
  ('enum-09', 'Pov Sreynich', 'អ្នកស្រី ពៅ ស្រីនិច', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៧', '1007', '011 778 899', 35, 'bg-rose-600'),
  ('enum-10', 'Chhorn Samnang', 'លោក ឈន សំណាង', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៨', '1008', '097 889 911', 35, 'bg-orange-600'),
  ('enum-11', 'Khem Sreyleak', 'កញ្ញា ខឹម ស្រីលក្ខណ៍', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី៩', '1009', '069 990 022', 35, 'bg-lime-600'),
  ('enum-12', 'Phan Rithy', 'លោក ផាន់ រិទ្ធី', 'enumerator', 'ភ្នាក់ងារស្រង់ទិន្នន័យ', 'ក្រុមទី១០', '1010', '010 321 654', 35, 'bg-violet-600')
ON CONFLICT (id) DO NOTHING;

-- បញ្ចូល Village Settings ដំបូង
INSERT INTO village_settings (village_name, commune_name, district_name, province_name, total_groups, village_chief_name, village_chief_phone, target_total_households, census_year)
VALUES ('ភូមិព្រៃស្វាយ', 'ឃុំព្រៃទទឹង', 'ស្រុកព្រៃកប្បាស', 'ខេត្តតាកែវ', 10, 'លោក សុខ ម៉ាន', '012 889 901', 350, '២០២៦')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- បើក SUPABASE REALTIME សម្រាប់ TABLE ទាំង ៤ (Realtime Synchronization)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE village_settings, enumerators, households, household_members;
