/**
 * Google Apps Script សម្រាប់ប្រព័ន្ធជំរឿនប្រជាជនភូមិ (Multi-Device Cloud Database)
 * អនុញ្ញាតឱ្យទូរស័ព្ទច្រើន (Multiple Phones) បញ្ចូលទិន្នន័យរួមគ្នាក្នុងពេលតែមួយបាន
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);
    
    const infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
    const hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
    const memSheet = ss.getSheetByName("បញ្ជីសមាជិក");
    
    // អានព័ត៌មានភូមិ
    const villageInfo = {
      villageName: infoSheet.getRange("B1").getValue() || "ភូមិត្រពាំងថ្ម",
      communeName: infoSheet.getRange("B2").getValue() || "ឃុំព្រៃវែង",
      districtName: infoSheet.getRange("B3").getValue() || "ស្រុកកណ្តាលស្ទឹង",
      provinceName: infoSheet.getRange("B4").getValue() || "ខេត្តកណ្តាល",
      villageChief: infoSheet.getRange("B5").getValue() || "លោក អ៊ុ ឈុនហេង",
      chiefPhone: infoSheet.getRange("B6").getValue() || "012 345 678",
      censusYear: infoSheet.getRange("B7").getValue() || "២០២៦",
      censusDate: infoSheet.getRange("B8").getValue() || "2026-08-20"
    };

    // អានបញ្ជីសមាជិក
    const memData = memSheet.getDataRange().getValues();
    const membersByHh = {};
    for (let i = 1; i < memData.length; i++) {
      const row = memData[i];
      if (!row[0]) continue;
      const hhId = String(row[1]);
      if (!membersByHh[hhId]) membersByHh[hhId] = [];
      
      membersByHh[hhId].push({
        id: String(row[0]),
        fullNameKh: String(row[2] || ''),
        fullNameEn: String(row[3] || ''),
        gender: row[4] === 'ស្រី' ? 'female' : 'male',
        dob: row[5] instanceof Date ? Utilities.formatDate(row[5], Session.getScriptTimeZone(), "yyyy-MM-dd") : String(row[5] || ''),
        relation: String(row[6] || 'head'),
        idCardNumber: row[7] ? String(row[7]).replace(/^'/, '') : '',
        occupation: String(row[8] || ''),
        education: String(row[9] || ''),
        disability: String(row[10] || 'none')
      });
    }

    // អានបញ្ជីគ្រួសារ
    const hhData = hhSheet.getDataRange().getValues();
    const households = [];
    for (let i = 1; i < hhData.length; i++) {
      const row = hhData[i];
      if (!row[0]) continue;
      const hhId = String(row[0]);
      households.push({
        id: hhId,
        houseNumber: String(row[1] || ''),
        groupNumber: String(row[2] || '១'),
        streetNumber: String(row[3] || ''),
        latitude: String(row[4] || ''),
        longitude: String(row[5] || ''),
        povertyStatus: String(row[6] || 'none'),
        housingType: String(row[7] || 'ផ្ទះថ្ម'),
        electricity: row[8] === true || row[8] === 'មាន',
        cleanWater: row[9] === true || row[9] === 'មាន',
        sanitationToilet: row[10] === true || row[10] === 'មាន',
        note: String(row[11] || ''),
        enumerator: String(row[12] || ''),
        updatedAt: String(row[13] || ''),
        members: membersByHh[hhId] || []
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      villageInfo: villageInfo,
      households: households,
      totalCount: households.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Lock for concurrent multi-phone writes (up to 20 seconds wait)
    lock.waitLock(20000);

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheets(ss);
    
    const infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
    const hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
    const memSheet = ss.getSheetByName("បញ្ជីសមាជិក");

    const action = data.action || "SAVE_HOUSEHOLD";

    // ករណីទី ១៖ បញ្ចូល ឬកែប្រែគ្រួសារតែមួយ (Single Household Real-time Multi-Device Sync)
    if (action === "SAVE_HOUSEHOLD" && data.household) {
      const hh = data.household;
      const hhId = String(hh.id).trim();

      // រកមើលថាតើមានគ្រួសារនេះរួចហើយឬនៅ
      const hhData = hhSheet.getDataRange().getValues();
      let targetRowIndex = -1;
      for (let i = 1; i < hhData.length; i++) {
        if (String(hhData[i][0]).trim() === hhId) {
          targetRowIndex = i + 1; // 1-based index
          break;
        }
      }

      const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      const hhRowValues = [
        hhId,
        hh.houseNumber || '',
        hh.groupNumber || '១',
        hh.streetNumber || '',
        hh.latitude || '',
        hh.longitude || '',
        hh.povertyStatus || 'none',
        hh.housingType || 'ផ្ទះថ្ម',
        hh.electricity ? "មាន" : "គ្មាន",
        hh.cleanWater ? "មាន" : "គ្មាន",
        hh.sanitationToilet ? "មាន" : "គ្មាន",
        hh.note || '',
        hh.enumerator || data.enumerator || 'ទូរស័ព្ទ',
        nowStr
      ];

      if (targetRowIndex !== -1) {
        // កែប្រែជួរដែលមានស្រាប់
        hhSheet.getRange(targetRowIndex, 1, 1, hhRowValues.length).setValues([hhRowValues]);
      } else {
        // បន្ថែមជួរថ្មី
        hhSheet.appendRow(hhRowValues);
      }

      // លុបសមាជិកចាស់ៗនៃគ្រួសារនេះ រួចបញ្ចូលសមាជិកថ្មីឡើងវិញ
      const memData = memSheet.getDataRange().getValues();
      for (let i = memData.length - 1; i >= 1; i--) {
        if (String(memData[i][1]).trim() === hhId) {
          memSheet.deleteRow(i + 1);
        }
      }

      // បញ្ចូលសមាជិកថ្មី
      if (hh.members && hh.members.length > 0) {
        const memRows = [];
        hh.members.forEach(function(m, idx) {
          memRows.push([
            m.id || `MEM-${hhId}-${idx + 1}`,
            hhId,
            m.fullNameKh || '',
            m.fullNameEn || '',
            m.gender === "female" ? "ស្រី" : "ប្រុស",
            m.dob || '',
            m.relation || 'head',
            m.idCardNumber ? "'" + m.idCardNumber : "",
            m.occupation || '',
            m.education || '',
            m.disability || 'none'
          ]);
        });
        memSheet.getRange(memSheet.getLastRow() + 1, 1, memRows.length, memRows[0].length).setValues(memRows);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: `បានរក្សាទុកគ្រួសារលេខ ${hhId} ចូល Google Sheets រួចរាល់!`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ករណីទី ២៖ លុបគ្រួសារមួយ
    if (action === "DELETE_HOUSEHOLD" && data.householdId) {
      const hhId = String(data.householdId).trim();
      const hhData = hhSheet.getDataRange().getValues();
      for (let i = hhData.length - 1; i >= 1; i--) {
        if (String(hhData[i][0]).trim() === hhId) {
          hhSheet.deleteRow(i + 1);
          break;
        }
      }
      const memData = memSheet.getDataRange().getValues();
      for (let i = memData.length - 1; i >= 1; i--) {
        if (String(memData[i][1]).trim() === hhId) {
          memSheet.deleteRow(i + 1);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: `បានលុបគ្រួសារលេខ ${hhId} ពី Google Sheets រួចរាល់!`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ករណីទី ៣៖ Bulk Sync ទិន្នន័យទាំងអស់ (Full Sync)
    if (data.households && Array.isArray(data.households)) {
      if (hhSheet.getLastRow() > 1) {
        hhSheet.getRange(2, 1, hhSheet.getLastRow() - 1, hhSheet.getLastColumn()).clearContent();
      }
      if (memSheet.getLastRow() > 1) {
        memSheet.getRange(2, 1, memSheet.getLastRow() - 1, memSheet.getLastColumn()).clearContent();
      }

      const hhRows = [];
      const memRows = [];
      const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

      data.households.forEach(function(hh) {
        hhRows.push([
          hh.id,
          hh.houseNumber || '',
          hh.groupNumber || '១',
          hh.streetNumber || '',
          hh.latitude || '',
          hh.longitude || '',
          hh.povertyStatus || 'none',
          hh.housingType || 'ផ្ទះថ្ម',
          hh.electricity ? "មាន" : "គ្មាន",
          hh.cleanWater ? "មាន" : "គ្មាន",
          hh.sanitationToilet ? "មាន" : "គ្មាន",
          hh.note || '',
          hh.enumerator || 'Admin',
          nowStr
        ]);

        (hh.members || []).forEach(function(m, idx) {
          memRows.push([
            m.id || `MEM-${hh.id}-${idx + 1}`,
            hh.id,
            m.fullNameKh || '',
            m.fullNameEn || '',
            m.gender === "female" ? "ស្រី" : "ប្រុស",
            m.dob || '',
            m.relation || 'head',
            m.idCardNumber ? "'" + m.idCardNumber : "",
            m.occupation || '',
            m.education || '',
            m.disability || 'none'
          ]);
        });
      });

      if (hhRows.length > 0) {
        hhSheet.getRange(2, 1, hhRows.length, hhRows[0].length).setValues(hhRows);
      }
      if (memRows.length > 0) {
        memSheet.getRange(2, 1, memRows.length, memRows[0].length).setValues(memRows);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "បាន Sync ទិន្នន័យទាំងអស់ចូល Google Sheets ដោយជោគជ័យ!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setupSheets(ss) {
  let infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
  if (!infoSheet) {
    infoSheet = ss.insertSheet("ព័ត៌មានភូមិ");
    infoSheet.getRange("A1:A8").setValues([
      ["ឈ្មោះភូមិ"], ["ឃុំ/សង្កាត់"], ["ស្រុក/ខណ្ឌ"], ["ខេត្ត/រាជធានី"],
      ["មេភូមិ"], ["លេខទូរស័ព្ទ"], ["ឆ្នាំជំរឿន"], ["កាលបរិច្ឆេទ"]
    ]).setFontWeight("bold");
  }

  let hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
  if (!hhSheet) {
    hhSheet = ss.insertSheet("បញ្ជីគ្រួសារ");
    hhSheet.getRange("A1:N1").setValues([[
      "លេខកូដគ្រួសារ", "ផ្ទះលេខ", "ក្រុមទី", "ផ្លូវ/ទីតាំង", "Latitude", "Longitude",
      "កម្រិតក្រីក្រ", "ប្រភេទផ្ទះ", "អគ្គិសនី", "ទឹកស្អាត", "បង្គន់", "កំណត់សម្គាល់", "អ្នកស្រង់ទិន្នន័យ", "កាលបរិច្ឆេទកែប្រែ"
    ]]).setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
  }

  let memSheet = ss.getSheetByName("បញ្ជីសមាជិក");
  if (!memSheet) {
    memSheet = ss.insertSheet("បញ្ជីសមាជិក");
    memSheet.getRange("A1:K1").setValues([[
      "លេខកូដសមាជិក", "លេខកូដគ្រួសារ", "គោត្តនាម-នាម", "ឈ្មោះឡាតាំង", "ភេទ", 
      "ថ្ងៃកំណើត", "ទំនាក់ទំនង", "លេខអត្តសញ្ញាណប័ណ្ណ", "មុខរបរ", "កម្រិតវប្បធម៌", "ពិការភាព"
    ]]).setBackground("#059669").setFontColor("#ffffff").setFontWeight("bold");
  }
}
