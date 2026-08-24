# 🌾 ប្រព័ន្ធជំរឿនស្ថិតិកម្រិតភូមិ (Village Census & Demographics System)

ប្រព័ន្ធគ្រប់គ្រង និងស្រង់ទិន្នន័យជំរឿនកម្រិតភូមិ **សម្រាប់ក្រុមការងារ ១២ នាក់** ដំណើរការទាំង **Offline & Online Realtime Sync** ជាមួយ **Supabase Cloud Database (PostgreSQL)** និងរៀបចំសម្រាប់ **Deploy តាមរយៈ GitHub Actions / GitHub Pages / Vercel** ១០០% ពេញលេញ។

---

## 🌟 លក្ខណៈពិសេសចម្បងៗ (Key Features)

- 👥 **គណនីក្រុមការងារ ១២ នាក់ (12 Enumerators & Roles)**:
  - មេភូមិ / អ្នកគ្រប់គ្រង (Admin)
  - អនុភូមិ / អ្នកផ្ទៀងផ្ទាត់ (Validator)
  - ភ្នាក់ងារស្រង់ទិន្នន័យ ១០ នាក់ (ទទួលបន្ទុកតាមក្រុមទី១ ដល់ ក្រុមទី១០)
  - ចូលប្រើរហ័សដោយប្រើលេខកូដសម្ងាត់ PIN (៤ ខ្ទង់) លើទូរស័ព្ទដៃ
- 📝 **ទម្រង់ស្រង់ទិន្នន័យជំរឿនតាមស្តង់ដារ ៥ ជំហាន**:
  1. ព័ត៌មានទូទៅខ្នងផ្ទះ (កូដខ្នងផ្ទះ, ក្រុម, ឈ្មោះមេគ្រួសារ, លេខទូរស័ព្ទ)
  2. ទីតាំង GPS (ចុចចាប់យកកូអរដោនេស្វ័យប្រវត្តិ 📍) & ស្ថានភាពផ្ទះ/ដំបូល/ប្រភពទឹក/អគ្គិសនី/បង្គន់អនាម័យ
  3. កម្រិតជីវភាព (ប័ណ្ណក្រីក្រ ក្រ១, ក្រ២, ងាយរងហានិភ័យ) & កសិកម្ម (ដីស្រែ, គោ, ក្របី, ជ្រូក, មាន់ទា)
  4. បញ្ជីសមាជិកគ្រួសារម្នាក់ៗ (ឈ្មោះខ្មែរ-ឡាតាំង, អាយុ, អត្តសញ្ញាណប័ណ្ណ, សំបុត្រកំណើត, កម្រិតអប់រំ, មុខរបរ, ពិការភាព, ជំងឺរ៉ាំរ៉ៃ, ស្ត្រីមានផ្ទៃពោះ, ចំណាកស្រុក)
  5. ផ្ទៀងផ្ទាត់ & រក្សាទុក
- 💾 **Offline-First & Supabase Cloud Sync**:
  - ដំណើរការបាន ១០០% ទោះគ្មានសេវាអ៊ីនធឺណិតនៅតាមទីវាល
  - ចុចប៊ូតុង **"Sync"** មួយចុចដើម្បីបញ្ជូនទិន្នន័យចូល Supabase
- 📊 **ផ្ទាំងស្ថិតិ & ក្រាហ្វិកវិភាគ (Interactive Dashboard)**:
  - ក្រាហ្វិកពីរ៉ាមីតអាយុ, សមាមាត្រភេទ, ក្រាហ្វិកប័ណ្ណក្រីក្រ, មុខរបរចម្បង, វឌ្ឍនភាពតាមក្រុម
- 👥 **ផ្ទាំងតាមដានសមិទ្ធផលក្រុមការងារ ១២ នាក់ (Enumerator Leaderboard)**:
  - តាមដានចំនួនខ្នងផ្ទះដែលបានស្រង់ធៀបនឹង Target
- 📥 **Export Excel (.xlsx) & CSV**:
  - ទាញយកជា Excel បែងចែកជា ៣ សន្លឹក (ស្ថិតិសង្ខេប, តារាងខ្នងផ្ទះ, តារាងសមាជិក)
- 🖨️ **បោះពុម្ពប័ណ្ណគ្រួសារផ្លូវការ (Print-Ready Family Card)**:
  - បោះពុម្ពជាទម្រង់ក្រដាសមានហត្ថលេខាមេភូមិ និងភ្នាក់ងារស្រង់

---

## 🛠️ រចនាសម្ព័ន្ធបច្ចេកវិទ្យា (Tech Stack)

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, SheetJS (XLSX)
- **Backend & Database**: Supabase (PostgreSQL Cloud), LocalStorage Offline Engine
- **Build Tool**: Vite
- **CI/CD & Deployment**: GitHub Actions, GitHub Pages, Vercel / Netlify

---

## 🚀 របៀបដំឡើង និងដំណើរការលើម៉ាស៊ីន (Local Development)

```bash
# ចូលទៅកាន់ Folder គម្រោង
cd village-census-system

# ដំឡើង Dependencies
npm install

# ដំណើរការ Development Server
npm run dev
```
បើក Browser ទៅកាន់ `http://localhost:3000`

---

## ☁️ របៀបភ្ជាប់ជាមួយ Supabase Database

1. បង្កើត Project ឥតគិតថ្លៃលើ [Supabase.com](https://supabase.com)
2. បើក **SQL Editor** ក្នុង Supabase រួច Paste កូដក្នុងឯកសារ `supabase_schema.sql` ហើយចុច **Run**
3. ចូលទៅ **Project Settings -> API** រួច Copy **Project URL** និង **anon key**
4. បើក App -> ចុចលើរូបកង់ប៉េក **Settings** -> Paste URL & Key -> ចុច **"តេស្ត & រក្សាទុកការភ្ជាប់"**
*(សូមមើលការណែនាំលម្អិតក្នុងឯកសារ `SETUP_SUPABASE.md`)*

---

## 🌐 របៀប Deploy ទៅកាន់ GitHub & GitHub Pages (១០០% ស្វ័យប្រវត្តិ)

### ជំហានទី ១: Push កូដទៅកាន់ GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit of Village Census System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/village-census-system.git
git push -u origin main
```

### ជំហានទី ២: បើក GitHub Pages
1. ចូលទៅ GitHub Repository របស់អ្នកលើគេហទំព័រ GitHub
2. ចុចលើ **Settings** -> ជ្រើសរើស **Pages** (នៅខាងឆ្វេង)
3. នៅត្រង់ **Build and deployment -> Source** ជ្រើសរើសយក **GitHub Actions**
4. រាល់ពេលដែលអ្នក Push កូដទៅកាន់ `main` branch នោះ GitHub Actions (`.github/workflows/deploy.yml`) នឹង Build និង Deploy ដោយស្វ័យប្រវត្តិតាមរយៈ Link `https://YOUR_USERNAME.github.io/village-census-system/`!

---

## 📄 អាជ្ញាប័ណ្ណ (License)
MIT License - អាចយកទៅប្រើប្រាស់ និងកែច្នៃដោយសេរីសម្រាប់សហគមន៍ និងការងាររដ្ឋបាលភូមិ-ឃុំ។
