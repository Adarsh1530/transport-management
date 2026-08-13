/* ==========================================
   SCHOOL ENTRY & OPERATIONAL DATA MODULE
   ========================================== */

let currentEntrySchoolId = null;
let currentEntryVehicleId = null;
let schoolEntryLiveSyncTimer = null;

function cleanReportLabelText(value) {
  return String(value || '').replace(/\s*\(10 Months\)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();
}

function renderSchoolEntryPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('school-entry-view');
  if (!container || !user) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = isSchoolUser ? user.schoolId : (currentEntrySchoolId || 1);
  const schools = window.db.getSchools(isSchoolUser ? user.schoolId : null);
  const vehicles = window.db.getVehicles(schoolId);

  if (!currentEntryVehicleId && vehicles.length > 0) {
    currentEntryVehicleId = vehicles[0].id;
  } else if (vehicles.length > 0 && !vehicles.some(v => v.id === currentEntryVehicleId)) {
    currentEntryVehicleId = vehicles[0].id;
  }

  const activeVehicle = vehicles.find(v => v.id === currentEntryVehicleId) || vehicles[0];
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = document.getElementById('entry-month-select')?.value || defaultMonthStr;
  const statementDateVal = `${selectedMonth}-01`;

  // Retrieve existing operational data or fallback to defaults (carries forward previous closing KM -> opening KM!)
  const opData = window.db.getSchoolOperationalData(activeVehicle ? activeVehicle.id : null, statementDateVal);

  const routes = window.db.getRoutes(schoolId);
  const drivers = window.db.getDrivers(schoolId);
  const attendants = window.db.getAttendants(schoolId);

  const routeObj = activeVehicle ? routes.find(r => r.busId === activeVehicle.id || r.routeCode === activeVehicle.routeNumber) : null;
  const driverObj = activeVehicle ? drivers.find(d => d.busId === activeVehicle.id || d.name === activeVehicle.driver) : null;
  const attendantObj = activeVehicle ? attendants.find(a => a.busId === activeVehicle.id || a.name === activeVehicle.attendant) : null;

  const busNumberStr = activeVehicle ? (activeVehicle.busNo ? (activeVehicle.busNo.replace(/\D/g, '').slice(-2) || String(activeVehicle.id)) : String(activeVehicle.id)) : '01';
  const regNoStr = activeVehicle ? activeVehicle.busNo : 'KL-01-AB-1234';
  const makeStr = activeVehicle ? (activeVehicle.manufacturer || activeVehicle.model || 'Ashok Leyland 2022') : 'Ashok Leyland 2022';
  const seatingCapacityStr = activeVehicle ? (activeVehicle.seats || 50) : 50;
  const studentsCountStr = routeObj ? (routeObj.studentsCount || 42) : (activeVehicle ? (activeVehicle.studentsCount || 42) : 42);
  const routeNumberStr = routeObj ? routeObj.routeCode : (activeVehicle ? (activeVehicle.routeNumber || 'R-01') : 'R-01');
  const routeDetailsStr = routeObj ? `${routeObj.start || 'Start'} - ${routeObj.destination || 'End'}` : 'Local School Route';
  const driverNameStr = driverObj ? driverObj.name : (activeVehicle ? (activeVehicle.driver || 'Unassigned') : 'Unassigned');
  const attendantNameStr = attendantObj ? attendantObj.name : (activeVehicle ? (activeVehicle.attendant || 'Unassigned') : 'Unassigned');
  const hiredDriverStr = (opData && opData.hiredDriver && opData.hiredDriver !== 'NA') ? opData.hiredDriver : (activeVehicle ? (activeVehicle.hiredDriver || 'NA') : 'NA');

  // Retrieve Report Card Settings privileges for current school
  const reportConfig = window.db.getSchoolReportConfig(schoolId);
  const activeModules = reportConfig ? (reportConfig.modules || []) : [];

  const getModuleLabels = (key) => {
    const mod = activeModules.find(m => m.key === key);
    const labels = mod ? (mod.labels || {}) : {};
    return Object.fromEntries(
      Object.entries(labels).map(([labelKey, labelValue]) => [labelKey, cleanReportLabelText(labelValue)])
    );
  };

  const kmLabels = getModuleLabels('km_trip_details');
  const expLabels = getModuleLabels('expense_part_a');
  const incLabels = getModuleLabels('income_collection');
  const partBLabels = getModuleLabels('part_b_bvb');

  const canSec1 = window.auth.hasPermission('school_entry_sec1');
  const canSec2 = window.auth.hasPermission('school_entry_sec2');
  const canSec3 = window.auth.hasPermission('school_entry_sec3');
  const canSec4 = window.auth.hasPermission('school_entry_sec4');

  container.innerHTML = `
    <div class="card" style="padding: 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-pen-to-square" style="color: var(--color-income);"></i>
          School Transport Operational Entry & Month-Wise Duration Logs
        </h3>
        <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
          Record month-wise operational metrics, bus specifications, expenses, collections, and BVB admin parameters.
        </p>
      </div>

      <!-- Controls & Selectors Bar -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        ${!isSchoolUser ? `
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Select School Campus *</label>
            <select id="entry-school-id" class="form-control" onchange="onSchoolEntrySchoolChange(this.value)">
              ${schools.map(s => `<option value="${s.id}" ${s.id === schoolId ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
            </select>
          </div>
        ` : `
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Assigned School Campus</label>
            <input type="text" class="form-control" readonly value="${escapeHTML(user.schoolName)}" style="background: #f1f5f9; font-weight: 600;">
            <input type="hidden" id="entry-school-id" value="${user.schoolId}">
          </div>
        `}

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Select Vehicle / Bus *</label>
          <select id="entry-vehicle-id" class="form-control" onchange="onSchoolEntryVehicleChange(this.value)">
            ${vehicles.map(v => `<option value="${v.id}" ${activeVehicle && v.id === activeVehicle.id ? 'selected' : ''}>${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Month Selection *</label>
          <input type="month" id="entry-month-select" class="form-control" value="${selectedMonth}" onchange="renderSchoolEntryPage()">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Active Year Period</label>
          <input type="text" class="form-control" readonly value="${selectedMonth.split('-')[0]} (1-Month Period)" style="background: #f1f5f9; font-weight: 600;">
        </div>
      </div>

      <!-- Form Grid with Merged Vehicle Specs, Personnel & KM / Trip Operational Details -->
      <form id="school-entry-form" onsubmit="saveSchoolEntryForm(event)">
        
        ${canSec1 ? `
          <!-- SECTION 1: KM / TRIP OPERATIONAL & MILEAGE DETAILS -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; text-transform: uppercase;">
                <i class="fa-solid fa-gauge-high" style="color: var(--color-income);"></i>
                1. KM / Trip Operational & Mileage Details
              </h4>
              <span class="badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 12px;">
                <i class="fa-solid fa-arrows-spin" style="margin-right: 4px;"></i> Month Carry Forward Active
              </span>
            </div>

            <!-- Sub-Header: Vehicle & Route Specifications -->
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 12px; letter-spacing: 0.04em; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              <i class="fa-solid fa-bus" style="margin-right: 6px; color: var(--color-primary);"></i> Vehicle & Route Specifications
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
              <div class="form-group">
                <label>Bus Number</label>
                <input type="text" id="op-bus-number" class="form-control" value="${escapeHTML(opData.busNumber || busNumberStr)}" placeholder="e.g. Bus 01 or Bus 34">
              </div>
              <div class="form-group">
                <label>Reg. No</label>
                <input type="text" id="op-reg-no" class="form-control" value="${escapeHTML(opData.regNo || regNoStr)}" placeholder="Reg. No">
              </div>
              <div class="form-group">
                <label>Make</label>
                <input type="text" id="op-make" class="form-control" value="${escapeHTML(opData.make || makeStr)}" placeholder="Make">
              </div>

              <div class="form-group">
                <label>Seating Capacity</label>
                <input type="number" id="op-seating-capacity" class="form-control" value="${opData.seatingCapacity || seatingCapacityStr}" placeholder="Seating Capacity">
              </div>
              <div class="form-group">
                <label>Total Number of Students</label>
                <input type="number" id="op-students-count" class="form-control" value="${opData.studentsCount || studentsCountStr}" placeholder="Total Students">
              </div>
              <div class="form-group">
                <label>Route Number</label>
                <input type="text" id="op-route-number" class="form-control" value="${escapeHTML(opData.routeNumber || routeNumberStr)}" placeholder="Route Number">
              </div>

              <div class="form-group" style="grid-column: span 3;">
                <label>Route Path / Details</label>
                <input type="text" id="op-route-details" class="form-control" value="${escapeHTML(opData.routeDetails || routeDetailsStr)}" placeholder="Route Path">
              </div>
            </div>

            <!-- Sub-Header: Personnel & Driver Details -->
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 12px; letter-spacing: 0.04em; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              <i class="fa-solid fa-users" style="margin-right: 6px; color: var(--color-primary);"></i> Personnel & Driver Details
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
              <div class="form-group">
                <label>Driver Name *</label>
                <input type="text" id="op-driver-name" class="form-control" value="${escapeHTML(opData.driverName || driverNameStr)}" placeholder="Driver Name">
              </div>
              <div class="form-group">
                <label>Hired Driver Name</label>
                <input type="text" id="op-hired-driver" class="form-control" placeholder="e.g. NA or Driver Name" value="${escapeHTML((opData.hiredDriver && opData.hiredDriver !== 'NA') ? opData.hiredDriver : hiredDriverStr)}">
              </div>
              <div class="form-group">
                <label>Attendant Name</label>
                <input type="text" id="op-attendant-name" class="form-control" value="${escapeHTML(opData.attendantName || attendantNameStr)}" placeholder="Attendant Name">
              </div>
            </div>

            <!-- Sub-Header: KM Trip & Mileage Operational Calculations -->
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 12px; letter-spacing: 0.04em; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
              <i class="fa-solid fa-gauge-high" style="margin-right: 6px; color: var(--color-income);"></i> KM Trip Logs & Fuel Calculations
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div class="form-group">
                <label>${escapeHTML(kmLabels.openingKm || 'Opening KM')} *</label>
                <input type="number" id="op-opening-km" class="form-control" required min="0" value="${opData.openingKm || 0}" oninput="calculateSchoolEntryCalculations(true)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(kmLabels.schoolTripKm || 'School Trip KM')} *</label>
                <input type="number" id="op-school-trip-km" class="form-control" required min="0" value="${opData.schoolTripKm || 0}" oninput="calculateSchoolEntryCalculations(true)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(kmLabels.additionalTripKm || 'Additional Trip KM')} *</label>
                <input type="number" id="op-additional-trip-km" class="form-control" required min="0" value="${opData.additionalTripKm || 0}" oninput="calculateSchoolEntryCalculations(true)">
              </div>

              <div class="form-group">
                <label style="color: var(--color-primary); font-weight: 700;">${escapeHTML(kmLabels.totalKm || 'Total KM')} (Calculated / Editable)</label>
                <input type="number" id="op-total-km" class="form-control" style="background: #ffffff; font-weight: 700; color: var(--color-primary);" value="${opData.totalKm || 0}" oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label style="color: var(--color-primary); font-weight: 700;">${escapeHTML(kmLabels.closingKm || 'Closing KM')} (Calculated / Editable)</label>
                <input type="number" id="op-closing-km" class="form-control" style="background: #ffffff; font-weight: 700; color: var(--color-primary);" value="${opData.closingKm || 0}" oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(kmLabels.avgMileage || 'Average Mileage')} *</label>
                <input type="number" id="op-avg-mileage" class="form-control" required step="0.01" min="0" value="${opData.avgMileage || 4.97}" oninput="calculateSchoolEntryCalculations(true)">
              </div>

              <div class="form-group" style="grid-column: span 3;">
                <label style="color: var(--color-income); font-weight: 700;">${escapeHTML(kmLabels.totalDiesel || 'Total Diesel / Fuel Required (Liters)')} (Calculated / Editable)</label>
                <input type="number" step="0.01" id="op-total-diesel" class="form-control" style="background: #ffffff; font-weight: 700; color: var(--color-income);" value="${opData.totalDiesel || 0}">
              </div>
            </div>
          </div>
        ` : ''}

        ${canSec2 ? `
          <!-- SECTION 2: EXPENSE SECTION (PART A) -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; text-transform: uppercase;">
                <i class="fa-solid fa-receipt" style="color: var(--color-expense);"></i>
                2. Expense Section (Part A)
              </h4>
              <span class="badge" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-size: 12px;">
                ${isSchoolUser ? '<i class="fa-solid fa-lock" style="margin-right: 4px;"></i> Auto-Fetched (Read Only)' : 'Auto-Fetched & Editable'}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div class="form-group">
                <label>${escapeHTML(expLabels.fuel || 'Fuel Expense')} (₹)</label>
                <input type="number" id="op-fuel-expense" class="form-control" step="0.01" value="${opData.fuelExpense || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Expenses module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(expLabels.maintenance || 'Maintenance Cost (Petty Cash)')} (₹)</label>
                <input type="number" id="op-maint-cost" class="form-control" step="0.01" value="${opData.maintenanceCost || opData.maintExpense || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Expenses module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(expLabels.salary || 'Salary of Driver and Attendant')} (₹)</label>
                <input type="number" id="op-salary" class="form-control" step="0.01" value="${opData.salary || opData.salaryExpense || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Expenses module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(expLabels.busesHired || 'No. of Bus Hired')}</label>
                <input type="number" id="op-buses-hired" class="form-control" min="0" value="${opData.noOfBusHired || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(expLabels.busHiringCharges || 'Total Bus Hiring Charges')} (₹)</label>
                <input type="number" id="op-bus-hiring-charges" class="form-control" step="0.01" value="${opData.busHiringCharges || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Expenses module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label style="color: var(--color-expense); font-weight: 700;">${escapeHTML(expLabels.totalExpenseA || 'Total Expense (A)')} (₹)</label>
                <input type="text" id="op-total-expense-a" class="form-control" readonly style="background: #fef2f2; font-weight: 700; color: var(--color-expense);" value="${formatCurrency(opData.totalExpenseA || 0)}">
              </div>
            </div>
          </div>
        ` : ''}

        ${canSec3 ? `
          <!-- SECTION 3: INCOME / COLLECTION SECTION -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; text-transform: uppercase;">
                <i class="fa-solid fa-wallet" style="color: var(--color-income);"></i>
                3. Income / Collection Section
              </h4>
              <span class="badge" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 12px;">
                ${isSchoolUser ? '<i class="fa-solid fa-lock" style="margin-right: 4px;"></i> Auto-Fetched (Read Only)' : 'Auto-Fetched & Editable'}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div class="form-group">
                <label>${escapeHTML(incLabels.studentCollection || 'Fee Collection – School Trips')} (₹)</label>
                <input type="number" id="op-school-trip-income" class="form-control" step="0.01" value="${opData.schoolTripIncome || opData.studentCollection || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Income module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(incLabels.otherCollection || 'Fee Collection – Other Trips')} (₹)</label>
                <input type="number" id="op-other-trip-income" class="form-control" step="0.01" value="${opData.otherTripIncome || opData.otherCollection || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Auto-fetched from Income module"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label style="color: var(--color-income); font-weight: 700;">${escapeHTML(incLabels.totalCollection || 'Total Collection')} (₹)</label>
                <input type="text" id="op-total-collection" class="form-control" readonly style="background: #eff6ff; font-weight: 700; color: var(--color-income);" value="${formatCurrency(opData.totalCollection || 0)}">
              </div>
            </div>
          </div>
        ` : ''}

        ${canSec4 ? `
          <!-- SECTION 4: Part B – Admin Panel -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h4 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; text-transform: uppercase;">
                <i class="fa-solid fa-user-shield" style="color: var(--color-primary);"></i>
                4. Part B – Admin Panel
              </h4>
              <span class="badge badge-neutral" style="font-size: 12px;">
                ${isSchoolUser ? '<i class="fa-solid fa-user-shield" style="margin-right: 4px;"></i> BVB Admin Entry Only (Read Only)' : 'Admin Financial Parameters'}
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.taxPerMonth || 'Tax Per Month'))} (₹)</label>
                <input type="number" id="op-bvb-tax" class="form-control" step="0.01" value="${opData.bvbTaxPerMonth || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.insurancePerMonth || 'Insurance Per Month'))} (₹)</label>
                <input type="number" id="op-bvb-insurance" class="form-control" step="0.01" value="${opData.bvbInsurancePerMonth || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.fitnessTest || 'Fitness Test Expense'))} (₹)</label>
                <input type="number" id="op-bvb-fitness" class="form-control" step="0.01" value="${opData.bvbFitnessExpense || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.gpsFee || 'GPS Fee'))} (₹)</label>
                <input type="number" id="op-bvb-gps" class="form-control" step="0.01" value="${opData.bvbGpsFee || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.maintenanceCost || 'Maintenance Cost'))} (₹)</label>
                <input type="number" id="op-bvb-maint" class="form-control" step="0.01" value="${opData.bvbMaintenanceCost || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
              <div class="form-group">
                <label>${escapeHTML(cleanReportLabelText(partBLabels.speedTestFee || 'Speed Test Fee'))} (₹)</label>
                <input type="number" id="op-bvb-speed" class="form-control" step="0.01" value="${opData.bvbSpeedTestFee || 0}" ${isSchoolUser ? 'readonly style="background: #f8fafc; font-weight: 600; cursor: not-allowed;" title="Managed by BVB Admin"' : ''} oninput="calculateSchoolEntryCalculations(false)">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-weight: 700;">${escapeHTML(cleanReportLabelText(partBLabels.totalBvb || 'Total Expense (B)'))} (₹)</label>
                <input type="text" id="op-total-expense-b" class="form-control" readonly style="background: #ffffff; font-weight: 700;" value="${formatCurrency(opData.totalExpenseB || 0)}">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-weight: 700; color: #dc2626;">Total Expense (A + B) (₹)</label>
                <input type="text" id="op-total-expense-ab" class="form-control" readonly style="background: #ffffff; font-weight: 800; color: #dc2626;" value="${formatCurrency((opData.totalExpenseA || 0) + (opData.totalExpenseB || 0))}">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-weight: 700;">Final Result</label>
                <div id="entry-surplus-display" style="font-size: 14px; font-weight: 800; padding: 8px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;"></div>
              </div>
            </div>
          </div>
        ` : ''}

        ${(!canSec1 && !canSec2 && !canSec3 && !canSec4) ? `
          <div class="card" style="padding: 32px; text-align: center; color: #64748b; font-weight: 600; margin-bottom: 24px;">
            <i class="fa-solid fa-lock" style="font-size: 28px; color: #94a3b8; display: block; margin-bottom: 10px;"></i>
            No operational entry sections have been enabled for your role in System Preferences & Settings.
          </div>
        ` : ''}

        <!-- SAVE OPERATIONAL DATA ACTION BAR -->
        <div class="card" style="padding: 20px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 13px; font-weight: 700; color: #e2e8f0;">Operational Entry Save & Live Statement Sync</span>
              <span class="badge" style="background: rgba(59,130,246,0.18); color: #bfdbfe; border: 1px solid rgba(96,165,250,0.35); font-size: 11px;">Live preview sync enabled</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">SAVE & VIEW IT</p>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button type="submit" class="btn-primary" style="width: auto; background: var(--color-income); font-size: 14px; padding: 10px 24px;">
              <i class="fa-solid fa-floppy-disk"></i> Save Operational Data
            </button>
          </div>
        </div>
      </form>

      <!-- SAVED OPERATIONAL ENTRIES & BUS STATEMENT DIRECTORY LIST -->
      ${(() => {
        const schoolVehicles = window.db.getVehicles(schoolId);
        const selectedMonthStr = document.getElementById('entry-month-select')?.value || new Date().toISOString().slice(0, 7);
        const statementDateStr = `${selectedMonthStr}-01`;

        const savedRowsData = schoolVehicles.map(v => {
          const vOpData = window.db.getSchoolOperationalData(v.id, statementDateStr);
          return {
            v,
            vOpData,
            busNoDisplay: v.busNo ? v.busNo : `Bus ${v.id}`,
            driverDisplay: vOpData.driverName || v.driver || 'Unassigned',
            attendantDisplay: vOpData.attendantName || v.attendant || 'Unassigned'
          };
        });

        const monthLabel = (() => {
          const [y, m] = selectedMonthStr.split('-').map(Number);
          const d = new Date(y, (m || 1) - 1, 1);
          return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        })();

        const savedRowsHTML = savedRowsData.map(({ v, vOpData, busNoDisplay }) => `
            <tr class="table-row" style="height: 76px;">
              <td style="white-space: nowrap; min-width: 180px; overflow: hidden; text-overflow: ellipsis; font-weight: 800; color: #0f172a; padding-top: 18px; padding-bottom: 18px;">
                <span style="display: inline-flex; align-items: center; gap: 10px; white-space: nowrap;">
                  <i class="fa-solid fa-bus" style="color: var(--color-primary); flex: 0 0 auto;"></i>
                  <strong style="color: var(--color-primary); white-space: nowrap; display: inline-block;">${escapeHTML(busNoDisplay)}</strong>
                </span>
              </td>
              <td style="text-align: left; white-space: nowrap; font-weight: 600; color: #334155; padding-top: 18px; padding-bottom: 18px;">
                <span style="display: inline-flex; align-items: center; min-height: 28px;">${escapeHTML(monthLabel)}</span>
              </td>
              <td style="text-align: left; font-weight: 800; color: #0f172a; white-space: nowrap; padding-top: 18px; padding-bottom: 18px;">${Number(vOpData.totalKm || 0).toLocaleString('en-IN')} KM</td>
              <td style="text-align: left; font-weight: 800; color: var(--color-expense); white-space: nowrap; padding-top: 18px; padding-bottom: 18px;">${formatCurrency(vOpData.totalExpenseAB || 0)}</td>
              <td style="text-align: left; font-weight: 800; color: var(--color-income); white-space: nowrap; padding-top: 18px; padding-bottom: 18px;">${formatCurrency(vOpData.totalCollection || 0)}</td>
              <td style="text-align: left; white-space: nowrap; padding-top: 18px; padding-bottom: 18px;">
                ${(vOpData.surplusDeficit || 0) >= 0
                  ? `<span class="badge" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-size: 11px; white-space: nowrap;">SURPLUS: ${formatCurrency(vOpData.surplusDeficit || 0)}</span>`
                  : `<span class="badge" style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; font-size: 11px; white-space: nowrap;">DEFICIT: ${formatCurrency(Math.abs(vOpData.surplusDeficit || 0))}</span>`}
              </td>
              <td style="text-align: center;">
                <button type="button" class="btn-primary motion-scale-press preview-report-btn" data-vehicle-id="${v.id}" style="width: auto; font-size: 12px; padding: 7px 14px; background: #0284c7; border: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(2,132,199,0.2); white-space: nowrap; border-radius: 999px;">
                  <i class="fa-solid fa-eye"></i> View
                </button>
              </td>
            </tr>
          `).join('');

        return `
          <div class="card" style="padding: 24px; margin-top: 24px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-list-check" style="color: var(--color-primary);"></i>
                  Bus-Wise Saved Operational Data & Statement Report Quick Preview
                </h3>
                <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
                  Live list of operational entries saved for each bus. Click <strong>"Preview Report"</strong> on any bus row to view how its full bus-wise A4 statement report generates with auto-fetched expenses, collections & BVB parameters.
                </p>
              </div>
              <span class="badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 12px;">
                <i class="fa-solid fa-arrows-rotate" style="margin-right: 4px;"></i> Live Central Storage Sync
              </span>
            </div>

            <div class="table-container" style="max-height: 600px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <table class="data-table" id="saved-ops-table" style="width: 100%; min-width: 980px; table-layout: fixed; border-collapse: separate; border-spacing: 0;">
                <colgroup>
                  <col style="width: 22%;">
                  <col style="width: 14%;">
                  <col style="width: 13%;">
                  <col style="width: 17%;">
                  <col style="width: 14%;">
                  <col style="width: 13%;">
                  <col style="width: 7%;">
                </colgroup>
                <thead>
                  <tr>
                    <th style="white-space: nowrap; text-align: left; letter-spacing: 0.02em;">BUS NO.</th>
                    <th style="white-space: nowrap; text-align: left; letter-spacing: 0.02em;">MONTH / PERIOD</th>
                    <th style="text-align: left; letter-spacing: 0.02em;">TOTAL KM</th>
                    <th style="text-align: left; letter-spacing: 0.02em;">TOTAL EXPENSE (A+B)</th>
                    <th style="text-align: left; letter-spacing: 0.02em;">COLLECTION</th>
                    <th style="text-align: left; letter-spacing: 0.02em;">FINANCIAL RESULT</th>
                    <th style="text-align: center; letter-spacing: 0.02em;">VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  ${savedRowsHTML.length > 0 ? savedRowsHTML : '<tr><td colspan="7" class="empty-state">No buses found for this school campus.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        `;
      })()}
    </div>
  `;

  // Wire Preview Report buttons via event delegation — no user data in onclick attributes
  const safeSchoolId = Number(schoolId);
  const safeDateStr = String(selectedMonth).replace(/[^0-9\-]/g, '') + '-01';
  const opsTable = document.getElementById('saved-ops-table');
  if (opsTable) {
    opsTable.addEventListener('click', (e) => {
      const btn = e.target.closest('.preview-report-btn');
      if (!btn) return;
      const vid = Number(btn.dataset.vehicleId);
      if (vid && typeof previewSchoolBusStatement === 'function') {
        previewSchoolBusStatement(safeSchoolId, safeDateStr, [vid]);
      }
    });
  }

  // Populate surplus/deficit display via DOM — never via innerHTML interpolation
  const surplusDisplayEl = document.getElementById('entry-surplus-display');
  if (surplusDisplayEl) {
    const surplusVal = Number(opData.surplusDeficit) || 0;
    const span = document.createElement('span');
    span.style.color = surplusVal >= 0 ? '#16a34a' : '#dc2626';
    span.textContent = surplusVal >= 0
      ? `SURPLUS: ${formatCurrency(surplusVal)}`
      : `DEFICIT: ${formatCurrency(Math.abs(surplusVal))}`;
    surplusDisplayEl.appendChild(span);
  }

  bindSchoolEntryLiveSync();
}

function onSchoolEntrySchoolChange(schoolId) {
  currentEntrySchoolId = Number(schoolId);
  const vehicles = window.db.getVehicles(currentEntrySchoolId);
  currentEntryVehicleId = vehicles.length > 0 ? vehicles[0].id : null;
  renderSchoolEntryPage();
}

function onSchoolEntryVehicleChange(vehicleId) {
  currentEntryVehicleId = Number(vehicleId);
  renderSchoolEntryPage();
}

function getSchoolEntryCurrentFormPayload() {
  const vehicleId = Number(document.getElementById('entry-vehicle-id')?.value || currentEntryVehicleId);
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user ? user.role === 'School' : false;
  const schoolId = isSchoolUser ? user.schoolId : Number(document.getElementById('entry-school-id')?.value || currentEntrySchoolId || 1);
  
  const today = new Date();
  const defaultMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = document.getElementById('entry-month-select')?.value || defaultMonthStr;
  const statementDate = `${selectedMonth}-01`;

  const existingOpData = window.db.getSchoolOperationalData(vehicleId, statementDate) || {};

  const openingKm = parseFloat(document.getElementById('op-opening-km')?.value) || 0;
  const schoolTripKm = parseFloat(document.getElementById('op-school-trip-km')?.value) || 0;
  const additionalTripKm = parseFloat(document.getElementById('op-additional-trip-km')?.value) || 0;
  const avgMileage = parseFloat(document.getElementById('op-avg-mileage')?.value) || 4.97;

  const totalKm = parseFloat(document.getElementById('op-total-km')?.value) || (schoolTripKm + additionalTripKm);
  const closingKm = parseFloat(document.getElementById('op-closing-km')?.value) || (openingKm + totalKm);
  const totalDiesel = parseFloat(document.getElementById('op-total-diesel')?.value) || (avgMileage > 0 ? Number((totalKm / avgMileage).toFixed(2)) : 0);

  const busNumber = document.getElementById('op-bus-number')?.value.trim() || existingOpData.busNumber || '';
  const regNo = document.getElementById('op-reg-no')?.value.trim() || existingOpData.regNo || '';
  const make = document.getElementById('op-make')?.value.trim() || existingOpData.make || '';
  const seatingCapacity = document.getElementById('op-seating-capacity')?.value.trim() || existingOpData.seatingCapacity || '';
  const studentsCount = document.getElementById('op-students-count')?.value.trim() || existingOpData.studentsCount || '';
  const routeNumber = document.getElementById('op-route-number')?.value.trim() || existingOpData.routeNumber || '';
  const routeDetails = document.getElementById('op-route-details')?.value.trim() || existingOpData.routeDetails || '';

  const hiredDriver = document.getElementById('op-hired-driver')?.value.trim() || 'NA';
  const driverName = document.getElementById('op-driver-name')?.value.trim() || existingOpData.driverName || 'Unassigned';
  const attendantName = document.getElementById('op-attendant-name')?.value.trim() || existingOpData.attendantName || 'Unassigned';

  const fuelExpense = document.getElementById('op-fuel-expense') ? parseFloat(document.getElementById('op-fuel-expense').value) || 0 : (existingOpData.fuelExpense || 0);
  const maintenanceCost = document.getElementById('op-maint-cost') ? parseFloat(document.getElementById('op-maint-cost').value) || 0 : (existingOpData.maintenanceCost || 0);
  const salary = document.getElementById('op-salary') ? parseFloat(document.getElementById('op-salary').value) || 0 : (existingOpData.salary || 0);
  const noOfBusHired = document.getElementById('op-buses-hired') ? parseInt(document.getElementById('op-buses-hired').value) || 0 : (existingOpData.noOfBusHired || 0);
  const busHiringCharges = document.getElementById('op-bus-hiring-charges') ? parseFloat(document.getElementById('op-bus-hiring-charges').value) || 0 : (existingOpData.busHiringCharges || 0);

  const totalExpenseA = fuelExpense + maintenanceCost + salary + busHiringCharges;

  const schoolTripIncome = document.getElementById('op-school-trip-income') ? parseFloat(document.getElementById('op-school-trip-income').value) || 0 : (existingOpData.schoolTripIncome || 0);
  const otherTripIncome = document.getElementById('op-other-trip-income') ? parseFloat(document.getElementById('op-other-trip-income').value) || 0 : (existingOpData.otherTripIncome || 0);
  const totalCollection = schoolTripIncome + otherTripIncome;

  const bvbTaxPerMonth = document.getElementById('op-bvb-tax') ? parseFloat(document.getElementById('op-bvb-tax').value) || 0 : (existingOpData.bvbTaxPerMonth || 0);
  const bvbInsurancePerMonth = document.getElementById('op-bvb-insurance') ? parseFloat(document.getElementById('op-bvb-insurance').value) || 0 : (existingOpData.bvbInsurancePerMonth || 0);
  const bvbFitnessExpense = document.getElementById('op-bvb-fitness') ? parseFloat(document.getElementById('op-bvb-fitness').value) || 0 : (existingOpData.bvbFitnessExpense || 0);
  const bvbGpsFee = document.getElementById('op-bvb-gps') ? parseFloat(document.getElementById('op-bvb-gps').value) || 0 : (existingOpData.bvbGpsFee || 0);
  const bvbMaintenanceCost = document.getElementById('op-bvb-maint') ? parseFloat(document.getElementById('op-bvb-maint').value) || 0 : (existingOpData.bvbMaintenanceCost || 0);
  const bvbSpeedTestFee = document.getElementById('op-bvb-speed') ? parseFloat(document.getElementById('op-bvb-speed').value) || 0 : (existingOpData.bvbSpeedTestFee || 0);

  const totalExpenseB = bvbTaxPerMonth + bvbInsurancePerMonth + bvbFitnessExpense + bvbGpsFee + bvbMaintenanceCost + bvbSpeedTestFee;
  const totalExpenseAB = totalExpenseA + totalExpenseB;
  const surplusDeficit = totalCollection - totalExpenseAB;

  return {
    ...existingOpData,
    vehicleId,
    schoolId,
    statementDate,
    busNumber,
    regNo,
    make,
    seatingCapacity,
    studentsCount,
    routeNumber,
    routeDetails,
    openingKm,
    schoolTripKm,
    additionalTripKm,
    totalKm,
    closingKm,
    avgMileage,
    totalDiesel,
    driverName,
    attendantName,
    hiredDriver,
    fuelExpense,
    maintenanceCost,
    salary,
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

function calculateSchoolEntryCalculations(autoCalcKm = true) {
  const openingKm = parseFloat(document.getElementById('op-opening-km')?.value) || 0;
  const schoolTripKm = parseFloat(document.getElementById('op-school-trip-km')?.value) || 0;
  const addTripKm = parseFloat(document.getElementById('op-additional-trip-km')?.value) || 0;
  const avgMileage = parseFloat(document.getElementById('op-avg-mileage')?.value) || 1;

  if (autoCalcKm) {
    const totalKm = schoolTripKm + addTripKm;
    const closingKm = openingKm + totalKm;
    const totalDiesel = avgMileage > 0 ? (totalKm / avgMileage).toFixed(2) : '0.00';

    if (document.getElementById('op-total-km')) document.getElementById('op-total-km').value = totalKm;
    if (document.getElementById('op-closing-km')) document.getElementById('op-closing-km').value = closingKm;
    if (document.getElementById('op-total-diesel')) document.getElementById('op-total-diesel').value = totalDiesel;
  }

  const fuelExp = parseFloat(document.getElementById('op-fuel-expense')?.value) || 0;
  const maintCost = parseFloat(document.getElementById('op-maint-cost')?.value) || 0;
  const salary = parseFloat(document.getElementById('op-salary')?.value) || 0;
  const hiringCharges = parseFloat(document.getElementById('op-bus-hiring-charges')?.value) || 0;
  const totalExpenseA = fuelExp + maintCost + salary + hiringCharges;

  if (document.getElementById('op-total-expense-a')) document.getElementById('op-total-expense-a').value = formatCurrency(totalExpenseA);

  const schoolIncome = parseFloat(document.getElementById('op-school-trip-income')?.value) || 0;
  const otherIncome = parseFloat(document.getElementById('op-other-trip-income')?.value) || 0;
  const totalCollection = schoolIncome + otherIncome;

  if (document.getElementById('op-total-collection')) document.getElementById('op-total-collection').value = formatCurrency(totalCollection);

  const bvbTax = parseFloat(document.getElementById('op-bvb-tax')?.value) || 0;
  const bvbIns = parseFloat(document.getElementById('op-bvb-insurance')?.value) || 0;
  const bvbFit = parseFloat(document.getElementById('op-bvb-fitness')?.value) || 0;
  const bvbGps = parseFloat(document.getElementById('op-bvb-gps')?.value) || 0;
  const bvbMaint = parseFloat(document.getElementById('op-bvb-maint')?.value) || 0;
  const bvbSpeed = parseFloat(document.getElementById('op-bvb-speed')?.value) || 0;
  const totalExpenseB = bvbTax + bvbIns + bvbFit + bvbGps + bvbMaint + bvbSpeed;

  if (document.getElementById('op-total-expense-b')) {
    document.getElementById('op-total-expense-b').value = totalExpenseB > 0 ? formatCurrency(totalExpenseB) : '₹0.00';
  }

  const totalExpenseAB = totalExpenseA + totalExpenseB;
  if (document.getElementById('op-total-expense-ab')) {
    document.getElementById('op-total-expense-ab').value = formatCurrency(totalExpenseAB);
  }

  const surplusDeficit = totalCollection - totalExpenseAB;
  const surplusDisplayEl = document.getElementById('entry-surplus-display');

  if (surplusDisplayEl) {
    const surplusText = surplusDeficit >= 0
      ? `SURPLUS: ${formatCurrency(surplusDeficit)}`
      : `DEFICIT: ${formatCurrency(Math.abs(surplusDeficit))}`;
    const surplusColor = surplusDeficit >= 0 ? '#16a34a' : '#dc2626';
    const span = document.createElement('span');
    span.style.color = surplusColor;
    span.textContent = surplusText;
    surplusDisplayEl.innerHTML = '';
    surplusDisplayEl.appendChild(span);
  }
}

function syncSchoolEntryLiveReportPreview() {
  const payload = getSchoolEntryCurrentFormPayload();
  if (!payload.vehicleId || !payload.schoolId) return;

  window.db.saveSchoolOperationalData(payload.vehicleId, payload.statementDate, payload);

  if (typeof refreshOpenStatementPreview === 'function') {
    refreshOpenStatementPreview();
  }
}

function queueSchoolEntryLiveSync() {
  clearTimeout(schoolEntryLiveSyncTimer);
  schoolEntryLiveSyncTimer = setTimeout(() => {
    syncSchoolEntryLiveReportPreview();
  }, 250);
}

function bindSchoolEntryLiveSync() {
  const form = document.getElementById('school-entry-form');
  if (!form || form.dataset.liveSyncBound === '1') return;

  form.dataset.liveSyncBound = '1';
  form.addEventListener('input', queueSchoolEntryLiveSync);
  form.addEventListener('change', queueSchoolEntryLiveSync);
}

function saveSchoolEntryForm(event) {
  if (event) event.preventDefault();

  const dataPayload = getSchoolEntryCurrentFormPayload();
  const vehicleId = dataPayload.vehicleId;
  const statementDate = dataPayload.statementDate;

  if (!vehicleId) {
    showToast('Please select a valid vehicle', 'warning');
    return;
  }

  window.db.saveSchoolOperationalData(vehicleId, statementDate, dataPayload);
  syncSchoolEntryLiveReportPreview();

  const vehicleObj = window.db.getVehicles().find(v => v.id === vehicleId);
  const busNo = vehicleObj ? vehicleObj.busNo : 'Vehicle';

  showToast(`Operational data saved for ${busNo}. Statement updated in common database!`, 'success');
  renderSchoolEntryPage();
}

window.renderSchoolEntryPage = renderSchoolEntryPage;
window.onSchoolEntrySchoolChange = onSchoolEntrySchoolChange;
window.onSchoolEntryVehicleChange = onSchoolEntryVehicleChange;
window.calculateSchoolEntryCalculations = calculateSchoolEntryCalculations;
window.saveSchoolEntryForm = saveSchoolEntryForm;
