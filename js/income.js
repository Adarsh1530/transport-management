/* ==========================================
   INCOME FINANCIAL MANAGEMENT MODULE
   ========================================== */

function renderIncomePage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('income-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const incomeRecords = window.db.getIncome(isSchoolUser ? schoolId : null, user.role);
  const totalIncome = window.db.getTotalIncome(isSchoolUser ? schoolId : null, user.role);
  const schools = window.db.getSchools();
  const categories = window.db.getCategories('INCOME', user.role);
  const vehicles = window.db.getVehicles(isSchoolUser ? schoolId : null);

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="card metric-card metric-blue" style="margin-bottom: 24px; padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span class="metric-title">Total Fee Income Collected</span>
          <div class="metric-value" id="income-total-display">${formatCurrency(totalIncome)}</div>
          <div class="metric-sub positive"><i class="fa-solid fa-arrow-up"></i> Accumulated revenue across transport operations</div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
          <button class="btn-primary" style="width: auto; background: #10b981;" onclick="exportIncomeToExcel()">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button class="btn-primary" style="width: auto; background: #ef4444;" onclick="exportIncomeToPDF()">
            <i class="fa-solid fa-file-pdf"></i> Export PDF
          </button>
          <button class="btn-primary" style="width: auto;" onclick="openAddIncomeModal()">
            <i class="fa-solid fa-plus"></i> Add Income Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Controls Bar with Filters: Search bar - School wise - Bus wise - Category wise - Date Wise -->
    <div class="controls-bar">
      <div class="filter-group" style="flex-wrap: wrap;">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="income-search-input" class="form-control" placeholder="Search description..." oninput="filterIncomeTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="income-school-filter" class="form-control" style="width: auto;" onchange="onIncomeSchoolFilterChange()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}

        <select id="income-bus-filter" class="form-control" style="width: auto;" onchange="onIncomeBusFilterChange()">
          <option value="">All Bus / Vehicles</option>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
        </select>

        <select id="income-category-filter" class="form-control" style="width: auto;" onchange="filterIncomeTable()">
          <option value="">All Categories</option>
          ${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
        </select>

        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0;">From:</label>
          <input type="date" id="income-date-from" class="form-control" style="width: auto;" title="From Date" onchange="filterIncomeTable()">
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px;">
          <label style="font-size: 12px; font-weight: 700; color: #64748b; margin: 0;">To:</label>
          <input type="date" id="income-date-to" class="form-control" style="width: auto;" title="To Date" onchange="filterIncomeTable()">
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="income-table">
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
          <tbody id="income-tbody">
            ${renderIncomeRows(incomeRecords, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderIncomeRows(records, showSchoolCol = true) {
  if (!records || !records.length) {
    const colSpan = showSchoolCol ? 7 : 6;
    return `<tr><td colspan="${colSpan}" class="empty-state">No income transactions found.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();

  return records.map(inc => {
    const school = schools.find(s => s.id === inc.schoolId);
    const veh = vehicles.find(v => v.id === inc.busId || v.id === inc.vehicleId);
    const busNoStr = veh ? veh.busNo : (inc.busId ? `Bus ${inc.busId}` : 'General');

    return `
      <tr class="table-row">
        <td>${formatDate(inc.date)}</td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><strong style="color: var(--color-primary);">${escapeHTML(busNoStr)}</strong></td>
        <td><span class="badge badge-paid">${escapeHTML(inc.category)}</span></td>
        <td>${escapeHTML(inc.description)}</td>
        <td style="color: var(--color-income); font-weight: 700;">${formatCurrency(inc.amount)}</td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Income" onclick="openEditIncomeModal(${inc.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Income" onclick="deleteIncome(${inc.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getFilteredIncomeList() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('income-search-input')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('income-category-filter')?.value || '';
  const busFilter = document.getElementById('income-bus-filter')?.value || '';
  const dateFrom = document.getElementById('income-date-from')?.value || '';
  const dateTo = document.getElementById('income-date-to')?.value || '';
  const schoolFilter = document.getElementById('income-school-filter')?.value || '';

  let list = window.db.getIncome(isSchoolUser ? schoolId : null, user.role);

  if (query) {
    list = list.filter(i => (i.description && i.description.toLowerCase().includes(query)));
  }

  if (categoryFilter) {
    list = list.filter(i => i.category === categoryFilter);
  }

  if (busFilter) {
    const numBusId = Number(busFilter);
    list = list.filter(i => Number(i.busId) === numBusId || Number(i.vehicleId) === numBusId);
  }

  if (dateFrom) {
    list = list.filter(i => i.date >= dateFrom);
  }
  
  if (dateTo) {
    list = list.filter(i => i.date <= dateTo);
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(i => i.schoolId === Number(schoolFilter));
  }
  
  return list;
}

function filterIncomeTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';

  const list = getFilteredIncomeList();

  const tbody = document.getElementById('income-tbody');
  if (tbody) tbody.innerHTML = renderIncomeRows(list, !isSchoolUser);

  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDisplay = document.getElementById('income-total-display');
  if (totalDisplay) totalDisplay.innerText = formatCurrency(filteredSum);
}

function exportIncomeToPDF() {
  const list = getFilteredIncomeList();
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
  
  const rows = list.map(inc => {
    const school = schools.find(s => s.id === inc.schoolId);
    const veh = vehicles.find(v => v.id === inc.busId || v.id === inc.vehicleId);
    const busNoStr = veh ? veh.busNo : (inc.busId ? `Bus ${inc.busId}` : 'General');
    
    if (isSchoolUser) {
      return [formatDate(inc.date), busNoStr, inc.category, inc.description, inc.amount];
    } else {
      return [formatDate(inc.date), school ? school.name : 'N/A', busNoStr, inc.category, inc.description, inc.amount];
    }
  });
  
  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  exportFilteredReportToPDF('Income Report', columns, rows, filteredSum);
}

function exportIncomeToExcel() {
  const list = getFilteredIncomeList();
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
  
  const rows = list.map(inc => {
    const school = schools.find(s => s.id === inc.schoolId);
    const veh = vehicles.find(v => v.id === inc.busId || v.id === inc.vehicleId);
    const busNoStr = veh ? veh.busNo : (inc.busId ? `Bus ${inc.busId}` : 'General');
    
    if (isSchoolUser) {
      return [inc.date, busNoStr, inc.category, inc.description, inc.amount];
    } else {
      return [inc.date, school ? school.name : 'N/A', busNoStr, inc.category, inc.description, inc.amount];
    }
  });
  
  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  exportFilteredReportToExcel('Income_Report', columns, rows, filteredSum);
}

function onIncomeSchoolFilterChange() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolFilterVal = document.getElementById('income-school-filter')?.value || '';
  const busSelect = document.getElementById('income-bus-filter');

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

  filterIncomeTable();
}

function onIncomeBusFilterChange() {
  const busFilterVal = document.getElementById('income-bus-filter')?.value || '';
  const schoolSelect = document.getElementById('income-school-filter');

  if (busFilterVal && schoolSelect && !schoolSelect.value) {
    const user = window.auth.getCurrentUser();
    const allVehicles = window.db.getVehicles(user.role === 'School' ? user.schoolId : null);
    const veh = allVehicles.find(v => String(v.id) === String(busFilterVal));
    if (veh && veh.schoolId) {
      schoolSelect.value = veh.schoolId;
      const schoolVehicles = window.db.getVehicles(veh.schoolId);
      const busSelect = document.getElementById('income-bus-filter');
      if (busSelect) {
        busSelect.innerHTML = `
          <option value="">All Bus / Vehicles</option>
          ${schoolVehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.vehicleName || v.model || 'Bus')})</option>`).join('')}
        `;
        busSelect.value = busFilterVal;
      }
    }
  }

  filterIncomeTable();
}

function updateIncomeBusDropdown(schoolId, selectedBusId = null) {
  const busSelect = document.getElementById('income-bus-id');
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

function openAddIncomeModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const categories = window.db.getCategories('INCOME', user.role);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Income Transaction';

  const todayStr = new Date().toISOString().split('T')[0];
  const initialSchoolId = isSchoolUser ? user.schoolId : (schools[0] ? schools[0].id : null);

  body.innerHTML = `
    <form id="income-form" onsubmit="saveIncome(event)">
      <input type="hidden" id="income-id-input" value="">
      
      <div class="form-group">
        <label>Transaction Date *</label>
        <input type="date" id="income-date" class="form-control" required value="${todayStr}">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Select School *</label>
          <select id="income-school-id" class="form-control" required onchange="updateIncomeBusDropdown(this.value)">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="income-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Select Vehicle / Bus *</label>
        <select id="income-bus-id" class="form-control" required>
          <option value="">SELECT VEHICLE</option>
        </select>
      </div>

      <div class="form-group">
        <label>Income Category *</label>
        <select id="income-category" class="form-control" required>
          ${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Description *</label>
        <input type="text" id="income-desc" class="form-control" required placeholder="e.g. August Bus Pass Collections">
      </div>

      <div class="form-group">
        <label>Amount (₹) *</label>
        <input type="number" id="income-amount" class="form-control" required min="1" step="1" placeholder="e.g. 50000">
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Income Entry</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
  if (initialSchoolId) {
    updateIncomeBusDropdown(initialSchoolId);
  }
}

function openEditIncomeModal(id) {
  const inc = window.db.getIncome().find(i => i.id === Number(id));
  if (!inc) return;

  openAddIncomeModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Income Transaction';
  document.getElementById('income-id-input').value = inc.id;
  document.getElementById('income-date').value = inc.date;
  const schoolSelect = document.getElementById('income-school-id');
  if (schoolSelect) schoolSelect.value = inc.schoolId;
  updateIncomeBusDropdown(inc.schoolId, inc.busId || inc.vehicleId);
  document.getElementById('income-category').value = inc.category;
  document.getElementById('income-desc').value = inc.description;
  document.getElementById('income-amount').value = inc.amount;
}

function saveIncome(event) {
  event.preventDefault();
  const idVal = document.getElementById('income-id-input').value;
  const date = document.getElementById('income-date').value;
  const schoolId = Number(document.getElementById('income-school-id').value);
  const busIdVal = document.getElementById('income-bus-id')?.value;
  const busId = busIdVal ? Number(busIdVal) : null;
  const category = document.getElementById('income-category').value;
  const description = document.getElementById('income-desc').value.trim();
  const amount = Number(document.getElementById('income-amount').value);

  const data = window.db.getData();

  const recordPayload = { date, schoolId, busId, vehicleId: busId, category, description, amount };

  if (idVal) {
    const idx = data.income.findIndex(i => i.id === Number(idVal));
    if (idx !== -1) {
      data.income[idx] = { ...data.income[idx], ...recordPayload };
      showToast('Income record updated', 'success');
    }
  } else {
    data.income.push({ id: Date.now(), ...recordPayload });
    showToast('Income recorded successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderIncomePage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteIncome(id) {
  const numId = Number(id);
  const inc = window.db.getIncome().find(i => i.id === numId);
  const incName = inc ? (inc.description || inc.category || 'Income Record') : 'Income Record';

  showDeleteConfirmationModal({
    itemTitle: incName,
    onConfirm: () => {
      const data = window.db.getData();
      data.income = data.income.filter(i => i.id !== numId);
      window.db.saveData(data);
      showToast('Income record deleted', 'success');
      renderIncomePage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

window.renderIncomePage = renderIncomePage;
window.openAddIncomeModal = openAddIncomeModal;
window.openEditIncomeModal = openEditIncomeModal;
window.saveIncome = saveIncome;
window.deleteIncome = deleteIncome;
window.filterIncomeTable = filterIncomeTable;
window.onIncomeSchoolFilterChange = onIncomeSchoolFilterChange;
window.onIncomeBusFilterChange = onIncomeBusFilterChange;

