/**
 * ទិន្នន័យគំរូសម្រាប់ប្រព័ន្ធស្ថិតិជំរឿនប្រជាជនភូមិ
 * Sample Census Data for Cambodian Village
 */

const DEFAULT_VILLAGE_INFO = {
  villageName: "ភូមិត្រពាំងថ្ម",
  communeName: "ឃុំព្រៃវែង",
  districtName: "ស្រុកកណ្តាលស្ទឹង",
  provinceName: "ខេត្តកណ្តាល",
  villageChief: "លោក អ៊ុ ឈុនហេង",
  chiefPhone: "012 345 678",
  censusYear: "២០២៦",
  censusDate: "២០២៦-០៨-២០"
};

const SAMPLE_HOUSEHOLDS = [
  {
    id: "HH-001",
    houseNumber: "១២",
    groupNumber: "១",
    streetNumber: "ផ្លូវបេតុងលេខ ០១",
    povertyStatus: "none", // none, idpoor_1, idpoor_2, vulnerable
    housingType: "ផ្ទះឈើលើថ្មក្រោម", // ផ្ទះថ្ម, ផ្ទះឈើលើថ្មក្រោម, ផ្ទះឈើប្រក់សង្កសី, ផ្ទះស្លឹក
    electricity: true,
    cleanWater: true,
    sanitationToilet: true,
    landArea: "1200", // m2
    agriculturalLand: "2.5", // Hectares
    note: "គ្រួសារគំរូក្នុងភូមិ",
    createdAt: "2026-08-10",
    members: [
      {
        id: "MEM-001-1",
        fullNameKh: "សុខ សុវណ្ណ",
        fullNameEn: "SOK SOVANN",
        gender: "male",
        dob: "1975-05-12",
        idCardNumber: "020456789",
        phone: "012 889 900",
        relation: "head", // head, spouse, son, daughter, parent, relative, other
        maritalStatus: "married", // single, married, widowed, divorced
        occupation: "កសិករ", // កសិករ, អាជីវករ, មន្ត្រីរាជការ, គ្រូបង្រៀន, កម្មកររោងចក្រ, សិស្ស/និស្សិត, គ្មានការងារ, ផ្សេងៗ
        education: "បឋមសិក្សា", // មិនបានរៀន, បឋមសិក្សា, អនុវិទ្យាល័យ, វិទ្យាល័យ, បរិញ្ញាបត្រ, ក្រោយបរិញ្ញាបត្រ
        disability: "none", // none, physical, visual, hearing, mental, other
        voter: true
      },
      {
        id: "MEM-001-2",
        fullNameKh: "ចាន់ ធីតា",
        fullNameEn: "CHAN THIDA",
        gender: "female",
        dob: "1978-08-20",
        idCardNumber: "020456790",
        phone: "088 776 543",
        relation: "spouse",
        maritalStatus: "married",
        occupation: "អាជីវករ",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-001-3",
        fullNameKh: "សុខ វីរៈ",
        fullNameEn: "SOK VIRAK",
        gender: "male",
        dob: "2002-11-15",
        idCardNumber: "020998877",
        phone: "096 554 321",
        relation: "son",
        maritalStatus: "single",
        occupation: "សិស្ស/និស្សិត",
        education: "បរិញ្ញាបត្រ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-001-4",
        fullNameKh: "សុខ ស្រីនិច",
        fullNameEn: "SOK SREYNICH",
        gender: "female",
        dob: "2010-04-03",
        idCardNumber: "",
        phone: "",
        relation: "daughter",
        maritalStatus: "single",
        occupation: "សិស្ស/និស្សិត",
        education: "អនុវិទ្យាល័យ",
        disability: "none",
        voter: false
      }
    ]
  },
  {
    id: "HH-002",
    houseNumber: "១៨",
    groupNumber: "១",
    streetNumber: "ផ្លូវលំលេខ ០២",
    povertyStatus: "idpoor_1",
    housingType: "ផ្ទះឈើប្រក់សង្កសី",
    electricity: true,
    cleanWater: false,
    sanitationToilet: true,
    landArea: "300",
    agriculturalLand: "0",
    note: "គ្រួសារក្រីក្រកម្រិត១ ត្រូវការជំនួយសង្គម",
    createdAt: "2026-08-11",
    members: [
      {
        id: "MEM-002-1",
        fullNameKh: "ម៉ៅ សារ៉េត",
        fullNameEn: "MAO SARETH",
        gender: "female",
        dob: "1960-03-10",
        idCardNumber: "010334455",
        phone: "097 665 443",
        relation: "head",
        maritalStatus: "widowed",
        occupation: "កសិករ",
        education: "មិនបានរៀន",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-002-2",
        fullNameKh: "ម៉ៅ សុផល",
        fullNameEn: "MAO SOPHAL",
        gender: "male",
        dob: "1988-09-25",
        idCardNumber: "020776655",
        phone: "077 123 456",
        relation: "son",
        maritalStatus: "single",
        occupation: "កម្មករសំណង់",
        education: "បឋមសិក្សា",
        disability: "physical",
        voter: true
      }
    ]
  },
  {
    id: "HH-003",
    houseNumber: "២៥",
    groupNumber: "២",
    streetNumber: "ផ្លូវបេតុងលេខ ០១",
    povertyStatus: "none",
    housingType: "ផ្ទះថ្ម",
    electricity: true,
    cleanWater: true,
    sanitationToilet: true,
    landArea: "800",
    agriculturalLand: "1.0",
    note: "",
    createdAt: "2026-08-12",
    members: [
      {
        id: "MEM-003-1",
        fullNameKh: "ហេង វណ្ណា",
        fullNameEn: "HENG VANNA",
        gender: "male",
        dob: "1982-01-14",
        idCardNumber: "020112233",
        phone: "017 889 911",
        relation: "head",
        maritalStatus: "married",
        occupation: "គ្រូបង្រៀន",
        education: "បរិញ្ញាបត្រ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-003-2",
        fullNameKh: "កែវ រស្មី",
        fullNameEn: "KEO REAKSMEY",
        gender: "female",
        dob: "1985-07-30",
        idCardNumber: "020223344",
        phone: "092 334 455",
        relation: "spouse",
        maritalStatus: "married",
        occupation: "មន្ត្រីរាជការ",
        education: "បរិញ្ញាបត្រ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-003-3",
        fullNameKh: "ហេង វិបុល",
        fullNameEn: "HENG VIBOL",
        gender: "male",
        dob: "2012-06-18",
        idCardNumber: "",
        phone: "",
        relation: "son",
        maritalStatus: "single",
        occupation: "សិស្ស/និស្សិត",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: false
      },
      {
        id: "MEM-003-4",
        fullNameKh: "ហេង សុជាតា",
        fullNameEn: "HENG SOCHEATAR",
        gender: "female",
        dob: "2016-10-05",
        idCardNumber: "",
        phone: "",
        relation: "daughter",
        maritalStatus: "single",
        occupation: "សិស្ស/និស្សិត",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: false
      }
    ]
  },
  {
    id: "HH-004",
    houseNumber: "០៥",
    groupNumber: "២",
    streetNumber: "ផ្លូវលំលេខ ០៣",
    povertyStatus: "idpoor_2",
    housingType: "ផ្ទះឈើប្រក់សង្កសី",
    electricity: true,
    cleanWater: true,
    sanitationToilet: true,
    landArea: "450",
    agriculturalLand: "0.5",
    note: "គ្រួសារក្រីក្រកម្រិត២",
    createdAt: "2026-08-14",
    members: [
      {
        id: "MEM-004-1",
        fullNameKh: "គង់ សារិន",
        fullNameEn: "KONG SARIN",
        gender: "male",
        dob: "1970-12-01",
        idCardNumber: "020887766",
        phone: "088 123 789",
        relation: "head",
        maritalStatus: "married",
        occupation: "កម្មកររោងចក្រ",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-004-2",
        fullNameKh: "ព្រំ ម៉ាលី",
        fullNameEn: "PROM MALY",
        gender: "female",
        dob: "1974-03-15",
        idCardNumber: "020778899",
        phone: "097 554 433",
        relation: "spouse",
        maritalStatus: "married",
        occupation: "កម្មកររោងចក្រ",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-004-3",
        fullNameKh: "គង់ រតនា",
        fullNameEn: "KONG RATTANA",
        gender: "female",
        dob: "2000-08-10",
        idCardNumber: "020665544",
        phone: "010 998 877",
        relation: "daughter",
        maritalStatus: "single",
        occupation: "កម្មកររោងចក្រ",
        education: "វិទ្យាល័យ",
        disability: "none",
        voter: true
      }
    ]
  },
  {
    id: "HH-005",
    houseNumber: "៣៣",
    groupNumber: "៣",
    streetNumber: "ផ្លូវបេតុងលេខ ០២",
    povertyStatus: "vulnerable",
    housingType: "ផ្ទះឈើលើថ្មក្រោម",
    electricity: true,
    cleanWater: true,
    sanitationToilet: true,
    landArea: "600",
    agriculturalLand: "1.2",
    note: "គ្រួសារមានមនុស្សចាស់ជរា និងកុមារតូច",
    createdAt: "2026-08-15",
    members: [
      {
        id: "MEM-005-1",
        fullNameKh: "អ៊ុច ធឿន",
        fullNameEn: "OUCH THOEUN",
        gender: "male",
        dob: "1952-04-08",
        idCardNumber: "010998811",
        phone: "012 667 788",
        relation: "head",
        maritalStatus: "married",
        occupation: "មនុស្សចាស់/ចូលនិវត្តន៍",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-005-2",
        fullNameKh: "តូច គឹមលាង",
        fullNameEn: "TOCH KIMLEANG",
        gender: "female",
        dob: "1955-09-12",
        idCardNumber: "010998822",
        phone: "096 112 233",
        relation: "spouse",
        maritalStatus: "married",
        occupation: "មេផ្ទះ",
        education: "មិនបានរៀន",
        disability: "visual",
        voter: true
      },
      {
        id: "MEM-005-3",
        fullNameKh: "អ៊ុច ចំរើន",
        fullNameEn: "OUCH CHAMROEUN",
        gender: "male",
        dob: "1987-02-18",
        idCardNumber: "020334411",
        phone: "015 445 566",
        relation: "son",
        maritalStatus: "married",
        occupation: "អាជីវករ",
        education: "វិទ្យាល័យ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-005-4",
        fullNameKh: "យិន ស្រីពៅ",
        fullNameEn: "YIN SREYPOV",
        gender: "female",
        dob: "1990-11-04",
        idCardNumber: "020334422",
        phone: "089 556 677",
        relation: "relative",
        maritalStatus: "married",
        occupation: "អាជីវករ",
        education: "វិទ្យាល័យ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-005-5",
        fullNameKh: "អ៊ុច ទេវី",
        fullNameEn: "OUCH TEVY",
        gender: "female",
        dob: "2021-07-19",
        idCardNumber: "",
        phone: "",
        relation: "relative",
        maritalStatus: "single",
        occupation: "កុមារក្នុងបន្ទុក",
        education: "មិនបានរៀន",
        disability: "none",
        voter: false
      }
    ]
  },
  {
    id: "HH-006",
    houseNumber: "៤០",
    groupNumber: "៣",
    streetNumber: "ផ្លូវលំលេខ ០១",
    povertyStatus: "none",
    housingType: "ផ្ទះថ្ម",
    electricity: true,
    cleanWater: true,
    sanitationToilet: true,
    landArea: "1500",
    agriculturalLand: "3.0",
    note: "គ្រួសារធ្វើកសិកម្មចម្ការ និងចិញ្ចឹមសត្វ",
    createdAt: "2026-08-16",
    members: [
      {
        id: "MEM-006-1",
        fullNameKh: "ឡាយ សុផល",
        fullNameEn: "LAY SOPHAL",
        gender: "male",
        dob: "1979-06-22",
        idCardNumber: "020556677",
        phone: "012 990 011",
        relation: "head",
        maritalStatus: "married",
        occupation: "កសិករ",
        education: "អនុវិទ្យាល័យ",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-006-2",
        fullNameKh: "សែម សុខា",
        fullNameEn: "SEM SOKHA",
        gender: "female",
        dob: "1981-10-14",
        idCardNumber: "020556688",
        phone: "088 332 211",
        relation: "spouse",
        maritalStatus: "married",
        occupation: "កសិករ",
        education: "បឋមសិក្សា",
        disability: "none",
        voter: true
      },
      {
        id: "MEM-006-3",
        fullNameKh: "ឡាយ រិទ្ធី",
        fullNameEn: "LAY RITTHY",
        gender: "male",
        dob: "2006-03-08",
        idCardNumber: "020667788",
        phone: "096 778 899",
        relation: "son",
        maritalStatus: "single",
        occupation: "សិស្ស/និស្សិត",
        education: "វិទ្យាល័យ",
        disability: "none",
        voter: true
      }
    ]
  }
];
