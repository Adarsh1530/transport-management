/* ==========================================
   INITIAL DEMO DATASETS & DATA STORE MANAGER
   ========================================== */

const STORAGE_KEY = 'school_transport_db';

const initialSeedData = {
  schools: [
    {
      id: 1,
      name: "Green Valley Public School",
      location: "Thiruvananthapuram",
      contact: "+91 98470 11223",
      email: "info@greenvalley.edu.in",
      vehicles: 18,
      income: 520000,
      expense: 310000,
      status: "Active"
    },
    {
      id: 2,
      name: "St. Mary's Higher Secondary School",
      location: "Kollam",
      contact: "+91 94471 22334",
      email: "contact@stmaryskollam.org",
      vehicles: 14,
      income: 410000,
      expense: 240000,
      status: "Active"
    },
    {
      id: 3,
      name: "Bright Future School",
      location: "Kochi",
      contact: "+91 98952 33445",
      email: "admin@brightfuturekochi.com",
      vehicles: 22,
      income: 630000,
      expense: 380000,
      status: "Active"
    },
    {
      id: 4,
      name: "Sunrise International School",
      location: "Alappuzha",
      contact: "+91 97443 44556",
      email: "transport@sunriseschool.edu",
      vehicles: 16,
      income: 470000,
      expense: 270000,
      status: "Active"
    },
    {
      id: 5,
      name: "Little Stars Academy",
      location: "Kottayam",
      contact: "+91 94964 55667",
      email: "office@littlestarskottayam.in",
      vehicles: 16,
      income: 455000,
      expense: 235000,
      status: "Active"
    }
  ],

  rtos: [
    { id: 1, city: "Thiruvananthapuram", code: "KL-01" },
    { id: 2, city: "Kollam", code: "KL-02" },
    { id: 3, city: "Pathanamthitta", code: "KL-03" },
    { id: 4, city: "Alappuzha", code: "KL-04" },
    { id: 5, city: "Kottayam", code: "KL-05" },
    { id: 6, city: "Idukki", code: "KL-06" },
    { id: 7, city: "Ernakulam", code: "KL-07" },
    { id: 8, city: "Thrissur", code: "KL-08" },
    { id: 9, city: "Palakkad", code: "KL-09" },
    { id: 10, city: "Malappuram", code: "KL-10" },
    { id: 11, city: "Kozhikode", code: "KL-11" },
    { id: 12, city: "Wayanad", code: "KL-12" },
    { id: 13, city: "Kannur", code: "KL-13" },
    { id: 14, city: "Kasaragod", code: "KL-14" }
  ],

  categories: [
    { id: 1, name: "Transport Fee", type: "INCOME", privilege: "All", description: "Regular student transport fee collection" },
    { id: 2, name: "Monthly Fee", type: "INCOME", privilege: "All", description: "Monthly bus pass fee" },
    { id: 3, name: "Annual Transport Fee", type: "INCOME", privilege: "All", description: "Annual student transport registration fee" },
    { id: 4, name: "Other Income", type: "INCOME", privilege: "All", description: "Miscellaneous transport income" },
    { id: 5, name: "Fee collection - School Trips", type: "INCOME", privilege: "All", description: "Income collected for school trip transport" },
    { id: 6, name: "Fee collection - Other Trips / Brilliant class", type: "INCOME", privilege: "All", description: "Income collected for other trip or brilliant class transport" },
    { id: 7, name: "Fuel", type: "EXPENSE", privilege: "All", description: "Diesel and petrol refills" },
    { id: 8, name: "Driver Salary", type: "EXPENSE", privilege: "All", description: "Driver & helper monthly salaries" },
    { id: 9, name: "Maintenance", type: "EXPENSE", privilege: "All", description: "Routine bus maintenance & servicing" },
    { id: 10, name: "Insurance", type: "EXPENSE", privilege: "All", description: "Annual bus insurance premiums" },
    { id: 11, name: "Repairs", type: "EXPENSE", privilege: "All", description: "Spare parts & breakdown repairs" },
    { id: 12, name: "Permit", type: "EXPENSE", privilege: "All", description: "State transport permit fees" },
    { id: 13, name: "Tax", type: "EXPENSE", privilege: "All", description: "Road tax payments" },
    { id: 14, name: "Bus Hiring Charges", type: "EXPENSE", privilege: "All", description: "Charges for hired buses" },
    { id: 15, name: "Fitness Test Expense", type: "EXPENSE", privilege: "All", description: "Vehicle fitness test charges" },
    { id: 16, name: "GPS Fee", type: "EXPENSE", privilege: "All", description: "GPS device or tracking fee" },
    { id: 17, name: "Speed Test Fee", type: "EXPENSE", privilege: "All", description: "Speed governor or speed test charges" },
    { id: 18, name: "Admin Maintenance Cost", type: "EXPENSE", privilege: "All", description: "Administrative maintenance expenses" }
  ],

  vehicles: [
    { id: 1, vehicleName: "Green Valley Bus 01", busNo: "KL-01-AB-1234", schoolId: 1, model: "Ashok Leyland 2022", fuelType: "Diesel", fuelEfficiency: "12 km/l", routeNumber: "R-01", chassisNo: "CH-2022-KL01-9981", manufacturer: "Ashok Leyland", engineNo: "ENG-AL-55412", regDate: "2021-04-12", seats: 50, maxAllowed: 50, contactPerson: "Arun Kumar (+91 98471 00112)", driver: "Arun Kumar", rto: "KL-01", status: "Active", type: "Ashok Leyland Sunshine" },
    { id: 2, vehicleName: "Green Valley Bus 02", busNo: "KL-01-CD-4521", schoolId: 1, model: "Tata Starbus 2023", fuelType: "Diesel", fuelEfficiency: "14 km/l", routeNumber: "R-02", chassisNo: "CH-2023-KL01-3321", manufacturer: "Tata Motors", engineNo: "ENG-TM-88214", regDate: "2022-01-18", seats: 30, maxAllowed: 30, contactPerson: "Rahul Raj (+91 98472 11223)", driver: "Rahul Raj", rto: "KL-01", status: "Active", type: "Tata Starbus Ultra" },
    { id: 3, vehicleName: "Green Valley Bus 03", busNo: "KL-01-EF-8890", schoolId: 1, model: "Eicher Skyline 2020", fuelType: "Diesel", fuelEfficiency: "11 km/l", routeNumber: "R-07", chassisNo: "CH-2020-KL01-7721", manufacturer: "Eicher Motors", engineNo: "ENG-EM-44120", regDate: "2020-08-05", seats: 50, maxAllowed: 50, contactPerson: "Vipin Das (+91 98473 22334)", driver: "Vipin Das", rto: "KL-01", status: "Active", type: "Eicher Skyline Pro" },
    { id: 4, vehicleName: "Green Valley Bus 04", busNo: "KL-01-GH-3341", schoolId: 1, model: "Force Traveller 2023", fuelType: "Diesel", fuelEfficiency: "16 km/l", routeNumber: "R-08", chassisNo: "CH-2023-KL01-1102", manufacturer: "Force Motors", engineNo: "ENG-FM-99321", regDate: "2023-03-22", seats: 14, maxAllowed: 14, contactPerson: "Anil Varghese (+91 98474 33445)", driver: "Anil Varghese", rto: "KL-01", status: "Maintenance", type: "Force Traveller Monobus" },

    { id: 5, vehicleName: "St Marys Bus 01", busNo: "KL-02-AB-5512", schoolId: 2, model: "Ashok Leyland 2021", fuelType: "Diesel", fuelEfficiency: "12 km/l", routeNumber: "R-03", chassisNo: "CH-2021-KL02-8812", manufacturer: "Ashok Leyland", engineNo: "ENG-AL-12345", regDate: "2021-06-14", seats: 50, maxAllowed: 50, contactPerson: "Suresh Pillai (+91 94471 99887)", driver: "Suresh Pillai", rto: "KL-02", status: "Active", type: "Ashok Leyland Sunshine" },
    { id: 6, vehicleName: "St Marys Bus 02", busNo: "KL-02-CD-6632", schoolId: 2, model: "SML Isuzu 2022", fuelType: "Diesel", fuelEfficiency: "13 km/l", routeNumber: "R-09", chassisNo: "CH-2022-KL02-6612", manufacturer: "SML Isuzu", engineNo: "ENG-SI-99123", regDate: "2022-09-10", seats: 32, maxAllowed: 32, contactPerson: "Deepak Nair (+91 94472 88776)", driver: "Deepak Nair", rto: "KL-02", status: "Active", type: "SML Isuzu Executive" },
    { id: 7, vehicleName: "St Marys Bus 03", busNo: "KL-02-EF-7741", schoolId: 2, model: "Tata Citybus 2019", fuelType: "Diesel", fuelEfficiency: "10 km/l", routeNumber: "R-10", chassisNo: "CH-2019-KL02-4412", manufacturer: "Tata Motors", engineNo: "ENG-TM-77123", regDate: "2019-11-28", seats: 45, maxAllowed: 45, contactPerson: "Manoj Mohan (+91 94473 77665)", driver: "Manoj Mohan", rto: "KL-02", status: "Active", type: "Tata Starbus Ultra" },

    { id: 8, vehicleName: "Bright Future Bus 01", busNo: "KL-07-AB-9921", schoolId: 3, model: "BharatBenz 2020", fuelType: "Diesel", fuelEfficiency: "9 km/l", routeNumber: "R-04", chassisNo: "CH-2020-KL07-2231", manufacturer: "BharatBenz", engineNo: "ENG-BB-88123", regDate: "2020-02-15", seats: 60, maxAllowed: 60, contactPerson: "Rajesh K (+91 98952 11009)", driver: "Rajesh K", rto: "KL-07", status: "Active", type: "BharatBenz School Bus" },
    { id: 9, vehicleName: "Bright Future Bus 02", busNo: "KL-07-CD-1102", schoolId: 3, model: "Ashok Leyland 2022", fuelType: "CNG", fuelEfficiency: "4.5 km/kg", routeNumber: "R-11", chassisNo: "CH-2022-KL07-4412", manufacturer: "Ashok Leyland", engineNo: "ENG-AL-33124", regDate: "2022-05-19", seats: 50, maxAllowed: 50, contactPerson: "Sunil Dutt (+91 98953 22110)", driver: "Sunil Dutt", rto: "KL-07", status: "Active", type: "Ashok Leyland Sunshine" },
    { id: 10, vehicleName: "Bright Future Bus 03", busNo: "KL-07-EF-4433", schoolId: 3, model: "Tata Winger 2023", fuelType: "Diesel", fuelEfficiency: "15 km/l", routeNumber: "R-12", chassisNo: "CH-2023-KL07-5512", manufacturer: "Tata Motors", engineNo: "ENG-TM-22100", regDate: "2023-01-10", seats: 26, maxAllowed: 26, contactPerson: "Gokul Prasad (+91 98954 33221)", driver: "Gokul Prasad", rto: "KL-07", status: "Fitness Test", type: "Force Traveller Monobus" },
    { id: 11, vehicleName: "Bright Future Bus 04", busNo: "KL-07-GH-8877", schoolId: 3, model: "Eicher Starline 2021", fuelType: "Diesel", fuelEfficiency: "11 km/l", routeNumber: "R-13", chassisNo: "CH-2021-KL07-9912", manufacturer: "Eicher Motors", engineNo: "ENG-EM-11029", regDate: "2021-12-01", seats: 50, maxAllowed: 50, contactPerson: "Biju Thomas (+91 98955 44332)", driver: "Biju Thomas", rto: "KL-07", status: "Maintenance", type: "Eicher Skyline Pro" },

    { id: 12, vehicleName: "Sunrise Bus 01", busNo: "KL-04-AB-3321", schoolId: 4, model: "Ashok Leyland 2020", fuelType: "Diesel", fuelEfficiency: "12 km/l", routeNumber: "R-05", chassisNo: "CH-2020-KL04-7712", manufacturer: "Ashok Leyland", engineNo: "ENG-AL-66123", regDate: "2020-07-11", seats: 50, maxAllowed: 50, contactPerson: "Nikhil George (+91 97443 66554)", driver: "Nikhil George", rto: "KL-04", status: "Active", type: "Ashok Leyland Sunshine" },
    { id: 13, vehicleName: "Sunrise Bus 02", busNo: "KL-04-CD-1298", schoolId: 4, model: "SML Supreme 2022", fuelType: "Diesel", fuelEfficiency: "13 km/l", routeNumber: "R-14", chassisNo: "CH-2022-KL04-3312", manufacturer: "SML Isuzu", engineNo: "ENG-SI-44102", regDate: "2022-10-04", seats: 30, maxAllowed: 30, contactPerson: "Shabu Alex (+91 97444 55443)", driver: "Shabu Alex", rto: "KL-04", status: "Active", type: "SML Isuzu Executive" },
    { id: 14, vehicleName: "Sunrise Bus 03", busNo: "KL-04-EF-7788", schoolId: 4, model: "Force Traveller 2023", fuelType: "Diesel", fuelEfficiency: "15 km/l", routeNumber: "R-15", chassisNo: "CH-2023-KL04-8812", manufacturer: "Force Motors", engineNo: "ENG-FM-55123", regDate: "2023-04-18", seats: 16, maxAllowed: 16, contactPerson: "Vineeth V (+91 97445 44332)", driver: "Vineeth V", rto: "KL-04", status: "Active", type: "Force Traveller Monobus" },

    { id: 15, vehicleName: "Little Stars Bus 01", busNo: "KL-05-AB-4455", schoolId: 5, model: "Tata Starbus 2021", fuelType: "Diesel", fuelEfficiency: "12 km/l", routeNumber: "R-06", chassisNo: "CH-2021-KL05-1102", manufacturer: "Tata Motors", engineNo: "ENG-TM-99120", regDate: "2021-09-09", seats: 48, maxAllowed: 48, contactPerson: "Shaji Mathew (+91 94964 11223)", driver: "Shaji Mathew", rto: "KL-05", status: "Active", type: "Tata Starbus Ultra" },
    { id: 16, vehicleName: "Little Stars Bus 02", busNo: "KL-05-CD-9900", schoolId: 5, model: "Eicher Skyline 2022", fuelType: "Petrol", fuelEfficiency: "10 km/l", routeNumber: "R-16", chassisNo: "CH-2022-KL05-4421", manufacturer: "Eicher Motors", engineNo: "ENG-EM-33120", regDate: "2022-08-30", seats: 28, maxAllowed: 28, contactPerson: "Sanju Samson (+91 94965 22334)", driver: "Sanju Samson", rto: "KL-05", status: "Active", type: "Eicher Skyline Pro" }
  ],

  renewals: [
    { id: 1, vehicleId: 1, schoolId: 1, type: "Insurance", renewalDate: "2026-08-15" },
    { id: 2, vehicleId: 2, schoolId: 1, type: "Pollution", renewalDate: "2026-08-10" }, // Due Today
    { id: 3, vehicleId: 3, schoolId: 1, type: "Fitness", renewalDate: "2026-08-02" }, // Expired
    { id: 4, vehicleId: 4, schoolId: 1, type: "Road Tax", renewalDate: "2026-08-25" },

    { id: 5, vehicleId: 5, schoolId: 2, type: "Pollution", renewalDate: "2026-08-14" }, // 4 Days Left
    { id: 6, vehicleId: 6, schoolId: 2, type: "Permit", renewalDate: "2026-09-05" },
    { id: 7, vehicleId: 7, schoolId: 2, type: "Fire & Safety", renewalDate: "2026-08-01" }, // Expired

    { id: 8, vehicleId: 8, schoolId: 3, type: "Insurance", renewalDate: "2026-08-17" }, // 7 Days Left
    { id: 9, vehicleId: 9, schoolId: 3, type: "Road Tax", renewalDate: "2026-09-10" },
    { id: 10, vehicleId: 10, schoolId: 3, type: "Pollution", renewalDate: "2026-08-30" },
    { id: 11, vehicleId: 11, schoolId: 3, type: "Fitness", renewalDate: "2026-10-15" },

    { id: 12, vehicleId: 12, schoolId: 4, type: "Fitness", renewalDate: "2026-08-10" }, // Due Today
    { id: 13, vehicleId: 13, schoolId: 4, type: "Pollution", renewalDate: "2026-09-25" },
    { id: 14, vehicleId: 14, schoolId: 4, type: "Permit", renewalDate: "2026-08-14" },

    { id: 15, vehicleId: 15, schoolId: 5, type: "Insurance", renewalDate: "2026-08-13" }, // 3 Days Left
    { id: 16, vehicleId: 16, schoolId: 5, type: "Permit", renewalDate: "2026-09-18" }
  ],

  income: [
    { id: 1, schoolId: 1, date: "2026-08-01", category: "Monthly Fee", description: "Term 2 Transport Fee Collection", amount: 320000 },
    { id: 2, schoolId: 1, date: "2026-08-05", category: "Annual Transport Fee", description: "New Admission Transport Reg", amount: 200000 },

    { id: 3, schoolId: 2, date: "2026-08-02", category: "Monthly Fee", description: "August Bus Pass Fee", amount: 260000 },
    { id: 4, schoolId: 2, date: "2026-08-06", category: "Transport Fee", description: "Excursion Special Transport", amount: 150000 },

    { id: 5, schoolId: 3, date: "2026-08-01", category: "Monthly Fee", description: "August Monthly Transport Charges", amount: 410000 },
    { id: 6, schoolId: 3, date: "2026-08-04", category: "Annual Transport Fee", description: "Senior Secondary Transport Fee", amount: 220000 },

    { id: 7, schoolId: 4, date: "2026-08-03", category: "Monthly Fee", description: "Alappuzha Route Transport Collection", amount: 310000 },
    { id: 8, schoolId: 4, date: "2026-08-07", category: "Other Income", description: "Old Spare Parts Sale", amount: 160000 },

    { id: 9, schoolId: 5, date: "2026-08-02", category: "Monthly Fee", description: "Primary Wing Transport Fee", amount: 295000 },
    { id: 10, schoolId: 5, date: "2026-08-05", category: "Annual Transport Fee", description: "Kottayam District Bus Pass", amount: 160000 }
  ],

  expenses: [
    { id: 1, schoolId: 1, date: "2026-08-02", category: "Fuel", description: "Diesel Refill - Vehicles 1 & 2", amount: 140000 },
    { id: 2, schoolId: 1, date: "2026-08-05", category: "Driver Salary", description: "Monthly Drivers & Helpers Pay", amount: 110000 },
    { id: 3, schoolId: 1, date: "2026-08-06", category: "Maintenance", description: "Brake Pad & Tyre Replacement (Bus KL-01-GH-3341)", amount: 60000 },

    { id: 4, schoolId: 2, date: "2026-08-03", category: "Fuel", description: "Kollam Central Fuel Depot Pay", amount: 110000 },
    { id: 5, schoolId: 2, date: "2026-08-05", category: "Driver Salary", description: "August Driver Compensation", amount: 90000 },
    { id: 6, schoolId: 2, date: "2026-08-07", category: "Insurance", description: "Annual Bus Insurance Renewal", amount: 40000 },

    { id: 7, schoolId: 3, date: "2026-08-02", category: "Fuel", description: "Kochi Marine Drive Diesel Station", amount: 180000 },
    { id: 8, schoolId: 3, date: "2026-08-05", category: "Driver Salary", description: "Drivers & Mechanics Salary", amount: 140000 },
    { id: 9, schoolId: 3, date: "2026-08-06", category: "Repairs", description: "Engine Servicing Bus KL-07-GH-8877", amount: 60000 },

    { id: 10, schoolId: 4, date: "2026-08-03", category: "Fuel", description: "Diesel Filling Station Alappuzha", amount: 130000 },
    { id: 11, schoolId: 4, date: "2026-08-05", category: "Driver Salary", description: "Monthly Staff Remuneration", amount: 100000 },
    { id: 12, schoolId: 4, date: "2026-08-07", category: "Permit", description: "State Transport Permit Renewal Fee", amount: 40000 },

    { id: 13, schoolId: 5, date: "2026-08-02", category: "Fuel", description: "Kottayam Fuel Outlet Diesel", amount: 115000 },
    { id: 14, schoolId: 5, date: "2026-08-05", category: "Driver Salary", description: "Staff Salary Disbursement", amount: 95000 },
    { id: 15, schoolId: 5, date: "2026-08-06", category: "Maintenance", description: "AC Servicing & Electrical Repairs", amount: 25000 }
  ],

  drivers: [
    { id: 1, name: "Arun Kumar", dob: "1988-05-15", license: "KL01-20150098471", phone: "+91 98471 00112", busId: 1, schoolId: 1, expiry: "2028-11-20", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 2, name: "Rahul Raj", dob: "1990-02-18", license: "KL01-20170044512", phone: "+91 98472 11223", busId: 2, schoolId: 1, expiry: "2027-04-15", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 3, name: "Vipin Das", dob: "1985-09-24", license: "KL01-20180099234", phone: "+91 98473 22334", busId: 3, schoolId: 1, expiry: "2029-01-10", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 4, name: "Anil Varghese", dob: "1992-11-04", license: "KL01-20160033129", phone: "+91 98474 33445", busId: 4, schoolId: 1, expiry: "2026-12-05", status: "Active", licenseDoc: null, pccDoc: null },

    { id: 5, name: "Suresh Pillai", dob: "1986-07-30", license: "KL02-20140088123", phone: "+91 94471 99887", busId: 5, schoolId: 2, expiry: "2027-09-30", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 6, name: "Deepak Nair", dob: "1991-04-12", license: "KL02-20190011245", phone: "+91 94472 88776", busId: 6, schoolId: 2, expiry: "2028-06-18", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 7, name: "Manoj Mohan", dob: "1989-12-01", license: "KL02-20160055432", phone: "+91 94473 77665", busId: 7, schoolId: 2, expiry: "2026-11-22", status: "Active", licenseDoc: null, pccDoc: null },

    { id: 8, name: "Rajesh K", dob: "1984-03-22", license: "KL07-20130099881", phone: "+91 98952 11009", busId: 8, schoolId: 3, expiry: "2027-07-14", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 9, name: "Sunil Dutt", dob: "1987-08-19", license: "KL07-20180044321", phone: "+91 98953 22110", busId: 9, schoolId: 3, expiry: "2029-03-25", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 10, name: "Gokul Prasad", dob: "1993-01-05", license: "KL07-20200088765", phone: "+91 98954 33221", busId: 10, schoolId: 3, expiry: "2030-05-12", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 11, name: "Biju Thomas", dob: "1986-10-14", license: "KL07-20150022334", phone: "+91 98955 44332", busId: 11, schoolId: 3, expiry: "2026-10-08", status: "Active", licenseDoc: null, pccDoc: null },

    { id: 12, name: "Nikhil George", dob: "1990-06-28", license: "KL04-20170066543", phone: "+91 97443 66554", busId: 12, schoolId: 4, expiry: "2028-02-28", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 13, name: "Shabu Alex", dob: "1988-09-17", license: "KL04-20190033221", phone: "+91 97444 55443", busId: 13, schoolId: 4, expiry: "2027-10-15", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 14, name: "Vineeth V", dob: "1994-05-02", license: "KL04-20210088990", phone: "+91 97445 44332", busId: 14, schoolId: 4, expiry: "2031-08-01", status: "Active", licenseDoc: null, pccDoc: null },

    { id: 15, name: "Shaji Mathew", dob: "1985-12-10", license: "KL05-20150011998", phone: "+91 94964 11223", busId: 15, schoolId: 5, expiry: "2027-05-20", status: "Active", licenseDoc: null, pccDoc: null },
    { id: 16, name: "Sanju Samson", dob: "1991-11-11", license: "KL05-20180077665", phone: "+91 94965 22334", busId: 16, schoolId: 5, expiry: "2029-09-12", status: "Active", licenseDoc: null, pccDoc: null }
  ],

  routes: [
    { id: 1, routeCode: "R-01", name: "Kazhakkoottam → School Campus", schoolId: 1, start: "Kazhakkoottam Junction", destination: "GVPS Campus", stops: 8, busId: 1, driverId: 1, status: "Active" },
    { id: 2, routeCode: "R-02", name: "Pattom → School Campus", schoolId: 1, start: "Pattom Palace", destination: "GVPS Campus", stops: 6, busId: 2, driverId: 2, status: "Active" },
    { id: 3, routeCode: "R-03", name: "Kollam Beach → St. Mary's Campus", schoolId: 2, start: "Kollam Beach Road", destination: "St. Mary's Main Gate", stops: 10, busId: 5, driverId: 5, status: "Active" },
    { id: 4, routeCode: "R-04", name: "Edappally → Bright Future Campus", schoolId: 3, start: "Edappally Toll", destination: "BFS Campus", stops: 12, busId: 8, driverId: 8, status: "Active" },
    { id: 5, routeCode: "R-05", name: "Alappuzha Town → Sunrise Campus", schoolId: 4, start: "Alappuzha KSRTC Bus Stand", destination: "Sunrise Campus", stops: 7, busId: 12, driverId: 12, status: "Active" },
    { id: 6, routeCode: "R-06", name: "Ettumanoor → Little Stars Campus", schoolId: 5, start: "Ettumanoor Temple", destination: "Little Stars Campus", stops: 9, busId: 15, driverId: 15, status: "Active" }
  ],

  attendants: [
    { id: 1, name: "Soman P", phone: "+91 98470 12345", schoolId: 1, busId: 1, dob: "1992-04-10", experience: "4 Years", address: "Trivandrum", status: "Active", doc: null },
    { id: 2, name: "Ramesh Babu", phone: "+91 98470 23456", schoolId: 1, busId: 2, dob: "1988-08-15", experience: "6 Years", address: "Kazhakkoottam", status: "Active", doc: null },
    { id: 3, name: "Sumesh K", phone: "+91 94470 34567", schoolId: 2, busId: 5, dob: "1995-01-20", experience: "3 Years", address: "Kollam", status: "Active", doc: null },
    { id: 4, name: "Subhash R", phone: "+91 98950 45678", schoolId: 3, busId: 8, dob: "1984-06-12", experience: "8 Years", address: "Kochi", status: "Active", doc: null },
    { id: 5, name: "Omana K", phone: "+91 97440 56789", schoolId: 4, busId: 12, dob: "1990-09-05", experience: "5 Years", address: "Alappuzha", status: "Active", doc: null },
    { id: 6, name: "Vijayan M", phone: "+91 94960 67890", schoolId: 5, busId: 15, dob: "1986-03-30", experience: "7 Years", address: "Kottayam", status: "Active", doc: null }
  ],

  trips: [
    { id: 1, tripId: "TRIP-101", date: "2026-08-10", schoolId: 1, busId: 1, routeId: 1, driverId: 1, startTime: "07:15 AM", endTime: "08:30 AM", status: "Completed" },
    { id: 2, tripId: "TRIP-102", date: "2026-08-10", schoolId: 1, busId: 2, routeId: 2, driverId: 2, startTime: "07:30 AM", endTime: "08:45 AM", status: "Completed" },
    { id: 3, tripId: "TRIP-103", date: "2026-08-11", schoolId: 2, busId: 5, routeId: 3, driverId: 5, startTime: "07:00 AM", endTime: "08:15 AM", status: "Running" },
    { id: 4, tripId: "TRIP-104", date: "2026-08-12", schoolId: 3, busId: 8, routeId: 4, driverId: 8, startTime: "07:45 AM", endTime: "09:00 AM", status: "Scheduled" }
  ]
};

