/* ==========================================
   REPORTS & ANALYTICS EXPORT MODULE
   ========================================== */

function renderReportsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('reports-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const schools = window.db.getSchools(isSchoolUser ? schoolId : null);
  const vehicles = window.db.getVehicles(isSchoolUser ? schoolId : null);
  const renewals = window.db.getRenewals(isSchoolUser ? schoolId : null);
  const totalIncome = window.db.getTotalIncome(isSchoolUser ? schoolId : null);
  const totalExpense = window.db.getTotalExpenses(isSchoolUser ? schoolId : null);
  const totalProfit = totalIncome - totalExpense;

  const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
  const maintVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'Inactive').length;

  let countExpired = 0, countDueToday = 0, countUnder10 = 0, countUnder30 = 0, countUpcoming = 0;

  renewals.forEach(r => {
    const st = getRenewalStatus(r.renewalDate);
    if (st.days < 0) countExpired++;
    else if (st.days === 0) countDueToday++;
    else if (st.days <= 10) countUnder10++;
    else if (st.days <= 30) countUnder30++;
    else countUpcoming++;
  });

  container.innerHTML = `
    <!-- Dedicated Print Header (Only visible on paper / PDF print output) -->
    <div class="print-header" style="display: none; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">EduTransit Transport System Report</h2>
          <p style="font-size: 13px; color: #475569; margin: 0;">Comprehensive Executive Breakdown — ${isSchoolUser ? escapeHTML(user.schoolName || '') : 'All Campuses'}</p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b; line-height: 1.5;">
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div><strong>Printed By:</strong> ${escapeHTML(user ? user.name : 'System User')} (${escapeHTML(user ? user.role : '')})</div>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h3 style="font-size: 20px; font-weight: 700; color: var(--color-dark);">Executive System Reports</h3>
        <p style="font-size: 13px; color: var(--color-text-secondary);">Comprehensive breakdown of fleet compliance, finances, and campus operations</p>
      </div>
      <div class="no-print" style="display: flex; gap: 12px;">
        <button class="btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Report</button>
        <button class="btn-primary" style="width: auto;" onclick="downloadFullReportCSV()"><i class="fa-solid fa-download"></i> Export CSV</button>
      </div>
    </div>

    <!-- 4 Report Cards Summary Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px;">
      <!-- Financial Summary -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">Financial Overview</h4>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Revenue:</span>
            <strong style="color: var(--color-income);">${formatCurrency(totalIncome)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Expenses:</span>
            <strong style="color: var(--color-expense);">${formatCurrency(totalExpense)}</strong>
          </div>
          <div style="border-top: 1px solid var(--color-border); padding-top: 8px; display: flex; justify-content: space-between; font-weight: 700;">
            <span>Net Profit:</span>
            <span style="color: var(--color-profit);">${formatCurrency(totalProfit)}</span>
          </div>
        </div>
      </div>

      <!-- Vehicle Summary -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">Vehicle Fleet Summary</h4>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13.5px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Total Fleet Size:</span>
            <strong>${vehicles.length} Buses</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Active Fleet:</span>
            <span class="badge badge-active">${activeVehicles} Active</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--color-text-secondary);">Under Maintenance:</span>
            <span class="badge badge-maintenance">${maintVehicles} Maintenance</span>
          </div>
        </div>
      </div>

      <!-- Renewal Compliance Summary -->
      <div class="card" style="padding: 24px;">
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">Compliance & Renewals</h4>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Expired Alerts:</span>
            <span class="badge badge-expired">${countExpired} Expired</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Due Today:</span>
            <span class="badge badge-due-today">${countDueToday} Today</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Urgent (1 - 10 Days):</span>
            <span class="badge badge-under-10">${countUnder10} Urgent</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Moderate (11 - 30 Days):</span>
            <span class="badge badge-under-30">${countUnder30} Moderate</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed School Summary Table -->
    <div class="card" style="padding: 24px;">
      <div class="section-header">
        <div>
          <h3>School Performance Report</h3>
          <p>Breakdown per educational institution campus</p>
        </div>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Location</th>
              <th>Fleet Count</th>
              <th>Income</th>
              <th>Expense</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${schools.map(s => {
              const vCount = window.db.getVehicles(s.id).length;
              const inc = window.db.getTotalIncome(s.id);
              const exp = window.db.getTotalExpenses(s.id);
              const prof = inc - exp;
              return `
                <tr class="table-row">
                  <td><strong>${escapeHTML(s.name)}</strong></td>
                  <td>${escapeHTML(s.location)}</td>
                  <td>${vCount} Vehicles</td>
                  <td style="color: var(--color-income); font-weight: 600;">${formatCurrency(inc)}</td>
                  <td style="color: var(--color-expense); font-weight: 600;">${formatCurrency(exp)}</td>
                  <td style="color: var(--color-profit); font-weight: 700;">${formatCurrency(prof)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function downloadFullReportCSV() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const schools = window.db.getSchools(isSchoolUser ? schoolId : null);

  const csvRows = [
    ['School Name', 'Location', 'Total Vehicles', 'Total Income (INR)', 'Total Expense (INR)', 'Net Profit (INR)']
  ];

  schools.forEach(s => {
    const vCount = window.db.getVehicles(s.id).length;
    const inc = window.db.getTotalIncome(s.id);
    const exp = window.db.getTotalExpenses(s.id);
    const prof = inc - exp;
    csvRows.push([s.name, s.location, vCount, inc, exp, prof]);
  });

  exportToCSV(`Transport_Report_${new Date().toISOString().split('T')[0]}.csv`, csvRows);
}

window.renderReportsPage = renderReportsPage;
window.downloadFullReportCSV = downloadFullReportCSV;
