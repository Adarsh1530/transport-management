/* ==========================================
   INCOME FINANCIAL MANAGEMENT MODULE
   ========================================== */

function renderIncomePage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('income-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const incomeRecords = window.db.getIncome(isSchoolUser ? schoolId : null);
  const totalIncome = window.db.getTotalIncome(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="card metric-card metric-blue" style="margin-bottom: 24px; padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span class="metric-title">Total Fee Income Collected</span>
          <div class="metric-value" id="income-total-display">${formatCurrency(totalIncome)}</div>
          <div class="metric-sub positive"><i class="fa-solid fa-arrow-up"></i> Accumulated revenue across transport operations</div>
        </div>
        <button class="btn-primary" style="width: auto;" onclick="openAddIncomeModal()">
          <i class="fa-solid fa-plus"></i> Add Income Entry
        </button>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="income-search-input" class="form-control" placeholder="Search description..." oninput="filterIncomeTable()">
        </div>

        <select id="income-category-filter" class="form-control" style="width: auto;" onchange="filterIncomeTable()">
          <option value="">All Categories</option>
          <option value="Transport Fee">Transport Fee</option>
          <option value="Monthly Fee">Monthly Fee</option>
          <option value="Annual Transport Fee">Annual Transport Fee</option>
          <option value="Other Income">Other Income</option>
        </select>

        ${!isSchoolUser ? `
          <select id="income-school-filter" class="form-control" style="width: auto;" onchange="filterIncomeTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
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
    const colSpan = showSchoolCol ? 6 : 5;
    return `<tr><td colspan="${colSpan}" class="empty-state">No income transactions found.</td></tr>`;
  }

  const schools = window.db.getSchools();

  return records.map(inc => {
    const school = schools.find(s => s.id === inc.schoolId);

    return `
      <tr class="table-row">
        <td>${formatDate(inc.date)}</td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
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

function filterIncomeTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('income-search-input')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('income-category-filter')?.value || '';
  const schoolFilter = document.getElementById('income-school-filter')?.value || '';

  let list = window.db.getIncome(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(i => (i.description && i.description.toLowerCase().includes(query)));
  }

  if (categoryFilter) {
    list = list.filter(i => i.category === categoryFilter);
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(i => i.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('income-tbody');
  if (tbody) tbody.innerHTML = renderIncomeRows(list, !isSchoolUser);

  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDisplay = document.getElementById('income-total-display');
  if (totalDisplay) totalDisplay.innerText = formatCurrency(filteredSum);
}

function openAddIncomeModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Income Transaction';

  const todayStr = new Date().toISOString().split('T')[0];

  body.innerHTML = `
    <form id="income-form" onsubmit="saveIncome(event)">
      <input type="hidden" id="income-id-input" value="">
      <div class="form-group">
        <label>Transaction Date *</label>
        <input type="date" id="income-date" class="form-control" required value="${todayStr}">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="income-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="income-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Income Category *</label>
        <select id="income-category" class="form-control" required>
          <option value="Transport Fee">Transport Fee</option>
          <option value="Monthly Fee">Monthly Fee</option>
          <option value="Annual Transport Fee">Annual Transport Fee</option>
          <option value="Other Income">Other Income</option>
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
}

function openEditIncomeModal(id) {
  const inc = window.db.getIncome().find(i => i.id === id);
  if (!inc) return;

  openAddIncomeModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Income Transaction';
  document.getElementById('income-id-input').value = inc.id;
  document.getElementById('income-date').value = inc.date;
  const schoolSelect = document.getElementById('income-school-id');
  if (schoolSelect) schoolSelect.value = inc.schoolId;
  document.getElementById('income-category').value = inc.category;
  document.getElementById('income-desc').value = inc.description;
  document.getElementById('income-amount').value = inc.amount;
}

function saveIncome(event) {
  event.preventDefault();
  const idVal = document.getElementById('income-id-input').value;
  const date = document.getElementById('income-date').value;
  const schoolId = Number(document.getElementById('income-school-id').value);
  const category = document.getElementById('income-category').value;
  const description = document.getElementById('income-desc').value.trim();
  const amount = Number(document.getElementById('income-amount').value);

  const data = window.db.getData();

  if (idVal) {
    const idx = data.income.findIndex(i => i.id === Number(idVal));
    if (idx !== -1) {
      data.income[idx] = { ...data.income[idx], date, schoolId, category, description, amount };
      showToast('Income record updated', 'success');
    }
  } else {
    data.income.push({ id: Date.now(), date, schoolId, category, description, amount });
    showToast('Income recorded successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderIncomePage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteIncome(id) {
  if (confirm('Are you sure you want to delete this income entry?')) {
    const data = window.db.getData();
    data.income = data.income.filter(i => i.id !== id);
    window.db.saveData(data);
    showToast('Income record deleted', 'success');
    renderIncomePage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

window.renderIncomePage = renderIncomePage;
window.openAddIncomeModal = openAddIncomeModal;
window.openEditIncomeModal = openEditIncomeModal;
window.saveIncome = saveIncome;
window.deleteIncome = deleteIncome;
