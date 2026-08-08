/* ==========================================
   SCHOOLS MANAGEMENT MODULE
   ========================================== */

function renderSchoolsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('schools-view');
  if (!container) return;

  if (user.role === 'School') {
    container.innerHTML = `
      <div class="card empty-state">
        <i class="fa-solid fa-lock"></i>
        <h4>Access Restricted</h4>
        <p>School accounts are restricted to their assigned school profile.</p>
      </div>
    `;
    return;
  }

  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="school-search-input" class="form-control" placeholder="Search school name or location..." oninput="filterSchoolsTable()">
      </div>
      <div>
        <button class="btn-primary" onclick="openAddSchoolModal()">
          <i class="fa-solid fa-plus"></i> Add New School
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="schools-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Vehicles</th>
              <th>Income</th>
              <th>Expense</th>
              <th>Profit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="schools-tbody">
            ${renderSchoolRows(schools)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSchoolRows(schools) {
  if (!schools || !schools.length) {
    return `<tr><td colspan="9" class="empty-state">No school records found.</td></tr>`;
  }

  return schools.map(s => {
    const vCount = window.db.getVehicles(s.id).length;
    const inc = window.db.getTotalIncome(s.id);
    const exp = window.db.getTotalExpenses(s.id);
    const prof = inc - exp;

    return `
      <tr class="table-row" style="cursor: pointer;" onclick="if (!event.target.closest('.action-buttons')) { selectDashboardSchool(${s.id}); app.navigateTo('dashboard'); }" title="Click to view transport dashboard for ${escapeHTML(s.name)}">
        <td><strong>${escapeHTML(s.name)}</strong><br><small style="color: var(--color-text-secondary);">${escapeHTML(s.email || '')}</small></td>
        <td>${escapeHTML(s.location)}</td>
        <td>${escapeHTML(s.contact)}</td>
        <td><span class="badge badge-neutral">${vCount} Vehicles</span></td>
        <td style="color: var(--color-income); font-weight: 600;">${formatCurrency(inc)}</td>
        <td style="color: var(--color-expense); font-weight: 600;">${formatCurrency(exp)}</td>
        <td style="color: var(--color-profit); font-weight: 700;">${formatCurrency(prof)}</td>
        <td><span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${s.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit School" onclick="openEditSchoolModal(${s.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete School" onclick="deleteSchool(${s.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterSchoolsTable() {
  const query = document.getElementById('school-search-input')?.value.toLowerCase().trim() || '';
  const allSchools = window.db.getSchools();
  const filtered = allSchools.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.location.toLowerCase().includes(query)
  );
  const tbody = document.getElementById('schools-tbody');
  if (tbody) tbody.innerHTML = renderSchoolRows(filtered);
}

// Add/Edit School Modals Logic
function openAddSchoolModal() {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add New School';

  body.innerHTML = `
    <form id="school-form" onsubmit="saveSchool(event)">
      <input type="hidden" id="school-id-input" value="">
      <div class="form-group">
        <label>School Name *</label>
        <input type="text" id="school-name" class="form-control" required placeholder="e.g. National Model School">
      </div>
      <div class="form-group">
        <label>Location / City *</label>
        <input type="text" id="school-location" class="form-control" required placeholder="e.g. Kozhikode">
      </div>
      <div class="form-group">
        <label>Contact Number *</label>
        <input type="text" id="school-contact" class="form-control" required placeholder="+91 98765 43210">
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="school-email" class="form-control" placeholder="contact@school.edu">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="school-status" class="form-control">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save School</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function openEditSchoolModal(id) {
  const school = window.db.getSchools().find(s => s.id === id);
  if (!school) return;

  openAddSchoolModal();
  document.getElementById('generic-modal-title').innerText = 'Edit School Details';
  document.getElementById('school-id-input').value = school.id;
  document.getElementById('school-name').value = school.name;
  document.getElementById('school-location').value = school.location;
  document.getElementById('school-contact').value = school.contact;
  document.getElementById('school-email').value = school.email || '';
  document.getElementById('school-status').value = school.status || 'Active';
}

function saveSchool(event) {
  event.preventDefault();
  const idVal = document.getElementById('school-id-input').value;
  const name = document.getElementById('school-name').value.trim();
  const location = document.getElementById('school-location').value.trim();
  const contact = document.getElementById('school-contact').value.trim();
  const email = document.getElementById('school-email').value.trim();
  const status = document.getElementById('school-status').value;

  const data = window.db.getData();

  if (idVal) {
    // Edit existing
    const index = data.schools.findIndex(s => s.id === Number(idVal));
    if (index !== -1) {
      data.schools[index] = { ...data.schools[index], name, location, contact, email, status };
      showToast('School updated successfully', 'success');
    }
  } else {
    // Add new
    const newId = Date.now();
    data.schools.push({ id: newId, name, location, contact, email, status, vehicles: 0, income: 0, expense: 0 });
    showToast('School added successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderSchoolsPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteSchool(id) {
  if (confirm('Are you sure you want to delete this school record?')) {
    const data = window.db.getData();
    data.schools = data.schools.filter(s => s.id !== id);
    window.db.saveData(data);
    showToast('School deleted successfully', 'success');
    renderSchoolsPage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

window.renderSchoolsPage = renderSchoolsPage;
window.openAddSchoolModal = openAddSchoolModal;
window.openEditSchoolModal = openEditSchoolModal;
window.saveSchool = saveSchool;
window.deleteSchool = deleteSchool;
