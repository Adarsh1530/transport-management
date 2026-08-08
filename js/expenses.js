/* ==========================================
   EXPENSES FINANCIAL MANAGEMENT MODULE
   ========================================== */

function renderExpensesPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('expenses-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const expenseRecords = window.db.getExpenses(isSchoolUser ? schoolId : null);
  const totalExpense = window.db.getTotalExpenses(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <!-- Top Summary Banner -->
    <div class="card metric-card metric-red" style="margin-bottom: 24px; padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span class="metric-title">Total Transport Expenses</span>
          <div class="metric-value" id="expense-total-display">${formatCurrency(totalExpense)}</div>
          <div class="metric-sub"><i class="fa-solid fa-arrow-down"></i> Operations, fuel, salaries & maintenance outlays</div>
        </div>
        <button class="btn-primary" style="width: auto; background: var(--color-expense);" onclick="openAddExpenseModal()">
          <i class="fa-solid fa-plus"></i> Add Expense Entry
        </button>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="expense-search-input" class="form-control" placeholder="Search expense description..." oninput="filterExpenseTable()">
        </div>

        <select id="expense-category-filter" class="form-control" style="width: auto;" onchange="filterExpenseTable()">
          <option value="">All Categories</option>
          <option value="Fuel">Fuel</option>
          <option value="Driver Salary">Driver Salary</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Insurance">Insurance</option>
          <option value="Repairs">Repairs</option>
          <option value="Permit">Permit</option>
          <option value="Tax">Tax</option>
          <option value="Other">Other</option>
        </select>

        ${!isSchoolUser ? `
          <select id="expense-school-filter" class="form-control" style="width: auto;" onchange="filterExpenseTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
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
    const colSpan = showSchoolCol ? 6 : 5;
    return `<tr><td colspan="${colSpan}" class="empty-state">No expense transactions recorded.</td></tr>`;
  }

  const schools = window.db.getSchools();

  return records.map(exp => {
    const school = schools.find(s => s.id === exp.schoolId);

    return `
      <tr class="table-row">
        <td>${formatDate(exp.date)}</td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><span class="badge badge-due">${escapeHTML(exp.category)}</span></td>
        <td>${escapeHTML(exp.description)}</td>
        <td style="color: var(--color-expense); font-weight: 700;">${formatCurrency(exp.amount)}</td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Expense" onclick="openEditExpenseModal(${exp.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Expense" onclick="deleteExpense(${exp.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterExpenseTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('expense-search-input')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('expense-category-filter')?.value || '';
  const schoolFilter = document.getElementById('expense-school-filter')?.value || '';

  let list = window.db.getExpenses(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(e => (e.description && e.description.toLowerCase().includes(query)));
  }

  if (categoryFilter) {
    list = list.filter(e => e.category === categoryFilter);
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(e => e.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('expenses-tbody');
  if (tbody) tbody.innerHTML = renderExpenseRows(list, !isSchoolUser);

  const filteredSum = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDisplay = document.getElementById('expense-total-display');
  if (totalDisplay) totalDisplay.innerText = formatCurrency(filteredSum);
}

function openAddExpenseModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Expense Transaction';

  const todayStr = new Date().toISOString().split('T')[0];

  body.innerHTML = `
    <form id="expense-form" onsubmit="saveExpense(event)">
      <input type="hidden" id="expense-id-input" value="">
      <div class="form-group">
        <label>Transaction Date *</label>
        <input type="date" id="expense-date" class="form-control" required value="${todayStr}">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="expense-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="expense-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Expense Category *</label>
        <select id="expense-category" class="form-control" required>
          <option value="Fuel">Fuel</option>
          <option value="Driver Salary">Driver Salary</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Insurance">Insurance</option>
          <option value="Repairs">Repairs</option>
          <option value="Permit">Permit</option>
          <option value="Tax">Tax</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label>Description *</label>
        <input type="text" id="expense-desc" class="form-control" required placeholder="e.g. Fleet Diesel Refill Charges">
      </div>

      <div class="form-group">
        <label>Amount (₹) *</label>
        <input type="number" id="expense-amount" class="form-control" required min="1" step="1" placeholder="e.g. 25000">
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="background: var(--color-expense); width: auto;">Save Expense Entry</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function openEditExpenseModal(id) {
  const exp = window.db.getExpenses().find(e => e.id === id);
  if (!exp) return;

  openAddExpenseModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Expense Transaction';
  document.getElementById('expense-id-input').value = exp.id;
  document.getElementById('expense-date').value = exp.date;
  const schoolSelect = document.getElementById('expense-school-id');
  if (schoolSelect) schoolSelect.value = exp.schoolId;
  document.getElementById('expense-category').value = exp.category;
  document.getElementById('expense-desc').value = exp.description;
  document.getElementById('expense-amount').value = exp.amount;
}

function saveExpense(event) {
  event.preventDefault();
  const idVal = document.getElementById('expense-id-input').value;
  const date = document.getElementById('expense-date').value;
  const schoolId = Number(document.getElementById('expense-school-id').value);
  const category = document.getElementById('expense-category').value;
  const description = document.getElementById('expense-desc').value.trim();
  const amount = Number(document.getElementById('expense-amount').value);

  const data = window.db.getData();

  if (idVal) {
    const idx = data.expenses.findIndex(e => e.id === Number(idVal));
    if (idx !== -1) {
      data.expenses[idx] = { ...data.expenses[idx], date, schoolId, category, description, amount };
      showToast('Expense record updated', 'success');
    }
  } else {
    data.expenses.push({ id: Date.now(), date, schoolId, category, description, amount });
    showToast('Expense recorded successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderExpensesPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteExpense(id) {
  if (confirm('Are you sure you want to delete this expense entry?')) {
    const data = window.db.getData();
    data.expenses = data.expenses.filter(e => e.id !== id);
    window.db.saveData(data);
    showToast('Expense record deleted', 'success');
    renderExpensesPage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

window.renderExpensesPage = renderExpensesPage;
window.openAddExpenseModal = openAddExpenseModal;
window.openEditExpenseModal = openEditExpenseModal;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
