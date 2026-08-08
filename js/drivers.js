/* ==========================================
   DRIVERS MANAGEMENT MODULE
   ========================================== */

function renderDriversPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('drivers-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const drivers = window.db.getDrivers(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="driver-search-input" class="form-control" placeholder="Search driver name or license..." oninput="filterDriversTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="driver-school-filter" class="form-control" style="width: auto;" onchange="filterDriversTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div>
        <button class="btn-primary" onclick="openAddDriverModal()">
          <i class="fa-solid fa-plus"></i> Add New Driver
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="drivers-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>License Number</th>
              <th>Phone</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Assigned Bus</th>
              <th>License Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="drivers-tbody">
            ${renderDriverRows(drivers, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDriverRows(drivers, showSchoolCol = true) {
  if (!drivers || !drivers.length) {
    const colSpan = showSchoolCol ? 8 : 7;
    return `<tr><td colspan="${colSpan}" class="empty-state">No driver records found.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();

  return drivers.map(d => {
    const school = schools.find(s => s.id === d.schoolId);
    const bus = vehicles.find(v => v.id === d.busId);

    return `
      <tr class="table-row">
        <td><strong>${escapeHTML(d.name)}</strong></td>
        <td><code>${escapeHTML(d.license)}</code></td>
        <td>${escapeHTML(d.phone)}</td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td>${escapeHTML(bus ? bus.busNo : 'Unassigned')}</td>
        <td>${formatDate(d.expiry)}</td>
        <td><span class="badge ${d.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${d.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Driver" onclick="openEditDriverModal(${d.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Driver" onclick="deleteDriver(${d.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterDriversTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('driver-search-input')?.value.toLowerCase().trim() || '';
  const schoolFilter = document.getElementById('driver-school-filter')?.value || '';

  let list = window.db.getDrivers(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(d =>
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.license && d.license.toLowerCase().includes(query)) ||
      (d.phone && d.phone.includes(query))
    );
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(d => d.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('drivers-tbody');
  if (tbody) tbody.innerHTML = renderDriverRows(list, !isSchoolUser);
}

function openAddDriverModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles(isSchoolUser ? user.schoolId : null);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add New Driver';

  body.innerHTML = `
    <form id="driver-form" onsubmit="saveDriver(event)">
      <input type="hidden" id="driver-id-input" value="">
      <div class="form-group">
        <label>Driver Full Name *</label>
        <input type="text" id="driver-name" class="form-control" required placeholder="e.g. Rajesh Kumar">
      </div>
      <div class="form-group">
        <label>License Number *</label>
        <input type="text" id="driver-license" class="form-control" required placeholder="e.g. KL01-2019008876">
      </div>
      <div class="form-group">
        <label>Mobile Number *</label>
        <input type="text" id="driver-phone" class="form-control" required placeholder="+91 98765 43210">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="driver-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="driver-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Assigned Bus</label>
        <select id="driver-bus-id" class="form-control">
          <option value="">Select Bus</option>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.type)})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>License Expiry Date</label>
        <input type="date" id="driver-expiry" class="form-control" value="2028-12-31">
      </div>

      <div class="form-group">
        <label>Status</label>
        <select id="driver-status" class="form-control">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Driver</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function openEditDriverModal(id) {
  const driver = window.db.getDrivers().find(d => d.id === id);
  if (!driver) return;

  openAddDriverModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Driver Details';
  document.getElementById('driver-id-input').value = driver.id;
  document.getElementById('driver-name').value = driver.name;
  document.getElementById('driver-license').value = driver.license;
  document.getElementById('driver-phone').value = driver.phone;
  const schoolSelect = document.getElementById('driver-school-id');
  if (schoolSelect) schoolSelect.value = driver.schoolId;
  document.getElementById('driver-bus-id').value = driver.busId || '';
  document.getElementById('driver-expiry').value = driver.expiry || '';
  document.getElementById('driver-status').value = driver.status || 'Active';
}

function saveDriver(event) {
  event.preventDefault();
  const idVal = document.getElementById('driver-id-input').value;
  const name = document.getElementById('driver-name').value.trim();
  const license = document.getElementById('driver-license').value.trim();
  const phone = document.getElementById('driver-phone').value.trim();
  const schoolId = Number(document.getElementById('driver-school-id').value);
  const busId = Number(document.getElementById('driver-bus-id').value) || null;
  const expiry = document.getElementById('driver-expiry').value;
  const status = document.getElementById('driver-status').value;

  const data = window.db.getData();

  if (idVal) {
    const idx = data.drivers.findIndex(d => d.id === Number(idVal));
    if (idx !== -1) {
      data.drivers[idx] = { ...data.drivers[idx], name, license, phone, schoolId, busId, expiry, status };
      showToast('Driver details updated', 'success');
    }
  } else {
    data.drivers.push({ id: Date.now(), name, license, phone, schoolId, busId, expiry, status });
    showToast('New driver registered', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderDriversPage();
}

function deleteDriver(id) {
  if (confirm('Are you sure you want to delete this driver?')) {
    const data = window.db.getData();
    data.drivers = data.drivers.filter(d => d.id !== id);
    window.db.saveData(data);
    showToast('Driver deleted', 'success');
    renderDriversPage();
  }
}

window.renderDriversPage = renderDriversPage;
window.openAddDriverModal = openAddDriverModal;
window.openEditDriverModal = openEditDriverModal;
window.saveDriver = saveDriver;
window.deleteDriver = deleteDriver;
