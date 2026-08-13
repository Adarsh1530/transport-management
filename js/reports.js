/* ==========================================
   REPORTS & ANALYTICS EXPORT MODULE
   ========================================== */

let selectedReportSchoolId = null;
let currentReportSubTab = 'executive'; // 'executive' or 'statement'

function selectReportSchool(schoolId) {
  selectedReportSchoolId = schoolId ? Number(schoolId) : null;
  renderReportsPage();
}

function switchReportSubTab(tabName) {
  currentReportSubTab = tabName;
  renderReportsPage();
}

function renderReportsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('reports-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;
  const canViewExpenses = window.auth.canViewExpenses(user.role);

  const allSchools = window.db.getSchools(isSchoolUser ? schoolId : null);
  const targetSchoolId = isSchoolUser ? schoolId : selectedReportSchoolId;

  const activeSchool = targetSchoolId ? allSchools.find(s => s.id === targetSchoolId) : null;
  const displayedSchools = activeSchool ? [activeSchool] : allSchools;

  const vehicles = window.db.getVehicles(targetSchoolId);
  const renewals = window.db.getRenewals(targetSchoolId);
  const totalIncome = window.db.getTotalIncome(targetSchoolId, user.role);
  const totalExpense = window.db.getTotalExpenses(targetSchoolId, user.role);
  const totalProfit = totalIncome - totalExpense;

  const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
  const maintVehicles = vehicles.filter(v => v.status === 'Maintenance').length;

  let countExpired = 0, countDueToday = 0, countUnder10 = 0, countUnder30 = 0, countUpcoming = 0;

  renewals.forEach(r => {
    const st = getRenewalStatus(r.renewalDate);
    if (st.days < 0) countExpired++;
    else if (st.days === 0) countDueToday++;
    else if (st.days <= 10) countUnder10++;
    else if (st.days <= 30) countUnder30++;
    else countUpcoming++;
  });

  const subTabHeader = `
    <div class="no-print" style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">
      <button class="tab-pill ${currentReportSubTab === 'executive' ? 'active' : ''}" onclick="switchReportSubTab('executive')" style="font-size: 13.5px; padding: 8px 18px; border-radius: 8px; font-weight: 700;">
        <i class="fa-solid fa-chart-line" style="margin-right: 6px;"></i> Executive System Reports
      </button>
      <button class="tab-pill ${currentReportSubTab === 'statement' ? 'active' : ''}" onclick="switchReportSubTab('statement')" style="font-size: 13.5px; padding: 8px 18px; border-radius: 8px; font-weight: 700;">
        <i class="fa-solid fa-file-invoice-dollar" style="margin-right: 6px; color: var(--color-income);"></i> School Bus Statement Generator
      </button>
    </div>
  `;

  if (currentReportSubTab === 'statement') {
    container.innerHTML = `
      ${subTabHeader}
      ${window.renderSchoolBusStatementView ? window.renderSchoolBusStatementView() : '<div class="card" style="padding: 20px;">Statement module loading...</div>'}
    `;
    return;
  }

  container.innerHTML = `
    <!-- Dedicated Print Header (Only visible on paper / PDF print output) -->
    <div class="print-header" style="display: none; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">VMS PRO Transport System Report</h2>
          <p style="font-size: 13px; color: #475569; margin: 0;">Executive Campus Breakdown — ${activeSchool ? escapeHTML(activeSchool.name) : (isSchoolUser ? escapeHTML(user.schoolName || '') : 'All Campuses')}</p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b; line-height: 1.5;">
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div><strong>Printed By:</strong> ${escapeHTML(user ? user.name : 'System User')} (${escapeHTML(user ? user.role : '')})</div>
        </div>
      </div>
    </div>

    ${subTabHeader}

    <!-- Top Back Button (Rendered when viewing a particular school's overview) -->
    ${activeSchool && !isSchoolUser ? `
      <div class="no-print" style="margin-bottom: 16px;">
        <button class="btn-secondary" style="width: auto; padding: 6px 14px; font-size: 13px;" onclick="selectReportSchool(null)">
          <i class="fa-solid fa-chevron-left"></i> Back
        </button>
      </div>
    ` : ''}

    <!-- Page Title & Print/Export Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div>
        <h3 style="font-size: 20px; font-weight: 700; color: var(--color-dark); margin: 0 0 4px 0;">
          ${activeSchool ? `<i class="fa-solid fa-school" style="color: var(--color-income); margin-right: 8px;"></i>${escapeHTML(activeSchool.name)} — Campus Report` : 'Executive System Reports'}
        </h3>
        <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
          ${activeSchool ? `Detailed campus metrics, financial summary, and vehicle compliance report for ${escapeHTML(activeSchool.name)}` : 'Comprehensive breakdown of vehicle compliance, finances, and campus operations'}
        </p>
      </div>

      <div class="no-print" style="display: flex; gap: 12px; align-items: center;">
        <button class="btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Report</button>
        <button class="btn-primary" style="width: auto;" onclick="downloadFullReportCSV()"><i class="fa-solid fa-download"></i> Export CSV</button>
      </div>
    </div>

    <!-- 3 Summary Overview Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px;">
      <!-- Financial Summary -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">
          ${activeSchool ? 'Campus Financial Overview' : 'Financial Overview'}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Revenue:</span>
            <strong style="color: var(--color-income);">${formatCurrency(totalIncome)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Expenses:</span>
            <strong style="color: var(--color-expense);">${canViewExpenses ? formatCurrency(totalExpense) : '<span style="font-size: 12px; color: #94a3b8;"><i class="fa-solid fa-lock"></i> Restricted</span>'}</strong>
          </div>
          <div style="border-top: 1px solid var(--color-border); padding-top: 8px; display: flex; justify-content: space-between; font-weight: 700;">
            <span>Net Profit:</span>
            <span style="color: var(--color-profit);">${canViewExpenses ? formatCurrency(totalProfit) : '<span style="font-size: 12px; color: #94a3b8;"><i class="fa-solid fa-lock"></i> Restricted</span>'}</span>
          </div>
        </div>
      </div>

      <!-- Vehicle Summary -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">
          ${activeSchool ? 'Campus Vehicle Summary' : 'Vehicle Summary'}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Vehicles:</span>
            <strong>${vehicles.length} Vehicles</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Active Vehicles:</span>
            <span class="badge badge-active">${activeVehicles} Active</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Under Maintenance:</span>
            <span class="badge badge-maintenance">${maintVehicles} Maintenance</span>
          </div>
        </div>
      </div>

      <!-- Renewal Compliance Summary with Clickable Filter Shortcuts -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">
          ${activeSchool ? 'Campus Compliance Shortcuts' : 'Compliance & Renewal Shortcuts'}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px; border-radius: 6px;" onclick="navigateToRenewalsWithFilter('expired')" title="Click to view Expired Renewals">
            <span style="font-weight: 600;">Expired Alerts:</span>
            <span class="badge badge-expired" style="cursor: pointer;">${countExpired} Expired <i class="fa-solid fa-arrow-right" style="font-size: 10px; margin-left: 4px;"></i></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px; border-radius: 6px;" onclick="navigateToRenewalsWithFilter('due_today')" title="Click to view Due Today Renewals">
            <span style="font-weight: 600;">Due Today:</span>
            <span class="badge badge-due-today" style="cursor: pointer;">${countDueToday} Today <i class="fa-solid fa-arrow-right" style="font-size: 10px; margin-left: 4px;"></i></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px; border-radius: 6px;" onclick="navigateToRenewalsWithFilter('under_10')" title="Click to view Urgent Renewals">
            <span style="font-weight: 600;">Urgent (1 - 10 Days):</span>
            <span class="badge badge-under-10" style="cursor: pointer;">${countUnder10} Urgent <i class="fa-solid fa-arrow-right" style="font-size: 10px; margin-left: 4px;"></i></span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 4px; border-radius: 6px;" onclick="navigateToRenewalsWithFilter('under_30')" title="Click to view Moderate Renewals">
            <span style="font-weight: 600;">Moderate (11 - 30 Days):</span>
            <span class="badge badge-under-30" style="cursor: pointer;">${countUnder30} Moderate <i class="fa-solid fa-arrow-right" style="font-size: 10px; margin-left: 4px;"></i></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Section 1: Financial & School Performance Report -->
    <div class="card" style="padding: 24px; margin-bottom: 24px;">
      <div class="section-header">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-line" style="color: var(--color-primary);"></i>
            ${activeSchool ? 'Campus Financial Performance Details' : 'School Performance & Financial Report'}
          </h3>
          <p>${activeSchool ? 'Individual performance and operational breakdown for ' + escapeHTML(activeSchool.name) : 'Comprehensive revenue, expense, and net profit metrics per educational institution'}</p>
        </div>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Location</th>
              <th>Vehicle Count</th>
              <th>Total Revenue</th>
              <th>Total Expenses</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${displayedSchools.map(s => {
              const vCount = window.db.getVehicles(s.id).length;
              const inc = window.db.getTotalIncome(s.id, user.role);
              const exp = window.db.getTotalExpenses(s.id, user.role);
              const prof = inc - exp;
              return `
                <tr class="table-row" ${!activeSchool ? `onclick="selectReportSchool(${s.id})" style="cursor: pointer;" title="Click to view detailed report for ${escapeHTML(s.name)}"` : ''}>
                  <td><strong>${escapeHTML(s.name)}</strong></td>
                  <td>${escapeHTML(s.location)}</td>
                  <td>${vCount} Vehicles</td>
                  <td style="color: var(--color-income); font-weight: 600;">${formatCurrency(inc)}</td>
                  <td style="color: var(--color-expense); font-weight: 600;">${canViewExpenses ? formatCurrency(exp) : '<span style="font-size: 12px; color: #94a3b8;"><i class="fa-solid fa-lock"></i> Restricted</span>'}</td>
                  <td style="color: var(--color-profit); font-weight: 700;">${canViewExpenses ? formatCurrency(prof) : '<span style="font-size: 12px; color: #94a3b8;"><i class="fa-solid fa-lock"></i> Restricted</span>'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detailed Section 2: Vehicle Status Report -->
    <div class="card" style="padding: 24px; margin-bottom: 24px;">
      <div class="section-header">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-bus" style="color: var(--color-primary);"></i>
            Vehicle Status Report
          </h3>
          <p>Complete operational breakdown of vehicles and driver assignments</p>
        </div>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Bus No / Vehicle</th>
              <th>Assigned School</th>
              <th>Assigned Route</th>
              <th>Assigned Driver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const allSchools = window.db.getSchools();
              const allRoutes = window.db.getRoutes() || [];
              const allDrivers = window.db.getDrivers() || [];
              if (!vehicles.length) {
                return `<tr><td colspan="5" class="empty-state">No vehicle records found.</td></tr>`;
              }
              return vehicles.map(v => {
                const sObj = allSchools.find(s => s.id === v.schoolId);
                const rObj = allRoutes.find(r => r.busId === v.id);
                const dObj = allDrivers.find(d => d.busId === v.id);
                
                let statusBadge = '<span class="badge badge-active">Active</span>';
                if (v.status === 'Maintenance') statusBadge = '<span class="badge badge-maintenance">Maintenance</span>';
                else if (v.status === 'Inactive') statusBadge = '<span class="badge badge-inactive">Inactive</span>';
                else if (v.status === 'Fitness Test') statusBadge = '<span class="badge badge-fitness-test">Fitness Test</span>';
                
                return `
                  <tr class="table-row">
                    <td><strong>${escapeHTML(v.busNo)}</strong> <span style="font-size: 12px; color: var(--color-text-secondary);">(${escapeHTML(v.vehicleName || v.name || v.type || 'Bus')})</span></td>
                    <td>${sObj ? escapeHTML(sObj.name) : 'Unassigned'}</td>
                    <td>${rObj ? `<strong style="color: var(--color-primary);">${escapeHTML(rObj.routeCode)}</strong> (${escapeHTML(rObj.name)})` : 'Unassigned'}</td>
                    <td>${dObj ? escapeHTML(dObj.name) : 'Unassigned'}</td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('');
            })()}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detailed Section 3: Detailed Compliance & Renewal Status Report -->
    <div class="card" style="padding: 24px;">
      <div class="section-header">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-file-shield" style="color: var(--color-primary);"></i>
            Detailed Compliance & Renewal Status Report
          </h3>
          <p>Individual document compliance audit, target expiry dates, and alert classifications</p>
        </div>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Vehicle / Bus</th>
              <th>Assigned School</th>
              <th>Renewal Type</th>
              <th>Expiry Date</th>
              <th>Days Remaining</th>
              <th>Urgency Level</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const allSchools = window.db.getSchools();
              const allVehicles = window.db.getVehicles();

              if (!renewals.length) {
                return `<tr><td colspan="6" class="empty-state">No renewal records found.</td></tr>`;
              }

              const sortedRenewals = [...renewals].sort((a, b) => {
                const stA = getRenewalStatus(a.renewalDate);
                const stB = getRenewalStatus(b.renewalDate);
                return stA.days - stB.days;
              });

              return sortedRenewals.map(r => {
                const vObj = allVehicles.find(v => v.id === r.vehicleId);
                const sObj = allSchools.find(s => s.id === (vObj ? vObj.schoolId : r.schoolId));
                const st = getRenewalStatus(r.renewalDate);

                let badgeHtml = '<span class="badge badge-active">Compliant</span>';
                if (st.days < 0) badgeHtml = '<span class="badge badge-expired">Expired</span>';
                else if (st.days === 0) badgeHtml = '<span class="badge badge-due-today">Due Today</span>';
                else if (st.days <= 10) badgeHtml = '<span class="badge badge-under-10">Urgent</span>';
                else if (st.days <= 30) badgeHtml = '<span class="badge badge-under-30">Moderate</span>';

                return `
                  <tr class="table-row">
                    <td><strong>${vObj ? escapeHTML(vObj.busNo) : 'Vehicle'}</strong> <span style="font-size: 12px; color: var(--color-text-secondary);">(${vObj ? escapeHTML(vObj.name || vObj.type || 'Bus') : ''})</span></td>
                    <td>${sObj ? escapeHTML(sObj.name) : 'Unassigned'}</td>
                    <td><strong style="color: var(--color-dark);">${escapeHTML(r.type)}</strong></td>
                    <td>${formatDate(r.renewalDate)}</td>
                    <td>${st.text}</td>
                    <td>${badgeHtml}</td>
                  </tr>
                `;
              }).join('');
            })()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function navigateToRenewalsWithFilter(filterName) {
  if (window.app) {
    window.app.navigateTo('renewals');
    setTimeout(() => {
      if (typeof setRenewalFilter === 'function') {
        setRenewalFilter(filterName);
      }
    }, 100);
  }
}

function downloadFullReportCSV() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const targetSchoolId = isSchoolUser ? user.schoolId : selectedReportSchoolId;
  const canViewExpenses = window.auth.canViewExpenses(user ? user.role : null);

  const schools = window.db.getSchools(targetSchoolId);
  const currentSchool = targetSchoolId ? window.db.getSchools().find(s => s.id === targetSchoolId) : null;
  const vehicles = window.db.getVehicles(targetSchoolId);
  const renewals = window.db.getRenewals(targetSchoolId);
  const routes = window.db.getRoutes() || [];
  const drivers = window.db.getDrivers() || [];

  const csvRows = [
    ['EXECUTIVE SYSTEM REPORT:', currentSchool ? currentSchool.name : 'All Campuses'],
    ['GENERATED ON:', new Date().toLocaleString()],
    [],
    ['--- SECTION 1: SCHOOL PERFORMANCE & FINANCIAL BREAKDOWN ---'],
    ['School Name', 'Location', 'Total Vehicles', 'Total Income (INR)', 'Total Expense (INR)', 'Net Profit (INR)']
  ];

  schools.forEach(s => {
    const vCount = window.db.getVehicles(s.id).length;
    const inc = window.db.getTotalIncome(s.id);
    const exp = window.db.getTotalExpenses(s.id);
    const prof = inc - exp;
    csvRows.push([
      s.name,
      s.location,
      vCount,
      inc,
      canViewExpenses ? exp : 'Restricted',
      canViewExpenses ? prof : 'Restricted'
    ]);
  });

  csvRows.push([]);
  csvRows.push(['--- SECTION 2: VEHICLE STATUS ---']);
  csvRows.push(['Bus No', 'Vehicle Model', 'Assigned School', 'Assigned Route', 'Assigned Driver', 'Status']);

  vehicles.forEach(v => {
    const sObj = schools.find(s => s.id === v.schoolId);
    const rObj = routes.find(r => r.busId === v.id);
    const dObj = drivers.find(d => d.busId === v.id);
    csvRows.push([
      v.busNo,
      v.vehicleName || v.name || v.type || 'Bus',
      sObj ? sObj.name : 'Unassigned',
      rObj ? `${rObj.routeCode} (${rObj.name})` : 'Unassigned',
      dObj ? dObj.name : 'Unassigned',
      v.status
    ]);
  });

  csvRows.push([]);
  csvRows.push(['--- SECTION 3: DETAILED COMPLIANCE & RENEWAL STATUS ---']);
  csvRows.push(['Bus No', 'Assigned School', 'Renewal Type', 'Expiry Date', 'Status / Days Left', 'Urgency Level']);

  renewals.forEach(r => {
    const vObj = vehicles.find(v => v.id === r.vehicleId);
    const sObj = schools.find(s => s.id === (vObj ? vObj.schoolId : r.schoolId));
    const st = getRenewalStatus(r.renewalDate);

    let level = 'Compliant';
    if (st.days < 0) level = 'Expired';
    else if (st.days === 0) level = 'Due Today';
    else if (st.days <= 10) level = 'Urgent';
    else if (st.days <= 30) level = 'Moderate';

    csvRows.push([
      vObj ? vObj.busNo : 'Vehicle',
      sObj ? sObj.name : 'Unassigned',
      r.type,
      r.renewalDate,
      st.text,
      level
    ]);
  });

  const fileName = currentSchool ? `Report_${currentSchool.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv` : `Transport_Report_All_Campuses_${new Date().toISOString().split('T')[0]}.csv`;

  exportToCSV(fileName, csvRows);
}

window.renderReportsPage = renderReportsPage;
window.selectReportSchool = selectReportSchool;
window.navigateToRenewalsWithFilter = navigateToRenewalsWithFilter;
window.downloadFullReportCSV = downloadFullReportCSV;


