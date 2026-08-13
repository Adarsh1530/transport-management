/* ==========================================
   SCHOOL BUS STATEMENT REPORT MODULE
   ========================================== */

let statementSelectedSchoolId = null;
let statementSelectedDate = new Date().toISOString().split('T')[0];
let statementSelectedRouteId = null;

function cleanReportLabelText(value) {
  return String(value || '').replace(/\s*\(10 Months\)\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim();
}

function renderSchoolBusStatementView() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user ? user.role === 'School' : false;
  const userSchoolId = user ? user.schoolId : 1;
  const schoolId = isSchoolUser ? userSchoolId : (statementSelectedSchoolId || 1);
  const schools = window.db.getSchools(isSchoolUser ? userSchoolId : null);
  const vehicles = window.db.getVehicles(schoolId);
  const routes = window.db.getRoutes(schoolId);
  const statements = window.db.getSchoolStatements(isSchoolUser ? userSchoolId : null);

  return `
    <div class="card motion-stagger-in" style="padding: 24px; margin-bottom: 24px;">
      <div class="section-header" style="margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-file-invoice-dollar" style="color: var(--color-income);"></i>
            School Bus Statement Report Generator
          </h3>
          <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
            Generate official printable A4 monthly transport statements, financial performance audits, and BVB expense summaries.
          </p>
        </div>
      </div>

      <!-- Generator Configuration Form -->
      <form id="statement-generator-form" onsubmit="event.preventDefault(); previewSchoolBusStatement();">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 2fr; gap: 16px; background: var(--color-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--color-border); margin-bottom: 16px;">
          
          <!-- Field 1: School Selection -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px;">School Campus *</label>
            ${!isSchoolUser ? `
              <select id="stmt-school-id" class="form-control" onchange="onStatementSchoolChange(this.value)">
                ${schools.map(s => `<option value="${s.id}" ${s.id === schoolId ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
              </select>
            ` : `
              <input type="text" class="form-control" readonly value="${escapeHTML(user.schoolName)}" style="background: var(--color-card); font-weight: 600;">
              <input type="hidden" id="stmt-school-id" value="${user.schoolId}">
            `}
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px;">Route Filter</label>
            <select id="stmt-route-id" class="form-control" onchange="onStatementRouteChange(this.value)">
              <option value="">All routes for selected school</option>
              ${routes.map(r => `<option value="${r.id}" ${Number(statementSelectedRouteId) === r.id ? 'selected' : ''}>${escapeHTML(r.routeCode)} — ${escapeHTML(r.name)}</option>`).join('')}
            </select>
          </div>

          <!-- Field 2: Statement Date Picker -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px;">Statement Date *</label>
            <input type="date" id="stmt-date" class="form-control" required value="${statementSelectedDate}" onchange="statementSelectedDate = this.value">
          </div>

          <!-- Field 3: Vehicle Selection Checkbox Group -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span>Select Vehicle(s) *</span>
              <label style="font-size: 12px; font-weight: 600; color: var(--color-income); cursor: pointer;">
                <input type="checkbox" id="stmt-select-all-vehicles" onchange="toggleAllStatementVehicles(this.checked)"> Select All Buses (${vehicles.length})
              </label>
            </label>
            
            <div style="max-height: 120px; overflow-y: auto; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${vehicles.map(v => `
                <label style="font-size: 12.5px; font-weight: 500; color: var(--color-text-primary); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" class="stmt-vehicle-cb" value="${v.id}" checked>
                  <span class="bus-no-text nowrap-single-line"><strong>Bus ${escapeHTML(v.busNo.replace(/\D/g, '').slice(-2) || v.id)}</strong> — ${escapeHTML(v.busNo)}</span>
                </label>
              `).join('')}
            </div>
          </div>

        </div>

        <div style="font-size: 12px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 20px;">
          <strong style="color:#0f172a;">Live data mapping:</strong> vehicle/specification → Vehicles; route, students → Routes; driver/attendant → Personnel; trip KM → Trip Operations; fuel and expenses → Expenses; collections → Income. Existing values are auto-fetched for this school, bus and reporting month; operational-entry values are saved as report-only overrides.
        </div>

        <!-- Action Control Buttons -->
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; flex-wrap: wrap;">
          <button type="button" class="btn-secondary motion-scale-press" style="width: auto;" onclick="previewSchoolBusStatement()">
            <i class="fa-solid fa-eye"></i> Preview Statement Report
          </button>
          <button type="button" class="btn-primary motion-scale-press" style="width: auto; background: var(--color-dark);" onclick="generateAndSaveStatement()">
            <i class="fa-solid fa-file-export"></i> Generate & Save Statement
          </button>
          <button type="button" class="btn-primary motion-scale-press" style="width: auto; background: var(--color-income);" onclick="printSelectedBusStatement()">
            <i class="fa-solid fa-print"></i> Print (A4)
          </button>
          <button type="button" class="btn-primary motion-scale-press" style="width: auto; background: var(--color-profit);" onclick="exportStatementToExcel()">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
        </div>
      </form>
    </div>

    <!-- STATEMENT HISTORY SECTION -->
    <div class="card motion-stagger-in" style="padding: 24px;">
      <div class="section-header">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-clock-rotate-left" style="color: var(--color-income);"></i>
            School Bus Statement History & Archive
          </h3>
          <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
            Review previously generated statement snapshots, verification statuses, and historical financial summaries.
          </p>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Statement Date</th>
              <th>Vehicles</th>
              <th>Total Collection</th>
              <th>Total Expense (A+B)</th>
              <th>Surplus / Deficit</th>
              <th>Status</th>
              <th>Generated By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${!statements || !statements.length ? `
              <tr><td colspan="9" class="empty-state">No saved statement records found. Generate a statement above.</td></tr>
            ` : statements.map(s => {
              const statusClass = s.status === 'Approved' ? 'badge-active' : (s.status === 'Verified' ? 'badge-due-today' : 'badge-neutral');
              const isProfit = s.surplusDeficit >= 0;
              return `
                <tr class="table-row">
                  <td><strong class="nowrap-single-line">${escapeHTML(s.schoolName)}</strong></td>
                  <td class="nowrap-single-line">${formatDate(s.statementDate)}</td>
                  <td><span class="badge badge-neutral">${s.vehicleIds.length} Vehicle(s)</span></td>
                  <td style="color: var(--color-income); font-weight: 600;" class="nowrap-single-line">${formatCurrency(s.totalCollection)}</td>
                  <td style="color: var(--color-expense); font-weight: 600;" class="nowrap-single-line">${formatCurrency(s.totalExpense)}</td>
                  <td style="font-weight: 700; color: ${isProfit ? 'var(--color-profit)' : 'var(--color-expense)'};" class="nowrap-single-line">
                    ${isProfit ? `+${formatCurrency(s.surplusDeficit)}` : formatCurrency(s.surplusDeficit)}
                  </td>
                  <td>
                    <select class="form-control" style="font-size: 12px; padding: 4px 8px; width: auto;" onchange="updateStatementStatus(${s.id}, this.value)">
                      <option value="Draft" ${s.status === 'Draft' ? 'selected' : ''}>Draft</option>
                      <option value="Generated" ${s.status === 'Generated' ? 'selected' : ''}>Generated</option>
                      <option value="Verified" ${s.status === 'Verified' ? 'selected' : ''}>Verified</option>
                      <option value="Approved" ${s.status === 'Approved' ? 'selected' : ''}>Approved</option>
                    </select>
                  </td>
                  <td><span style="font-size: 12px; color: var(--color-text-secondary);" class="nowrap-single-line">${escapeHTML(s.generatedBy || 'System Admin')}</span></td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn motion-scale-press" title="Preview Statement" onclick="previewSavedStatement(${s.id})"><i class="fa-solid fa-eye"></i></button>
                      <button class="icon-btn motion-scale-press" title="Print Statement" onclick="printSavedStatement(${s.id})"><i class="fa-solid fa-print"></i></button>
                      <button class="icon-btn delete motion-scale-press" title="Delete Snapshot" onclick="deleteSavedStatement(${s.id})"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function onStatementSchoolChange(schoolId) {
  statementSelectedSchoolId = Number(schoolId);
  statementSelectedRouteId = null;
  if (typeof renderReportsPage === 'function') renderReportsPage();
}

function onStatementRouteChange(routeId) {
  statementSelectedRouteId = routeId ? Number(routeId) : null;
  const route = window.db.getRoutes().find(r => r.id === statementSelectedRouteId);
  if (route && route.busId) {
    document.querySelectorAll('.stmt-vehicle-cb').forEach(cb => {
      cb.checked = Number(cb.value) === Number(route.busId);
    });
  }
}

function toggleAllStatementVehicles(isChecked) {
  document.querySelectorAll('.stmt-vehicle-cb').forEach(cb => {
    cb.checked = isChecked;
  });
}

function getSelectedStatementVehicleIds() {
  const cbs = document.querySelectorAll('.stmt-vehicle-cb:checked');
  return Array.from(cbs).map(cb => Number(cb.value));
}

function validateStatementInputs() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user ? user.role === 'School' : false;
  const rawSchool = document.getElementById('stmt-school-id')?.value;
  const schoolId = isSchoolUser ? user.schoolId : Number(rawSchool);
  const stmtDate = document.getElementById('stmt-date')?.value;
  const vehicleIds = getSelectedStatementVehicleIds();
  const routeId = Number(document.getElementById('stmt-route-id')?.value || 0) || null;

  if (!schoolId) {
    showToast('Please select a school campus', 'warning');
    return null;
  }
  if (!stmtDate) {
    showToast('Please select a statement date', 'warning');
    return null;
  }
  if (!vehicleIds || vehicleIds.length === 0) {
    showToast('Please select at least one vehicle', 'warning');
    return null;
  }
  if (routeId) {
    const route = window.db.getRoutes().find(r => r.id === routeId);
    if (!route || !vehicleIds.every(vId => Number(vId) === Number(route.busId))) {
      showToast('Select the bus assigned to the chosen route, or clear the route filter.', 'warning');
      return null;
    }
  }

  // Validate KM range for selected vehicles
  const vehicles = window.db.getVehicles();
  for (const vId of vehicleIds) {
    const v = vehicles.find(veh => veh.id === vId);
    const opData = window.db.getSchoolOperationalData(vId, stmtDate);
    if (opData.closingKm < opData.openingKm) {
      showToast(`Invalid KM entry for Vehicle ${v ? v.busNo : vId}: Closing KM cannot be lower than Opening KM.`, 'warning');
      return null;
    }
  }

  return { schoolId, stmtDate, vehicleIds, routeId };
}

function getScopedStyleTag(selector, styleObj) {
  if (!styleObj) return '';
  const font = styleObj.fontFamily ? `font-family: '${styleObj.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif !important; ` : '';
  const size = styleObj.fontSize ? `font-size: ${styleObj.fontSize} !important; ` : '';
  const weight = styleObj.bold ? `font-weight: 700 !important; ` : '';
  const style = styleObj.italic ? `font-style: italic !important; ` : '';
  const decoration = styleObj.underline ? `text-decoration: underline !important; ` : '';
  const alignment = styleObj.textAlign ? `text-align: ${styleObj.textAlign} !important; ` : '';
  const color = styleObj.color ? `color: ${styleObj.color} !important; ` : '';

  if (!font && !size && !weight && !style && !decoration && !alignment && !color) return '';

  return `<style>${selector}, ${selector} * { ${font}${size}${weight}${style}${decoration}${alignment}${color} }</style>`;
}

// Helper renderer for dynamic report modules
function renderStatementModuleSection(mod, dataContext) {
  if (mod.visible === false) return '';
  const labels = Object.fromEntries(
    Object.entries(mod.labels || {}).map(([labelKey, labelValue]) => [labelKey, cleanReportLabelText(labelValue)])
  );
  const { v, busNumStr, routeCodeStr, routeNameStr, driverNameStr, attendantNameStr, openingKm, closingKm, totalKm, opData, totalExpA, totalExpB, totalExpAB, totalColl, surplusDef, surplusDefStatusText, surplusDefColor } = dataContext;

  const secId = `sec-stmt-${mod.key}`;
  const styleTag = getScopedStyleTag(`#${secId}`, mod.style);

  let innerHTML = '';
  switch (mod.key) {
    case 'vehicle_details':
      innerHTML = `
        <div style="margin-bottom: 22px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || '1. VEHICLE DETAILS')}
          </div>
          <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
            <tbody>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.busNumber || 'Bus Number')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">Bus ${escapeHTML(opData.busNumber || busNumStr)}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.regNumber || 'Reg. No')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">${escapeHTML(opData.regNo || v.busNo)}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.make || 'Make')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${escapeHTML(opData.make || v.manufacturer || v.model || 'Ashok Leyland')}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.seatingCapacity || 'Seating Capacity')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${opData.seatingCapacity || v.seats || 50}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.studentsCount || 'Total Number of students')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${opData.studentsCount || v.studentsCount || 42}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.routeNumber || 'Route Number')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">${escapeHTML(opData.routeNumber || routeCodeStr)}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.route || 'Route')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${escapeHTML(opData.routeDetails || routeNameStr)}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.driver || 'Driver Name')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${escapeHTML(opData.driverName || driverNameStr)}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.hiredDriver || 'Hired Driver Name')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${escapeHTML(opData.hiredDriver || v.hiredDriver || 'NA')}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.attendant || 'Attendant Name')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${escapeHTML(opData.attendantName || attendantNameStr)}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      break;

    case 'km_trip_details':
      innerHTML = `
        <div style="margin-bottom: 22px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || '2. KM / TRIP DETAILS')}
          </div>
          <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
            <tbody>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.openingKm || 'Opening KM')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${openingKm}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.additionalTripKm || 'Additional Trip KM')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${opData.additionalTripKm || 0}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.schoolTripKm || 'School Trip KM')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${opData.schoolTripKm || 0}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.closingKm || 'Closing KM')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">${closingKm}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.totalKm || 'Total KM')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">${totalKm}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.avgMileage || 'Average Mileage')}</td><td style="padding: 7px 12px; border: 1px solid #000000;">${opData.avgMileage || 4.97}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.totalDiesel || 'Total Diesel')}</td><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 700;">${opData.totalDiesel || 0}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      break;

    case 'expense_part_a':
      innerHTML = `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || '3. EXPENSE SECTION (PART A)')}
          </div>
          <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
            <tbody>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.fuel || 'Fuel Expense')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.fuelExpense > 0 ? opData.fuelExpense.toFixed(2) : '—'}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.maintenance || 'Maintenance Cost (petty cash)')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.maintExpense > 0 ? opData.maintExpense.toFixed(2) : (opData.maintenanceCost > 0 ? opData.maintenanceCost.toFixed(2) : '—')}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.salary || 'Salary of Driver and Attender')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.salaryExpense > 0 ? opData.salaryExpense.toFixed(2) : (opData.salary > 0 ? opData.salary.toFixed(2) : '—')}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.busesHired || 'No. of Bus hired')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.noOfBusHired || 0}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.busHiringCharges || 'Total Bus Hiring charges')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.busHiringCharges > 0 ? opData.busHiringCharges.toFixed(2) : '—'}</td></tr>
              <tr style="background: #fef2f2;"><td style="padding: 8px 12px; border: 1px solid #000000; font-weight: 800; color: #dc2626;">${escapeHTML(labels.totalExpenseA || 'Total Expense (A)')}</td><td style="padding: 8px 12px; border: 1px solid #000000; text-align: right; font-weight: 800; color: #dc2626;">${totalExpA.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      break;

    case 'income_collection':
      innerHTML = `
        <div style="margin-bottom: 22px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || '4. INCOME / COLLECTION SECTION')}
          </div>
          <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
            <tbody>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.studentCollection || 'Fee collection - School Trips')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.schoolTripIncome > 0 ? opData.schoolTripIncome.toFixed(2) : (opData.studentCollection > 0 ? opData.studentCollection.toFixed(2) : '—')}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.otherCollection || 'Fee collection - Other Trips')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.otherTripIncome > 0 ? opData.otherTripIncome.toFixed(2) : (opData.otherCollection > 0 ? opData.otherCollection.toFixed(2) : '—')}</td></tr>
              <tr style="background: #eff6ff;"><td style="padding: 8px 12px; border: 1px solid #000000; font-weight: 800; color: #2563eb;">${escapeHTML(labels.totalCollection || 'Total Collection')}</td><td style="padding: 8px 12px; border: 1px solid #000000; text-align: right; font-weight: 800; color: #2563eb;">${totalColl.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      break;

    case 'part_b_bvb':
      innerHTML = `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || 'PART B - To be filled in by BVB')}
          </div>
          <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
            <tbody>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.taxPerMonth || 'Tax Per Month')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbTaxPerMonth > 0 ? opData.bvbTaxPerMonth.toFixed(2) : ''}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.insurancePerMonth || 'Insurance Per Month')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbInsurancePerMonth > 0 ? opData.bvbInsurancePerMonth.toFixed(2) : ''}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.fitnessTest || 'Fitness Test Expense')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbFitnessExpense > 0 ? opData.bvbFitnessExpense.toFixed(2) : ''}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.gpsFee || 'GPS fee')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbGpsFee > 0 ? opData.bvbGpsFee.toFixed(2) : ''}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.maintenanceCost || 'Maintenance Cost')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbMaintenanceCost > 0 ? opData.bvbMaintenanceCost.toFixed(2) : ''}</td></tr>
              <tr><td style="padding: 7px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.speedTestFee || 'Speed Test fee')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right;">${opData.bvbSpeedTestFee > 0 ? opData.bvbSpeedTestFee.toFixed(2) : ''}</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 8px 12px; border: 1px solid #000000; font-weight: 800;">${escapeHTML(labels.totalBvb || 'Total Expense (B)')}</td><td style="padding: 8px 12px; border: 1px solid #000000; text-align: right; font-weight: 800;">${totalExpB > 0 ? totalExpB.toFixed(2) : ''}</td></tr>
            </tbody>
          </table>
        </div>
      `;
      break;

    case 'financial_summary':
      innerHTML = `
        <div style="border: 2px solid #000000; padding: 16px 20px; margin-bottom: 28px; background: #ffffff;">
          <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000000; padding-bottom: 6px; letter-spacing: 0.03em;">
            ${escapeHTML(mod.title || '6. FINAL FINANCIAL STATEMENT SUMMARY')}
          </div>
          
          ${dataContext.isPartBVisible !== false ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13.5px; margin-bottom: 14px;">
              <div>${escapeHTML(labels.totalExpA || 'TOTAL EXPENSE (A)')}: <strong>${formatCurrency(totalExpA)}</strong></div>
              <div>${escapeHTML(labels.totalExpB || 'TOTAL BVB (B)')}: <strong>${totalExpB > 0 ? formatCurrency(totalExpB) : '₹0.00'}</strong></div>
              <div>${escapeHTML(labels.totalExpAB || 'TOTAL EXPENSE (A+B)')}: <strong>${formatCurrency(totalExpAB)}</strong></div>
              <div>${escapeHTML(labels.totalCollection || 'TOTAL COLLECTION')}: <strong style="color: #2563eb;">${formatCurrency(totalColl)}</strong></div>
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; margin-bottom: 14px;">
              <div>${escapeHTML(labels.totalExpA || 'TOTAL EXPENSE (A)')}: <strong>${formatCurrency(totalExpA)}</strong></div>
              <div>${escapeHTML(labels.totalCollection || 'TOTAL COLLECTION')}: <strong style="color: #2563eb;">${formatCurrency(totalColl)}</strong></div>
            </div>
          `}

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 900; background: #f8fafc; padding: 12px 16px; border: 2px solid #000000;">
            <span>${escapeHTML(labels.financialResult || 'FINANCIAL RESULT')}:</span>
            <span style="color: ${surplusDefColor};">${surplusDefStatusText}: ${formatCurrency(Math.abs(surplusDef))}</span>
          </div>
        </div>
      `;
      break;

    case 'verification_signatures':
      const sigImg = mod.signatureImage || dataContext.signatureImage || null;
      const currentUser = window.auth ? window.auth.getCurrentUser() : null;
      const preparedByName = currentUser ? (currentUser.name || currentUser.username || 'System User') : 'Authorized Staff';

      innerHTML = `
        <div style="border-top: 1px dashed #000000; padding-top: 20px; font-size: 12.5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div><strong>${escapeHTML(labels.preparedBy || 'Prepared By')}:</strong> <span style="font-weight: 700; border-bottom: 1px solid #000000; padding: 0 6px 2px 6px;">${escapeHTML(preparedByName)}</span></div>
            <div><strong>${escapeHTML(labels.verifiedBy || 'Verified By')}:</strong> __________________________</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <strong>${escapeHTML(labels.principalSignature || 'Principal / Authorized Signature')}:</strong><br>
              ${sigImg ? `
                <div style="margin-top: 6px; margin-bottom: 2px;">
                  <img src="${sigImg}" style="max-height: 50px; max-width: 180px; object-fit: contain;">
                </div>
              ` : '<br>'}
              _________________________________________
            </div>
            <div>
              <strong>${escapeHTML(labels.dateLabel || 'Date')}:</strong> ____________________
            </div>
          </div>
        </div>
      `;
      break;

    default:
      return '';
  }

  return styleTag ? `${styleTag}<div id="${secId}">${innerHTML}</div>` : `<div id="${secId}">${innerHTML}</div>`;
}

// Statement Printable A4 HTML Builder (Strictly 2 A4 Pages Per Vehicle)
function buildSchoolBusStatementA4PagesHTML(schoolId, stmtDate, vehicleIds, customConfig = null, routeId = null) {
  const schoolObj = window.db.getSchools().find(s => s.id === Number(schoolId));
  const schoolName = schoolObj ? schoolObj.name : 'SCHOOL MANAGEMENT SYSTEM';
  const formattedDate = formatDate(stmtDate);

  const reportConfig = customConfig || window.db.getSchoolReportConfig(schoolId);
  const activeModules = (reportConfig.modules || []).filter(m => m.visible !== false);

  const page1Modules = activeModules.slice(0, 3);
  const page2Modules = activeModules.slice(3);

  const allVehicles = window.db.getVehicles();
  const allRoutes = window.db.getRoutes() || [];
  const allDrivers = window.db.getDrivers() || [];
  const allAttendants = window.db.getAttendants() || [];

  const headerCfg = reportConfig.headerConfig || {};
  const footerCfg = reportConfig.footerConfig || {};

  const displayHeaderTitle = (headerCfg.title && headerCfg.title.trim()) ? headerCfg.title.trim() : schoolName;
  const displayHeaderSubtitle = (headerCfg.subtitle && headerCfg.subtitle.trim()) ? headerCfg.subtitle.trim() : `SCHOOL BUS STATEMENT FOR: ${formattedDate}`;

  const rawFooterLeft = footerCfg.footerLeft !== undefined ? footerCfg.footerLeft : 'VMS PRO | Powered By SparkIT Techno Solutions Pvt. Ltd.';
  const displayFooterLeft = rawFooterLeft.replace(/{schoolName}/g, schoolName);

  const rawFooterMiddle = footerCfg.footerMiddle !== undefined ? footerCfg.footerMiddle : '{schoolName}';
  const displayFooterMiddle = rawFooterMiddle.replace(/{schoolName}/g, schoolName);

  const rawFooterRight = footerCfg.footerRight !== undefined ? footerCfg.footerRight : '{page}';

  const headerStyleTag = getScopedStyleTag('.report-header-styled', headerCfg.style);
  const footerStyleTag = getScopedStyleTag('.report-footer-styled', footerCfg.style);

  return vehicleIds.map((vId, idx) => {
    const v = allVehicles.find(veh => veh.id === vId);
    if (!v) return '';

    const rObj = allRoutes.find(r => Number(r.id) === Number(routeId) && Number(r.busId) === Number(v.id)) ||
      allRoutes.find(r => r.busId === v.id || (v.routeNumber && r.routeCode === v.routeNumber));
    const dObj = allDrivers.find(d => d.busId === v.id || (v.driver && d.name === v.driver));
    const aObj = allAttendants.find(a => a.busId === v.id || (v.attendant && a.name === v.attendant));

    const opData = window.db.getBusWiseMonthlyReport(v.schoolId, v.id, rObj?.id, stmtDate);

    const busNumStr = v.busNo ? (v.busNo.replace(/\D/g, '').slice(-2) || String(v.id)) : String(v.id);
    const routeCodeStr = rObj ? rObj.routeCode : (v.routeNumber || '02');
    const routeNameStr = rObj ? `${rObj.start || 'Start'} - ${rObj.destination || 'End'}` : 'Local Route';
    const driverNameStr = dObj ? dObj.name : (v.driver || 'Unassigned');
    const attendantNameStr = aObj ? aObj.name : (v.attendant || 'Unassigned');

    const openingKm = opData.openingKm || 0;
    const closingKm = opData.closingKm || (openingKm + opData.totalKm);
    const totalKm = closingKm >= openingKm ? (closingKm - openingKm) : opData.totalKm;

    const isPartBVisible = activeModules.some(m => m.key === 'part_b_bvb' && m.visible !== false);
    const totalExpA = opData.totalExpenseA || 0;
    const totalExpB = opData.totalExpenseB || 0;
    const totalExpAB = totalExpA + totalExpB;
    const totalColl = opData.totalCollection || 0;
    const effectiveTotalExp = isPartBVisible ? totalExpAB : totalExpA;
    const surplusDef = totalColl - effectiveTotalExp;

    let surplusDefStatusText = 'BALANCED';
    let surplusDefColor = '#0f172a';
    if (surplusDef > 0) {
      surplusDefStatusText = 'SURPLUS';
      surplusDefColor = '#16a34a';
    } else if (surplusDef < 0) {
      surplusDefStatusText = 'DEFICIT';
      surplusDefColor = '#dc2626';
    }

    const dataContext = {
      v, busNumStr, routeCodeStr, routeNameStr, driverNameStr, attendantNameStr,
      openingKm, closingKm, totalKm, opData, totalExpA, totalExpB, totalExpAB,
      totalColl, surplusDef, surplusDefStatusText, surplusDefColor, isPartBVisible
    };

    const isLastVehicle = (idx === vehicleIds.length - 1);

    const page1ContentHTML = page1Modules.map(m => renderStatementModuleSection(m, dataContext)).join('');
    const page2ContentHTML = page2Modules.map(m => renderStatementModuleSection(m, dataContext)).join('');

    const page1FooterRightText = rawFooterRight.replace(/{page}/g, '1').replace(/{totalPages}/g, '2').replace(/{busNo}/g, v.busNo || '');
    const page2FooterRightText = rawFooterRight.replace(/{page}/g, '2').replace(/{totalPages}/g, '2').replace(/{busNo}/g, v.busNo || '');

    return `
      ${headerStyleTag}
      ${footerStyleTag}
      <!-- ==========================================
           PAGE 1 OF 2 FOR VEHICLE: ${escapeHTML(v.busNo)}
           ========================================== -->
      <div class="a4-statement-page" style="page-break-after: always; break-after: page; background: #ffffff; color: #000000; padding: 28px 36px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.4; border: none; margin-bottom: 24px; border-radius: 4px; max-width: 800px; margin-left: auto; margin-right: auto; min-height: 275mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
        
        <div>
          <!-- PAGE 1 HEADER -->
          <div class="report-header-styled" style="text-align: center; margin-bottom: 16px;">
            <h1 style="font-size: 24px; font-weight: 800; color: #000000; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.03em;">
              ${escapeHTML(displayHeaderTitle)}
            </h1>
            
            <div style="font-size: 15px; font-weight: 700; color: #000000; margin-bottom: 6px; text-transform: uppercase;">
              ${escapeHTML(displayHeaderSubtitle)}
            </div>

            <div style="font-size: 14px; font-weight: 700; color: #000000;">
              Vehicle No.: ${escapeHTML(v.busNo)} &nbsp;&nbsp;|&nbsp;&nbsp; Route Code: ${escapeHTML(routeCodeStr)}
            </div>
          </div>

          <hr style="border: none; border-top: 2px solid #000000; margin: 12px 0 20px 0;">

          <!-- DYNAMIC PAGE 1 SECTIONS -->
          ${page1ContentHTML}
        </div>

        <!-- PAGE 1 FOOTER -->
        <div class="report-footer-styled" style="border-top: 1px solid #000000; padding-top: 6px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
          <span style="flex: 1; text-align: left;">${escapeHTML(displayFooterLeft)}</span>
          <span style="flex: 1; text-align: center; font-weight: 600; color: #000000;">${escapeHTML(displayFooterMiddle)}</span>
          <span style="flex: 1; text-align: right; font-weight: 700; color: #000000;">${escapeHTML(page1FooterRightText)}</span>
        </div>

      </div>

      <!-- ==========================================
           PAGE 2 OF 2 FOR VEHICLE: ${escapeHTML(v.busNo)}
           ========================================== -->
      <div class="a4-statement-page" style="page-break-after: ${isLastVehicle ? 'avoid' : 'always'}; break-after: ${isLastVehicle ? 'avoid' : 'page'}; background: #ffffff; color: #000000; padding: 28px 36px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.4; border: none; margin-bottom: 24px; border-radius: 4px; max-width: 800px; margin-left: auto; margin-right: auto; min-height: 275mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
        
        <div>
          <!-- DYNAMIC PAGE 2 SECTIONS -->
          ${page2ContentHTML}
        </div>

        <!-- PAGE 2 FOOTER -->
        <div class="report-footer-styled" style="border-top: 1px solid #000000; padding-top: 6px; margin-top: 20px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
          <span style="flex: 1; text-align: left;">${escapeHTML(displayFooterLeft)}</span>
          <span style="flex: 1; text-align: center; font-weight: 600; color: #000000;">${escapeHTML(displayFooterMiddle)}</span>
          <span style="flex: 1; text-align: right; font-weight: 700; color: #000000;">${escapeHTML(page2FooterRightText)}</span>
        </div>

      </div>
    `;
  }).join('');
}

// Build Structure-Only Template Preview (Only Labels & Headings) for Report Builder
function buildSchoolBusStatementTemplatePreviewHTML(schoolId, customConfig = null) {
  const schoolObj = window.db.getSchools().find(s => s.id === Number(schoolId));
  const schoolName = schoolObj ? schoolObj.name : 'SCHOOL MANAGEMENT SYSTEM';

  const reportConfig = customConfig || window.db.getSchoolReportConfig(schoolId);
  const activeModules = (reportConfig.modules || []).filter(m => m.visible !== false);

  const page1Modules = activeModules.slice(0, 3);
  const page2Modules = activeModules.slice(3);

  const placeholderText = '-----';

  const renderTemplateSection = (mod) => {
    if (mod.visible === false) return '';
    const labels = Object.fromEntries(
      Object.entries(mod.labels || {}).map(([labelKey, labelValue]) => [labelKey, cleanReportLabelText(labelValue)])
    );
    const secId = `sec-tpl-${mod.key}`;
    const styleTag = getScopedStyleTag(`#${secId}`, mod.style);

    let innerHTML = '';
    switch (mod.key) {
      case 'vehicle_details':
        innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '1. VEHICLE DETAILS')}
            </div>
            <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
              <tbody>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.busNumber || 'Bus Number')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.regNumber || 'Registration Number')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.make || 'Make')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.model || 'Model')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.type || 'Vehicle Type')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.ownership || 'Ownership')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.seatingCapacity || 'Seating Capacity')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.driver || 'Driver')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.hiredDriver || 'Hired Driver Name')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.conductor || 'Conductor / Attendant')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.routeCode || 'Route Code')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'km_trip_details':
        innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '2. KM / TRIP DETAILS')}
            </div>
            <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
              <tbody>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; width: 45%; font-weight: 600;">${escapeHTML(labels.openingKm || 'Opening KM')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.schoolTripKm || 'School Trip KM')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.additionalTripKm || 'Additional Trip KM')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.totalKm || 'Total KM (Closing - Opening)')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.closingKm || 'Closing KM')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.avgMileage || 'Average Mileage (km/l)')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.totalDiesel || 'Total Fuel Required (L)')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.routeDetails || 'Route Details')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td></tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'expense_part_a':
        innerHTML = `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '3. EXPENSE SECTION (PART A)')}
            </div>
            <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">Expense Category</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">Description</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.fuel || 'Fuel')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.maintenance || 'Maintenance')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.salary || 'Salary')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.busHiring || 'Bus Hiring')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr style="background: #fef2f2;"><td colspan="2" style="padding: 7px 12px; border: 1px solid #000000; font-weight: 800; color: #dc2626;">${escapeHTML(labels.totalExpenseA || 'TOTAL EXPENSE (A)')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right; font-weight: 800; color: #dc2626;">₹ ${placeholderText}</td></tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'income_collection':
        innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '4. INCOME / COLLECTION SECTION')}
            </div>
            <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">Collection Category</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">Description</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.studentCollection || 'Student Collection')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.otherCollection || 'Other Collection')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr style="background: #eff6ff;"><td colspan="2" style="padding: 7px 12px; border: 1px solid #000000; font-weight: 800; color: #2563eb;">${escapeHTML(labels.totalCollection || 'TOTAL COLLECTION')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right; font-weight: 800; color: #2563eb;">₹ ${placeholderText}</td></tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'part_b_bvb':
        innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; background: #0f172a; color: #ffffff; padding: 6px 10px; border: 1px solid #000000; margin-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '5. PART B — BVB')}
            </div>
            <table class="custom-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">BVB Category</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: left;">Description</th>
                  <th style="padding: 6px 12px; border: 1px solid #000000; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.taxPerMonth || 'Tax Per Month')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.insurancePerMonth || 'Insurance Per Month')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.fitnessTest || 'Fitness Test Expense')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.gpsFee || 'GPS Fee')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.maintenanceCost || 'Maintenance Cost')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr><td style="padding: 6px 12px; border: 1px solid #000000; font-weight: 600;">${escapeHTML(labels.speedTestFee || 'Speed Test Fee')}</td><td style="padding: 6px 12px; border: 1px solid #000000; color: #475569;">-----</td><td style="padding: 6px 12px; border: 1px solid #000000; text-align: right; color: #475569;">₹ ${placeholderText}</td></tr>
                <tr style="background: #f8fafc;"><td colspan="2" style="padding: 7px 12px; border: 1px solid #000000; font-weight: 800;">${escapeHTML(labels.totalBvb || 'TOTAL BVB (B)')}</td><td style="padding: 7px 12px; border: 1px solid #000000; text-align: right; font-weight: 800;">₹ ${placeholderText}</td></tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'financial_summary':
        const isPartBInTemplate = activeModules.some(m => m.key === 'part_b_bvb' && m.visible !== false);
        innerHTML = `
          <div style="border: 2px solid #000000; padding: 14px 18px; margin-bottom: 24px; background: #ffffff;">
            <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #000000; padding-bottom: 6px; letter-spacing: 0.03em;">
              ${escapeHTML(mod.title || '6. FINAL FINANCIAL STATEMENT SUMMARY')}
            </div>
            
            ${isPartBInTemplate ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-bottom: 12px;">
                <div>${escapeHTML(labels.totalExpA || 'TOTAL EXPENSE (A)')}: <strong>₹ ${placeholderText}</strong></div>
                <div>${escapeHTML(labels.totalExpB || 'TOTAL BVB (B)')}: <strong>₹ ${placeholderText}</strong></div>
                <div>${escapeHTML(labels.totalExpAB || 'TOTAL EXPENSE (A+B)')}: <strong>₹ ${placeholderText}</strong></div>
                <div>${escapeHTML(labels.totalCollection || 'TOTAL COLLECTION')}: <strong style="color: #2563eb;">₹ ${placeholderText}</strong></div>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 12px;">
                <div>${escapeHTML(labels.totalExpA || 'TOTAL EXPENSE (A)')}: <strong>₹ ${placeholderText}</strong></div>
                <div>${escapeHTML(labels.totalCollection || 'TOTAL COLLECTION')}: <strong style="color: #2563eb;">₹ ${placeholderText}</strong></div>
              </div>
            `}

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 900; background: #f8fafc; padding: 10px 14px; border: 2px solid #000000;">
              <span>${escapeHTML(labels.financialResult || 'FINANCIAL RESULT')}:</span>
              <span style="color: #2563eb;">RESULT: ₹ ${placeholderText}</span>
            </div>
          </div>
        `;
        break;

      case 'verification_signatures':
        const templateSigImg = mod.signatureImage || null;
        const currentTmpUser = window.auth ? window.auth.getCurrentUser() : null;
        const tmpPreparedByName = currentTmpUser ? (currentTmpUser.name || currentTmpUser.username || 'System User') : 'Authorized Staff';

        innerHTML = `
          <div style="border-top: 1px dashed #000000; padding-top: 16px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div><strong>${escapeHTML(labels.preparedBy || 'Prepared By')}:</strong> <span style="font-weight: 700; border-bottom: 1px solid #000000; padding: 0 6px 2px 6px;">${escapeHTML(tmpPreparedByName)}</span></div>
              <div><strong>${escapeHTML(labels.verifiedBy || 'Verified By')}:</strong> __________________________</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <strong>${escapeHTML(labels.principalSignature || 'Principal / Authorized Signature')}:</strong><br>
                ${templateSigImg ? `
                  <div style="margin-top: 6px; margin-bottom: 2px;">
                    <img src="${templateSigImg}" style="max-height: 48px; max-width: 180px; object-fit: contain;">
                  </div>
                ` : '<br>'}
                _________________________________________
              </div>
              <div>
                <strong>${escapeHTML(labels.dateLabel || 'Date')}:</strong> ____________________
              </div>
            </div>
          </div>
        `;
        break;

      default:
        return '';
    }

    return styleTag ? `${styleTag}<div id="${secId}">${innerHTML}</div>` : `<div id="${secId}">${innerHTML}</div>`;
  };

  const headerCfg = reportConfig.headerConfig || {};
  const footerCfg = reportConfig.footerConfig || {};

  const headerStyleTag = getScopedStyleTag('.report-header-styled', headerCfg.style);
  const footerStyleTag = getScopedStyleTag('.report-footer-styled', footerCfg.style);

  const displayHeaderTitle = (headerCfg.title && headerCfg.title.trim()) ? headerCfg.title.trim() : schoolName;
  const displayHeaderSubtitle = (headerCfg.subtitle && headerCfg.subtitle.trim()) ? headerCfg.subtitle.trim() : 'SCHOOL BUS STATEMENT — REPORT TEMPLATE PREVIEW';

  const rawFooterLeft = footerCfg.footerLeft !== undefined ? footerCfg.footerLeft : 'VMS PRO | Powered By SparkIT Techno Solutions Pvt. Ltd.';
  const displayFooterLeft = rawFooterLeft.replace(/{schoolName}/g, schoolName);

  const rawFooterMiddle = footerCfg.footerMiddle !== undefined ? footerCfg.footerMiddle : '{schoolName}';
  const displayFooterMiddle = rawFooterMiddle.replace(/{schoolName}/g, schoolName);

  const rawFooterRight = footerCfg.footerRight !== undefined ? footerCfg.footerRight : '{page}';

  const page1FooterRightText = rawFooterRight.replace(/{page}/g, '1').replace(/{totalPages}/g, '2').replace(/{busNo}/g, 'Bus No.');
  const page2FooterRightText = rawFooterRight.replace(/{page}/g, '2').replace(/{totalPages}/g, '2').replace(/{busNo}/g, 'Bus No.');

  const page1ContentHTML = page1Modules.map(m => renderTemplateSection(m)).join('');
  const page2ContentHTML = page2Modules.map(m => renderTemplateSection(m)).join('');

  return `
    ${headerStyleTag}
    ${footerStyleTag}
    <div class="a4-statement-page" style="background: #ffffff; color: #000000; padding: 28px 36px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.4; border: none; margin-bottom: 24px; border-radius: 4px; width: 100%; max-width: 800px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <div>
        <div class="report-header-styled" style="text-align: center; margin-bottom: 16px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #000000; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.03em;">
            ${escapeHTML(displayHeaderTitle)}
          </h1>
          <div style="font-size: 14px; font-weight: 700; color: #000000; margin-bottom: 4px; text-transform: uppercase;">
            ${escapeHTML(displayHeaderSubtitle)}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #475569;">
            Vehicle No.: ----- &nbsp;&nbsp;|&nbsp;&nbsp; Route Code: -----
          </div>
        </div>
        <hr style="border: none; border-top: 2px solid #000000; margin: 12px 0 20px 0;">
        ${page1ContentHTML}
      </div>
      <div class="report-footer-styled" style="border-top: 1px solid #000000; padding-top: 6px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
        <span style="flex: 1; text-align: left;">${escapeHTML(displayFooterLeft)}</span>
        <span style="flex: 1; text-align: center; font-weight: 600; color: #000000;">${escapeHTML(displayFooterMiddle)}</span>
        <span style="flex: 1; text-align: right; font-weight: 700; color: #000000;">${escapeHTML(page1FooterRightText)}</span>
      </div>
    </div>

    ${page2Modules.length > 0 ? `
      <div class="a4-statement-page" style="background: #ffffff; color: #000000; padding: 28px 36px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; line-height: 1.4; border: none; margin-bottom: 24px; border-radius: 4px; width: 100%; max-width: 800px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div>
          ${page2ContentHTML}
        </div>
        <div class="report-footer-styled" style="border-top: 1px solid #000000; padding-top: 6px; margin-top: 20px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
          <span style="flex: 1; text-align: left;">${escapeHTML(displayFooterLeft)}</span>
          <span style="flex: 1; text-align: center; font-weight: 600; color: #000000;">${escapeHTML(displayFooterMiddle)}</span>
          <span style="flex: 1; text-align: right; font-weight: 700; color: #000000;">${escapeHTML(page2FooterRightText)}</span>
        </div>
      </div>
    ` : ''}
  `;
}