// Store Interface
class DataStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
    }
  }

  getData() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialSeedData;
      // Guarantee legacy stores get rtos and categories datasets
      if (!data.rtos || !data.rtos.length) data.rtos = initialSeedData.rtos;
      if (!data.categories || !data.categories.length) data.categories = [...initialSeedData.categories];
      else {
        const existingKeys = new Set(
          data.categories.map(c => `${String(c.name || '').trim().toLowerCase()}|${String(c.type || '').trim().toUpperCase()}`)
        );
        let categoriesModified = false;
        initialSeedData.categories.forEach(seedCat => {
          const key = `${String(seedCat.name || '').trim().toLowerCase()}|${String(seedCat.type || '').trim().toUpperCase()}`;
          if (!existingKeys.has(key)) {
            data.categories.push({ ...seedCat });
            existingKeys.add(key);
            categoriesModified = true;
          }
        });
        if (categoriesModified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }
      if (!data.attendants || !data.attendants.length) data.attendants = initialSeedData.attendants;
      if (!data.trips || !data.trips.length) data.trips = initialSeedData.trips;

      const validVehicleTypes = [
        "Ashok Leyland Sunshine",
        "Tata Starbus Ultra",
        "Eicher Skyline Pro",
        "BharatBenz School Bus",
        "SML Isuzu Executive",
        "Force Traveller Monobus"
      ];

      // Auto-migrate legacy vehicle types in localStorage (e.g. "School Bus (50 Seater)", "Mini Bus (30 Seater)", "Van (14 Seater)")
      if (data.vehicles && Array.isArray(data.vehicles)) {
        let modified = false;
        data.vehicles.forEach((v, index) => {
          if (!v.type || v.type.includes('Seater') || v.type.includes('Mini Bus') || v.type.includes('Heavy Bus') || v.type.includes('Van') || !validVehicleTypes.includes(v.type)) {
            v.type = validVehicleTypes[index % validVehicleTypes.length];
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }

      return data;
    } catch (e) {
      return initialSeedData;
    }
  }

  saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  resetData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedData));
  }

  // --- RTO Master Data Operations (Official Master List) ---
  getRtos() {
    return [
      { id: 1, office: "RTO Adoor", city: "Pathanamthitta", code: "KL26" },
      { id: 2, office: "RTO Alappuzha", city: "Alappuzha", code: "KL04" },
      { id: 3, office: "RTO Aluva", city: "Ernakulam", code: "KL41" },
      { id: 4, office: "RTO Angamaly", city: "Ernakulam", code: "KL63" },
      { id: 5, office: "RTO Attingal", city: "Thiruvananthapuram", code: "KL16" },
      { id: 6, office: "RTO Chalakudy", city: "Thrissur", code: "KL64" },
      { id: 7, office: "RTO Changanassery", city: "Kottayam", code: "KL33" },
      { id: 8, office: "RTO Chengannur", city: "Alappuzha", code: "KL30" },
      { id: 9, office: "RTO Cherthala", city: "Alappuzha", code: "KL32" },
      { id: 10, office: "RTO Ernakulam", city: "Ernakulam", code: "KL07, KL39, KL42" },
      { id: 11, office: "RTO Guruvayoor", city: "Thrissur", code: "KL46" },
      { id: 12, office: "RTO Idukki", city: "Idukki", code: "KL06, KL37" },
      { id: 13, office: "RTO Irinjalakuda", city: "Thrissur", code: "KL45" },
      { id: 14, office: "RTO Kanhangad", city: "Kasaragod", code: "KL60" },
      { id: 15, office: "RTO Kanjirappally", city: "Kottayam", code: "KL34" },
      { id: 16, office: "RTO Kannur", city: "Kannur", code: "KL13" },
      { id: 17, office: "RTO Karunagappally", city: "Kollam", code: "KL23" },
      { id: 18, office: "RTO Kasaragod", city: "Kasaragod", code: "KL14" },
      { id: 19, office: "RTO Kattakkada", city: "Thiruvananthapuram", code: "KL74" },
      { id: 20, office: "RTO Kayamkulam", city: "Alappuzha", code: "KL29" },
      { id: 21, office: "RTO Kodungallur", city: "Thrissur", code: "KL47" },
      { id: 22, office: "RTO Kollam", city: "Kollam", code: "KL02, KL61" },
      { id: 23, office: "RTO Kothamangalam", city: "Ernakulam", code: "KL44" },
      { id: 24, office: "RTO Kottarakkara", city: "Kollam", code: "KL24" },
      { id: 25, office: "RTO Kottayam", city: "Kottayam", code: "KL05" },
      { id: 26, office: "RTO Koyilandy", city: "Kozhikode", code: "KL56" },
      { id: 27, office: "RTO Kozhikode", city: "Kozhikode", code: "KL11, KL56, KL57" },
      { id: 28, office: "RTO Malappuram", city: "Malappuram", code: "KL10" },
      { id: 29, office: "RTO Mallappally", city: "Pathanamthitta", code: "KL28" },
      { id: 30, office: "RTO Mannarkkad", city: "Palakkad", code: "KL50" },
      { id: 31, office: "RTO Mavelikara", city: "Alappuzha", code: "KL31" },
      { id: 32, office: "RTO Muvattupuzha", city: "Ernakulam", code: "KL17" },
      { id: 33, office: "RTO Nedumangad", city: "Thiruvananthapuram", code: "KL21" },
      { id: 34, office: "RTO Neyyattinkara", city: "Thiruvananthapuram", code: "KL20" },
      { id: 35, office: "RTO Nilambur", city: "Malappuram", code: "KL71" },
      { id: 36, office: "RTO Ottapalam", city: "Palakkad", code: "KL51" },
      { id: 37, office: "RTO Palakkad", city: "Palakkad", code: "KL09, KL49, KL50, KL52" },
      { id: 38, office: "RTO Parassala", city: "Thiruvananthapuram", code: "KL19" },
      { id: 39, office: "RTO Paravur", city: "Ernakulam", code: "KL42" },
      { id: 40, office: "RTO Pathanamthitta", city: "Pathanamthitta", code: "KL03, KL62" },
      { id: 41, office: "RTO Pattambi", city: "Palakkad", code: "KL52" },
      { id: 42, office: "RTO Payyanur", city: "Kannur", code: "KL86" },
      { id: 43, office: "RTO Perinthalmanna", city: "Malappuram", code: "KL53" },
      { id: 44, office: "RTO Perumbavoor", city: "Ernakulam", code: "KL40" },
      { id: 45, office: "RTO Ponnani", city: "Malappuram", code: "KL54" },
      { id: 46, office: "RTO Punalur", city: "Kollam", code: "KL25" },
      { id: 47, office: "RTO Ranni", city: "Pathanamthitta", code: "KL62" },
      { id: 48, office: "RTO Sultan Bathery", city: "Wayanad", code: "KL73" },
      { id: 49, office: "RTO Taliparamba", city: "Kannur", code: "KL59" },
      { id: 50, office: "RTO Thalassery", city: "Kannur", code: "KL58" },
      { id: 51, office: "RTO Thiruvalla", city: "Pathanamthitta", code: "KL27" },
      { id: 52, office: "RTO Thiruvananthapuram", city: "Thiruvananthapuram", code: "KL01, KL19, KL22" },
      { id: 53, office: "RTO Thodupuzha", city: "Idukki", code: "KL38" },
      { id: 54, office: "RTO Thrissur", city: "Thrissur", code: "KL08" },
      { id: 55, office: "RTO Tirur", city: "Malappuram", code: "KL55" },
      { id: 56, office: "RTO Vadakara", city: "Kozhikode", code: "KL18" },
      { id: 57, office: "RTO Vaikom", city: "Kottayam", code: "KL36" },
      { id: 58, office: "RTO Varkala", city: "Thiruvananthapuram", code: "KL81" },
      { id: 59, office: "RTO Wadakkanchery", city: "Thrissur", code: "KL48" },
      { id: 60, office: "RTO Wayanad", city: "Wayanad", code: "KL12, KL72" }
    ];
  }

  saveRto(city, code) {
    return { success: false, message: "RTO Code List is view-only." };
  }

  // --- Category Master Operations ---
  getCategories(type = null, role = null) {
    const data = this.getData();
    let list = data.categories || initialSeedData.categories;

    if (type) {
      list = list.filter(c => c.type.toUpperCase() === type.toUpperCase());
    }

    if (role && role !== 'Super Admin') {
      list = list.filter(c => {
        const priv = c.privilege || 'All';
        if (priv === 'All') return true;
        if (role === 'Admin') return priv === 'Admin' || priv === 'Super Admin & Admin';
        if (role === 'School') return priv === 'School' || priv === 'Schools' || priv === 'Super Admin & School';
        return false;
      });
    }

    return list;
  }

  isCategoryAllowedForRole(categoryName, role) {
    if (!role || role === 'Super Admin' || !categoryName) return true;
    const cat = this.getCategories().find(c => c.name.toLowerCase().trim() === categoryName.toLowerCase().trim());
    if (!cat) return true;
    const priv = cat.privilege || 'All';
    if (priv === 'All') return true;
    if (role === 'Admin') return priv === 'Admin' || priv === 'Super Admin & Admin';
    if (role === 'School') return priv === 'School' || priv === 'Schools' || priv === 'Super Admin & School';
    return false;
  }

  checkDuplicateCategory(name) {
    if (!name) return false;
    const list = this.getCategories();
    return list.some(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
  }

  saveCategory(name, type, privilege = 'All', description = '') {
    const cleanName = name.trim();
    if (this.checkDuplicateCategory(cleanName)) {
      return { success: false, message: 'Category already exists.' };
    }

    const data = this.getData();
    if (!data.categories) data.categories = [...initialSeedData.categories];

    const newCat = {
      id: Date.now(),
      name: cleanName,
      type: type.toUpperCase(),
      privilege: privilege || 'All',
      description: description.trim()
    };

    data.categories.push(newCat);
    this.saveData(data);
    return { success: true, category: newCat, message: `Category '${cleanName}' created successfully.` };
  }

  updateCategory(id, name, type, privilege = 'All', description = '') {
    const cleanName = name.trim();
    const data = this.getData();
    if (!data.categories) data.categories = [...initialSeedData.categories];

    const idx = data.categories.findIndex(c => c.id === Number(id));
    if (idx === -1) {
      return { success: false, message: 'Category not found.' };
    }

    if (data.categories[idx].name.toLowerCase().trim() !== cleanName.toLowerCase()) {
      const dup = data.categories.some(c => c.id !== Number(id) && c.name.toLowerCase().trim() === cleanName.toLowerCase());
      if (dup) {
        return { success: false, message: 'Another category with this name already exists.' };
      }
    }

    data.categories[idx] = {
      ...data.categories[idx],
      name: cleanName,
      type: type.toUpperCase(),
      privilege: privilege || 'All',
      description: description.trim()
    };

    this.saveData(data);
    return { success: true, category: data.categories[idx], message: `Category '${cleanName}' updated successfully.` };
  }

  deleteCategory(id) {
    const data = this.getData();
    if (!data.categories) data.categories = [...initialSeedData.categories];

    const cat = data.categories.find(c => c.id === Number(id));
    if (!cat) {
      return { success: false, message: 'Category not found.' };
    }

    data.categories = data.categories.filter(c => c.id !== Number(id));
    this.saveData(data);
    return { success: true, message: `Category '${cat.name}' deleted successfully.` };
  }

  // --- Dynamic Calculators ---

  getSchools(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.schools.filter(s => s.id === Number(schoolId));
    }
    return data.schools;
  }

  getVehicles(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.vehicles.filter(v => v.schoolId === Number(schoolId));
    }
    return data.vehicles;
  }

  getTrips(schoolId = null) {
    const data = this.getData();
    let list = data.trips || [];
    if (schoolId) {
      list = list.filter(t => t.schoolId === Number(schoolId));
    }
    return list;
  }

  getRenewals(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.renewals.filter(r => r.schoolId === Number(schoolId));
    }
    return data.renewals;
  }

  getIncome(schoolId = null, role = null) {
    const data = this.getData();
    let list = data.income;
    if (schoolId) {
      list = list.filter(i => i.schoolId === Number(schoolId));
    }
    if (role && role !== 'Super Admin') {
      list = list.filter(i => this.isCategoryAllowedForRole(i.category, role));
    }
    return list;
  }

  getExpenses(schoolId = null, role = null) {
    const data = this.getData();
    let list = data.expenses;
    if (schoolId) {
      list = list.filter(e => e.schoolId === Number(schoolId));
    }
    if (role && role !== 'Super Admin') {
      list = list.filter(e => this.isCategoryAllowedForRole(e.category, role));
    }
    return list;
  }

  getDrivers(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.drivers.filter(d => d.schoolId === Number(schoolId));
    }
    return data.drivers;
  }

  getAttendants(schoolId = null) {
    const data = this.getData();
    let list = data.attendants || initialSeedData.attendants;
    if (schoolId) {
      list = list.filter(a => a.schoolId === Number(schoolId));
    }
    return list;
  }

  getRoutes(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.routes.filter(r => r.schoolId === Number(schoolId));
    }
    return data.routes;
  }

  // Dynamic Totals Calculation
  getTotalIncome(schoolId = null, role = null) {
    const incomeList = this.getIncome(schoolId, role);
    return incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }

  getTotalExpenses(schoolId = null, role = null) {
    const expenseList = this.getExpenses(schoolId, role);
    return expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }

  getTotalProfit(schoolId = null, role = null) {
    return this.getTotalIncome(schoolId, role) - this.getTotalExpenses(schoolId, role);
  }

  // --- Active Financial Year Operations ---
  getActiveYear() {
    const data = this.getData();
    if (!data.activeYear) {
      data.activeYear = '2026-2027';
      this.saveData(data);
    }
    return data.activeYear;
  }

  setActiveYear(year) {
    const data = this.getData();
    data.activeYear = year;
    if (!data.financialYears) data.financialYears = [];
    const fy = data.financialYears.find(y => y.year === year);
    if (fy) {
      data.financialYears.forEach(y => y.status = (y.year === year ? 'Active' : 'Inactive'));
    } else {
      data.financialYears.forEach(y => y.status = 'Inactive');
      data.financialYears.push({ id: Date.now(), year: year, status: 'Active' });
    }
    this.saveData(data);
    return { success: true, activeYear: year };
  }

  getFinancialYears() {
    const data = this.getData();
    if (!data.financialYears || !data.financialYears.length) {
      data.financialYears = [
        { id: 1, year: '2024-2025', status: 'Inactive' },
        { id: 2, year: '2025-2026', status: 'Inactive' },
        { id: 3, year: '2026-2027', status: 'Active' }
      ];
      data.activeYear = '2026-2027';
      this.saveData(data);
    }
    return data.financialYears;
  }

  saveFinancialYear(year, status = 'Active') {
    const data = this.getData();
    if (!data.financialYears) data.financialYears = [];
    const cleanYear = year.trim();
    if (status === 'Active') {
      data.financialYears.forEach(y => y.status = 'Inactive');
      data.activeYear = cleanYear;
    }
    const idx = data.financialYears.findIndex(y => y.year === cleanYear);
    if (idx !== -1) {
      data.financialYears[idx].status = status;
    } else {
      data.financialYears.push({ id: Date.now(), year: cleanYear, status });
    }
    this.saveData(data);
    return { success: true, year: cleanYear };
  }

  // --- School Bus Statement Operational Data Operations ---
  getBusWiseMonthlyReport(schoolId, vehicleId, routeId = null, reportingMonth) {
    const sId = Number(schoolId);
    const vId = Number(vehicleId);
    const month = String(reportingMonth || new Date().toISOString().slice(0, 7)).slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const monthStart = `${month}-01`;
    const nextMonthDate = new Date(year, monthNumber, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const vehicle = this.getVehicles(sId).find(v => Number(v.id) === vId);
    const school = this.getSchools().find(s => Number(s.id) === sId);
    if (!vehicle) throw new Error('Vehicle not found.');
    if (!school) throw new Error('School not found.');

    const routes = this.getRoutes(sId);
    const route = routes.find(r => Number(r.id) === Number(routeId)) || routes.find(r => Number(r.busId) === vId || r.routeCode === vehicle.routeNumber);
    const driver = this.getDrivers(sId).find(d => Number(d.busId) === vId || d.name === vehicle.driver);
    const attendant = this.getAttendants(sId).find(a => Number(a.busId) === vId || a.name === vehicle.attendant);
    const inMonth = row => String(row.date || '').slice(0, 10) >= monthStart && String(row.date || '').slice(0, 10) < nextMonth;
    const forBus = row => Number(row.busId || row.vehicleId) === vId && Number(row.schoolId) === sId;
    const trips = this.getTrips(sId).filter(t => forBus(t) && inMonth(t) && t.status !== 'Cancelled');
    const expenses = this.getExpenses(sId).filter(e => forBus(e) && inMonth(e));
    const incomeEntries = this.getIncome(sId).filter(i => forBus(i) && inMonth(i));
    const allOperational = this.getData().schoolOperationalData || [];
    const currentOp = allOperational.find(o => Number(o.vehicleId) === vId && String(o.statementDate || '').slice(0, 7) === month) || {};
    const previousOp = allOperational.filter(o => Number(o.vehicleId) === vId && String(o.statementDate || '').slice(0, 7) < month).sort((a, b) => String(b.statementDate).localeCompare(String(a.statementDate)))[0];
    const openingKm = Number(currentOp.openingKm ?? previousOp?.closingKm ?? vehicle.openingKm ?? 0);
    const tripType = t => String(t.tripType || 'School').toLowerCase();
    const schoolTrips = trips.filter(t => tripType(t) === 'school');
    const additionalTrips = trips.filter(t => tripType(t) === 'additional');
    const sum = (list, key) => list.reduce((total, row) => total + Number(row[key] || 0), 0);
    const schoolTripKm = Number(currentOp.schoolTripKm ?? sum(schoolTrips, 'distanceKm'));
    const additionalTripKm = Number(currentOp.additionalTripKm ?? sum(additionalTrips, 'distanceKm'));
    const totalKm = Number(currentOp.totalKm ?? schoolTripKm + additionalTripKm);
    const closingKm = Number(currentOp.closingKm ?? openingKm + totalKm);
    const fuelEntries = expenses.filter(e => /fuel|diesel|petrol/i.test(String(e.category || e.description || '')));
    const totalFuelLitres = Number(currentOp.totalFuelLitres ?? fuelEntries.reduce((total, e) => total + Number(e.litreQty ?? e.litreQuantity ?? e.quantity ?? e.litres ?? 0), 0));
    const fuelExpense = Number(currentOp.fuelExpense ?? sum(fuelEntries, 'amount'));
    const configuredMileage = parseFloat(String(vehicle.avgMileage || vehicle.averageMileage || vehicle.fuelEfficiency || '').replace(/[^0-9.]/g, '')) || 0;
    const averageMileage = Number(currentOp.avgMileage ?? (totalFuelLitres > 0 ? totalKm / totalFuelLitres : configuredMileage));
    const totalDiesel = Number(currentOp.totalDiesel ?? (averageMileage > 0 ? totalKm / averageMileage : totalFuelLitres));
    const expenseTotal = keywords => expenses.filter(e => keywords.some(k => String(e.category || '').toLowerCase().includes(k))).reduce((total, e) => total + Number(e.amount || 0), 0);
    const maintenanceExpense = Number(currentOp.maintenanceCost ?? currentOp.maintExpense ?? expenseTotal(['maintenance', 'repair', 'service']));
    const salaryExpense = Number(currentOp.salary ?? currentOp.salaryExpense ?? expenseTotal(['salary', 'driver', 'attendant', 'staff']));
    const hiringExpense = Number(currentOp.busHiringCharges ?? expenseTotal(['hiring', 'hire', 'rental']));
    const totalExpenseA = Number(currentOp.totalExpenseA ?? fuelExpense + maintenanceExpense + salaryExpense + hiringExpense);
    const isSchoolCollection = i => /school|student|transport|fee|collection/i.test(`${i.category || ''} ${i.type || ''} ${i.description || ''}`);
    const schoolTripIncome = Number(currentOp.schoolTripIncome ?? currentOp.studentCollection ?? sum(incomeEntries.filter(isSchoolCollection), 'amount'));
    const otherTripIncome = Number(currentOp.otherTripIncome ?? currentOp.otherCollection ?? sum(incomeEntries.filter(i => !isSchoolCollection(i)), 'amount'));
    const totalCollection = Number(currentOp.totalCollection ?? schoolTripIncome + otherTripIncome);
    const adminValue = (key, keywords) => Number(currentOp[key] ?? expenseTotal(keywords));
    const taxPerMonth = adminValue('bvbTaxPerMonth', ['tax']);
    const insurancePerMonth = adminValue('bvbInsurancePerMonth', ['insurance']);
    const fitnessExpense = adminValue('bvbFitnessExpense', ['fitness']);
    const gpsFee = adminValue('bvbGpsFee', ['gps']);
    const adminMaintenanceCost = adminValue('bvbMaintenanceCost', ['admin maintenance']);
    const speedTestFee = adminValue('bvbSpeedTestFee', ['speed test', 'speed governor']);
    const totalExpenseB = Number(currentOp.totalExpenseB ?? taxPerMonth + insurancePerMonth + fitnessExpense + gpsFee + adminMaintenanceCost + speedTestFee);
    const totalExpense = totalExpenseA + totalExpenseB;
    const surplusDeficit = totalCollection - totalExpense;
    return {
      ...currentOp,
      school, vehicle, route, driver, attendant, reportingMonth: month,
      openingKm, schoolTripKm, additionalTripKm, totalKm, closingKm, avgMileage: averageMileage, totalDiesel,
      fuelExpense, totalFuelLitres, maintenanceCost: maintenanceExpense, salary: salaryExpense, busHiringCharges: hiringExpense,
      totalExpenseA, schoolTripIncome, otherTripIncome, totalCollection,
      bvbTaxPerMonth: taxPerMonth, bvbInsurancePerMonth: insurancePerMonth, bvbFitnessExpense: fitnessExpense, bvbGpsFee: gpsFee, bvbMaintenanceCost: adminMaintenanceCost, bvbSpeedTestFee: speedTestFee, totalExpenseB, totalExpenseAB: totalExpense, surplusDeficit,
      report: { school, vehicle, route, driver, attendant, reportingMonth: month, kmDetails: { openingKm, schoolTripKm, additionalTripKm, totalKm, closingKm, averageMileage, totalFuelLitres, totalDiesel }, expensePartA: { fuelExpense, maintenanceExpense, salaryExpense, hiringExpense, totalExpenseA }, incomeCollection: { schoolTripIncome, otherTripIncome, totalCollection }, adminPartB: { taxPerMonth, insurancePerMonth, fitnessExpense, gpsFee, adminMaintenanceCost, speedTestFee, totalExpenseB }, financialSummary: { totalExpense, totalCollection, surplusDeficit } }
    };
  }

  getSchoolOperationalData(vehicleId, statementDate = null) {
    const data = this.getData();
    if (!data.schoolOperationalData) data.schoolOperationalData = [];

    const numVehicleId = Number(vehicleId);

    // Normalize statementDate key (can be YYYY-MM or YYYY-MM-DD)
    const monthPrefix = statementDate ? statementDate.slice(0, 7) : null;

    // Real calculations from common db with intelligent auto-fetching
    const vehicles = this.getVehicles();
    const v = vehicles.find(veh => veh.id === numVehicleId);

    const schoolId = v ? v.schoolId : 1;
    // Reports are always scoped to the requested month and vehicle.  Do not
    // spread a school-wide transaction across every bus: transactions without
    // a vehicle assignment remain available for school-level reports only.
    const inReportingMonth = (record) => !monthPrefix || String(record.date || '').slice(0, 7) === monthPrefix;
    const isForVehicle = (record) => Number(record.busId) === numVehicleId || Number(record.vehicleId) === numVehicleId;
    const vehicleIncomes = this.getIncome(schoolId).filter(inc => isForVehicle(inc) && inReportingMonth(inc));
    const vehicleExpenses = this.getExpenses(schoolId).filter(exp => isForVehicle(exp) && inReportingMonth(exp));
    const vehicleTrips = this.getTrips(schoolId).filter(trip =>
      Number(trip.busId) === numVehicleId && inReportingMonth(trip) && trip.status !== 'Cancelled'
    );
    const tripKm = (type) => vehicleTrips
      .filter(trip => (trip.tripType || 'School').toLowerCase() === type)
      .reduce((sum, trip) => sum + Number(trip.distanceKm || 0), 0);

    const dbSchoolIncomeSum = vehicleIncomes.filter(i => (i.category || '').toLowerCase().includes('school') || (i.category || '').toLowerCase().includes('transport') || (i.category || '').toLowerCase().includes('fee') || (i.description || '').toLowerCase().includes('school')).reduce((s, i) => s + Number(i.amount || 0), 0);
    const dbOtherIncomeSum = vehicleIncomes.filter(i => !(i.category || '').toLowerCase().includes('school') && !(i.category || '').toLowerCase().includes('transport') && !(i.description || '').toLowerCase().includes('school')).reduce((s, i) => s + Number(i.amount || 0), 0);

    const dbFuelExpenseSum = vehicleExpenses.filter(e => (e.category || '').toLowerCase().includes('fuel')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const dbMaintExpenseSum = vehicleExpenses.filter(e => (e.category || '').toLowerCase().includes('mainten') || (e.category || '').toLowerCase().includes('repair')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const dbSalarySum = vehicleExpenses.filter(e => (e.category || '').toLowerCase().includes('salary') || (e.category || '').toLowerCase().includes('driver')).reduce((s, e) => s + Number(e.amount || 0), 0);
    const dbHiringSum = vehicleExpenses.filter(e => (e.category || '').toLowerCase().includes('hiring') || (e.category || '').toLowerCase().includes('hire') || (e.category || '').toLowerCase().includes('permit')).reduce((s, e) => s + Number(e.amount || 0), 0);

    const existing = data.schoolOperationalData.find(d => {
      if (Number(d.vehicleId) !== numVehicleId) return false;
      if (!statementDate) return true;
      if (d.statementDate === statementDate) return true;
      if (monthPrefix && d.statementDate && d.statementDate.startsWith(monthPrefix)) return true;
      return false;
    });
    
    if (existing) {
      const fuelExpense = (existing.fuelExpense || 0) > 0 ? existing.fuelExpense : dbFuelExpenseSum;
      const maintenanceCost = (existing.maintenanceCost || existing.maintExpense || 0) > 0 ? (existing.maintenanceCost || existing.maintExpense) : dbMaintExpenseSum;
      const salary = (existing.salary || existing.salaryExpense || 0) > 0 ? (existing.salary || existing.salaryExpense) : dbSalarySum;
      const busHiringCharges = (existing.busHiringCharges || 0) > 0 ? existing.busHiringCharges : dbHiringSum;
      const totalExpenseA = fuelExpense + maintenanceCost + salary + busHiringCharges;

      const schoolTripIncome = (existing.schoolTripIncome || existing.studentCollection || 0) > 0 ? (existing.schoolTripIncome || existing.studentCollection) : dbSchoolIncomeSum;
      const otherTripIncome = (existing.otherTripIncome || existing.otherCollection || 0) > 0 ? (existing.otherTripIncome || existing.otherCollection) : dbOtherIncomeSum;
      const totalCollection = schoolTripIncome + otherTripIncome;

      const totalExpenseB = Number(existing.totalExpenseB || 0);
      const totalExpenseAB = totalExpenseA + totalExpenseB;
      const surplusDeficit = totalCollection - totalExpenseAB;

      return {
        ...existing,
        fuelExpense,
        maintenanceCost,
        salary,
        busHiringCharges,
        totalExpenseA,
        schoolTripIncome,
        otherTripIncome,
        totalCollection,
        totalExpenseAB,
        surplusDeficit
      };
    }

    // Check for previous saved operational entries for this vehicle to carry forward Closing KM -> Opening KM!
    const previousEntries = data.schoolOperationalData
      .filter(d => Number(d.vehicleId) === numVehicleId && (!monthPrefix || (d.statementDate || '').slice(0, 7) < monthPrefix))
      .sort((a, b) => (b.statementDate || '').localeCompare(a.statementDate || ''));
    
    const previousClosingKm = (previousEntries.length > 0 && previousEntries[0].closingKm !== undefined) ? previousEntries[0].closingKm : null;

    const openingKm = previousClosingKm !== null ? previousClosingKm : (v ? Number(v.openingKm || 0) : 0);
    // Completed/scheduled trip logs can supply distance automatically; the
    // operational entry remains the report-specific editable override.
    const additionalTripKm = tripKm('additional');
    const schoolTripKm = tripKm('school');
    const totalKm = additionalTripKm + schoolTripKm;
    const closingKm = openingKm + totalKm;
    const avgMileage = v ? (parseFloat(v.avgMileage || v.fuelEfficiency) || 4.97) : 4.97;
    const totalDiesel = (avgMileage > 0 && totalKm > 0) ? Number((totalKm / avgMileage).toFixed(2)) : 0;

    const fuelExpense = dbFuelExpenseSum;
    const maintenanceCost = dbMaintExpenseSum;
    const salary = dbSalarySum;
    const noOfBusHired = 0;
    const busHiringCharges = dbHiringSum;
    const totalExpenseA = fuelExpense + maintenanceCost + salary + busHiringCharges;

    const schoolTripIncome = dbSchoolIncomeSum;
    const otherTripIncome = dbOtherIncomeSum;
    const totalCollection = schoolTripIncome + otherTripIncome;

    const bvbTaxPerMonth = 0;
    const bvbInsurancePerMonth = 0;
    const bvbFitnessExpense = 0;
    const bvbGpsFee = 0;
    const bvbMaintenanceCost = 0;
    const bvbSpeedTestFee = 0;
    const totalExpenseB = bvbTaxPerMonth + bvbInsurancePerMonth + bvbFitnessExpense + bvbGpsFee + bvbMaintenanceCost + bvbSpeedTestFee;

    const totalExpenseAB = totalExpenseA + totalExpenseB;
    const surplusDeficit = totalCollection - totalExpenseAB;

    return {
      vehicleId: numVehicleId,
      schoolId: v ? v.schoolId : 1,
      statementDate: statementDate || new Date().toISOString().split('T')[0],
      openingKm,
      additionalTripKm,
      schoolTripKm,
      closingKm,
      totalKm,
      avgMileage,
      totalDiesel,
      fuelExpense,
      maintenanceCost,
      salary,
      hiredDriver: v ? (v.hiredDriver || 'NA') : 'NA',
      noOfBusHired,
      busHiringCharges,
      totalExpenseA,
      schoolTripIncome,
      otherTripIncome,
      totalCollection,
      bvbTaxPerMonth,
      bvbInsurancePerMonth,
      bvbFitnessExpense,
      bvbGpsFee,
      bvbMaintenanceCost,
      bvbSpeedTestFee,
      totalExpenseB,
      totalExpenseAB,
      surplusDeficit
    };
  }

  saveSchoolOperationalData(vehicleId, statementDate, opData) {
    const data = this.getData();
    if (!data.schoolOperationalData) data.schoolOperationalData = [];

    const numVehicleId = Number(vehicleId);
    
    // Sanitize existing records to ensure vehicleId and schoolId are numbers
    data.schoolOperationalData = data.schoolOperationalData.map(d => ({
      ...d,
      vehicleId: Number(d.vehicleId),
      schoolId: d.schoolId ? Number(d.schoolId) : undefined
    }));

    const idx = data.schoolOperationalData.findIndex(d => d.vehicleId === numVehicleId && d.statementDate === statementDate);

    const payload = {
      ...opData,
      vehicleId: numVehicleId,
      statementDate: statementDate || new Date().toISOString().split('T')[0]
    };

    if (idx !== -1) {
      data.schoolOperationalData.splice(idx, 1, payload);
    } else {
      data.schoolOperationalData.push(payload);
    }

    this.saveData(data);
    return { success: true, data: payload };
  }

  getSchoolOperationalDataList(schoolId = null) {
    const data = this.getData();
    let list = data.schoolOperationalData || [];
    if (schoolId) {
      list = list.filter(d => d.schoolId === Number(schoolId));
    }
    return list;
  }

  // --- Statement History Operations ---
  getSchoolStatements(schoolId = null) {
    const data = this.getData();
    let list = data.statements || [];
    if (schoolId) {
      list = list.filter(s => s.schoolId === Number(schoolId));
    }
    return list;
  }

  saveSchoolStatement(statementObj) {
    const data = this.getData();
    if (!data.statements) data.statements = [];

    const existingIdx = data.statements.findIndex(s => s.id === statementObj.id);
    if (existingIdx !== -1) {
      data.statements.splice(existingIdx, 1, statementObj);
    } else {
      data.statements.unshift(statementObj);
    }

    this.saveData(data);
    return { success: true, statement: statementObj };
  }

  updateStatementStatus(id, newStatus) {
    const data = this.getData();
    if (!data.statements) return;

    const stmt = data.statements.find(s => s.id === Number(id));
    if (stmt) {
      stmt.status = newStatus;
      this.saveData(data);
    }
  }

  deleteSchoolStatement(id) {
    const data = this.getData();
    if (!data.statements) return;

    data.statements = data.statements.filter(s => s.id !== Number(id));
    this.saveData(data);
  }

  // --- Report Builder Custom Configuration Operations ---
  getDefaultReportConfig() {
    return {
      headerConfig: {
        title: '',
        subtitle: 'SCHOOL BUS STATEMENT — REPORT TEMPLATE PREVIEW'
      },
      footerConfig: {
        footerLeft: 'VMS PRO | Powered By SparkIT Techno Solutions Pvt. Ltd.',
        footerMiddle: '{schoolName}',
        footerRight: '{page}'
      },
      modules: [
        {
          id: 'sec_vehicle_details',
          key: 'vehicle_details',
          title: '1. VEHICLE DETAILS',
          visible: true,
          labels: {
            busNumber: 'Bus Number',
            regNumber: 'Reg. No',
            make: 'Make',
            seatingCapacity: 'Seating Capacity',
            studentsCount: 'Total Number of students',
            routeNumber: 'Route Number',
            route: 'Route',
            driver: 'Driver Name',
            hiredDriver: 'Hired Driver Name',
            attendant: 'Attendant Name'
          }
        },
        {
          id: 'sec_km_trip_details',
          key: 'km_trip_details',
          title: '2. KM / TRIP DETAILS',
          visible: true,
          labels: {
            openingKm: 'Opening KM',
            additionalTripKm: 'Additional Trip KM',
            schoolTripKm: 'School Trip KM',
            closingKm: 'Closing KM',
            totalKm: 'Total KM',
            avgMileage: 'Average Mileage',
            totalDiesel: 'Total Diesel'
          }
        },
        {
          id: 'sec_expense_part_a',
          key: 'expense_part_a',
          title: '3. EXPENSE SECTION (PART A)',
          visible: true,
          labels: {
            fuel: 'Fuel Expense',
            maintenance: 'Maintenance Cost (petty cash)',
            salary: 'Salary of Driver and Attender',
            busesHired: 'No. of Bus hired',
            busHiringCharges: 'Total Bus Hiring charges',
            totalExpenseA: 'Total Expense (A)'
          }
        },
        {
          id: 'sec_income_collection',
          key: 'income_collection',
          title: '4. INCOME / COLLECTION SECTION',
          visible: true,
          labels: {
            studentCollection: 'Fee collection - School Trips',
            otherCollection: 'Fee collection - Other Trips',
            totalCollection: 'Total Collection'
          }
        },
        {
          id: 'sec_part_b_bvb',
          key: 'part_b_bvb',
          title: '5. PART B — BVB',
          visible: true,
          labels: {
            taxPerMonth: 'Tax Per Month',
            insurancePerMonth: 'Insurance Per Month',
            fitnessTest: 'Fitness Test Expense',
            gpsFee: 'GPS fee',
            maintenanceCost: 'Maintenance Cost',
            speedTestFee: 'Speed Test fee',
            totalBvb: 'Total Expense (B)'
          }
        },
        {
          id: 'sec_financial_summary',
          key: 'financial_summary',
          title: '6. FINAL FINANCIAL STATEMENT SUMMARY',
          visible: true,
          labels: {
            totalExpA: 'Total Expense (A)',
            totalExpB: 'Total Expense (B)',
            totalExpAB: 'Total Expense (A+B)',
            totalCollection: 'Total Collection',
            financialResult: 'SURPLUS/DEFICIT'
          }
        },
        {
          id: 'sec_verification_signatures',
          key: 'verification_signatures',
          title: '7. VERIFICATION & SIGNATURES',
          visible: true,
          labels: {
            preparedBy: 'Prepared By',
            verifiedBy: 'Verified By',
            principalSignature: 'PRINCIPAL',
            dateLabel: 'Date'
          }
        }
      ]
    };
  }

  getSchoolReportConfig(schoolId) {
    const data = this.getData();
    if (!data.reportConfigs) data.reportConfigs = {};
    const sId = Number(schoolId);
    if (data.reportConfigs[sId] && data.reportConfigs[sId].modules && data.reportConfigs[sId].modules.length > 0) {
      return JSON.parse(JSON.stringify(data.reportConfigs[sId]));
    }
    return this.getDefaultReportConfig();
  }

  saveSchoolReportConfig(schoolId, config) {
    const data = this.getData();
    if (!data.reportConfigs) data.reportConfigs = {};
    const sId = Number(schoolId);
    data.reportConfigs[sId] = JSON.parse(JSON.stringify(config));
    this.saveData(data);
    return { success: true, schoolId: sId, config: data.reportConfigs[sId] };
  }

  resetSchoolReportConfig(schoolId) {
    const data = this.getData();
    const sId = Number(schoolId);
    if (data.reportConfigs && Object.prototype.hasOwnProperty.call(data.reportConfigs, sId)) {
      const { [sId]: _removed, ...remaining } = data.reportConfigs;
      data.reportConfigs = remaining;
      this.saveData(data);
    }
    return this.getDefaultReportConfig();
  }
}

window.db = new DataStore();
