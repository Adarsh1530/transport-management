/* ==========================================
   DYNAMIC DASHBOARD RENDERER & CHART ENGINE
   ========================================== */

let activeCharts = {};
window.selectedDashboardSchoolId = 'all';

function destroyActiveCharts() {
  Object.keys(activeCharts).forEach(key => {
    if (activeCharts[key]) {
      activeCharts[key].destroy();
      delete activeCharts[key];
    }
  });
}

function selectDashboardSchool(schoolId) {
  window.selectedDashboardSchoolId = schoolId;
  renderDashboard();
  if (window.app && typeof window.app.updateHeaderNavigation === 'function') {
    window.app.updateHeaderNavigation('dashboard');
  }
}

function renderDashboard() {
  const user = window.auth.getCurrentUser();
  if (!user) return;

  const container = document.getElementById('dashboard-view');
  if (!container) return;

  destroyActiveCharts();

  const isSchoolRole = user.role === 'School';

  if (isSchoolRole) {
    window.selectedDashboardSchoolId = user.schoolId;
    renderSchoolDashboard(container, user, user.schoolId, false);
  } else {
    if (window.selectedDashboardSchoolId === 'all') {
      renderGlobalDashboard(container, user);
    } else {
      renderSchoolDashboard(container, user, Number(window.selectedDashboardSchoolId), true);
    }
  }

  if (window.app && typeof window.app.updateHeaderNavigation === 'function') {
    window.app.updateHeaderNavigation('dashboard');
  }
}

