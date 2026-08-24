/**
 * កម្មវិធីស្ថិតិ និងគ្រប់គ្រងជំរឿនប្រជាជនភូមិ (Village Census & Statistics System)
 */

// Global State
let villageInfo = {};
let households = [];
let charts = {};
let currentTab = 'dashboard';
let currentEditingHouseholdId = null;
const DEFAULT_GSHEET_URL = 'https://script.google.com/macros/s/AKfycbyieVQulvaB0quLtUgtbJLDcRzUCIgP9rGclTszv9xz3q0anLNthLqibWJs7PnIKje2/exec';
let googleSheetsUrl = localStorage.getItem('village_census_gsheet_url') || DEFAULT_GSHEET_URL;
let enumeratorName = localStorage.getItem('village_census_enumerator') || '';
let cloudAccessToken = sessionStorage.getItem('village_census_cloud_token') || '';

// Leaflet Map instances
let villageMapInstance = null;
let singleHouseMapInstance = null;
let singleHouseMarker = null;
let pickerMapInstance = null;
let pickerMarker = null;
let currentPickerLat = null;
let currentPickerLng = null;

// Education Options (ថ្នាក់ទី ១ ដល់ ១២, សាកលវិទ្យាល័យ, ជំនាញវិជ្ជាជីវៈ)
const EDUCATION_OPTIONS = [
  "មិនបានរៀន",
  "មត្តេយ្យ",
  "ថ្នាក់ទី ១",
  "ថ្នាក់ទី ២",
  "ថ្នាក់ទី ៣",
  "ថ្នាក់ទី ៤",
  "ថ្នាក់ទី ៥",
  "ថ្នាក់ទី ៦",
  "ថ្នាក់ទី ៧",
  "ថ្នាក់ទី ៨",
  "ថ្នាក់ទី ៩",
  "ថ្នាក់ទី ១០",
  "ថ្នាក់ទី ១១",
  "ថ្នាក់ទី ១២",
  "សាកលវិទ្យាល័យ",
  "ជំនាញវិជ្ជាជីវៈ",
  "ក្រោយឧត្តមសិក្សា"
];

// Khmer numbers converter
const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
function toKhmerNum(num) {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/[0-9]/g, d => khmerDigits[parseInt(d)]);
}

// Escape untrusted values before inserting them into HTML templates.
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function getCloudCredentials() {
  const url = document.getElementById('setting-gsheet-url')?.value.trim() || googleSheetsUrl || DEFAULT_GSHEET_URL;
  const token = document.getElementById('setting-cloud-token')?.value.trim() || cloudAccessToken || '';
  return { url, token };
}

function validateImportedData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.households)) {
    throw new Error('ទម្រង់ទិន្នន័យមិនត្រឹមត្រូវ។');
  }
  if (data.households.length > 10000) throw new Error('ទិន្នន័យមានចំនួនលើសកំណត់។');
  data.households.forEach(hh => {
    if (!hh || typeof hh !== 'object' || !/^[A-Za-z0-9_-]{1,50}$/.test(String(hh.id || ''))) {
      throw new Error('លេខកូដគ្រួសារមិនត្រឹមត្រូវ។ អនុញ្ញាតតែអក្សរ លេខ _ និង -។');
    }
    if (!Array.isArray(hh.members) || hh.members.length > 100) {
      throw new Error(`បញ្ជីសមាជិកគ្រួសារ ${hh.id} មិនត្រឹមត្រូវ។`);
    }
  });
  return data;
}

async function cloudRequest(payload) {
  const { url, token } = getCloudCredentials();
  if (!url) throw new Error('ពុំទាន់មាន Cloud URL ក្នុងផ្ទាំងការកំណត់ឡើយ។');
  const bodyPayload = token ? { ...payload, token } : payload;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(bodyPayload)
  });
  const data = await response.json();
  if (!response.ok || data.status !== 'success') throw new Error(data.message || `HTTP ${response.status}`);
  return data;
}

