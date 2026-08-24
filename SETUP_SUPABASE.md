# 🚀 សេចក្តីណែនាំការបង្កើត និងភ្ជាប់ Supabase Database (១០០% ឥតគិតថ្លៃ)

ប្រព័ន្ធជំរឿនកម្រិតភូមិត្រូវបានរៀបចំឡើងដើម្បីភ្ជាប់ជាមួយ **Supabase (PostgreSQL Cloud Database)** ដើម្បីឱ្យក្រុមការងារទាំង **១២ នាក់** អាច Sync ទិន្នន័យពីទូរស័ព្ទដៃ ឬកុំព្យូទ័រមកកាន់ Database កណ្តាលរួមតែមួយ។

---

## ជំហានទី ១: បង្កើតគណនី និង Project លើ Supabase
1. ចូលទៅកាន់គេហទំព័រ [https://supabase.com](https://supabase.com)
2. ចុច **"Start your project"** ឬ **"Sign in"** (អាចចូលដោយប្រើ GitHub Account បាន)
3. ចុចប៊ូតុង **"New Project"**
4. បញ្ចូលព័ត៌មានគម្រោង៖
   - **Name**: `village-census` (ឬឈ្មោះភូមិរបស់អ្នក)
   - **Database Password**: កំណត់លេខសម្ងាត់ Database ផ្ទាល់ខ្លួនរបស់អ្នក (សូមចងចាំទុក)
   - **Region**: ជ្រើសរើស `Singapore (ap-southeast-1)` ដើម្បីឱ្យល្បឿនដំណើរការលឿននៅកម្ពុជា
5. ចុច **"Create new project"** ហើយរង់ចាំប្រហែល ១-២ នាទីឱ្យ Supabase រៀបចំ Database រួចរាល់។

---

## ជំហានទី ២: Run SQL Schema ដើម្បីបង្កើតតារាងដោយស្វ័យប្រវត្តិ
1. នៅក្នុងផ្ទាំង Supabase Dashboard ខាងឆ្វេងដៃ ចុចលើម៉ឺនុយ **"SQL Editor"** (រូបកូដ `_>`)
2. ចុចលើប៊ូតុង **"+ New query"**
3. បើកឯកសារ `supabase_schema.sql` ក្នុងគម្រោងនេះ ឬចុចប៊ូតុង **"Copy SQL Schema"** ក្នុង Settings នៃប្រព័ន្ធជំរឿន
4. Paste កូដ SQL ទាំងអស់នោះចូលទៅក្នុង SQL Editor
5. ចុចប៊ូតុង **"Run"** (ឬចុច `Ctrl + Enter` / `Cmd + Enter`)
6. អ្នកនឹងឃើញសារ **"Success. No rows returned"** មានន័យថាតារាងទាំងអស់ (households, household_members, enumerators, village_settings) ត្រូវបានបង្កើត និងបើក Realtime រួចរាល់ ១០០%!

---

## ជំហានទី ៣: យក Project URL & Anon Key មកភ្ជាប់ក្នុង App
1. នៅក្នុង Supabase Dashboard ចុចលើរូបកង់ប៉េក **"Project Settings"** (ខាងឆ្វេងក្រោម)
2. ជ្រើសរើសម៉ឺនុយ **"API"**
3. ចម្លង (Copy) តម្លៃពីរខាងក្រោម៖
   - **Project URL**: ឧទាហរណ៍ `https://xxxxxx.supabase.co`
   - **anon / public key**: កូដវែងដែលចាប់ផ្តើមដោយ `eyJhbGci...`
4. បើកប្រព័ន្ធជំរឿនកម្រិតភូមិ -> ចុចលើរូបកង់ប៉េក **"ការកំណត់ (Settings)"**
5. Paste URL និង Key ចូល រួចចុច **"តេស្ត & រក្សាទុកការភ្ជាប់"**
6. ប្រព័ន្ធនឹងបង្ហាញសារថា **"ភ្ជាប់ទៅកាន់ Supabase ជោគជ័យ!"** ជាការស្រេច។

---

## ជំហានទី ៤: ការធ្វើសមកាលកម្មទិន្នន័យ (Sync Data)
- ភ្នាក់ងារចុះស្រង់ទិន្នន័យទាំង ១២ នាក់អាចបញ្ចូលទិន្នន័យទោះបីគ្មានអ៊ីនធឺណិត (Offline)
- ពេលមានសេវាអ៊ីនធឺណិត (Wi-Fi/4G) គ្រាន់តែចុចប៊ូតុង **"Sync"** នៅលើ Navbar កំពូល ទិន្នន័យទាំងអស់នឹងត្រូវបញ្ជូនទៅ Supabase ភ្លាមៗ។