function renderGlobalDashboard(container, user) {
  const role = user ? user.role : null;
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();
  const income = window.db.getTotalIncome(null, role);
  const expense = window.db.getTotalExpenses(null, role);
  const profit = window.db.getTotalProfit(null, role);
  const renewals = window.db.getRenewals();
  const canViewExpenses = window.auth.canViewExpenses(role);

  container.innerHTML = `
    <!-- Top Metric Cards Grid -->
    <div class="metrics-grid-5">
      <div class="card metric-card metric-black">
        <div class="metric-card-top">
          <span class="metric-title">Total Schools</span>
          <div class="metric-icon-box"><i class="fa-solid fa-school"></i></div>
        </div>
        <div class="metric-value">${schools.length}</div>
        <div class="metric-sub positive"><i class="fa-solid fa-arrow-up"></i> All Registered Campuses</div>
      </div>

      <div class="card metric-card metric-black">
        <div class="metric-card-top">
          <span class="metric-title">Total Vehicles</span>
          <div class="metric-icon-box"><i class="fa-solid fa-bus"></i></div>
        </div>
        <div class="metric-value">${vehicles.length}</div>
        <div class="metric-sub positive"><i class="fa-solid fa-check"></i> Vehicle Capacity</div>
      </div>

      <div class="card metric-card metric-blue">
        <div class="metric-card-top">
          <span class="metric-title">Income</span>
          <div class="metric-icon-box"><i class="fa-solid fa-wallet"></i></div>
        </div>
        <div class="metric-value">${formatCurrency(income)}</div>
        <div class="metric-sub positive"><i class="fa-solid fa-arrow-up"></i> Gross Revenue</div>
      </div>

      <div class="card metric-card metric-red">
        <div class="metric-card-top">
          <span class="metric-title">Expense</span>
          <div class="metric-icon-box"><i class="fa-solid fa-receipt"></i></div>
        </div>
        <div class="metric-value">${canViewExpenses ? formatCurrency(expense) : '<span style="font-size: 15px; color: #94a3b8;"><i class="fa-solid fa-lock" style="font-size: 12px; margin-right: 4px;"></i> Restricted</span>'}</div>
        <div class="metric-sub">${canViewExpenses ? '<i class="fa-solid fa-arrow-down"></i> Operations Cost' : 'Access Restricted'}</div>
      </div>

      <div class="card metric-card metric-green">
        <div class="metric-card-top">
          <span class="metric-title">Profit</span>
          <div class="metric-icon-box"><i class="fa-solid fa-chart-line"></i></div>
        </div>
        <div class="metric-value">${canViewExpenses ? formatCurrency(profit) : '<span style="font-size: 15px; color: #94a3b8;"><i class="fa-solid fa-lock" style="font-size: 12px; margin-right: 4px;"></i> Restricted</span>'}</div>
        <div class="metric-sub positive">${canViewExpenses ? '<i class="fa-solid fa-arrow-up"></i> Net Earnings' : 'Access Restricted'}</div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div class="charts-grid-2" style="margin-bottom: 28px;">
      <div class="card" style="padding: 24px;">
        <div class="section-header">
          <div>
            <h3>Financial Overview</h3>
            <p>Overall system income, expense and net profit comparison</p>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-financial-overview"></canvas>
        </div>
      </div>

      <div class="card" style="padding: 24px;">
        <div class="section-header">
          <div>
            <h3>Transport Overview</h3>
            <p>Distribution ratio of schools to total vehicles</p>
          </div>
        </div>
        <div style="height: 280px; position: relative; display: flex; align-items: center; justify-content: center;">
          <canvas id="chart-transport-overview"></canvas>
        </div>
      </div>
    </div>

    <!-- Renewal Alert Section -->
    <div class="card" style="padding: 24px;">
      <div class="section-header">
        <div>
          <h3>Renewal Alerts</h3>
          <p>Upcoming vehicle insurance, pollution, service and other renewal dates (Click any row to view bus details)</p>
        </div>
        <button class="btn-sm btn-secondary" onclick="app.navigateTo('renewals')">View All Renewals</button>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Bus No</th>
              <th>School Name</th>
              <th>Renewal Name</th>
              <th>Renewal Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${renderRenewalRows(renewals, true)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  initGlobalCharts(income, expense, profit, schools, vehicles, canViewExpenses);
}

// Individual School Dashboard (Supports both Super Admin/Admin viewing a specific school & School Role)
function renderSchoolDashboard(container, user, schoolId, allowBackToGlobal = false) {
  const schools = window.db.getSchools();
  const schoolObj = schools.find(s => s.id === schoolId);
  const schoolName = schoolObj ? schoolObj.name : user.schoolName;

  const role = user ? user.role : null;
  const schoolVehicles = window.db.getVehicles(schoolId);
  const income = window.db.getTotalIncome(schoolId, role);
  const expense = window.db.getTotalExpenses(schoolId, role);
  const profit = window.db.getTotalProfit(schoolId, role);
  const renewals = window.db.getRenewals(schoolId);
  const canViewExpenses = window.auth.canViewExpenses(role);

  const activeVehicles = schoolVehicles.filter(v => v.status === 'Active').length;
  const maintVehicles = schoolVehicles.filter(v => v.status === 'Maintenance').length;

  container.innerHTML = `
    <!-- Top School Scope Bar -->
    <div class="card" style="padding: 16px 20px; margin-bottom: 24px; background: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; background: #eff6ff; color: var(--color-income); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            <i class="fa-solid fa-school"></i>
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--color-dark);">${escapeHTML(schoolName)}</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary);">
              <i class="fa-solid fa-location-dot"></i> ${escapeHTML(schoolObj ? schoolObj.location : '')} | Dedicated School Transport Dashboard
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top 4 Metric Cards Grid -->
    <div class="metrics-grid-4">
      <div class="card metric-card metric-black">
        <div class="metric-card-top">
          <span class="metric-title">Total Vehicles</span>
          <div class="metric-icon-box"><i class="fa-solid fa-bus"></i></div>
        </div>
        <div class="metric-value">${schoolVehicles.length}</div>
        <div class="metric-sub positive"><i class="fa-solid fa-check"></i> Campus Vehicle Count</div>
      </div>

      <div class="card metric-card metric-blue">
        <div class="metric-card-top">
          <span class="metric-title">Income</span>
          <div class="metric-icon-box"><i class="fa-solid fa-wallet"></i></div>
        </div>
        <div class="metric-value">${formatCurrency(income)}</div>
        <div class="metric-sub positive"><i class="fa-solid fa-arrow-up"></i> Fee Revenue</div>
      </div>

      <div class="card metric-card metric-red">
        <div class="metric-card-top">
          <span class="metric-title">Expense</span>
          <div class="metric-icon-box"><i class="fa-solid fa-receipt"></i></div>
        </div>
        <div class="metric-value">${canViewExpenses ? formatCurrency(expense) : '<span style="font-size: 15px; color: #94a3b8;"><i class="fa-solid fa-lock" style="font-size: 12px; margin-right: 4px;"></i> Restricted</span>'}</div>
        <div class="metric-sub">${canViewExpenses ? '<i class="fa-solid fa-arrow-down"></i> Operating Expenses' : 'Access Restricted'}</div>
      </div>

      <div class="card metric-card metric-green">
        <div class="metric-card-top">
          <span class="metric-title">Profit</span>
          <div class="metric-icon-box"><i class="fa-solid fa-chart-line"></i></div>
        </div>
        <div class="metric-value">${canViewExpenses ? formatCurrency(profit) : '<span style="font-size: 15px; color: #94a3b8;"><i class="fa-solid fa-lock" style="font-size: 12px; margin-right: 4px;"></i> Restricted</span>'}</div>
        <div class="metric-sub positive">${canViewExpenses ? '<i class="fa-solid fa-arrow-up"></i> Net Campus Profit' : 'Access Restricted'}</div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div class="charts-grid-equal">
      <div class="card" style="padding: 24px;">
        <div class="section-header">
          <div>
            <h3>Financial Overview</h3>
            <p>Campus income vs expense vs net profit</p>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-school-financial"></canvas>
        </div>
      </div>

      <div class="card" style="padding: 24px;">
        <div class="section-header">
          <div>
            <h3>Vehicle Distribution</h3>
            <p>Active vs maintenance vehicle status</p>
          </div>
        </div>
        <div style="height: 280px; position: relative; display: flex; align-items: center; justify-content: center;">
          <canvas id="chart-school-vehicle"></canvas>
        </div>
      </div>
    </div>

    <!-- Renewal Alert Section -->
    <div class="card" style="padding: 24px;">
      <div class="section-header">
        <div>
          <h3>Renewal Alerts</h3>
          <p>Upcoming compliance deadlines for ${escapeHTML(schoolName)} (Click any row to view bus details)</p>
        </div>
        <button class="btn-sm btn-secondary" onclick="app.navigateTo('renewals')">View All Renewals</button>
      </div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Bus No</th>
              <th>Renewal Name</th>
              <th>Renewal Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${renderRenewalRows(renewals, false)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  initSchoolCharts(income, expense, profit, schoolVehicles.length, activeVehicles, maintVehicles, canViewExpenses);
}