// Calculate age from DOB
function calculateAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// Format Date to Khmer display
function formatDateKh(dateStr) {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${toKhmerNum(parts[2])}/${toKhmerNum(parts[1])}/${toKhmerNum(parts[0])}`;
  }
  return dateStr;
}

// Poverty Status Helper
function getPovertyLabel(status) {
  switch (status) {
    case 'idpoor_1': return { text: 'ក្រីក្រកម្រិត ១ (ក្រ១)', badge: 'badge-idpoor-1' };
    case 'idpoor_2': return { text: 'ក្រីក្រកម្រិត ២ (ក្រ២)', badge: 'badge-idpoor-2' };
    case 'vulnerable': return { text: 'ងាយរងគ្រោះ', badge: 'badge-idpoor-vulnerable' };
    default: return { text: 'ធម្មតា (មិនក្រីក្រ)', badge: 'badge-idpoor-none' };
  }
}

// Relation Helper
function getRelationLabel(relation) {
  const map = {
    head: 'មេគ្រួសារ',
    spouse: 'ប្តី/ប្រពន្ធ',
    son: 'កូនប្រុស',
    daughter: 'កូនស្រី',
    parent: 'ឪពុក/ម្តាយ',
    relative: 'សាច់ញាតិ',
    other: 'ផ្សេងៗ'
  };
  return map[relation] || relation;
}

// Disability Helper
function getDisabilityLabel(dis) {
  const map = {
    none: 'គ្មាន',
    physical: 'កាយសម្បទា',
    visual: 'គំហើញ (ភ្នែក)',
    hearing: 'សោតវិញ្ញាណ (ត្រចៀក)',
    mental: 'សតិបញ្ញា',
    other: 'ផ្សេងៗ'
  };
  return map[dis] || dis;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderAll();
  updateCloudSyncBadge();

  // 1. Auto fetch latest shared census data from Google Sheets immediately
  if (googleSheetsUrl) {
    fetchFromGoogleSheets(true); // silent background fetch
  }

  // 2. Real-time auto-polling every 15 seconds so all phones stay updated
  setInterval(() => {
    if (googleSheetsUrl && !document.hidden) {
      fetchFromGoogleSheets(true);
    }
  }, 15000);
});

// Load Data from LocalStorage or Sample Data
function loadData() {
  const savedVillage = localStorage.getItem('village_census_info');
  const savedHouseholds = localStorage.getItem('village_census_households');

  if (savedVillage) {
    villageInfo = JSON.parse(savedVillage);
  } else {
    villageInfo = { ...DEFAULT_VILLAGE_INFO };
    saveVillageInfo();
  }

  if (savedHouseholds) {
    households = JSON.parse(savedHouseholds);
  } else {
    households = JSON.parse(JSON.stringify(SAMPLE_HOUSEHOLDS));
    saveHouseholds();
  }
}

function updateCloudSyncBadge() {
  const badge = document.getElementById('cloud-sync-status-badge');
  const text = document.getElementById('cloud-sync-status-text');
  if (!badge || !text) return;

  if (googleSheetsUrl && cloudAccessToken) {
    badge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
    text.textContent = '☁️ Cloud Sync បានត្រៀមរួច';
  } else {
    badge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300';
    text.textContent = '💾 ប្រើទិន្នន័យលើម៉ាស៊ីន (Local)';
  }
}

function saveVillageInfo() {
  localStorage.setItem('village_census_info', JSON.stringify(villageInfo));
}

function saveHouseholds() {
  localStorage.setItem('village_census_households', JSON.stringify(households));
}

// Render Master Controller
function renderAll() {
  renderVillageHeader();
  renderDashboardStats();
  renderHouseholdsTable();
  renderResidentsTable();
  renderOfficialReport();
  populateSettingsForm();
}

// Render Header Info
function renderVillageHeader() {
  document.querySelectorAll('.village-title-display').forEach(el => {
    el.textContent = villageInfo.villageName;
  });
  document.querySelectorAll('.village-full-address').forEach(el => {
    el.textContent = `${villageInfo.villageName} ${villageInfo.communeName} ${villageInfo.districtName} ${villageInfo.provinceName}`;
  });
  document.querySelectorAll('.village-chief-display').forEach(el => {
    el.textContent = villageInfo.villageChief;
  });
}

// Compute Statistics
function computeStatistics() {
  let totalHouseholds = households.length;
  let allMembers = [];
  let maleCount = 0;
  let femaleCount = 0;
  let voterCount = 0;
  let age0_5 = 0;
  let age6_17 = 0;
  let age18_59 = 0;
  let age60Plus = 0;

  let povertyCounts = { none: 0, idpoor_1: 0, idpoor_2: 0, vulnerable: 0 };
  let occupations = {};
  let educationLevels = {};
  let disabilityCount = 0;
  let utilities = { electricity: 0, cleanWater: 0, sanitationToilet: 0 };

  households.forEach(hh => {
    povertyCounts[hh.povertyStatus] = (povertyCounts[hh.povertyStatus] || 0) + 1;
    if (hh.electricity) utilities.electricity++;
    if (hh.cleanWater) utilities.cleanWater++;
    if (hh.sanitationToilet) utilities.sanitationToilet++;

    (hh.members || []).forEach(m => {
      allMembers.push({ ...m, householdId: hh.id, groupNumber: hh.groupNumber, houseNumber: hh.houseNumber });
      
      if (m.gender === 'female') femaleCount++;
      else maleCount++;

      const age = calculateAge(m.dob);
      if (age >= 18) voterCount++;

      if (age <= 5) age0_5++;
      else if (age <= 17) age6_17++;
      else if (age <= 59) age18_59++;
      else age60Plus++;

      // Occupations
      const occ = m.occupation || 'គ្មានមុខរបរ';
      occupations[occ] = (occupations[occ] || 0) + 1;

      // Education
      const edu = m.education || 'មិនបានរៀន';
      educationLevels[edu] = (educationLevels[edu] || 0) + 1;

      if (m.disability && m.disability !== 'none') {
        disabilityCount++;
      }
    });
  });

  return {
    totalHouseholds,
    totalResidents: allMembers.length,
    maleCount,
    femaleCount,
    voterCount,
    age0_5,
    age6_17,
    age18_59,
    age60Plus,
    povertyCounts,
    occupations,
    educationLevels,
    disabilityCount,
    utilities,
    allMembers
  };
}

// Render Dashboard
function renderDashboardStats() {
  const stats = computeStatistics();

  // Summary Stat cards
  document.getElementById('stat-total-households').textContent = toKhmerNum(stats.totalHouseholds);
  document.getElementById('stat-total-residents').textContent = toKhmerNum(stats.totalResidents);
  document.getElementById('stat-male-count').textContent = toKhmerNum(stats.maleCount);
  document.getElementById('stat-female-count').textContent = toKhmerNum(stats.femaleCount);
  document.getElementById('stat-voters-count').textContent = toKhmerNum(stats.voterCount);
  document.getElementById('stat-elderly-count').textContent = toKhmerNum(stats.age60Plus);
  document.getElementById('stat-children-count').textContent = toKhmerNum(stats.age0_5 + stats.age6_17);
  document.getElementById('stat-idpoor-count').textContent = toKhmerNum(stats.povertyCounts.idpoor_1 + stats.povertyCounts.idpoor_2);
  document.getElementById('stat-disability-count').textContent = toKhmerNum(stats.disabilityCount);

  // Percentages
  const femalePercent = stats.totalResidents > 0 ? Math.round((stats.femaleCount / stats.totalResidents) * 100) : 0;
  document.getElementById('stat-female-percent').textContent = `(${toKhmerNum(femalePercent)}%)`;
  
  const malePercent = stats.totalResidents > 0 ? Math.round((stats.maleCount / stats.totalResidents) * 100) : 0;
  document.getElementById('stat-male-percent').textContent = `(${toKhmerNum(malePercent)}%)`;

  // Utilities percentages
  const elecPct = stats.totalHouseholds > 0 ? Math.round((stats.utilities.electricity / stats.totalHouseholds) * 100) : 0;
  const waterPct = stats.totalHouseholds > 0 ? Math.round((stats.utilities.cleanWater / stats.totalHouseholds) * 100) : 0;
  const toiletPct = stats.totalHouseholds > 0 ? Math.round((stats.utilities.sanitationToilet / stats.totalHouseholds) * 100) : 0;

  document.getElementById('util-elec-bar').style.width = `${elecPct}%`;
  document.getElementById('util-elec-text').textContent = `${toKhmerNum(elecPct)}% (${toKhmerNum(stats.utilities.electricity)}/${toKhmerNum(stats.totalHouseholds)} គ្រួសារ)`;

  document.getElementById('util-water-bar').style.width = `${waterPct}%`;
  document.getElementById('util-water-text').textContent = `${toKhmerNum(waterPct)}% (${toKhmerNum(stats.utilities.cleanWater)}/${toKhmerNum(stats.totalHouseholds)} គ្រួសារ)`;

  document.getElementById('util-toilet-bar').style.width = `${toiletPct}%`;
  document.getElementById('util-toilet-text').textContent = `${toKhmerNum(toiletPct)}% (${toKhmerNum(stats.utilities.sanitationToilet)}/${toKhmerNum(stats.totalHouseholds)} គ្រួសារ)`;

  // Render Charts
  renderCharts(stats);
}

// Render Chart.js
function renderCharts(stats) {
  // 1. Gender Chart
  const ctxGender = document.getElementById('chart-gender');
  if (ctxGender) {
    if (charts.gender) charts.gender.destroy();
    charts.gender = new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: ['ប្រុស', 'ស្រី'],
        datasets: [{
          data: [stats.maleCount, stats.femaleCount],
          backgroundColor: ['#3b82f6', '#ec4899'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // 2. Age Groups Chart
  const ctxAge = document.getElementById('chart-age');
  if (ctxAge) {
    if (charts.age) charts.age.destroy();
    charts.age = new Chart(ctxAge, {
      type: 'bar',
      data: {
        labels: ['០-៥ ឆ្នាំ (ទារក)', '៦-១៧ ឆ្នាំ (កុមារ/យុវវ័យ)', '១៨-៥៩ ឆ្នាំ (វ័យការងារ)', '៦០ ឆ្នាំឡើង (មនុស្សចាស់)'],
        datasets: [{
          label: 'ចំនួនប្រជាជន (នាក់)',
          data: [stats.age0_5, stats.age6_17, stats.age18_59, stats.age60Plus],
          backgroundColor: ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // 3. Occupations Chart
  const ctxOcc = document.getElementById('chart-occupations');
  if (ctxOcc) {
    if (charts.occ) charts.occ.destroy();
    const sortedOcc = Object.entries(stats.occupations).sort((a, b) => b[1] - a[1]);
    const labels = sortedOcc.map(i => i[0]);
    const counts = sortedOcc.map(i => i[1]);

    charts.occ = new Chart(ctxOcc, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'ចំនួននាក់',
          data: counts,
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // 4. Poverty Chart
  const ctxPoverty = document.getElementById('chart-poverty');
  if (ctxPoverty) {
    if (charts.poverty) charts.poverty.destroy();
    charts.poverty = new Chart(ctxPoverty, {
      type: 'pie',
      data: {
        labels: ['មិនក្រីក្រ', 'ក្រ១ (ក្រីក្រខ្លាំង)', 'ក្រ២ (ក្រីក្រមធ្យម)', 'ងាយរងគ្រោះ'],
        datasets: [{
          data: [
            stats.povertyCounts.none || 0,
            stats.povertyCounts.idpoor_1 || 0,
            stats.povertyCounts.idpoor_2 || 0,
            stats.povertyCounts.vulnerable || 0
          ],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// Render Households Table
function renderHouseholdsTable() {
  const tbody = document.getElementById('households-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('household-search')?.value || '').toLowerCase().trim();
  const groupFilter = document.getElementById('household-group-filter')?.value || 'all';
  const povertyFilter = document.getElementById('household-poverty-filter')?.value || 'all';

  let filtered = households.filter(hh => {
    // Group filter
    if (groupFilter !== 'all' && hh.groupNumber !== groupFilter) return false;
    // Poverty filter
    if (povertyFilter !== 'all' && hh.povertyStatus !== povertyFilter) return false;

    // Search term
    if (!searchTerm) return true;
    const head = hh.members?.find(m => m.relation === 'head') || {};
    const matchId = (hh.id || '').toLowerCase().includes(searchTerm);
    const matchHouse = (hh.houseNumber || '').toLowerCase().includes(searchTerm);
    const matchHeadKh = (head.fullNameKh || '').toLowerCase().includes(searchTerm);
    const matchHeadEn = (head.fullNameEn || '').toLowerCase().includes(searchTerm);
    const matchHeadIdCard = (head.idCardNumber || '').includes(searchTerm);
    const matchHeadPhone = (head.phone || '').includes(searchTerm);

    return matchId || matchHouse || matchHeadKh || matchHeadEn || matchHeadIdCard || matchHeadPhone;
  });

  document.getElementById('household-count-badge').textContent = `${toKhmerNum(filtered.length)} គ្រួសារ`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-10 text-slate-400">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p>ពុំមានទិន្នន័យគ្រួសារដែលត្រូវគ្នានឹងការស្វែងរកឡើយ</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map((hh, index) => {
    const head = hh.members?.find(m => m.relation === 'head') || hh.members?.[0] || {};
    const pov = getPovertyLabel(hh.povertyStatus);
    const memberCount = hh.members?.length || 0;
    const femaleCount = hh.members?.filter(m => m.gender === 'female').length || 0;

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4 text-center font-medium text-slate-500">${toKhmerNum(index + 1)}</td>
        <td class="py-3 px-4 font-semibold text-indigo-600">${escapeHTML(hh.id)}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800">${escapeHTML(head.fullNameKh || '---')}</div>
          <div class="text-xs text-slate-400 font-mono">${escapeHTML(head.fullNameEn || '')}</div>
        </td>
        <td class="py-3 px-4 text-slate-600">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              ក្រុម ${toKhmerNum(hh.groupNumber)} / ផ្ទះលេខ ${toKhmerNum(hh.houseNumber)}
            </span>
            ${hh.latitude && hh.longitude ? `
              <button onclick="openHouseMapModal('${hh.id}')" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200" title="ចុចដើម្បីមើលទីតាំងកូអរដោនេលើផែនទី">
                <i data-lucide="map-pin" class="w-3 h-3 text-rose-500"></i>
                <span>GPS</span>
              </button>
            ` : ''}
          </div>
          <div class="text-xs text-slate-400 mt-0.5">${escapeHTML(hh.streetNumber || '')}</div>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="font-bold text-slate-800">${toKhmerNum(memberCount)} នាក់</span>
          <span class="text-xs text-pink-600 block">(ស្រី ${toKhmerNum(femaleCount)})</span>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${pov.badge}">
            ${pov.text}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-600 text-sm">
          ${head.phone ? `<a href="tel:${encodeURIComponent(head.phone)}" class="hover:text-indigo-600">${escapeHTML(head.phone)}</a>` : '<span class="text-slate-300">គ្មាន</span>'}
        </td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          ${hh.latitude && hh.longitude ? `
            <button onclick="openHouseMapModal('${hh.id}')" class="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="មើលទីតាំង GPS លើផែនទី">
              <i data-lucide="map-pin" class="w-4 h-4 text-rose-500"></i>
            </button>
          ` : ''}
          <button onclick="viewHouseholdDetail('${hh.id}')" class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="មើលលម្អិត">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
          <button onclick="editHousehold('${hh.id}')" class="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition" title="កែប្រែ">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteHousehold('${hh.id}')" class="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="លុប">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// Render Residents Table
function renderResidentsTable() {
  const tbody = document.getElementById('residents-table-body');
  if (!tbody) return;

  const searchTerm = (document.getElementById('resident-search')?.value || '').toLowerCase().trim();
  const genderFilter = document.getElementById('resident-gender-filter')?.value || 'all';
  const ageFilter = document.getElementById('resident-age-filter')?.value || 'all';

  const stats = computeStatistics();
  let members = stats.allMembers;

  let filtered = members.filter(m => {
    // Gender filter
    if (genderFilter !== 'all' && m.gender !== genderFilter) return false;

    // Age filter
    const age = calculateAge(m.dob);
    if (ageFilter === 'voter' && age < 18) return false;
    if (ageFilter === 'child' && age >= 18) return false;
    if (ageFilter === 'elderly' && age < 60) return false;

    // Search
    if (!searchTerm) return true;
    const matchNameKh = (m.fullNameKh || '').toLowerCase().includes(searchTerm);
    const matchNameEn = (m.fullNameEn || '').toLowerCase().includes(searchTerm);
    const matchIdCard = (m.idCardNumber || '').includes(searchTerm);
    const matchOcc = (m.occupation || '').toLowerCase().includes(searchTerm);
    const matchHh = (m.householdId || '').toLowerCase().includes(searchTerm);

    return matchNameKh || matchNameEn || matchIdCard || matchOcc || matchHh;
  });

  document.getElementById('resident-count-badge').textContent = `${toKhmerNum(filtered.length)} នាក់`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-10 text-slate-400">
          <i data-lucide="users" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          <p>ពុំមានទិន្នន័យប្រជាពលរដ្ឋដែលត្រូវគ្នានឹងការស្វែងរកឡើយ</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map((m, index) => {
    const age = calculateAge(m.dob);
    const isVoter = age >= 18;
    const relLabel = getRelationLabel(m.relation);

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4 text-center font-medium text-slate-500">${toKhmerNum(index + 1)}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800 flex items-center gap-1.5">
            ${escapeHTML(m.fullNameKh)}
            ${m.relation === 'head' ? '<span class="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded">មេគ្រួសារ</span>' : ''}
          </div>
          <div class="text-xs text-slate-400 font-mono">${escapeHTML(m.fullNameEn || '')}</div>
        </td>
        <td class="py-3 px-4 text-center">
          ${m.gender === 'female' 
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">ស្រី</span>'
            : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">ប្រុស</span>'}
        </td>
        <td class="py-3 px-4 text-slate-600">
          <div>${formatDateKh(m.dob)}</div>
          <span class="text-xs text-slate-400 font-medium">អាយុ ${toKhmerNum(age)} ឆ្នាំ</span>
        </td>
        <td class="py-3 px-4 text-slate-700 font-mono text-sm">
          ${m.idCardNumber ? escapeHTML(m.idCardNumber) : '<span class="text-slate-300">ពុំទាន់មាន</span>'}
        </td>
        <td class="py-3 px-4 text-slate-600 text-sm">
          <div>${escapeHTML(m.occupation || 'គ្មាន')}</div>
          <span class="text-xs text-slate-400">${escapeHTML(m.education || '')}</span>
        </td>
        <td class="py-3 px-4 text-slate-600 text-sm">
          <button onclick="viewHouseholdDetail('${m.householdId}')" class="text-indigo-600 hover:underline font-medium">
            ${m.householdId} (ក្រុម ${toKhmerNum(m.groupNumber)})
          </button>
          <div class="text-xs text-slate-400">${relLabel}</div>
        </td>
        <td class="py-3 px-4 text-center">
          ${isVoter 
            ? '<span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="មានសិទ្ធិបោះឆ្នោត"></span>' 
            : '<span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" title="មិនទាន់គ្រប់អាយុ"></span>'}
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// Render Official Census Report for Printing / Viewing
function renderOfficialReport() {
  const stats = computeStatistics();
  const reportContainer = document.getElementById('official-report-content');
  if (!reportContainer) return;

  reportContainer.innerHTML = `
    <!-- Header Royal Kingdom of Cambodia -->
    <div class="text-center mb-6">
      <h2 class="font-moul text-lg tracking-wider text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</h2>
      <h3 class="font-moul text-base text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
      <div class="flex justify-center items-center gap-1 my-1">
        <span class="w-12 h-0.5 bg-slate-400"></span>
        <span class="text-xs">✤ ✤ ✤</span>
        <span class="w-12 h-0.5 bg-slate-400"></span>
      </div>
    </div>

    <!-- Administrative Levels -->
    <div class="flex justify-between items-start text-sm mb-6 pb-4 border-b border-slate-200">
      <div>
        <p class="font-semibold">រដ្ឋបាល ${villageInfo.provinceName}</p>
        <p class="font-semibold">រដ្ឋបាល ${villageInfo.districtName}</p>
        <p class="font-semibold">រដ្ឋបាល ${villageInfo.communeName}</p>
        <p class="font-bold text-indigo-700">រដ្ឋបាល ${villageInfo.villageName}</p>
      </div>
      <div class="text-right">
        <p>ឆ្នាំជំរឿន៖ <span class="font-bold">${toKhmerNum(villageInfo.censusYear)}</span></p>
        <p>កាលបរិច្ឆេទរបាយការណ៍៖ ${formatDateKh(villageInfo.censusDate)}</p>
      </div>
    </div>

    <!-- Report Title -->
    <div class="text-center my-6">
      <h1 class="font-moul text-xl text-slate-900">របាយការណ៍សង្ខេបស្ថិតិជំរឿនប្រជាជនប្រចាំភូមិ</h1>
      <p class="text-slate-600 text-sm mt-1">ស្ថិតិប្រជាសាស្ត្រ សេដ្ឋកិច្ច និងសង្គមកិច្ច ក្នុងមូលដ្ឋាន${villageInfo.villageName}</p>
    </div>

    <!-- Summary Statistics Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
        <div class="text-xs text-slate-500">ចំនួនគ្រួសារសរុប</div>
        <div class="text-xl font-bold text-slate-800">${toKhmerNum(stats.totalHouseholds)} គ្រួសារ</div>
      </div>
      <div class="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
        <div class="text-xs text-slate-500">ចំនួនប្រជាជនសរុប</div>
        <div class="text-xl font-bold text-slate-800">${toKhmerNum(stats.totalResidents)} នាក់</div>
        <div class="text-xs text-slate-500">(ស្រី ${toKhmerNum(stats.femaleCount)} នាក់)</div>
      </div>
      <div class="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
        <div class="text-xs text-slate-500">អ្នកមានសិទ្ធិបោះឆ្នោត (១៨+)</div>
        <div class="text-xl font-bold text-slate-800">${toKhmerNum(stats.voterCount)} នាក់</div>
      </div>
      <div class="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
        <div class="text-xs text-slate-500">គ្រួសារក្រីក្រ (ក្រ១ + ក្រ២)</div>
        <div class="text-xl font-bold text-rose-600">${toKhmerNum(stats.povertyCounts.idpoor_1 + stats.povertyCounts.idpoor_2)} គ្រួសារ</div>
      </div>
    </div>

    <!-- Detailed Section 1: Demographics -->
    <div class="mb-6">
      <h3 class="font-bold text-slate-800 border-l-4 border-indigo-600 pl-2 mb-3">១. រចនាសម្ព័ន្ធប្រជាសាស្ត្រតាមក្រុមអាយុ</h3>
      <table class="w-full text-sm border-collapse border border-slate-300">
        <thead>
          <tr class="bg-slate-100">
            <th class="border border-slate-300 p-2 text-left">ល.រ</th>
            <th class="border border-slate-300 p-2 text-left">ក្រុមអាយុ</th>
            <th class="border border-slate-300 p-2 text-center">ចំនួន (នាក់)</th>
            <th class="border border-slate-300 p-2 text-center">ភាគរយ (%)</th>
            <th class="border border-slate-300 p-2 text-left">សម្គាល់</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 p-2 text-center">១</td>
            <td class="border border-slate-300 p-2">០ ដល់ ៥ ឆ្នាំ</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${toKhmerNum(stats.age0_5)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalResidents ? Math.round((stats.age0_5 / stats.totalResidents)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-slate-500">ទារក និងកុមារតូច</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-center">២</td>
            <td class="border border-slate-300 p-2">៦ ដល់ ១៧ ឆ្នាំ</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${toKhmerNum(stats.age6_17)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalResidents ? Math.round((stats.age6_17 / stats.totalResidents)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-slate-500">វ័យសិក្សា (បឋម-វិទ្យាល័យ)</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-center">៣</td>
            <td class="border border-slate-300 p-2">១៨ ដល់ ៥៩ ឆ្នាំ</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${toKhmerNum(stats.age18_59)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalResidents ? Math.round((stats.age18_59 / stats.totalResidents)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-slate-500">កម្លាំងពលកម្ម និងវ័យបោះឆ្នោត</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-center">៤</td>
            <td class="border border-slate-300 p-2">៦០ ឆ្នាំឡើង</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${toKhmerNum(stats.age60Plus)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalResidents ? Math.round((stats.age60Plus / stats.totalResidents)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-slate-500">មនុស្សចាស់ជរា</td>
          </tr>
          <tr class="bg-slate-50 font-bold">
            <td colspan="2" class="border border-slate-300 p-2 text-center">សរុបរួម</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalResidents)}</td>
            <td class="border border-slate-300 p-2 text-center">១០០%</td>
            <td class="border border-slate-300 p-2"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detailed Section 2: Poverty & Economy -->
    <div class="mb-6">
      <h3 class="font-bold text-slate-800 border-l-4 border-indigo-600 pl-2 mb-3">២. ស្ថានភាពជីវភាព និងកម្រិតក្រីក្រ</h3>
      <table class="w-full text-sm border-collapse border border-slate-300">
        <thead>
          <tr class="bg-slate-100">
            <th class="border border-slate-300 p-2 text-left">ប្រភេទកម្រិតក្រីក្រ</th>
            <th class="border border-slate-300 p-2 text-center">ចំនួនគ្រួសារ</th>
            <th class="border border-slate-300 p-2 text-center">ភាគរយ</th>
            <th class="border border-slate-300 p-2 text-left">គោលនយោបាយគាំពារសង្គម</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 p-2">ធម្មតា (មិនក្រីក្រ)</td>
            <td class="border border-slate-300 p-2 text-center font-bold">${toKhmerNum(stats.povertyCounts.none || 0)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalHouseholds ? Math.round(((stats.povertyCounts.none||0)/stats.totalHouseholds)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-slate-500">---</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-rose-700 font-semibold">ក្រីក្រកម្រិត ១ (ក្រ១)</td>
            <td class="border border-slate-300 p-2 text-center font-bold text-rose-700">${toKhmerNum(stats.povertyCounts.idpoor_1 || 0)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalHouseholds ? Math.round(((stats.povertyCounts.idpoor_1||0)/stats.totalHouseholds)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-rose-600">ឧបត្ថម្ភសាច់ប្រាក់រដ្ឋ និងប.ស.ស</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-amber-700 font-semibold">ក្រីក្រកម្រិត ២ (ក្រ២)</td>
            <td class="border border-slate-300 p-2 text-center font-bold text-amber-700">${toKhmerNum(stats.povertyCounts.idpoor_2 || 0)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalHouseholds ? Math.round(((stats.povertyCounts.idpoor_2||0)/stats.totalHouseholds)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-amber-600">ឧបត្ថម្ភសាច់ប្រាក់រដ្ឋ និងប.ស.ស</td>
          </tr>
          <tr>
            <td class="border border-slate-300 p-2 text-blue-700 font-semibold">គ្រួសារងាយរងគ្រោះ</td>
            <td class="border border-slate-300 p-2 text-center font-bold text-blue-700">${toKhmerNum(stats.povertyCounts.vulnerable || 0)}</td>
            <td class="border border-slate-300 p-2 text-center">${toKhmerNum(stats.totalHouseholds ? Math.round(((stats.povertyCounts.vulnerable||0)/stats.totalHouseholds)*100) : 0)}%</td>
            <td class="border border-slate-300 p-2 text-blue-600">ការគាំទ្រពិសេសពេលមានវិបត្តិ</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Signatures -->
    <div class="flex justify-between items-end mt-12 pt-6 text-sm">
      <div class="text-center w-48">
        <p class="mb-16">បានឃើញ និងបញ្ជាក់ត្រឹមត្រូវ<br><strong>មេឃុំព្រៃវែង</strong></p>
        <p class="border-t border-dotted border-slate-400 pt-1 text-slate-400">(ហត្ថលេខា និងត្រា)</p>
      </div>

      <div class="text-center w-56">
        <p class="text-xs text-slate-500 mb-1">ធ្វើនៅ ${villageInfo.villageName}, ${formatDateKh(villageInfo.censusDate)}</p>
        <p class="font-bold mb-16">មេ${villageInfo.villageName}</p>
        <p class="font-bold text-slate-800">${villageInfo.villageChief}</p>
      </div>
    </div>
  `;
}

// View Household Detail Modal
window.viewHouseholdDetail = function(householdId) {
  const hh = households.find(h => h.id === householdId);
  if (!hh) return;

  const pov = getPovertyLabel(hh.povertyStatus);
  const modalContent = document.getElementById('detail-modal-body');

  modalContent.innerHTML = `
    <div class="border-b border-slate-200 pb-4 mb-4 flex justify-between items-start">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold text-slate-900">សៀវភៅគ្រួសារលេខ៖ ${hh.id}</h2>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${pov.badge}">${pov.text}</span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          ក្រុម ${toKhmerNum(hh.groupNumber)} ផ្ទះលេខ ${toKhmerNum(hh.houseNumber)} ${hh.streetNumber || ''}, ${villageInfo.villageName}
        </p>
      </div>
      <button onclick="printFamilyBook('${hh.id}')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
        <i data-lucide="printer" class="w-4 h-4"></i>
        <span>បោះពុម្ពសៀវភៅ</span>
      </button>
    </div>

    <!-- Household Info -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-sm mb-4">
      <div>
        <span class="text-xs text-slate-400 block">ប្រភេទផ្ទះ</span>
        <span class="font-semibold text-slate-800">${hh.housingType || '---'}</span>
      </div>
      <div>
        <span class="text-xs text-slate-400 block">អគ្គិសនីប្រើប្រាស់</span>
        <span class="font-semibold ${hh.electricity ? 'text-emerald-600' : 'text-rose-500'}">
          ${hh.electricity ? '✓ មានប្រើប្រាស់' : '✗ គ្មាន'}
        </span>
      </div>
      <div>
        <span class="text-xs text-slate-400 block">ទឹកស្អាត/អនាម័យ</span>
        <span class="font-semibold ${hh.cleanWater ? 'text-emerald-600' : 'text-rose-500'}">
          ${hh.cleanWater ? '✓ មានទឹកស្អាត' : '✗ គ្មាន'}
        </span>
      </div>
      <div>
        <span class="text-xs text-slate-400 block">បង្គន់អនាម័យ</span>
        <span class="font-semibold ${hh.sanitationToilet ? 'text-emerald-600' : 'text-rose-500'}">
          ${hh.sanitationToilet ? '✓ មានបង្គន់' : '✗ គ្មាន'}
        </span>
      </div>
      ${hh.latitude && hh.longitude ? `
        <div class="col-span-2 md:col-span-4 bg-indigo-50/70 p-2.5 rounded-lg flex items-center justify-between border border-indigo-100">
          <div>
            <span class="text-xs text-indigo-700 font-bold flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-500"></i> កូអរដោនេទីតាំងផ្ទះ (GPS)
            </span>
            <span class="text-xs font-mono text-slate-700 font-semibold">${hh.latitude}, ${hh.longitude}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="openHouseMapModal('${hh.id}')" class="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-md flex items-center gap-1 transition">
              <i data-lucide="map" class="w-3.5 h-3.5"></i> បង្ហាញផែនទី
            </button>
            <a href="https://www.google.com/maps?q=${hh.latitude},${hh.longitude}" target="_blank" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Google Maps
            </a>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Members Table -->
    <h3 class="font-bold text-slate-800 mb-2 flex items-center justify-between">
      <span>បញ្ជីសមាជិកគ្រួសារ (${toKhmerNum(hh.members?.length || 0)} នាក់)</span>
    </h3>

    <div class="overflow-x-auto border border-slate-200 rounded-lg">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-100 text-slate-700 text-xs uppercase">
          <tr>
            <th class="py-2.5 px-3">ល.រ</th>
            <th class="py-2.5 px-3">គោត្តនាម-នាម</th>
            <th class="py-2.5 px-3">ភេទ</th>
            <th class="py-2.5 px-3">ថ្ងៃខែឆ្នាំកំណើត</th>
            <th class="py-2.5 px-3">ទំនាក់ទំនង</th>
            <th class="py-2.5 px-3">អត្តសញ្ញាណប័ណ្ណ</th>
            <th class="py-2.5 px-3">មុខរបរ</th>
            <th class="py-2.5 px-3">ពិការភាព</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${(hh.members || []).map((m, idx) => `
            <tr class="hover:bg-slate-50">
              <td class="py-2.5 px-3 font-medium text-slate-400">${toKhmerNum(idx + 1)}</td>
              <td class="py-2.5 px-3">
                <div class="font-bold text-slate-800">${m.fullNameKh}</div>
                <div class="text-xs text-slate-400 font-mono">${m.fullNameEn || ''}</div>
              </td>
              <td class="py-2.5 px-3">
                ${m.gender === 'female' ? '<span class="text-pink-600 font-medium">ស្រី</span>' : '<span class="text-blue-600 font-medium">ប្រុស</span>'}
              </td>
              <td class="py-2.5 px-3">
                <div>${formatDateKh(m.dob)}</div>
                <span class="text-xs text-slate-400 font-medium">${toKhmerNum(calculateAge(m.dob))} ឆ្នាំ</span>
              </td>
              <td class="py-2.5 px-3 font-medium text-indigo-700">${getRelationLabel(m.relation)}</td>
              <td class="py-2.5 px-3 font-mono text-xs">${m.idCardNumber || '---'}</td>
              <td class="py-2.5 px-3">${m.occupation || '---'}</td>
              <td class="py-2.5 px-3">
                ${m.disability && m.disability !== 'none' 
                  ? `<span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">${getDisabilityLabel(m.disability)}</span>` 
                  : '<span class="text-slate-300">គ្មាន</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${hh.note ? `
      <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <strong>កំណត់សម្គាល់៖</strong> ${hh.note}
      </div>
    ` : ''}
  `;

  document.getElementById('household-detail-modal').classList.remove('hidden');
  document.getElementById('household-detail-modal').classList.add('flex');
  lucide.createIcons();
};

window.closeDetailModal = function() {
  document.getElementById('household-detail-modal').classList.add('hidden');
  document.getElementById('household-detail-modal').classList.remove('flex');
};

// Print Family Book directly
window.printFamilyBook = function(householdId) {
  window.print();
};

// Open Add Household Modal
window.openAddHouseholdModal = function() {
  currentEditingHouseholdId = null;
  document.getElementById('modal-household-title').textContent = 'បន្ថែមសៀវភៅគ្រួសារថ្មី';
  document.getElementById('household-form').reset();
  
  // Generate next ID
  const nextId = `HH-${String(households.length + 1).padStart(3, '0')}`;
  document.getElementById('form-hh-id').value = nextId;
  document.getElementById('form-hh-lat').value = '';
  document.getElementById('form-hh-lng').value = '';

  // Clear and add first default head member
  const membersContainer = document.getElementById('form-members-container');
  membersContainer.innerHTML = '';
  addMemberRow({ relation: 'head' });

  document.getElementById('household-form-modal').classList.remove('hidden');
  document.getElementById('household-form-modal').classList.add('flex');
  lucide.createIcons();
};

// Edit Household
window.editHousehold = function(householdId) {
  currentEditingHouseholdId = householdId;
  const hh = households.find(h => h.id === householdId);
  if (!hh) return;

  document.getElementById('modal-household-title').textContent = `កែប្រែទិន្នន័យគ្រួសារ (${hh.id})`;
  document.getElementById('form-hh-id').value = hh.id;
  document.getElementById('form-hh-house').value = hh.houseNumber || '';
  document.getElementById('form-hh-group').value = hh.groupNumber || '១';
  document.getElementById('form-hh-street').value = hh.streetNumber || '';
  document.getElementById('form-hh-lat').value = hh.latitude || '';
  document.getElementById('form-hh-lng').value = hh.longitude || '';
  document.getElementById('form-hh-poverty').value = hh.povertyStatus || 'none';
  document.getElementById('form-hh-housing').value = hh.housingType || 'ផ្ទះឈើលើថ្មក្រោម';
  document.getElementById('form-hh-electricity').checked = !!hh.electricity;
  document.getElementById('form-hh-cleanwater').checked = !!hh.cleanWater;
  document.getElementById('form-hh-toilet').checked = !!hh.sanitationToilet;
  document.getElementById('form-hh-note').value = hh.note || '';

  const membersContainer = document.getElementById('form-members-container');
  membersContainer.innerHTML = '';

  if (hh.members && hh.members.length > 0) {
    hh.members.forEach(m => addMemberRow(m));
  } else {
    addMemberRow({ relation: 'head' });
  }

  document.getElementById('household-form-modal').classList.remove('hidden');
  document.getElementById('household-form-modal').classList.add('flex');
  lucide.createIcons();
};

window.closeHouseholdFormModal = function() {
  document.getElementById('household-form-modal').classList.add('hidden');
  document.getElementById('household-form-modal').classList.remove('flex');
};

// Add Member Form Row
window.addMemberRow = function(memberData = {}) {
  const container = document.getElementById('form-members-container');
  const index = container.children.length;

  const row = document.createElement('div');
  row.className = 'member-form-row border border-slate-200 rounded-xl p-4 bg-slate-50 relative mb-3 transition hover:border-indigo-300';
  row.innerHTML = `
    <div class="flex justify-between items-center mb-3">
      <span class="font-bold text-sm text-indigo-700 flex items-center gap-1.5">
        <i data-lucide="user" class="w-4 h-4"></i> សមាជិកទី ${toKhmerNum(index + 1)}
      </span>
      ${index > 0 ? `
        <button type="button" onclick="this.closest('.member-form-row').remove()" class="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1">
          <i data-lucide="x" class="w-4 h-4"></i> ដកចេញ
        </button>
      ` : '<span class="text-xs text-slate-400 font-medium">មេគ្រួសារចម្បង</span>'}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">គោត្តនាម-នាម (ខ្មែរ) *</label>
        <input type="text" class="member-kh-name w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required value="${memberData.fullNameKh || ''}" placeholder="ឧ. សុខ សុវណ្ណ">
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">ឈ្មោះឡាតាំង (English)</label>
        <input type="text" class="member-en-name w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono" value="${memberData.fullNameEn || ''}" placeholder="SOK SOVANN">
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">ភេទ *</label>
        <select class="member-gender w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="male" ${memberData.gender === 'male' ? 'selected' : ''}>ប្រុស (Male)</option>
          <option value="female" ${memberData.gender === 'female' ? 'selected' : ''}>ស្រី (Female)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">ថ្ងៃខែឆ្នាំកំណើត *</label>
        <input type="date" class="member-dob w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required value="${memberData.dob || ''}">
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">ទំនាក់ទំនងជាមួយមេគ្រួសារ</label>
        <select class="member-relation w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="head" ${memberData.relation === 'head' ? 'selected' : ''}>មេគ្រួសារ</option>
          <option value="spouse" ${memberData.relation === 'spouse' ? 'selected' : ''}>ប្តី/ប្រពន្ធ</option>
          <option value="son" ${memberData.relation === 'son' ? 'selected' : ''}>កូនប្រុស</option>
          <option value="daughter" ${memberData.relation === 'daughter' ? 'selected' : ''}>កូនស្រី</option>
          <option value="parent" ${memberData.relation === 'parent' ? 'selected' : ''}>ឪពុក/ម្តាយ</option>
          <option value="relative" ${memberData.relation === 'relative' ? 'selected' : ''}>សាច់ញាតិ</option>
          <option value="other" ${memberData.relation === 'other' ? 'selected' : ''}>ផ្សេងៗ</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">លេខអត្តសញ្ញាណប័ណ្ណ</label>
        <input type="text" class="member-idcard w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono" value="${memberData.idCardNumber || ''}" placeholder="០២០XXXXXX">
      </div>

      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">មុខរបរ</label>
        <input type="text" class="member-occupation w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none" value="${memberData.occupation || ''}" placeholder="កសិករ, អាជីវករ, ...">
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">កម្រិតវប្បធម៌ / ថ្នាក់រៀន</label>
        <select class="member-education w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          ${EDUCATION_OPTIONS.map(opt => `
            <option value="${opt}" ${memberData.education === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-600 mb-1 font-medium">ស្ថានភាពពិការភាព</label>
        <select class="member-disability w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <option value="none" ${memberData.disability === 'none' ? 'selected' : ''}>គ្មានពិការភាព</option>
          <option value="physical" ${memberData.disability === 'physical' ? 'selected' : ''}>ពិការកាយសម្បទា</option>
          <option value="visual" ${memberData.disability === 'visual' ? 'selected' : ''}>ពិការភ្នែក/គំហើញ</option>
          <option value="hearing" ${memberData.disability === 'hearing' ? 'selected' : ''}>ពិការត្រចៀក/គថ្លង់</option>
          <option value="mental" ${memberData.disability === 'mental' ? 'selected' : ''}>ពិការសតិបញ្ញា</option>
          <option value="other" ${memberData.disability === 'other' ? 'selected' : ''}>ផ្សេងៗ</option>
        </select>
      </div>
    </div>
  `;

  container.appendChild(row);
  lucide.createIcons();
};

// Save Form Submission (Add or Edit)
function handleHouseholdFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-hh-id').value.trim();
  if (!/^[A-Za-z0-9_-]{1,50}$/.test(id)) {
    alert('លេខកូដគ្រួសារអនុញ្ញាតតែអក្សរឡាតាំង លេខ សញ្ញា _ និង - ប៉ុណ្ណោះ។');
    document.getElementById('form-hh-id').focus();
    return;
  }
  const houseNumber = document.getElementById('form-hh-house').value.trim();
  const groupNumber = document.getElementById('form-hh-group').value;
  const streetNumber = document.getElementById('form-hh-street').value.trim();
  const latitude = document.getElementById('form-hh-lat').value.trim();
  const longitude = document.getElementById('form-hh-lng').value.trim();
  const povertyStatus = document.getElementById('form-hh-poverty').value;
  const housingType = document.getElementById('form-hh-housing').value;
  const electricity = document.getElementById('form-hh-electricity').checked;
  const cleanWater = document.getElementById('form-hh-cleanwater').checked;
  const sanitationToilet = document.getElementById('form-hh-toilet').checked;
  const note = document.getElementById('form-hh-note').value.trim();

  // Collect members
  const memberRows = document.querySelectorAll('.member-form-row');
  const members = [];

  memberRows.forEach((row, i) => {
    const fullNameKh = row.querySelector('.member-kh-name').value.trim();
    const fullNameEn = row.querySelector('.member-en-name').value.trim();
    const gender = row.querySelector('.member-gender').value;
    const dob = row.querySelector('.member-dob').value;
    const relation = row.querySelector('.member-relation').value;
    const idCardNumber = row.querySelector('.member-idcard').value.trim();
    const occupation = row.querySelector('.member-occupation').value.trim();
    const education = row.querySelector('.member-education').value;
    const disability = row.querySelector('.member-disability').value;

    if (fullNameKh && dob) {
      members.push({
        id: `MEM-${id}-${i + 1}`,
        fullNameKh,
        fullNameEn,
        gender,
        dob,
        relation,
        idCardNumber,
        occupation,
        education,
        disability
      });
    }
  });

  if (members.length === 0) {
    alert('សូមបញ្ចូលយ៉ាងហោចណាស់សមាជិកគ្រួសារម្នាក់ (មេគ្រួសារ)!');
    return;
  }

  const householdObj = {
    id,
    houseNumber,
    groupNumber,
    streetNumber,
    latitude,
    longitude,
    povertyStatus,
    housingType,
    electricity,
    cleanWater,
    sanitationToilet,
    note,
    createdAt: currentEditingHouseholdId ? (households.find(h => h.id === currentEditingHouseholdId)?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    members
  };

  if (currentEditingHouseholdId) {
    const idx = households.findIndex(h => h.id === currentEditingHouseholdId);
    if (idx !== -1) {
      households[idx] = householdObj;
    }
  } else {
    // Check duplicate ID
    if (households.some(h => h.id === id)) {
      alert('លេខកូដសៀវភៅគ្រួសារនេះមានរួចហើយ សូមប្តូរលេខកូដថ្មី!');
      return;
    }
    households.push(householdObj);
  }

  saveHouseholds();
  closeHouseholdFormModal();
  renderAll();
  showToast('រក្សាទុកទិន្នន័យបានជោគជ័យ!', 'success');

  // Multi-Phone Cloud Auto-Sync
  if (googleSheetsUrl && cloudAccessToken) {
    saveHouseholdToCloud(householdObj);
  }
}

// Push single household to Google Sheets (Multi-Device Live Sync)
async function saveHouseholdToCloud(householdObj) {
  try {
    const payload = {
      action: "SAVE_HOUSEHOLD",
      enumerator: enumeratorName || "ទូរស័ព្ទមន្ត្រី",
      household: householdObj
    };
    await cloudRequest(payload);
    showToast('☁️ បានរក្សាទុកក្នុង Cloud Google Sheet រួចរាល់!', 'success');
  } catch (err) {
    console.warn('Could not sync to cloud immediately:', err);
    showToast(`រក្សាទុកក្នុងម៉ាស៊ីនរួច ប៉ុន្តែ Cloud មានបញ្ហា៖ ${err.message}`, 'error');
  }
}

// Delete Household
window.deleteHousehold = function(id) {
  if (confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យសៀវភៅគ្រួសារលេខ ${id} នេះមែនទេ?`)) {
    households = households.filter(h => h.id !== id);
    saveHouseholds();
    renderAll();
    showToast('បានលុបទិន្នន័យគ្រួសាររួចរាល់', 'info');

    if (googleSheetsUrl && cloudAccessToken) {
      deleteHouseholdFromCloud(id);
    }
  }
};

async function deleteHouseholdFromCloud(id) {
  try {
    const payload = {
      action: "DELETE_HOUSEHOLD",
      householdId: id
    };
    await cloudRequest(payload);
  } catch (err) {
    console.warn('Could not delete from cloud:', err);
    showToast(`បានលុបក្នុងម៉ាស៊ីន ប៉ុន្តែលុបពី Cloud មិនបាន៖ ${err.message}`, 'error');
  }
};

// Export to CSV with UTF-8 BOM
window.exportCensusCSV = function() {
  const stats = computeStatistics();
  let csvContent = "\uFEFF"; // UTF-8 BOM for Khmer support in Excel
  csvContent += "ល.រ,លេខសៀវភៅគ្រួសារ,ក្រុម,ផ្ទះលេខ,Latitude,Longitude,ឈ្មោះមេគ្រួសារ,ឈ្មោះសមាជិក,ភេទ,ថ្ងៃខែឆ្នាំកំណើត,អាយុ,ទំនាក់ទំនង,លេខអត្តសញ្ញាណប័ណ្ណ,មុខរបរ,កម្រិតវប្បធម៌_ថ្នាក់រៀន,ស្ថានភាពក្រីក្រ,ពិការភាព\n";

  let counter = 1;
  households.forEach(hh => {
    const head = hh.members?.find(m => m.relation === 'head') || {};
    const pov = getPovertyLabel(hh.povertyStatus).text;

    (hh.members || []).forEach(m => {
      const age = calculateAge(m.dob);
      const row = [
        counter++,
        csvCell(hh.id), csvCell(hh.groupNumber), csvCell(hh.houseNumber),
        csvCell(hh.latitude), csvCell(hh.longitude), csvCell(head.fullNameKh),
        csvCell(m.fullNameKh), csvCell(m.gender === 'female' ? 'ស្រី' : 'ប្រុស'), csvCell(m.dob),
        age,
        csvCell(getRelationLabel(m.relation)), csvCell(m.idCardNumber),
        csvCell(m.occupation), csvCell(m.education), csvCell(pov), csvCell(getDisabilityLabel(m.disability))
      ];
      csvContent += row.join(",") + "\n";
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ជំរឿនប្រជាជន_${villageInfo.villageName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('បានទាញយកឯកសារ Excel/CSV ដោយជោគជ័យ!', 'success');
};

// Backup JSON
window.backupDataJSON = function() {
  const data = {
    villageInfo,
    households,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `village_census_backup_${villageInfo.villageName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('បាន Backup ទិន្នន័យរួចរាល់', 'success');
};

// Restore JSON
window.restoreDataJSON = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = validateImportedData(JSON.parse(evt.target.result));
      if (parsed.villageInfo && parsed.households) {
        villageInfo = parsed.villageInfo;
        households = parsed.households;
        saveVillageInfo();
        saveHouseholds();
        renderAll();
        showToast('បានស្តារទិន្នន័យ (Restore) ជោគជ័យ!', 'success');
      } else {
        alert('ឯកសារ JSON មិនត្រូវតាមទម្រង់ត្រឹមត្រូវឡើយ!');
      }
    } catch (err) {
      alert('កំហុសក្នុងការអានឯកសារ JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
};

// Reset Demo Data
window.resetDemoData = function() {
  if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យឡើងវិញទៅជាទិន្នន័យគំរូដើមមែនទេ? ទិន្នន័យថ្មីៗនឹងត្រូវបាត់បង់។')) {
    villageInfo = { ...DEFAULT_VILLAGE_INFO };
    households = JSON.parse(JSON.stringify(SAMPLE_HOUSEHOLDS));
    saveVillageInfo();
    saveHouseholds();
    renderAll();
    showToast('បានកំណត់ទៅទិន្នន័យគំរូដើមរួចរាល់', 'info');
  }
};

// Google Sheets Integration
window.syncToGoogleSheets = async function() {
  const { url, token } = getCloudCredentials();
  if (!url || !token) {
    alert('សូមបញ្ចូល Google Apps Script Web App URL និង Access Token ជាមុនសិន!');
    switchTab('settings');
    document.getElementById('setting-gsheet-url')?.focus();
    return;
  }

  googleSheetsUrl = url;
  localStorage.setItem('village_census_gsheet_url', url);
  cloudAccessToken = token;
  sessionStorage.setItem('village_census_cloud_token', token);

  showToast('កំពុងបញ្ជូនទិន្នន័យទៅ Google Sheets...', 'info');

  try {
    const payload = {
      action: 'FULL_SYNC',
      villageInfo,
      households
    };
    await cloudRequest(payload);
    showToast('បាន Sync ទិន្នន័យទៅកាន់ Google Sheets ដោយជោគជ័យ!', 'success');
  } catch (err) {
    alert('កំហុសក្នុងការ Sync ទៅ Google Sheets: ' + err.message);
  }
};

window.fetchFromGoogleSheets = async function(silent = false) {
  const { url, token } = getCloudCredentials();
  if (!url) {
    if (!silent) {
      alert('សូមបញ្ចូល Google Apps Script Web App URL ជាមុនសិន!');
      switchTab('settings');
      document.getElementById('setting-gsheet-url')?.focus();
    }
    return;
  }

  googleSheetsUrl = url;
  localStorage.setItem('village_census_gsheet_url', url);
  updateCloudSyncBadge();

  if (!silent) {
    showToast('កំពុងទាញយកទិន្នន័យពី Google Sheets...', 'info');
  }

  try {
    const requestUrl = new URL(url);
    if (token) {
      requestUrl.searchParams.set('token', token);
    }
    const res = await fetch(requestUrl.toString());
    const rawData = await res.json();
    if (!res.ok || rawData.status !== 'success') {
      throw new Error(rawData.message || `HTTP ${res.status}`);
    }
    const data = validateImportedData(rawData);

    if (data.status === 'success' && data.households) {
      if (data.villageInfo) villageInfo = data.villageInfo;
      households = data.households;
      saveVillageInfo();
      saveHouseholds();
      renderAll();
      updateCloudSyncBadge();
      if (!silent) {
        showToast(`☁️ បានទាញយកទិន្នន័យចុងក្រោយ (${toKhmerNum(households.length)} គ្រួសារ) ពី Cloud!`, 'success');
      }
    } else {
      if (!silent) alert('មិនអាចអានទិន្នន័យពី Google Sheets បានទេ៖ ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    if (!silent) alert('កំហុសក្នុងការទាញយកទិន្នន័យពី Google Sheets: ' + err.message);
  }
};

// Populate Settings Form
function populateSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;
  document.getElementById('setting-village-name').value = villageInfo.villageName || '';
  document.getElementById('setting-commune-name').value = villageInfo.communeName || '';
  document.getElementById('setting-district-name').value = villageInfo.districtName || '';
  document.getElementById('setting-province-name').value = villageInfo.provinceName || '';
  document.getElementById('setting-village-chief').value = villageInfo.villageChief || '';
  document.getElementById('setting-chief-phone').value = villageInfo.chiefPhone || '';
  document.getElementById('setting-census-year').value = villageInfo.censusYear || '២០២៦';
  document.getElementById('setting-census-date').value = villageInfo.censusDate || '២០២៦-០៨-២០';
  
  const gsheetInput = document.getElementById('setting-gsheet-url');
  if (gsheetInput) {
    gsheetInput.value = googleSheetsUrl || '';
  }

  const enumInput = document.getElementById('setting-enumerator-name');
  if (enumInput) {
    enumInput.value = enumeratorName || '';
  }
  const tokenInput = document.getElementById('setting-cloud-token');
  if (tokenInput) tokenInput.value = cloudAccessToken;
}

async function handleSettingsFormSubmit(e) {
  e.preventDefault();
  villageInfo.villageName = document.getElementById('setting-village-name').value.trim();
  villageInfo.communeName = document.getElementById('setting-commune-name').value.trim();
  villageInfo.districtName = document.getElementById('setting-district-name').value.trim();
  villageInfo.provinceName = document.getElementById('setting-province-name').value.trim();
  villageInfo.villageChief = document.getElementById('setting-village-chief').value.trim();
  villageInfo.chiefPhone = document.getElementById('setting-chief-phone').value.trim();
  villageInfo.censusYear = document.getElementById('setting-census-year').value.trim();
  villageInfo.censusDate = document.getElementById('setting-census-date').value.trim();

  const gsheetVal = document.getElementById('setting-gsheet-url')?.value.trim() || '';
  googleSheetsUrl = gsheetVal;
  localStorage.setItem('village_census_gsheet_url', gsheetVal);

  const enumVal = document.getElementById('setting-enumerator-name')?.value.trim() || '';
  enumeratorName = enumVal;
  localStorage.setItem('village_census_enumerator', enumVal);

  cloudAccessToken = document.getElementById('setting-cloud-token')?.value.trim() || '';
  if (cloudAccessToken) sessionStorage.setItem('village_census_cloud_token', cloudAccessToken);
  else sessionStorage.removeItem('village_census_cloud_token');

  saveVillageInfo();
  renderAll();
  updateCloudSyncBadge();
  showToast('បានរក្សាទុកការកំណត់ក្នុងទូរស័ព្ទនេះរួចរាល់!', 'success');

  if (googleSheetsUrl && cloudAccessToken) {
    try {
      await cloudRequest({ action: 'UPDATE_VILLAGE_INFO', villageInfo });
      showToast('☁️ បាន Sync ព័ត៌មានភូមិទៅគ្រប់ទូរស័ព្ទរួចរាល់!', 'success');
    } catch (err) {
      showToast(`រក្សាទុកក្នុងទូរស័ព្ទរួច ប៉ុន្តែ Cloud មានបញ្ហា៖ ${err.message}`, 'error');
    }
  }
}

// Navigation Tabs
window.switchTab = function(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
  });
  document.querySelectorAll('.tab-link').forEach(el => {
    el.classList.remove('bg-indigo-50', 'text-indigo-600', 'font-bold');
    el.classList.add('text-slate-600');
  });

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) {
    targetTab.classList.remove('hidden');
    targetTab.classList.add('animate-fade-in');
  }

  const targetLink = document.getElementById(`link-${tabName}`);
  if (targetLink) {
    targetLink.classList.add('bg-indigo-50', 'text-indigo-600', 'font-bold');
    targetLink.classList.remove('text-slate-600');
  }

  if (tabName === 'dashboard') {
    const stats = computeStatistics();
    renderCharts(stats);
  } else if (tabName === 'map') {
    setTimeout(initVillageMap, 150);
  }
};

// ==========================================
// GPS & LEAFLET MAP LOGIC (OFFICIAL & ROBUST)
// ==========================================

// Get current device GPS location with high-accuracy + fallback
window.getCurrentGPSLocation = function() {
  if (!navigator.geolocation) {
    alert('ឧបករណ៍ ឬ Browser របស់អ្នកមិនគាំទ្រប្រព័ន្ធ Geolocation GPS ឡើយ!');
    return;
  }

  const btn = document.getElementById('btn-auto-gps');
  const indicator = document.getElementById('gps-accuracy-indicator');
  const indicatorText = document.getElementById('gps-accuracy-text');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">⏳</span> កំពុងចាប់យក GPS...`;
  }

  showToast('🔍 កំពុងស្វែងរកផ្កាយរណប GPS...', 'info');

  const onLocationSuccess = (position) => {
    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);
    const accuracy = Math.round(position.coords.accuracy || 0);

    document.getElementById('form-hh-lat').value = lat;
    document.getElementById('form-hh-lng').value = lng;

    if (indicator && indicatorText) {
      indicator.classList.remove('hidden');
      indicatorText.textContent = `ទទួលបានទីតាំង GPS: ${lat}, ${lng} (កម្រិតលម្អិត ±${accuracy} ម៉ែត្រ)`;
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="crosshair" class="w-3.5 h-3.5 text-indigo-600"></i> <span>📍 ចាប់យកទីតាំង GPS (Auto)</span>`;
      lucide.createIcons();
    }

    showToast(`✓ ទទួលបានកូអរដោនេ GPS (ភាពសុក្រឹត ±${accuracy}m)`, 'success');
  };

  const onLocationError = (error) => {
    // If high accuracy timed out, try standard accuracy
    if (error.code === 3 || error.code === 2) {
      showToast('កំពុងព្យាយាមចាប់យកទីតាំងតាមបណ្តាញទូរស័ព្ទ (Network GPS)...', 'info');
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (err2) => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="crosshair" class="w-3.5 h-3.5 text-indigo-600"></i> <span>📍 ចាប់យកទីតាំង GPS (Auto)</span>`;
            lucide.createIcons();
          }
          let msg = 'មិនអាចចាប់យកទីតាំង GPS បានទេ។';
          if (err2.code === 1) msg = 'សូមអនុញ្ញាត (Allow) Location Permission លើទូរស័ព្ទ ឬ Browser។';
          alert(msg + ' លោកអ្នកអាចចុច "🗺️ រើសលើផែនទី" ដើម្បីកំណត់ទីតាំងផ្ទាល់ដៃបាន!');
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
      return;
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="crosshair" class="w-3.5 h-3.5 text-indigo-600"></i> <span>📍 ចាប់យកទីតាំង GPS (Auto)</span>`;
      lucide.createIcons();
    }

    if (error.code === 1) {
      alert('សូមអនុញ្ញាត (Allow) Location Permission លើ Browser ឬ Settings ទូរស័ព្ទរបស់អ្នក ដើម្បីប្រើប្រាស់ GPS។');
    } else {
      alert('មិនអាចចាប់យកទីតាំង GPS បានទេ៖ ' + error.message + '។ សូមចុច "🗺️ រើសលើផែនទី" ដើម្បីរើសទីតាំងដោយផ្ទាល់។');
    }
  };

  // Attempt 1: High Accuracy GPS (10 seconds timeout)
  navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
};

// ==========================================
// MAP PICKER MODAL (រើសទីតាំងដោយផ្ទាល់លើផែនទី)
// ==========================================

window.openMapPickerModal = function() {
  const existingLat = parseFloat(document.getElementById('form-hh-lat')?.value) || 11.4528;
  const existingLng = parseFloat(document.getElementById('form-hh-lng')?.value) || 104.9184;

  currentPickerLat = existingLat;
  currentPickerLng = existingLng;

  document.getElementById('map-picker-coords-preview').textContent = `${currentPickerLat.toFixed(6)}, ${currentPickerLng.toFixed(6)}`;
  document.getElementById('map-picker-modal').classList.remove('hidden');
  document.getElementById('map-picker-modal').classList.add('flex');
  lucide.createIcons();

  setTimeout(() => {
    if (pickerMapInstance) {
      pickerMapInstance.remove();
      pickerMapInstance = null;
    }

    pickerMapInstance = L.map('picker-leaflet-map').setView([currentPickerLat, currentPickerLng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(pickerMapInstance);

    pickerMarker = L.marker([currentPickerLat, currentPickerLng], { draggable: true }).addTo(pickerMapInstance);
    pickerMarker.bindPopup('<strong>ទីតាំងខ្នងផ្ទះ</strong><br>អូស Marker ដើម្បីកែប្រែទីតាំង').openPopup();

    pickerMarker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      currentPickerLat = pos.lat;
      currentPickerLng = pos.lng;
      document.getElementById('map-picker-coords-preview').textContent = `${currentPickerLat.toFixed(6)}, ${currentPickerLng.toFixed(6)}`;
    });

    pickerMapInstance.on('click', function(e) {
      currentPickerLat = e.latlng.lat;
      currentPickerLng = e.latlng.lng;
      pickerMarker.setLatLng(e.latlng);
      document.getElementById('map-picker-coords-preview').textContent = `${currentPickerLat.toFixed(6)}, ${currentPickerLng.toFixed(6)}`;
    });

    pickerMapInstance.invalidateSize();
  }, 200);
};

window.confirmMapPickerLocation = function() {
  if (currentPickerLat && currentPickerLng) {
    document.getElementById('form-hh-lat').value = currentPickerLat.toFixed(6);
    document.getElementById('form-hh-lng').value = currentPickerLng.toFixed(6);

    const indicator = document.getElementById('gps-accuracy-indicator');
    const indicatorText = document.getElementById('gps-accuracy-text');
    if (indicator && indicatorText) {
      indicator.classList.remove('hidden');
      indicatorText.textContent = `បានកំណត់ទីតាំងលើផែនទី៖ ${currentPickerLat.toFixed(6)}, ${currentPickerLng.toFixed(6)}`;
    }
    showToast('បានកំណត់កូអរដោនេទីតាំងលើផែនទី!', 'success');
  }
  closeMapPickerModal();
};

window.closeMapPickerModal = function() {
  document.getElementById('map-picker-modal').classList.add('hidden');
  document.getElementById('map-picker-modal').classList.remove('flex');
};

// ==========================================
// VILLAGE FULL MAP & SINGLE HOUSE MODAL
// ==========================================

// Initialize Village Full Map
window.initVillageMap = function() {
  const mapContainer = document.getElementById('village-leaflet-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const validHouseholds = households.filter(h => h.latitude && h.longitude && !isNaN(parseFloat(h.latitude)) && !isNaN(parseFloat(h.longitude)));
  
  const markerCountBadge = document.getElementById('map-total-markers');
  if (markerCountBadge) {
    markerCountBadge.textContent = `📍 ${toKhmerNum(validHouseholds.length)}/${toKhmerNum(households.length)} ខ្នងផ្ទះមាន GPS`;
  }

  let centerLat = 11.4528;
  let centerLng = 104.9184;

  if (validHouseholds.length > 0) {
    centerLat = parseFloat(validHouseholds[0].latitude);
    centerLng = parseFloat(validHouseholds[0].longitude);
  }

  if (villageMapInstance) {
    villageMapInstance.remove();
    villageMapInstance = null;
  }

  villageMapInstance = L.map('village-leaflet-map').setView([centerLat, centerLng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(villageMapInstance);

  const markersGroup = L.featureGroup();

  validHouseholds.forEach(hh => {
    const lat = parseFloat(hh.latitude);
    const lng = parseFloat(hh.longitude);
    const head = hh.members?.find(m => m.relation === 'head') || hh.members?.[0] || {};
    const pov = getPovertyLabel(hh.povertyStatus);

    let markerColor = '#10b981'; // green for normal
    if (hh.povertyStatus === 'idpoor_1' || hh.povertyStatus === 'idpoor_2') {
      markerColor = '#ef4444'; // red for poor
    } else if (hh.povertyStatus === 'vulnerable') {
      markerColor = '#3b82f6'; // blue for vulnerable
    }

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          ${hh.houseNumber}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersGroup);

    const popupHtml = `
      <div style="font-family: var(--font-khmer, sans-serif); min-width: 180px;">
        <div style="font-weight: bold; font-size: 14px; color: #1e293b; margin-bottom: 2px;">
          ផ្ទះលេខ ${toKhmerNum(hh.houseNumber)} (ក្រុម ${toKhmerNum(hh.groupNumber)})
        </div>
        <div style="font-size: 12px; color: #4338ca; font-weight: 600;">
          មេគ្រួសារ៖ ${head.fullNameKh || '---'}
        </div>
        <div style="font-size: 11px; color: #64748b; margin: 4px 0;">
          សមាជិក៖ ${toKhmerNum(hh.members?.length || 0)} នាក់ | ស្ថានភាព៖ <strong>${pov.text}</strong>
        </div>
        <div style="font-size: 10px; font-family: monospace; color: #94a3b8; margin-bottom: 8px;">
          GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
        </div>
        <div style="display: flex; gap: 4px;">
          <button onclick="viewHouseholdDetail('${hh.id}')" style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer;">
            មើលលម្អិត
          </button>
          <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="background: #e0e7ff; color: #4338ca; text-decoration: none; border-radius: 4px; padding: 3px 8px; font-size: 11px; display: inline-block;">
            Google Maps
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
  });

  markersGroup.addTo(villageMapInstance);

  if (validHouseholds.length > 0) {
    try {
      villageMapInstance.fitBounds(markersGroup.getBounds().pad(0.2));
    } catch(e) {}
  }

  setTimeout(() => {
    if (villageMapInstance) villageMapInstance.invalidateSize();
  }, 300);
};

window.refreshVillageMap = function() {
  initVillageMap();
  showToast('បានផ្ទុកទិន្នន័យផែនទីឡើងវិញ!', 'info');
};

// Open Single House GPS Location Modal Map
window.openHouseMapModal = function(householdId) {
  const hh = households.find(h => h.id === householdId);
  if (!hh) return;

  const lat = parseFloat(hh.latitude);
  const lng = parseFloat(hh.longitude);

  if (isNaN(lat) || isNaN(lng)) {
    alert(`សៀវភៅគ្រួសារ ${hh.id} ពុំទាន់មានកូអរដោនេ GPS នៅឡើយទេ! សូមកែប្រែដើម្បីបញ្ចូល GPS។`);
    return;
  }

  const head = hh.members?.find(m => m.relation === 'head') || hh.members?.[0] || {};
  document.getElementById('house-map-modal-title').textContent = `ទីតាំងផ្ទះលេខ ${toKhmerNum(hh.houseNumber)} (មេគ្រួសារ៖ ${head.fullNameKh || '---'})`;
  document.getElementById('house-map-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  document.getElementById('house-map-google-link').href = `https://www.google.com/maps?q=${lat},${lng}`;

  document.getElementById('house-map-modal').classList.remove('hidden');
  document.getElementById('house-map-modal').classList.add('flex');
  lucide.createIcons();

  setTimeout(() => {
    if (singleHouseMapInstance) {
      singleHouseMapInstance.remove();
      singleHouseMapInstance = null;
    }

    singleHouseMapInstance = L.map('single-house-leaflet-map').setView([lat, lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(singleHouseMapInstance);

    const houseMarker = L.marker([lat, lng]).addTo(singleHouseMapInstance);
    houseMarker.bindPopup(`
      <div style="font-family: var(--font-khmer, sans-serif); text-align: center;">
        <strong>ផ្ទះលេខ ${toKhmerNum(hh.houseNumber)} (ក្រុម ${toKhmerNum(hh.groupNumber)})</strong><br>
        <span>មេគ្រួសារ៖ ${head.fullNameKh || ''}</span>
      </div>
    `).openPopup();

    singleHouseMapInstance.invalidateSize();
  }, 250);
};

window.closeHouseMapModal = function() {
  document.getElementById('house-map-modal').classList.add('hidden');
  document.getElementById('house-map-modal').classList.remove('flex');
};

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  const msgEl = document.getElementById('toast-message');
  msgEl.textContent = message;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3000);
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('household-form')?.addEventListener('submit', handleHouseholdFormSubmit);
  document.getElementById('settings-form')?.addEventListener('submit', handleSettingsFormSubmit);

  // Search & Filters for Households
  document.getElementById('household-search')?.addEventListener('input', renderHouseholdsTable);
  document.getElementById('household-group-filter')?.addEventListener('change', renderHouseholdsTable);
  document.getElementById('household-poverty-filter')?.addEventListener('change', renderHouseholdsTable);

  // Search & Filters for Residents
  document.getElementById('resident-search')?.addEventListener('input', renderResidentsTable);
  document.getElementById('resident-gender-filter')?.addEventListener('change', renderResidentsTable);
  document.getElementById('resident-age-filter')?.addEventListener('change', renderResidentsTable);
}