// Full-Screen Report Preview Modal Renderer with Zoom In / Out
function previewSchoolBusStatement(schoolIdParam = null, stmtDateParam = null, vehicleIdsParam = null) {
  let schoolId = schoolIdParam;
  let stmtDate = stmtDateParam;
  let vehicleIds = vehicleIdsParam;
  let routeId = null;

  if (!schoolId || !stmtDate || !vehicleIds) {
    const inputs = validateStatementInputs();
    if (!inputs) return;
    schoolId = inputs.schoolId;
    stmtDate = inputs.stmtDate;
    vehicleIds = inputs.vehicleIds;
    routeId = inputs.routeId;
  }

  window.currentStatementPreviewContext = {
    schoolId: Number(schoolId),
    stmtDate: String(stmtDate),
    vehicleIds: Array.isArray(vehicleIds) ? vehicleIds.map(Number) : [],
    routeId: routeId ? Number(routeId) : null
  };

  const html = buildSchoolBusStatementA4PagesHTML(schoolId, stmtDate, vehicleIds, null, routeId);
  openFullscreenStatementModal(html, schoolId, stmtDate, vehicleIds);
}

function openFullscreenStatementModal(htmlContent, schoolId, stmtDate, vehicleIds) {
  let modal = document.getElementById('fullscreen-statement-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fullscreen-statement-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#334155;z-index:999999;display:flex;flex-direction:column;overflow:hidden;';
    document.body.appendChild(modal);
  }

  window.currentStatementZoom = 1.0;
  modal.innerHTML = '';

  // --- Toolbar (static markup only — no user data injected) ---
  const safeCount = Number(vehicleIds.length);
  const toolbar = document.createElement('div');
  toolbar.className = 'no-print';
  toolbar.style.cssText = 'background:#0f172a;color:#ffffff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);z-index:10;width:100%;box-sizing:border-box;flex-wrap:nowrap;gap:16px;';
  toolbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
      <i class="fa-solid fa-file-invoice" style="color:var(--color-income);font-size:20px;"></i>
      <div>
        <h3 style="font-size:16px;font-weight:800;margin:0;color:#ffffff;">Printable Statement Report Preview</h3>
        <span style="font-size:12px;color:#94a3b8;">Full-Screen A4 Preview (<span id="fsm-page-count"></span> Page(s))</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;background:#1e293b;padding:6px 14px;border-radius:8px;border:1px solid #475569;flex-shrink:0;">
      <span style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Zoom:</span>
      <button type="button" id="fsm-zoom-out" title="Zoom Out" style="padding:4px 10px;background:#334155;color:white;border:1px solid #64748b;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><i class="fa-solid fa-minus"></i></button>
      <span id="statement-report-zoom-val" style="font-size:13px;font-weight:800;color:#38bdf8;min-width:45px;text-align:center;">100%</span>
      <button type="button" id="fsm-zoom-in" title="Zoom In" style="padding:4px 10px;background:#334155;color:white;border:1px solid #64748b;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"><i class="fa-solid fa-plus"></i></button>
      <button type="button" id="fsm-zoom-reset" title="Reset Zoom to 100%" style="padding:4px 12px;font-size:11px;background:#475569;color:white;border:1px solid #64748b;border-radius:6px;cursor:pointer;font-weight:600;">Reset 100%</button>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
      <button type="button" id="fsm-print-btn" style="width:auto;background:var(--color-income);color:#ffffff;border:none;font-size:13px;padding:8px 16px;border-radius:8px;font-weight:700;white-space:nowrap;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-print"></i> Print (A4)</button>
      <button type="button" id="fsm-excel-btn" style="width:auto;background:var(--color-profit);color:#ffffff;border:none;font-size:13px;padding:8px 16px;border-radius:8px;font-weight:700;white-space:nowrap;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-file-excel"></i> Export Excel</button>
      <button type="button" id="fsm-close-btn" style="width:auto;background:#dc2626;color:#ffffff;border:none;font-size:13px;padding:8px 16px;border-radius:8px;font-weight:700;white-space:nowrap;flex-shrink:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-xmark" style="font-size:14px;"></i> Close Preview</button>
    </div>
  `;
  modal.appendChild(toolbar);

  // Set page count via textContent — no injection
  const pageCountEl = toolbar.querySelector('#fsm-page-count');
  if (pageCountEl) pageCountEl.textContent = String(safeCount);

  // Wire buttons via addEventListener — no inline onclick with user data
  const safeSchoolId  = Number(schoolId);
  const safeStmtDate  = String(stmtDate).replace(/[^0-9\-]/g, '');
  const safeVehicleIds = vehicleIds.map(Number);

  toolbar.querySelector('#fsm-zoom-out').addEventListener('click', () => changeStatementReportZoom(-0.1));
  toolbar.querySelector('#fsm-zoom-in').addEventListener('click',  () => changeStatementReportZoom(0.1));
  toolbar.querySelector('#fsm-zoom-reset').addEventListener('click', () => resetStatementReportZoom());
  toolbar.querySelector('#fsm-print-btn').addEventListener('click', () => printSelectedBusStatement(safeSchoolId, safeStmtDate, safeVehicleIds));
  toolbar.querySelector('#fsm-excel-btn').addEventListener('click', () => exportStatementToExcel());
  toolbar.querySelector('#fsm-close-btn').addEventListener('click', () => closeFullscreenStatementModal());

  // --- Scrollable canvas ---
  const canvas = document.createElement('div');
  canvas.style.cssText = 'flex:1;overflow:auto;padding:40px 20px;display:flex;justify-content:center;background:#475569;';

  const zoomWrapper = document.createElement('div');
  zoomWrapper.id = 'statement-report-zoom-wrapper';
  zoomWrapper.style.cssText = 'transform-origin:top center;transition:transform 0.15s ease-out;';
  // htmlContent is produced entirely by buildSchoolBusStatementA4PagesHTML which
  // escapes all user-supplied strings via escapeHTML — safe to set as innerHTML here.
  zoomWrapper.innerHTML = htmlContent;

  canvas.appendChild(zoomWrapper);
  modal.appendChild(canvas);

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFullscreenStatementModal() {
  const modal = document.getElementById('fullscreen-statement-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function refreshOpenStatementPreview() {
  const modal = document.getElementById('fullscreen-statement-modal');
  const context = window.currentStatementPreviewContext;

  if (!modal || !context || modal.style.display === 'none') return false;

  const zoom = window.currentStatementZoom || 1.0;
  const html = buildSchoolBusStatementA4PagesHTML(
    context.schoolId,
    context.stmtDate,
    context.vehicleIds,
    null,
    context.routeId
  );

  const wrapper = document.getElementById('statement-report-zoom-wrapper');
  if (wrapper) {
    wrapper.innerHTML = html;
    window.currentStatementZoom = zoom;
    applyStatementReportZoom();
  }

  return true;
}

function changeStatementReportZoom(delta) {
  window.currentStatementZoom = Math.max(0.4, Math.min(2.5, (window.currentStatementZoom || 1.0) + delta));
  applyStatementReportZoom();
}

function resetStatementReportZoom() {
  window.currentStatementZoom = 1.0;
  applyStatementReportZoom();
}

function applyStatementReportZoom() {
  const wrapper = document.getElementById('statement-report-zoom-wrapper');
  const label = document.getElementById('statement-report-zoom-val');
  if (wrapper) wrapper.style.transform = `scale(${window.currentStatementZoom || 1.0})`;
  if (label) label.innerText = `${Math.round((window.currentStatementZoom || 1.0) * 100)}%`;
}

window.previewSchoolBusStatement = previewSchoolBusStatement;
window.closeFullscreenStatementModal = closeFullscreenStatementModal;
window.refreshOpenStatementPreview = refreshOpenStatementPreview;
window.changeStatementReportZoom = changeStatementReportZoom;
window.resetStatementReportZoom = resetStatementReportZoom;

// Generate & Save Statement Snapshot
function generateAndSaveStatement() {
  const inputs = validateStatementInputs();
  if (!inputs) return;

  const schoolObj = window.db.getSchools().find(s => s.id === inputs.schoolId);
  const user = window.auth.getCurrentUser();

  let totalCollSum = 0;
  let totalExpSum = 0;
  let totalKmSum = 0;

  inputs.vehicleIds.forEach(vId => {
    const route = window.db.getRoutes(inputs.schoolId).find(r => Number(r.busId) === Number(vId));
    const opData = window.db.getBusWiseMonthlyReport(inputs.schoolId, vId, route?.id, inputs.stmtDate);
    totalCollSum += (opData.totalCollection || 0);
    totalExpSum += (opData.totalExpenseAB || 0);
    totalKmSum += (opData.totalKm || 0);
  });

  const statementSnapshot = {
    id: Date.now(),
    schoolId: inputs.schoolId,
    schoolName: schoolObj ? schoolObj.name : 'School Campus',
    statementDate: inputs.stmtDate,
    vehicleIds: inputs.vehicleIds,
    totalKm: totalKmSum,
    totalCollection: totalCollSum,
    totalExpense: totalExpSum,
    surplusDeficit: totalCollSum - totalExpSum,
    status: 'Generated',
    generatedDate: new Date().toISOString(),
    generatedBy: user ? `${user.name} (${user.role})` : 'System User'
  };

  window.db.saveSchoolStatement(statementSnapshot);
  showToast('School Bus Statement snapshot saved successfully to history', 'success');

  if (typeof renderReportsPage === 'function') renderReportsPage();
}

function updateStatementStatus(id, newStatus) {
  window.db.updateStatementStatus(id, newStatus);
  showToast(`Statement status updated to ${newStatus}`, 'info');
  if (typeof renderReportsPage === 'function') renderReportsPage();
}

function deleteSavedStatement(id) {
  const numId = Number(id);
  const stmt = window.db.getSchoolStatements().find(s => s.id === numId);
  const stmtTitle = stmt ? `${stmt.schoolName} (${stmt.statementDate})` : 'Statement Snapshot';

  showDeleteConfirmationModal({
    itemTitle: stmtTitle,
    onConfirm: () => {
      window.db.deleteSchoolStatement(numId);
      showToast('Statement snapshot deleted', 'info');
      if (typeof renderReportsPage === 'function') renderReportsPage();
    }
  });
}

function previewSavedStatement(id) {
  const stmt = window.db.getSchoolStatements().find(s => s.id === Number(id));
  if (!stmt) return;

  const html = buildSchoolBusStatementA4PagesHTML(stmt.schoolId, stmt.statementDate, stmt.vehicleIds);

  const modalBody = document.getElementById('generic-modal-body');
  const modalTitle = document.getElementById('generic-modal-title');
  modalTitle.innerHTML = `<i class="fa-solid fa-file-invoice" style="color: var(--color-income); margin-right: 6px;"></i> Saved Statement Snapshot — ${escapeHTML(stmt.schoolName)}`;

  const safeId = Number(stmt.id);
  const infoDiv = document.createElement('div');
  infoDiv.className = 'no-print';
  infoDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;background:var(--color-bg);padding:12px 16px;border-radius:8px;border:1px solid var(--color-border);margin-bottom:16px;';
  infoDiv.innerHTML = `<span style="font-size:13px;font-weight:600;color:var(--color-text-secondary);">Statement Date: <strong>${escapeHTML(formatDate(stmt.statementDate))}</strong> | Status: <strong>${escapeHTML(stmt.status)}</strong></span>`;
  const printBtn = document.createElement('button');
  printBtn.className = 'btn-primary motion-scale-press';
  printBtn.style.cssText = 'width:auto;padding:6px 14px;font-size:13px;';
  printBtn.innerHTML = '<i class="fa-solid fa-print"></i> Print Statement';
  printBtn.onclick = () => printSavedStatement(safeId);
  infoDiv.appendChild(printBtn);

  const previewDiv = document.createElement('div');
  previewDiv.className = 'statement-preview-container';
  previewDiv.style.cssText = 'background:#cbd5e1;padding:20px;border-radius:10px;max-height:70vh;overflow-y:auto;';
  previewDiv.innerHTML = html;

  modalBody.innerHTML = '';
  modalBody.appendChild(infoDiv);
  modalBody.appendChild(previewDiv);

  openModal('generic-modal');
}

// Print Handler
function printSelectedBusStatement(schoolIdParam = null, stmtDateParam = null, vehicleIdsParam = null) {
  let schoolId = schoolIdParam;
  let stmtDate = stmtDateParam;
  let vehicleIds = vehicleIdsParam;

  if (!schoolId || !stmtDate || !vehicleIds) {
    const inputs = validateStatementInputs();
    if (!inputs) return;
    schoolId = inputs.schoolId;
    stmtDate = inputs.stmtDate;
    vehicleIds = inputs.vehicleIds;
  }

  const html = buildSchoolBusStatementA4PagesHTML(schoolId, stmtDate, vehicleIds);

  let printContainer = document.getElementById('statement-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'statement-print-container';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = html;
  document.body.classList.add('printing-statement-active');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-statement-active');
    printContainer.innerHTML = '';
  }, 500);
}

function printSavedStatement(id) {
  const stmt = window.db.getSchoolStatements().find(s => s.id === Number(id));
  if (!stmt) return;

  const html = buildSchoolBusStatementA4PagesHTML(stmt.schoolId, stmt.statementDate, stmt.vehicleIds);

  let printContainer = document.getElementById('statement-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'statement-print-container';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = html;
  document.body.classList.add('printing-statement-active');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-statement-active');
    printContainer.innerHTML = '';
  }, 500);
}

// Excel Export Handler
function exportStatementToExcel() {
  const inputs = validateStatementInputs();
  if (!inputs) return;

  const schoolObj = window.db.getSchools().find(s => s.id === inputs.schoolId);
  const schoolName = schoolObj ? schoolObj.name : 'School Campus';
  const allVehicles = window.db.getVehicles();
  const allRoutes = window.db.getRoutes() || [];
  const allDrivers = window.db.getDrivers() || [];

  const csvRows = [
    ['SCHOOL BUS STATEMENT EXECUTIVE EXPORT'],
    ['School Name:', schoolName],
    ['Statement Date:', inputs.stmtDate],
    ['Generated On:', new Date().toLocaleString()],
    [],
    [
      'Bus Number', 'Registration No', 'Make', 'Model', 'Vehicle Type', 'Seating Capacity', 'Driver', 'Conductor / Attendant', 'Route Code', 'Route',
      'Opening KM', 'Closing KM', 'Total KM', 'No of Trips',
      'Fuel Expense (₹)', 'Maintenance Cost (₹)', 'Salary (₹)', 'Hiring Charges (₹)', 'TOTAL EXPENSE (A) (₹)',
      'School Trip Collection (₹)', 'Other Trip Collection (₹)', 'TOTAL COLLECTION (₹)',
      'BVB Tax/Mo', 'BVB Insurance/Mo', 'BVB Fitness', 'BVB GPS', 'BVB Maintenance', 'BVB Speed Test', 'TOTAL BVB (B) (₹)',
      'TOTAL EXPENSE (A+B) (₹)', 'SURPLUS / DEFICIT (₹)'
    ]
  ];

  inputs.vehicleIds.forEach(vId => {
    const v = allVehicles.find(veh => veh.id === vId);
    if (!v) return;
    const rObj = allRoutes.find(r => r.busId === v.id || (v.routeNumber && r.routeCode === v.routeNumber));
    const dObj = allDrivers.find(d => d.busId === v.id || (v.driver && d.name === v.driver));
    const opData = window.db.getBusWiseMonthlyReport(v.schoolId, v.id, rObj?.id, inputs.stmtDate);

    const openingKm = opData.openingKm || 0;
    const closingKm = opData.closingKm || (openingKm + opData.totalKm);
    const totalKm = closingKm >= openingKm ? (closingKm - openingKm) : opData.totalKm;

    const totalExpA = opData.totalExpenseA || 0;
    const totalExpB = opData.totalExpenseB || 0;
    const totalExpAB = totalExpA + totalExpB;
    const totalColl = opData.totalCollection || 0;
    const surplusDef = totalColl - totalExpAB;

    csvRows.push([
      v.busNo ? (v.busNo.replace(/\D/g, '').slice(-2) || v.id) : v.id,
      v.busNo,
      v.manufacturer || 'Eicher',
      v.model || 'Starline',
      v.type || 'School Bus',
      v.seats || 40,
      dObj ? dObj.name : (v.driver || 'Unassigned'),
      v.attendant || 'Unassigned',
      rObj ? rObj.routeCode : (v.routeNumber || '02'),
      rObj ? `${rObj.start} - ${rObj.destination}` : 'Local Route',
      openingKm,
      closingKm,
      totalKm,
      2,
      opData.fuelExpense || 0,
      opData.maintenanceCost || 0,
      opData.salary || 0,
      opData.busHiringCharges || 0,
      totalExpA,
      opData.schoolTripIncome || 0,
      opData.otherTripIncome || 0,
      totalColl,
      opData.bvbTaxPerMonth || 0,
      opData.bvbInsurancePerMonth || 0,
      opData.bvbFitnessExpense || 0,
      opData.bvbGpsFee || 0,
      opData.bvbMaintenanceCost || 0,
      opData.bvbSpeedTestFee || 0,
      totalExpB,
      totalExpAB,
      surplusDef
    ]);
  });

  const fileName = `School_Bus_Statement_${schoolName.replace(/\s+/g, '_')}_${inputs.stmtDate}.csv`;
  exportToCSV(fileName, csvRows);
}

window.renderSchoolBusStatementView = renderSchoolBusStatementView;
window.onStatementRouteChange = onStatementRouteChange;
window.onStatementSchoolChange = onStatementSchoolChange;
window.toggleAllStatementVehicles = toggleAllStatementVehicles;
window.previewSchoolBusStatement = previewSchoolBusStatement;
window.generateAndSaveStatement = generateAndSaveStatement;
window.updateStatementStatus = updateStatementStatus;
window.deleteSavedStatement = deleteSavedStatement;
window.previewSavedStatement = previewSavedStatement;
window.printSelectedBusStatement = printSelectedBusStatement;
window.printSavedStatement = printSavedStatement;
window.exportStatementToExcel = exportStatementToExcel;