// Render School Summary Table Rows
function renderSchoolSummaryRows(schools) {
  if (!schools || !schools.length) {
    return `<tr><td colspan="8" class="empty-state">No school summary records found.</td></tr>`;
  }

  return schools.map(s => {
    const vCount = window.db.getVehicles(s.id).length;
    const realInc = window.db.getTotalIncome(s.id);
    const collection = realInc;
    const demand = collection > 0 ? Math.round(collection * 1.25) : 300000;
    const due = Math.max(0, demand - collection);
    const pct = demand > 0 ? Math.min(100, Number(((collection / demand) * 100).toFixed(1))) : 0;
    const status = pct >= 85 ? 'Excellent' : pct >= 75 ? 'Good' : 'Average';
    
    const metrics = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      students: vCount * 25 || 100,
      demand,
      collection,
      due,
      pct,
      status
    };

    let badgeBg = '#fef3c7';
    let badgeColor = '#b45309';
    let barColor = '#f59e0b';

    if (metrics.status === 'Good') {
      badgeBg = '#dcfce7';
      badgeColor = '#15803d';
      barColor = '#10b981';
    } else if (metrics.status === 'Excellent') {
      badgeBg = '#dbeafe';
      badgeColor = '#1d4ed8';
      barColor = '#2563eb';
    }

    return `
      <tr class="table-row" style="cursor: pointer;" onclick="selectDashboardSchool(${s.id})" title="Click to view dedicated transport dashboard for ${escapeHTML(s.name)}">
        <td style="padding: 14px 16px;">
          <strong style="font-size: 13px; font-weight: 700; color: #0f172a; display: block; line-height: 1.3;">${escapeHTML(s.name.toUpperCase())}</strong>
        </td>
        <td style="padding: 14px 16px; color: #64748b; font-size: 12.5px; white-space: nowrap;">${metrics.date}</td>
        <td style="padding: 14px 16px; font-weight: 600; color: #334155; font-size: 13px;">${metrics.students}</td>
        <td style="padding: 14px 16px; font-weight: 700; color: #2563eb; font-size: 13.5px;">${formatCurrency(metrics.demand)}</td>
        <td style="padding: 14px 16px; font-weight: 700; color: #16a34a; font-size: 13.5px;">${formatCurrency(metrics.collection)}</td>
        <td style="padding: 14px 16px; font-weight: 700; color: #dc2626; font-size: 13.5px;">${formatCurrency(metrics.due)}</td>
        <td style="padding: 14px 16px; white-space: nowrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 60px; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${metrics.pct}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
            </div>
            <span style="font-weight: 700; font-size: 12.5px; color: #334155;">${metrics.pct}%</span>
          </div>
        </td>
        <td style="padding: 14px 16px; text-align: center;">
          <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${badgeBg}; color: ${badgeColor};">
            ${metrics.status}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// Generate Renewal Alert Table Rows
function renderRenewalRows(renewals, includeSchoolColumn = true) {
  if (!renewals || !renewals.length) {
    const colSpan = includeSchoolColumn ? 5 : 4;
    return `<tr><td colspan="${colSpan}" class="empty-state">No upcoming renewal alerts found.</td></tr>`;
  }

  const vehicles = window.db.getVehicles();
  const schools = window.db.getSchools();

  const enriched = renewals.map(r => {
    const vehicle = vehicles.find(v => v.id === r.vehicleId);
    const school = schools.find(s => s.id === r.schoolId);
    const statusObj = getRenewalStatus(r.renewalDate);
    return {
      ...r,
      vehicleId: r.vehicleId,
      busNo: vehicle ? vehicle.busNo : 'N/A',
      schoolName: school ? school.name : 'N/A',
      statusObj
    };
  });

  enriched.sort((a, b) => (a.statusObj?.urgencyScore || 99) - (b.statusObj?.urgencyScore || 99));

  return enriched.map(item => `
    <tr class="table-row" onclick="openBusDetailsModal(${item.vehicleId})" style="cursor: pointer;" title="Click to view complete details for Bus ${escapeHTML(item.busNo)}">
      <td><span class="bus-no-text" style="color: #111827 !important; text-decoration: none !important; font-weight: 700;"><i class="fa-solid fa-bus" style="font-size: 12px; margin-right: 6px; color: #64748b;"></i>${escapeHTML(item.busNo)}</span></td>
      ${includeSchoolColumn ? `<td>${escapeHTML(item.schoolName)}</td>` : ''}
      <td>${escapeHTML(item.type)}</td>
      <td>${formatDate(item.renewalDate)}</td>
      <td>
        <span class="badge ${item.statusObj.badgeClass}">
          <span class="badge-dot"></span>
          ${item.statusObj.text}
        </span>
      </td>
    </tr>
  `).join('');
}

// Initialize Chart.js for Global View
function initGlobalCharts(income, expense, profit, schools, vehicles, canViewExpenses = true) {
  const ctxFinancial = document.getElementById('chart-financial-overview')?.getContext('2d');
  if (ctxFinancial) {
    activeCharts['financial'] = new Chart(ctxFinancial, {
      type: 'bar',
      data: {
        labels: canViewExpenses ? ['Income', 'Expense', 'Profit'] : ['Income'],
        datasets: [{
          label: 'Amount (₹)',
          data: canViewExpenses ? [income, expense, profit] : [income],
          backgroundColor: canViewExpenses ? ['#2563EB', '#DC2626', '#16A34A'] : ['#2563EB'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ' ' + formatCurrency(ctx.raw)
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: val => '₹' + (val / 100000).toFixed(1) + 'L'
            }
          }
        }
      }
    });
  }

  const ctxTransport = document.getElementById('chart-transport-overview')?.getContext('2d');
  if (ctxTransport) {
    activeCharts['transport'] = new Chart(ctxTransport, {
      type: 'doughnut',
      data: {
        labels: ['Schools', 'Vehicles'],
        datasets: [{
          data: [schools.length, vehicles.length],
          backgroundColor: ['#111827', '#2563EB'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// Initialize Chart.js for School View
function initSchoolCharts(income, expense, profit, totalVehicles, activeVehicles, maintVehicles, canViewExpenses = true) {
  const ctxFinancial = document.getElementById('chart-school-financial')?.getContext('2d');
  if (ctxFinancial) {
    activeCharts['schoolFinancial'] = new Chart(ctxFinancial, {
      type: 'bar',
      data: {
        labels: canViewExpenses ? ['Income', 'Expense', 'Profit'] : ['Income'],
        datasets: [{
          data: canViewExpenses ? [income, expense, profit] : [income],
          backgroundColor: canViewExpenses ? ['#2563EB', '#DC2626', '#16A34A'] : ['#2563EB'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ' ' + formatCurrency(ctx.raw) } }
        }
      }
    });
  }

  const ctxVehicle = document.getElementById('chart-school-vehicle')?.getContext('2d');
  if (ctxVehicle) {
    activeCharts['school Vehicles'] = new Chart(ctxVehicle, {
      type: 'doughnut',
      data: {
        labels: ['Active Vehicles', 'In Maintenance'],
        datasets: [{
          data: [activeVehicles, maintVehicles],
          backgroundColor: ['#16A34A', '#F59E0B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

window.renderDashboard = renderDashboard;
window.selectDashboardSchool = selectDashboardSchool;
window.renderSchoolDashboard = renderSchoolDashboard;
window.renderGlobalDashboard = renderGlobalDashboard;
