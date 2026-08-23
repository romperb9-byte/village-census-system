/**
 * Google Apps Script សម្រាប់ភ្ជាប់ប្រព័ន្ធជំរឿនប្រជាជនភូមិជាមួយ Google Sheets
 * 
 * របៀបដំឡើង៖
 * 1. បង្កើត Google Sheet ថ្មីមួយ
 * 2. ចូលទៅ Extensions -> Apps Script
 * 3. ចម្លងកូដខាងក្រោមទៅដាក់ រួចចុច Save
 * 4. ចុច "Deploy" -> "New deployment" -> ជ្រើសរើសប្រភេទ "Web app"
 * 5. កំណត់ "Execute as: Me" និង "Who has access: Anyone"
 * 6. ចុច Deploy រួចចម្លង Web App URL មកដាក់ក្នុង Settings នៃប្រព័ន្ធជំរឿន
 */

// ទទួលទិន្នន័យតាមរយៈ GET (សម្រាប់ទាញយកទិន្នន័យពី Google Sheets មកកាន់ Web App)
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // សន្លឹកកិច្ចការព័ត៌មានភូមិ
    let infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
    if (!infoSheet) {
      setupSheets(ss);
      infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
    }
    
    const hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
    const memSheet = ss.getSheetByName("បញ្ជីសមាជិក");
    
    // អានទិន្នន័យព័ត៌មានភូមិ
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

    // អានទិន្នន័យសមាជិក
    const memData = memSheet.getDataRange().getValues();
    const membersByHh = {};
    for (let i = 1; i < memData.length; i++) {
      const row = memData[i];
      if (!row[0]) continue;
      const hhId = row[1];
      if (!membersByHh[hhId]) membersByHh[hhId] = [];
      
      membersByHh[hhId].push({
        id: row[0],
        fullNameKh: row[2],
        fullNameEn: row[3],
        gender: row[4] === 'ស្រី' ? 'female' : 'male',
        dob: row[5] instanceof Date ? Utilities.formatDate(row[5], Session.getScriptTimeZone(), "yyyy-MM-dd") : row[5],
        relation: row[6],
        idCardNumber: row[7] ? String(row[7]) : '',
        occupation: row[8],
        education: row[9],
        disability: row[10]
      });
    }

    // អានទិន្នន័យគ្រួសារ
    const hhData = hhSheet.getDataRange().getValues();
    const households = [];
    for (let i = 1; i < hhData.length; i++) {
      const row = hhData[i];
      if (!row[0]) continue;
      const hhId = row[0];
      households.push({
        id: hhId,
        houseNumber: String(row[1]),
        groupNumber: String(row[2]),
        streetNumber: String(row[3] || ''),
        povertyStatus: row[4] || 'none',
        housingType: row[5] || 'ផ្ទះថ្ម',
        electricity: row[6] === true || row[6] === 'មាន',
        cleanWater: row[7] === true || row[7] === 'មាន',
        sanitationToilet: row[8] === true || row[8] === 'មាន',
        note: row[9] || '',
        members: membersByHh[hhId] || []
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      villageInfo: villageInfo,
      households: households
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ទទួលទិន្នន័យតាមរយៈ POST (សម្រាប់បញ្ជូនទិន្នន័យពី Web App ទៅរក្សាទុកក្នុង Google Sheets)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // បង្កើត Sheets ប្រសិនបើមិនទាន់មាន
    setupSheets(ss);
    
    const infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
    const hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
    const memSheet = ss.getSheetByName("បញ្ជីសមាជិក");

    // ១. រក្សាទុកព័ត៌មានភូមិ
    if (data.villageInfo) {
      infoSheet.getRange("B1").setValue(data.villageInfo.villageName || "");
      infoSheet.getRange("B2").setValue(data.villageInfo.communeName || "");
      infoSheet.getRange("B3").setValue(data.villageInfo.districtName || "");
      infoSheet.getRange("B4").setValue(data.villageInfo.provinceName || "");
      infoSheet.getRange("B5").setValue(data.villageInfo.villageChief || "");
      infoSheet.getRange("B6").setValue(data.villageInfo.chiefPhone || "");
      infoSheet.getRange("B7").setValue(data.villageInfo.censusYear || "");
      infoSheet.getRange("B8").setValue(data.villageInfo.censusDate || "");
    }

    // ២. រក្សាទុកបញ្ជីគ្រួសារ និងសមាជិក
    if (data.households && Array.isArray(data.households)) {
      // សម្អាតទិន្នន័យចាស់
      if (hhSheet.getLastRow() > 1) {
        hhSheet.getRange(2, 1, hhSheet.getLastRow() - 1, hhSheet.getLastColumn()).clearContent();
      }
      if (memSheet.getLastRow() > 1) {
        memSheet.getRange(2, 1, memSheet.getLastRow() - 1, memSheet.getLastColumn()).clearContent();
      }

      const hhRows = [];
      const memRows = [];

      data.households.forEach(function(hh) {
        hhRows.push([
          hh.id,
          hh.houseNumber,
          hh.groupNumber,
          hh.streetNumber || "",
          hh.povertyStatus,
          hh.housingType,
          hh.electricity ? "មាន" : "គ្មាន",
          hh.cleanWater ? "មាន" : "គ្មាន",
          hh.sanitationToilet ? "មាន" : "គ្មាន",
          hh.note || ""
        ]);

        (hh.members || []).forEach(function(m) {
          memRows.push([
            m.id,
            hh.id,
            m.fullNameKh,
            m.fullNameEn || "",
            m.gender === "female" ? "ស្រី" : "ប្រុស",
            m.dob,
            m.relation,
            m.idCardNumber ? "'" + m.idCardNumber : "",
            m.occupation || "",
            m.education || "",
            m.disability || "none"
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
      message: "បាន Sync ទិន្នន័យចូល Google Sheets ដោយជោគជ័យ!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// មុខងារដំឡើង Headers ក្នុង Google Sheets
function setupSheets(ss) {
  // Sheet 1: ព័ត៌មានភូមិ
  let infoSheet = ss.getSheetByName("ព័ត៌មានភូមិ");
  if (!infoSheet) {
    infoSheet = ss.insertSheet("ព័ត៌មានភូមិ");
    infoSheet.getRange("A1:A8").setValues([
      ["ឈ្មោះភូមិ"], ["ឃុំ/សង្កាត់"], ["ស្រុក/ខណ្ឌ"], ["ខេត្ត/រាជធានី"],
      ["មេភូមិ"], ["លេខទូរស័ព្ទ"], ["ឆ្នាំជំរឿន"], ["កាលបរិច្ឆេទ"]
    ]).setFontWeight("bold");
  }

  // Sheet 2: បញ្ជីគ្រួសារ
  let hhSheet = ss.getSheetByName("បញ្ជីគ្រួសារ");
  if (!hhSheet) {
    hhSheet = ss.insertSheet("បញ្ជីគ្រួសារ");
    hhSheet.getRange("A1:J1").setValues([[
      "លេខកូដគ្រួសារ", "ផ្ទះលេខ", "ក្រុមទី", "ផ្លូវ/ទីតាំង", "កម្រិតក្រីក្រ", 
      "ប្រភេទផ្ទះ", "អគ្គិសនី", "ទឹកស្អាត", "បង្គន់", "កំណត់សម្គាល់"
    ]]).setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
  }

  // Sheet 3: បញ្ជីសមាជិក
  let memSheet = ss.getSheetByName("បញ្ជីសមាជិក");
  if (!memSheet) {
    memSheet = ss.insertSheet("បញ្ជីសមាជិក");
    memSheet.getRange("A1:K1").setValues([[
      "លេខកូដសមាជិក", "លេខកូដគ្រួសារ", "គោត្តនាម-នាម", "ឈ្មោះឡាតាំង", "ភេទ", 
      "ថ្ងៃកំណើត", "ទំនាក់ទំនង", "លេខអត្តសញ្ញាណប័ណ្ណ", "មុខរបរ", "កម្រិតវប្បធម៌", "ពិការភាព"
    ]]).setBackground("#059669").setFontColor("#ffffff").setFontWeight("bold");
  }

  // Sheet 4: ផ្ទាំងស្ថិតិស្វ័យប្រវត្តិ (Dashboard Formulas)
  let dashSheet = ss.getSheetByName("ផ្ទាំងស្ថិតិស្វ័យប្រវត្តិ");
  if (!dashSheet) {
    dashSheet = ss.insertSheet("ផ្ទាំងស្ថិតិស្វ័យប្រវត្តិ");
    dashSheet.getRange("A1:B1").setValues([["សូចនាករស្ថិតិជំរឿន", "លទ្ធផលស្វ័យប្រវត្តិ"]]).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
    
    dashSheet.getRange("A2:B8").setValues([
      ["ចំនួនគ្រួសារសរុប", "=COUNTA('បញ្ជីគ្រួសារ'!A2:A)"],
      ["ចំនួនប្រជាជនសរុប", "=COUNTA('បញ្ជីសមាជិក'!A2:A)"],
      ["ចំនួនបុរស (ប្រុស)", '=COUNTIF(\'បញ្ជីសមាជិក\'!E2:E, "ប្រុស")'],
      ["ចំនួនស្ត្រី (ស្រី)", '=COUNTIF(\'បញ្ជីសមាជិក\'!E2:E, "ស្រី")'],
      ["គ្រួសារក្រីក្រ កម្រិត ១ (ក្រ១)", '=COUNTIF(\'បញ្ជីគ្រួសារ\'!E2:E, "idpoor_1")'],
      ["គ្រួសារក្រីក្រ កម្រិត ២ (ក្រ២)", '=COUNTIF(\'បញ្ជីគ្រួសារ\'!E2:E, "idpoor_2")'],
      ["គ្រួសារមានភ្លើងអគ្គិសនី", '=COUNTIF(\'បញ្ជីគ្រួសារ\'!G2:G, "មាន")']
    ]);
  }
}
