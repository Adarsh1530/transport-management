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

  vehicles: [
    { id: 1, busNo: "KL-01-AB-1234", schoolId: 1, type: "School Bus (50 Seater)", driver: "Arun Kumar", regDate: "2021-04-12", status: "Active" },
    { id: 2, busNo: "KL-01-CD-4521", schoolId: 1, type: "Mini Bus (30 Seater)", driver: "Rahul Raj", regDate: "2022-01-18", status: "Active" },
    { id: 3, busNo: "KL-01-EF-8890", schoolId: 1, type: "School Bus (50 Seater)", driver: "Vipin Das", regDate: "2020-08-05", status: "Active" },
    { id: 4, busNo: "KL-01-GH-3341", schoolId: 1, type: "Van (14 Seater)", driver: "Anil Varghese", regDate: "2023-03-22", status: "Maintenance" },

    { id: 5, busNo: "KL-02-AB-5512", schoolId: 2, type: "School Bus (50 Seater)", driver: "Suresh Pillai", regDate: "2021-06-14", status: "Active" },
    { id: 6, busNo: "KL-02-CD-6632", schoolId: 2, type: "Mini Bus (32 Seater)", driver: "Deepak Nair", regDate: "2022-09-10", status: "Active" },
    { id: 7, busNo: "KL-02-EF-7741", schoolId: 2, type: "School Bus (45 Seater)", driver: "Manoj Mohan", regDate: "2019-11-28", status: "Active" },

    { id: 8, busNo: "KL-07-AB-9921", schoolId: 3, type: "Heavy Bus (60 Seater)", driver: "Rajesh K", regDate: "2020-02-15", status: "Active" },
    { id: 9, busNo: "KL-07-CD-1102", schoolId: 3, type: "School Bus (50 Seater)", driver: "Sunil Dutt", regDate: "2022-05-19", status: "Active" },
    { id: 10, busNo: "KL-07-EF-4433", schoolId: 3, type: "Mini Bus (26 Seater)", driver: "Gokul Prasad", regDate: "2023-01-10", status: "Active" },
    { id: 11, busNo: "KL-07-GH-8877", schoolId: 3, type: "School Bus (50 Seater)", driver: "Biju Thomas", regDate: "2021-12-01", status: "Maintenance" },

    { id: 12, busNo: "KL-04-AB-3321", schoolId: 4, type: "School Bus (50 Seater)", driver: "Nikhil George", regDate: "2020-07-11", status: "Active" },
    { id: 13, busNo: "KL-04-CD-1298", schoolId: 4, type: "Mini Bus (30 Seater)", driver: "Shabu Alex", regDate: "2022-10-04", status: "Active" },
    { id: 14, busNo: "KL-04-EF-7788", schoolId: 4, type: "Van (16 Seater)", driver: "Vineeth V", regDate: "2023-04-18", status: "Active" },

    { id: 15, busNo: "KL-05-AB-4455", schoolId: 5, type: "School Bus (48 Seater)", driver: "Shaji Mathew", regDate: "2021-09-09", status: "Active" },
    { id: 16, busNo: "KL-05-CD-9900", schoolId: 5, type: "Mini Bus (28 Seater)", driver: "Sanju Samson", regDate: "2022-08-30", status: "Active" }
  ],

  renewals: [
    // Today is set around Aug 2026 for testing variety of date diffs
    { id: 1, vehicleId: 1, schoolId: 1, type: "Insurance", renewalDate: "2026-08-15" },
    { id: 2, vehicleId: 2, schoolId: 1, type: "Pollution", renewalDate: "2026-08-08" }, // Due Today
    { id: 3, vehicleId: 3, schoolId: 1, type: "Fitness", renewalDate: "2026-08-02" }, // Expired
    { id: 4, vehicleId: 4, schoolId: 1, type: "Service", renewalDate: "2026-08-25" },

    { id: 5, vehicleId: 5, schoolId: 2, type: "Pollution", renewalDate: "2026-08-12" }, // 4 Days Left
    { id: 6, vehicleId: 6, schoolId: 2, type: "Permit", renewalDate: "2026-09-05" },
    { id: 7, vehicleId: 7, schoolId: 2, type: "Service", renewalDate: "2026-08-01" }, // Expired

    { id: 8, vehicleId: 8, schoolId: 3, type: "Insurance", renewalDate: "2026-08-17" }, // 9 Days Left
    { id: 9, vehicleId: 9, schoolId: 3, type: "Tax", renewalDate: "2026-09-10" },
    { id: 10, vehicleId: 10, schoolId: 3, type: "Pollution", renewalDate: "2026-08-30" },
    { id: 11, vehicleId: 11, schoolId: 3, type: "Registration", renewalDate: "2026-10-15" },

    { id: 12, vehicleId: 12, schoolId: 4, type: "Fitness", renewalDate: "2026-08-08" }, // Due Today
    { id: 13, vehicleId: 13, schoolId: 4, type: "Pollution", renewalDate: "2026-09-25" },
    { id: 14, vehicleId: 14, schoolId: 4, type: "Service", renewalDate: "2026-08-14" },

    { id: 15, vehicleId: 15, schoolId: 5, type: "Insurance", renewalDate: "2026-08-11" }, // 3 Days Left
    { id: 16, vehicleId: 16, schoolId: 5, type: "Permit", renewalDate: "2026-09-18" }
  ],

  income: [
    { id: 1, schoolId: 1, date: "2026-08-01", category: "Monthly Fee", description: "Term 2 Transport Fee Collection", amount: 320000 },
    { id: 2, schoolId: 1, date: "2026-08-05", category: "Annual Transport Fee", description: "New Admission Transport Reg", amount: 200000 },

    { id: 3, schoolId: 2, date: "2026-08-02", category: "Monthly Fee", description: "August Bus Pass Fee", amount: 260000 },
    { id: 4, schoolId: 2, date: "2026-08-06", category: "Transport Fee", description: "Excursion Special Transport", amount: 150000 },

    { id: 5, schoolId: 3, date: "2026-08-01", category: "Monthly Fee", description: "August Monthly Transport Charges", amount: 410000 },
    { id: 6, schoolId: 3, date: "2026-08-04", category: "Annual Transport Fee", description: "Senior Secondary Fleet Fee", amount: 220000 },

    { id: 7, schoolId: 4, date: "2026-08-03", category: "Monthly Fee", description: "Alappuzha Route Transport Collection", amount: 310000 },
    { id: 8, schoolId: 4, date: "2026-08-07", category: "Other Income", description: "Old Spare Parts Sale", amount: 160000 },

    { id: 9, schoolId: 5, date: "2026-08-02", category: "Monthly Fee", description: "Primary Wing Transport Fee", amount: 295000 },
    { id: 10, schoolId: 5, date: "2026-08-05", category: "Annual Transport Fee", description: "Kottayam District Bus Pass", amount: 160000 }
  ],

  expenses: [
    { id: 1, schoolId: 1, date: "2026-08-02", category: "Fuel", description: "Diesel Refill - Fleet 1 & 2", amount: 140000 },
    { id: 2, schoolId: 1, date: "2026-08-05", category: "Driver Salary", description: "Monthly Drivers & Helpers Pay", amount: 110000 },
    { id: 3, schoolId: 1, date: "2026-08-06", category: "Maintenance", description: "Brake Pad & Tyre Replacement (Bus KL-01-GH-3341)", amount: 60000 },

    { id: 4, schoolId: 2, date: "2026-08-03", category: "Fuel", description: "Kollam Central Fuel Depot Pay", amount: 110000 },
    { id: 5, schoolId: 2, date: "2026-08-05", category: "Driver Salary", description: "August Driver Compensation", amount: 90000 },
    { id: 6, schoolId: 2, date: "2026-08-07", category: "Insurance", description: "Annual Fleet Insurance Renewal", amount: 40000 },

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
    { id: 1, name: "Arun Kumar", license: "KL01-20150098471", phone: "+91 98471 00112", busId: 1, schoolId: 1, expiry: "2028-11-20", status: "Active" },
    { id: 2, name: "Rahul Raj", license: "KL01-20170044512", phone: "+91 98472 11223", busId: 2, schoolId: 1, expiry: "2027-04-15", status: "Active" },
    { id: 3, name: "Vipin Das", license: "KL01-20180099234", phone: "+91 98473 22334", busId: 3, schoolId: 1, expiry: "2029-01-10", status: "Active" },
    { id: 4, name: "Anil Varghese", license: "KL01-20160033129", phone: "+91 98474 33445", busId: 4, schoolId: 1, expiry: "2026-12-05", status: "Active" },

    { id: 5, name: "Suresh Pillai", license: "KL02-20140088123", phone: "+91 94471 99887", busId: 5, schoolId: 2, expiry: "2027-09-30", status: "Active" },
    { id: 6, name: "Deepak Nair", license: "KL02-20190011245", phone: "+91 94472 88776", busId: 6, schoolId: 2, expiry: "2028-06-18", status: "Active" },
    { id: 7, name: "Manoj Mohan", license: "KL02-20160055432", phone: "+91 94473 77665", busId: 7, schoolId: 2, expiry: "2026-11-22", status: "Active" },

    { id: 8, name: "Rajesh K", license: "KL07-20130099881", phone: "+91 98952 11009", busId: 8, schoolId: 3, expiry: "2027-07-14", status: "Active" },
    { id: 9, name: "Sunil Dutt", license: "KL07-20180044321", phone: "+91 98953 22110", busId: 9, schoolId: 3, expiry: "2029-03-25", status: "Active" },
    { id: 10, name: "Gokul Prasad", license: "KL07-20200088765", phone: "+91 98954 33221", busId: 10, schoolId: 3, expiry: "2030-05-12", status: "Active" },
    { id: 11, name: "Biju Thomas", license: "KL07-20150022334", phone: "+91 98955 44332", busId: 11, schoolId: 3, expiry: "2026-10-08", status: "Active" },

    { id: 12, name: "Nikhil George", license: "KL04-20170066543", phone: "+91 97443 66554", busId: 12, schoolId: 4, expiry: "2028-02-28", status: "Active" },
    { id: 13, name: "Shabu Alex", license: "KL04-20190033221", phone: "+91 97444 55443", busId: 13, schoolId: 4, expiry: "2027-10-15", status: "Active" },
    { id: 14, name: "Vineeth V", license: "KL04-20210088990", phone: "+91 97445 44332", busId: 14, schoolId: 4, expiry: "2031-08-01", status: "Active" },

    { id: 15, name: "Shaji Mathew", license: "KL05-20150011998", phone: "+91 94964 11223", busId: 15, schoolId: 5, expiry: "2027-05-20", status: "Active" },
    { id: 16, name: "Sanju Samson", license: "KL05-20180077665", phone: "+91 94965 22334", busId: 16, schoolId: 5, expiry: "2029-09-12", status: "Active" }
  ],

  routes: [
    { id: 1, routeCode: "R-01", name: "Kazhakkoottam → School Campus", schoolId: 1, start: "Kazhakkoottam Junction", destination: "GVPS Campus", stops: 8, busId: 1, driverId: 1, status: "Active" },
    { id: 2, routeCode: "R-02", name: "Pattom → School Campus", schoolId: 1, start: "Pattom Palace", destination: "GVPS Campus", stops: 6, busId: 2, driverId: 2, status: "Active" },
    { id: 3, routeCode: "R-03", name: "Kollam Beach → St. Mary's Campus", schoolId: 2, start: "Kollam Beach Road", destination: "St. Mary's Main Gate", stops: 10, busId: 5, driverId: 5, status: "Active" },
    { id: 4, routeCode: "R-04", name: "Edappally → Bright Future Campus", schoolId: 3, start: "Edappally Toll", destination: "BFS Campus", stops: 12, busId: 8, driverId: 8, status: "Active" },
    { id: 5, routeCode: "R-05", name: "Alappuzha Town → Sunrise Campus", schoolId: 4, start: "Alappuzha KSRTC Bus Stand", destination: "Sunrise Campus", stops: 7, busId: 12, driverId: 12, status: "Active" },
    { id: 6, routeCode: "R-06", name: "Ettumanoor → Little Stars Campus", schoolId: 5, start: "Ettumanoor Temple", destination: "Little Stars Campus", stops: 9, busId: 15, driverId: 15, status: "Active" }
  ],

  trips: [
    { id: 1, tripId: "TRIP-101", date: "2026-08-08", busId: 1, schoolId: 1, routeId: 1, driverId: 1, startTime: "07:30 AM", endTime: "08:25 AM", status: "Completed" },
    { id: 2, tripId: "TRIP-102", date: "2026-08-08", busId: 2, schoolId: 1, routeId: 2, driverId: 2, startTime: "07:45 AM", endTime: "08:35 AM", status: "Running" },
    { id: 3, tripId: "TRIP-103", date: "2026-08-08", busId: 5, schoolId: 2, routeId: 3, driverId: 5, startTime: "07:20 AM", endTime: "08:15 AM", status: "Completed" },
    { id: 4, tripId: "TRIP-104", date: "2026-08-08", busId: 8, schoolId: 3, routeId: 4, driverId: 8, startTime: "07:15 AM", endTime: "08:30 AM", status: "Running" },
    { id: 5, tripId: "TRIP-105", date: "2026-08-08", busId: 12, schoolId: 4, routeId: 5, driverId: 12, startTime: "03:30 PM", endTime: "04:30 PM", status: "Scheduled" },
    { id: 6, tripId: "TRIP-106", date: "2026-08-08", busId: 15, schoolId: 5, routeId: 6, driverId: 15, startTime: "03:45 PM", endTime: "04:45 PM", status: "Scheduled" }
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
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialSeedData;
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

  getRenewals(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.renewals.filter(r => r.schoolId === Number(schoolId));
    }
    return data.renewals;
  }

  getIncome(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.income.filter(i => i.schoolId === Number(schoolId));
    }
    return data.income;
  }

  getExpenses(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.expenses.filter(e => e.schoolId === Number(schoolId));
    }
    return data.expenses;
  }

  getDrivers(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.drivers.filter(d => d.schoolId === Number(schoolId));
    }
    return data.drivers;
  }

  getRoutes(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.routes.filter(r => r.schoolId === Number(schoolId));
    }
    return data.routes;
  }

  getTrips(schoolId = null) {
    const data = this.getData();
    if (schoolId) {
      return data.trips.filter(t => t.schoolId === Number(schoolId));
    }
    return data.trips;
  }

  // Dynamic Totals Calculation
  getTotalIncome(schoolId = null) {
    const incomeList = this.getIncome(schoolId);
    return incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }

  getTotalExpenses(schoolId = null) {
    const expenseList = this.getExpenses(schoolId);
    return expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }

  getTotalProfit(schoolId = null) {
    return this.getTotalIncome(schoolId) - this.getTotalExpenses(schoolId);
  }
}

window.db = new DataStore();
