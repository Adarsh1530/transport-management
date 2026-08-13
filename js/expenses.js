/* ==========================================
   EXPENSES FINANCIAL MANAGEMENT MODULE
   ========================================== */

function renderExpensesPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('expenses-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const expenseRecords = window.db.getExpenses(isSchoolUser ? schoolId : null, user.role);
  const totalExpense = window.db.getTotalExpenses(isSchoolUser ? schoolId : null, user.role);
  const schools = window.db.getSchools();
  const categories = window.db.getCategories('EXPENSE', user.role);
  const vehicles = window.db.getVehicles(isSchoolUser ? schoolId : null);

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="card metric-card metric-red" style="margin-bottom: 24px; padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span class="metric-title">Total Transport Expenses</span>
          <div class="metric-value" id="expense-total-display">${formatCurrency(totalExpense)}</div>
          <div class="metric-sub"><i class="fa-solid fa-arrow-down"></i> Operations, fuel, salaries & maintenance outlays</div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
          <button class="btn-primary" style="width: auto; background: #10b981;" onclick="exportExpenseToExcel()">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button class="btn-primary" style="width: auto; background: #ef4444;" onclick="exportExpenseToPDF()">
            <i class="fa-solid fa-file-pdf"></i> Export PDF
          </button>
          <button class="btn-primary" style="width: auto; background: var(--color-expense);" onclick="openAddExpenseModal()">
            <i class="fa-solid fa-plus"></i> Add Expense Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Controls Bar with Filters -->
    <div class="controls-bar">
      <div class="filter-group" style="flex-wrap: wrap;">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="expense-search-input" class="form-control" placeholder="Search expense description..." oninput="filterExpenseTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="expense-school-filter" class="form-control" style="width: auto;" onchange="onExpenseSchoolFilterChange()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}

        <select id="expense-bus-filter" class="form-control" style="width: auto;" onchange="onExpenseBusFilterChange()">
          <option value="">All Bus / Vehicles</option>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
        </select>

        <select id="expense-category-filter" class="form-control" style="width: auto;" onchange="filterExpenseTable()">
          <option value="">All Categories</option>
          ${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
        </select>

        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0;">From:</label>
          <input type="date" id="expense-date-from" class="form-control" style="width: auto;" title="From Date" onchange="filterExpenseTable()">
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0;">To:</label>
          <input type="date" id="expense-date-to" class="form-control" style="width: auto;" title="To Date" onchange="filterExpenseTable()">
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Vehicle No.</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="expenses-tbody">
            ${renderExpenseRows(expenseRecords, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderExpenseRows(records, showSchoolCol = true) {
  if (!records || !records.length) {
    const colSpan = showSchoolCol ? 7 : 6;
    return `<tr><td colspan="${colSpan}" class="empty-state">No expense transactions recorded.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();

  return records.map(exp => {
    const school = schools.find(s => s.id === exp.schoolId);
    const veh = vehicles.find(v => v.id === exp.busId || v.id === exp.vehicleId);
    const busNoStr = veh ? veh.busNo : (exp.busId ? `Bus ${exp.busId}` : 'General');
    const isFuel = (exp.category || '').toLowerCase() === 'fuel';

    return `
      <tr class="table-row">
        <td>${formatDate(exp.date)}</td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><strong style="color: var(--color-primary);">${escapeHTML(busNoStr)}</strong></td>
        <td><span class="badge ${isFuel ? 'badge-info' : 'badge-due'}" style="${isFuel ? 'background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;' : ''}">${escapeHTML(exp.category)}</span></td>
        <td>
          <div style="font-weight: 600; color: #1e293b;">${escapeHTML(exp.description)}</div>
          ${isFuel && exp.litreQty ? `
            <div style="font-size: 11px; color: #0284c7; margin-top: 2px; font-weight: 500;">
              <i class="fa-solid fa-gas-pump"></i> ${exp.litreQty} L ${exp.ratePerLitre ? '@ ₹' + exp.ratePerLitre + '/L' : ''} ${exp.kmFilling ? '| Odometer: ' + exp.kmFilling + ' KM' : ''}
            </div>
          ` : ''}
        </td>
        <td style="color: var(--color-expense); font-weight: 700;">${formatCurrency(exp.amount)}</td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Expense Transaction" onclick="openEditExpenseModal(${exp.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Expense Transaction" onclick="deleteExpense(${exp.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getFilteredExpenseList() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('expense-search-input')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('expense-category-filter')?.value || '';
  const busFilter = document.getElementById('expense-bus-filter')?.value || '';
  const dateFrom = document.getElementById('expense-date-from')?.value || '';
  const dateTo = document.getElementById('expense-date-to')?.value || '';
  const schoolFilter = document.getElementById('expense-school-filter')?.value || '';

  let list = window.db.getExpenses(isSchoolUser ? schoolId : null, user.role);

  if (query) {
    list = list.filter(e => (e.description && e.description.toLowerCase().includes(query)));
  }

  if (categoryFilter) {
    list = list.filter(e => e.category === categoryFilter);
  }

  if (busFilter) {
    const numBusId = Number(busFilter);
    list = list.filter(e => Number(e.busId) === numBusId || Number(e.vehicleId) === numBusId);
  }

  if (dateFrom) {
    list = list.filter(e => e.date >= dateFrom);
  }
  
  if (dateTo) {
    list = list.filter(e => e.date <= dateTo);
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(e => e.schoolId === Number(schoolFilter));
  }
  
  return list;
}

function filterExpenseTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';

  const list = getFilteredExpenseList();

  const tbody = document.getElementById('expenses-tbody');
  if (tbody) tbody.innerHTML = renderExpenseRows(list, !isSchoolUser);

  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDisplay = document.getElementById('expense-total-display');
  if (totalDisplay) totalDisplay.innerText = formatCurrency(filteredSum);
}

function exportExpenseToPDF() {
  const list = getFilteredExpenseList();
  if (!list.length) {
    showToast('No records to export', 'warning');
    return;
  }
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  
  const columns = isSchoolUser 
    ? ['Date', 'Vehicle No.', 'Category', 'Description', 'Amount']
    : ['Date', 'School', 'Vehicle No.', 'Category', 'Description', 'Amount'];
    
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();
  
  const rows = list.map(exp => {
    const school = schools.find(s => s.id === exp.schoolId);
    const veh = vehicles.find(v => v.id === exp.busId || v.id === exp.vehicleId);
    const busNoStr = veh ? veh.busNo : (exp.busId ? `Bus ${exp.busId}` : 'General');
    
    // Combine description with fuel details if any
    let desc = exp.description || '';
    if ((exp.category || '').toLowerCase() === 'fuel' && exp.litreQty) {
      desc += ` (${exp.litreQty} L @ ₹${exp.ratePerLitre || 0}/L, Odo: ${exp.kmFilling || 'N/A'} KM)`;
    }
    
    if (isSchoolUser) {
      return [formatDate(exp.date), busNoStr, exp.category, desc, exp.amount];
    } else {
      return [formatDate(exp.date), school ? school.name : 'N/A', busNoStr, exp.category, desc, exp.amount];
    }
  });
  
  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  exportFilteredReportToPDF('Expense Report', columns, rows, filteredSum);
}

function exportExpenseToExcel() {
  const list = getFilteredExpenseList();
  if (!list.length) {
    showToast('No records to export', 'warning');
    return;
  }
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  
  const columns = isSchoolUser 
    ? ['Date', 'Vehicle No.', 'Category', 'Description', 'Amount']
    : ['Date', 'School', 'Vehicle No.', 'Category', 'Description', 'Amount'];
    
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();
  
  const rows = list.map(exp => {
    const school = schools.find(s => s.id === exp.schoolId);
    const veh = vehicles.find(v => v.id === exp.busId || v.id === exp.vehicleId);
    const busNoStr = veh ? veh.busNo : (exp.busId ? `Bus ${exp.busId}` : 'General');
    
    // Combine description with fuel details if any
    let desc = exp.description || '';
    if ((exp.category || '').toLowerCase() === 'fuel' && exp.litreQty) {
      desc += ` (${exp.litreQty} L @ ₹${exp.ratePerLitre || 0}/L, Odo: ${exp.kmFilling || 'N/A'} KM)`;
    }
    
    if (isSchoolUser) {
      return [exp.date, busNoStr, exp.category, desc, exp.amount];
    } else {
      return [exp.date, school ? school.name : 'N/A', busNoStr, exp.category, desc, exp.amount];
    }
  });
  
  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  exportFilteredReportToExcel('Expense_Report', columns, rows, filteredSum);
}

function onExpenseSchoolFilterChange() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolFilterVal = document.getElementById('expense-school-filter')?.value || '';
  const busSelect = document.getElementById('expense-bus-filter');

  if (busSelect) {
    const selectedBusId = busSelect.value;
    const targetSchoolId = isSchoolUser ? user.schoolId : (schoolFilterVal ? Number(schoolFilterVal) : null);
    const vehicles = window.db.getVehicles(targetSchoolId);

    busSelect.innerHTML = `
      <option value="">All Bus / Vehicles</option>
      ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
    `;

    const stillValid = vehicles.some(v => String(v.id) === String(selectedBusId));
    if (stillValid) {
      busSelect.value = selectedBusId;
    } else {
      busSelect.value = '';
    }
  }

  filterExpenseTable();
}

function onExpenseBusFilterChange() {
  const busFilterVal = document.getElementById('expense-bus-filter')?.value || '';
  const schoolSelect = document.getElementById('expense-school-filter');

  if (busFilterVal && schoolSelect && !schoolSelect.value) {
    const user = window.auth.getCurrentUser();
    const allVehicles = window.db.getVehicles(user.role === 'School' ? user.schoolId : null);
    const veh = allVehicles.find(v => String(v.id) === String(busFilterVal));
    if (veh && veh.schoolId) {
      schoolSelect.value = veh.schoolId;
      const schoolVehicles = window.db.getVehicles(veh.schoolId);
      const busSelect = document.getElementById('expense-bus-filter');
      if (busSelect) {
        busSelect.innerHTML = `
          <option value="">All Bus / Vehicles</option>
          ${schoolVehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
        `;
        busSelect.value = busFilterVal;
      }
    }
  }

  filterExpenseTable();
}

function updateExpenseBusDropdown(schoolId, selectedBusId = null) {
  const busSelect = document.getElementById('expense-bus-id');
  if (!busSelect) return;

  const sId = Number(schoolId);
  const vehicles = window.db.getVehicles().filter(v => v.schoolId === sId);

  busSelect.innerHTML = `
    <option value="">SELECT VEHICLE</option>
    ${vehicles.map(v => `
      <option value="${v.id}" ${selectedBusId && Number(selectedBusId) === v.id ? 'selected' : ''}>
        Bus ${v.busNo ? v.busNo.replace(/\D/g, '').slice(-2) || v.id : v.id} — ${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})
      </option>
    `).join('')}
  `;
}

/* ==========================================
   CHRONOLOGICAL & DATE-AWARE FUEL ENGINE
   ========================================== */

function getVehicleFuelTransactions(schoolId, busId) {
  if (!busId) return [];
  const targetBusId = Number(busId);

  const allExpenses = window.db.getExpenses();
  const fuelExpenses = allExpenses.filter(e => {
    const isFuel = (e.category || '').toLowerCase() === 'fuel';
    const eBusId = Number(e.busId || e.vehicleId || 0);
    return isFuel && eBusId === targetBusId;
  });

  // Sort chronologically by transaction date asc, then id asc
  fuelExpenses.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });

  return fuelExpenses;
}

function calculateFuelMetrics(schoolId, busId, targetDate, entryId = null, candidateAmount = 0, candidateLitres = 0) {
  const cAmt = Number(candidateAmount || 0);
  const cLit = Number(candidateLitres || 0);

  if (!busId || !targetDate) {
    return {
      previousCumulativeAmount: 0,
      cumulativeAmountAfter: cAmt,
      previousCumulativeLitres: 0,
      cumulativeLitresAfter: cLit,
      dailyTotal: cAmt,
      monthlyTotal: cAmt
    };
  }

  const bId = Number(busId || 0);
  const eId = entryId ? Number(entryId) : null;

  // Fetch all existing fuel transactions for THIS vehicle, excluding current entry if editing
  const existingRecords = getVehicleFuelTransactions(schoolId, bId).filter(e => eId ? Number(e.id) !== eId : true);

  // Candidate entry representing current transaction
  const targetEntry = {
    id: eId || 9999999999999, // position new entries after existing entries on same date
    date: targetDate,
    amount: cAmt,
    litreQty: cLit,
    isTarget: true
  };

  const fullList = [...existingRecords, targetEntry];

  // Re-sort list chronologically by date asc, then id asc
  fullList.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });

  const targetIdx = fullList.findIndex(e => e.isTarget || (eId && Number(e.id) === eId));

  let previousCumulativeAmount = 0;
  let previousCumulativeLitres = 0;

  for (let i = 0; i < targetIdx; i++) {
    previousCumulativeAmount += Number(fullList[i].amount || 0);
    previousCumulativeLitres += Number(fullList[i].litreQty || 0);
  }

  const cumulativeAmountAfter = previousCumulativeAmount + cAmt;
  const cumulativeLitresAfter = previousCumulativeLitres + cLit;

  // Daily & Monthly Totals for target date/month for THIS vehicle
  const targetMonthStr = targetDate.substring(0, 7);
  const dailyTotal = fullList.filter(e => e.date === targetDate).reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthlyTotal = fullList.filter(e => (e.date || '').substring(0, 7) === targetMonthStr).reduce((s, e) => s + Number(e.amount || 0), 0);

  return {
    previousCumulativeAmount,
    cumulativeAmountAfter,
    previousCumulativeLitres,
    cumulativeLitresAfter,
    dailyTotal,
    monthlyTotal
  };
}

function updateExpenseFuelCalculations() {
  const catVal = document.getElementById('expense-category')?.value || '';
  if (catVal.toLowerCase() !== 'fuel') return;

  const schoolId = Number(document.getElementById('expense-school-id')?.value || 0);
  const busId = Number(document.getElementById('expense-bus-id')?.value || 0);
  const date = document.getElementById('expense-date')?.value || new Date().toISOString().split('T')[0];
  const entryId = document.getElementById('expense-id-input')?.value || null;
  const amount = parseFloat(document.getElementById('expense-fuel-amount')?.value || 0);
  const litres = parseFloat(document.getElementById('expense-litre-qty')?.value || 0);

  const metrics = calculateFuelMetrics(schoolId, busId, date, entryId, amount, litres);

  const prevTotalEl = document.getElementById('expense-previous-total');
  const cumTotalEl = document.getElementById('expense-cumulative-total');
  const prevLitresEl = document.getElementById('expense-previous-litres');
  const cumLitresEl = document.getElementById('expense-cumulative-litres');
  const dailyTotalEl = document.getElementById('expense-daily-total');
  const monthlyTotalEl = document.getElementById('expense-monthly-total');

  if (prevTotalEl) prevTotalEl.textContent = formatCurrency(metrics.previousCumulativeAmount);
  if (cumTotalEl) cumTotalEl.textContent = formatCurrency(metrics.cumulativeAmountAfter);
  if (prevLitresEl) prevLitresEl.textContent = `${metrics.previousCumulativeLitres.toFixed(2)} L`;
  if (cumLitresEl) cumLitresEl.textContent = `${metrics.cumulativeLitresAfter.toFixed(2)} L`;
  if (dailyTotalEl) dailyTotalEl.textContent = formatCurrency(metrics.dailyTotal);
  if (monthlyTotalEl) monthlyTotalEl.textContent = formatCurrency(metrics.monthlyTotal);
}

function onExpenseFuelLitresRateInput() {
  const litres = parseFloat(document.getElementById('expense-litre-qty')?.value) || 0;
  const rate = parseFloat(document.getElementById('expense-rate')?.value) || 0;
  const fuelAmountInput = document.getElementById('expense-fuel-amount');

  if (litres > 0 && rate > 0 && fuelAmountInput) {
    fuelAmountInput.value = (litres * rate).toFixed(2);
  }
  updateExpenseFuelCalculations();
}

function onExpenseFuelAmountInput() {
  const amount = parseFloat(document.getElementById('expense-fuel-amount')?.value) || 0;
  const litres = parseFloat(document.getElementById('expense-litre-qty')?.value) || 0;
  const rateInput = document.getElementById('expense-rate');

  if (amount > 0 && litres > 0 && rateInput && (!rateInput.value || rateInput.value === '0')) {
    rateInput.value = (amount / litres).toFixed(2);
  }
  updateExpenseFuelCalculations();
}

function toggleExpenseFuelFields() {
  const catVal = document.getElementById('expense-category')?.value || '';
  const fuelFieldsContainer = document.getElementById('expense-fuel-fields');
  const standardAmountGroup = document.getElementById('expense-amount-standard-group');
  const isFuel = catVal.toLowerCase() === 'fuel';

  if (fuelFieldsContainer) {
    fuelFieldsContainer.style.display = isFuel ? 'block' : 'none';
  }

  if (standardAmountGroup) {
    standardAmountGroup.style.display = isFuel ? 'none' : 'block';
  }

  const descInput = document.getElementById('expense-desc');
  if (isFuel && descInput && (!descInput.value || descInput.value.trim() === '')) {
    descInput.value = 'Diesel Refill';
  }

  if (isFuel) {
    updateExpenseFuelCalculations();
  }
}

/* ==========================================
   ADD & EDIT EXPENSE TRANSACTION MODAL
   ========================================== */

function openAddExpenseModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const categories = window.db.getCategories('EXPENSE', user.role);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Expense Transaction';

  const todayStr = new Date().toISOString().split('T')[0];
  const initialSchoolId = isSchoolUser ? user.schoolId : (schools[0] ? schools[0].id : null);

  body.innerHTML = `
    <form id="expense-form" onsubmit="saveExpense(event)">
      <input type="hidden" id="expense-id-input" value="">

      <div class="form-group">
        <label>Transaction Date *</label>
        <input type="date" id="expense-date" class="form-control" required value="${todayStr}" onchange="updateExpenseFuelCalculations()">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Select School *</label>
          <select id="expense-school-id" class="form-control" required onchange="updateExpenseBusDropdown(this.value); updateExpenseFuelCalculations();">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="expense-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Select Bus / Vehicle *</label>
        <select id="expense-bus-id" class="form-control" required onchange="updateExpenseFuelCalculations()">
          <option value="">SELECT VEHICLE</option>
        </select>
      </div>

      <div class="form-group">
        <label>Expense Category *</label>
        <select id="expense-category" class="form-control" required onchange="toggleExpenseFuelFields()">
          ${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
        </select>
      </div>

      <!-- Fuel Specific Parameters (Displayed dynamically when Fuel Category is selected) -->
      <div id="expense-fuel-fields" style="display: none; background: #eff6ff; padding: 16px; border-radius: 10px; border: 1px solid #bfdbfe; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-gas-pump" style="color: #0284c7;"></i> Fuel Refill Details & Odometer Tracking
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: #1e40af;">Litre Quantity (Liters) *</label>
            <input type="number" step="0.01" min="0" id="expense-litre-qty" class="form-control" placeholder="e.g. 50.5" oninput="onExpenseFuelLitresRateInput()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: #1e40af;">KM Filling Fuel (Odometer) *</label>
            <input type="number" step="1" min="0" id="expense-km-filling" class="form-control" placeholder="e.g. 45890" oninput="updateExpenseFuelCalculations()">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 600; color: #1e40af;">Rate Per Liter (₹/L)</label>
            <input type="number" step="0.01" min="0" id="expense-rate" class="form-control" placeholder="e.g. 98.50" oninput="onExpenseFuelLitresRateInput()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-weight: 700; color: var(--color-expense);">Total Fuel Amount (₹) *</label>
            <input type="number" step="0.01" min="1" id="expense-fuel-amount" class="form-control" placeholder="e.g. 4974.25" oninput="onExpenseFuelAmountInput()">
          </div>
        </div>

        <!-- Cumulative Fuel & Litres Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Previous Cumulative Fuel</div>
            <strong id="expense-previous-total" style="font-size: 14px; color: #0f172a;">₹ 0</strong>
            <div style="font-size: 11px; color: #64748b;" id="expense-previous-litres">0 L</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Cumulative After This Entry</div>
            <strong id="expense-cumulative-total" style="font-size: 14px; color: #047857;">₹ 0</strong>
            <div style="font-size: 11px; color: #047857; font-weight: 600;" id="expense-cumulative-litres">0 L</div>
          </div>
        </div>

        <!-- Daily & Monthly Totals Banner -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 12px;">
          <div>
            <span style="color: #64748b; font-weight: 600;">Daily Fuel Total:</span>
            <strong id="expense-daily-total" style="color: #1e293b; margin-left: 4px;">₹ 0</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Monthly Fuel Total:</span>
            <strong id="expense-monthly-total" style="color: #0284c7; margin-left: 4px;">₹ 0</strong>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Fuel Station / Description *</label>
        <input type="text" id="expense-desc" class="form-control" required placeholder="e.g. Bus Diesel Refill Charges">
      </div>

      <div class="form-group" id="expense-amount-standard-group">
        <label>Amount (₹) *</label>
        <input type="number" id="expense-amount-standard" class="form-control" min="1" step="0.01" placeholder="e.g. 25000">
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="background: var(--color-expense); width: auto;">Save Expense Entry</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
  if (initialSchoolId) {
    updateExpenseBusDropdown(initialSchoolId);
  }
  toggleExpenseFuelFields();
}

function openEditExpenseModal(id) {
  const exp = window.db.getExpenses().find(e => e.id === Number(id));
  if (!exp) return;

  openAddExpenseModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Expense Transaction';
  document.getElementById('expense-id-input').value = exp.id;
  document.getElementById('expense-date').value = exp.date;

  const schoolSelect = document.getElementById('expense-school-id');
  if (schoolSelect) schoolSelect.value = exp.schoolId;

  const busId = exp.busId || exp.vehicleId;
  updateExpenseBusDropdown(exp.schoolId, busId);
  if (document.getElementById('expense-bus-id')) {
    document.getElementById('expense-bus-id').value = busId || '';
  }

  document.getElementById('expense-category').value = exp.category;
  toggleExpenseFuelFields();

  if ((exp.category || '').toLowerCase() === 'fuel') {
    if (document.getElementById('expense-litre-qty')) document.getElementById('expense-litre-qty').value = exp.litreQty || '';
    if (document.getElementById('expense-km-filling')) document.getElementById('expense-km-filling').value = exp.kmFilling || '';
    if (document.getElementById('expense-rate')) document.getElementById('expense-rate').value = exp.ratePerLitre || '';
    if (document.getElementById('expense-fuel-amount')) document.getElementById('expense-fuel-amount').value = exp.amount || '';
    if (document.getElementById('expense-desc')) document.getElementById('expense-desc').value = exp.description || '';
    updateExpenseFuelCalculations();
  } else {
    if (document.getElementById('expense-desc')) document.getElementById('expense-desc').value = exp.description || '';
    if (document.getElementById('expense-amount-standard')) document.getElementById('expense-amount-standard').value = exp.amount || '';
  }
}

function saveExpense(event) {
  event.preventDefault();
  const idVal = document.getElementById('expense-id-input').value;
  const date = document.getElementById('expense-date').value;
  const schoolId = Number(document.getElementById('expense-school-id').value);
  const busIdVal = document.getElementById('expense-bus-id')?.value;
  const busId = busIdVal ? Number(busIdVal) : null;
  const category = document.getElementById('expense-category').value;
  const description = document.getElementById('expense-desc').value.trim();

  const isFuel = category.toLowerCase() === 'fuel';
  const amount = isFuel 
    ? Number(document.getElementById('expense-fuel-amount').value)
    : Number(document.getElementById('expense-amount-standard').value);

  const litreQtyVal = document.getElementById('expense-litre-qty')?.value;
  const kmFillingVal = document.getElementById('expense-km-filling')?.value;
  const rateVal = document.getElementById('expense-rate')?.value;

  let litreQty = isFuel && litreQtyVal ? parseFloat(litreQtyVal) : null;
  let kmFilling = isFuel && kmFillingVal ? parseFloat(kmFillingVal) : null;
  let ratePerLitre = isFuel && rateVal ? parseFloat(rateVal) : null;

  if (isFuel) {
    if (!busId) {
      showToast('Please select a vehicle / bus for fuel entry', 'warning');
      return;
    }
    if (!litreQty || litreQty <= 0) {
      showToast('Please enter a valid fuel Litre Quantity', 'warning');
      return;
    }
    if (kmFilling === null || isNaN(kmFilling)) {
      showToast('Please enter KM Filling Fuel (Odometer)', 'warning');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Please enter a valid Total Fuel Amount (₹)', 'warning');
      return;
    }
    if (!ratePerLitre && litreQty > 0 && amount > 0) {
      ratePerLitre = parseFloat((amount / litreQty).toFixed(2));
    }
  } else {
    if (!amount || amount <= 0) {
      showToast('Please enter a valid Amount (₹)', 'warning');
      return;
    }
  }

  const data = window.db.getData();

  const recordPayload = {
    date,
    schoolId,
    busId,
    vehicleId: busId,
    category,
    description,
    amount,
    ...(isFuel ? { litreQty, kmFilling, ratePerLitre } : {})
  };

  if (idVal) {
    const idx = data.expenses.findIndex(e => e.id === Number(idVal));
    if (idx !== -1) {
      data.expenses[idx] = { ...data.expenses[idx], ...recordPayload };
      showToast('Expense transaction updated successfully', 'success');
    }
  } else {
    data.expenses.push({ id: Date.now(), ...recordPayload });
    showToast('Expense transaction recorded successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderExpensesPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteExpense(id) {
  const numId = Number(id);
  const exp = window.db.getExpenses().find(e => e.id === numId);
  const expName = exp ? (exp.description || exp.category || 'Expense Record') : 'Expense Record';

  showDeleteConfirmationModal({
    itemTitle: expName,
    onConfirm: () => {
      const data = window.db.getData();
      data.expenses = data.expenses.filter(e => e.id !== numId);
      window.db.saveData(data);
      showToast('Expense record deleted', 'success');
      renderExpensesPage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

// Window Exposures & Global API
window.renderExpensesPage = renderExpensesPage;
window.openAddExpenseModal = openAddExpenseModal;
window.openEditExpenseModal = openEditExpenseModal;
window.openQuickFuelModal = (id) => openEditExpenseModal(id);
window.updateExpenseBusDropdown = updateExpenseBusDropdown;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
window.toggleExpenseFuelFields = toggleExpenseFuelFields;
window.updateExpenseFuelCalculations = updateExpenseFuelCalculations;
window.onExpenseFuelLitresRateInput = onExpenseFuelLitresRateInput;
window.onExpenseFuelAmountInput = onExpenseFuelAmountInput;
window.filterExpenseTable = filterExpenseTable;
window.onExpenseSchoolFilterChange = onExpenseSchoolFilterChange;
window.onExpenseBusFilterChange = onExpenseBusFilterChange;
window.getVehicleFuelTransactions = getVehicleFuelTransactions;
window.calculateFuelMetrics = calculateFuelMetrics;
