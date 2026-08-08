/* ==========================================
   ROUTES MANAGEMENT MODULE
   ========================================== */

function renderRoutesPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('routes-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const routes = window.db.getRoutes(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="route-search-input" class="form-control" placeholder="Search route name or start point..." oninput="filterRoutesTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="route-school-filter" class="form-control" style="width: auto;" onchange="filterRoutesTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div>
        <button class="btn-primary" onclick="openAddRouteModal()">
          <i class="fa-solid fa-plus"></i> Add New Route
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="routes-table">
          <thead>
            <tr>
              <th>Route Code</th>
              <th>Route Name</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Starting Point</th>
              <th>Destination</th>
              <th>Stops</th>
              <th>Assigned Bus</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="routes-tbody">
            ${renderRouteRows(routes, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRouteRows(routes, showSchoolCol = true) {
  if (!routes || !routes.length) {
    const colSpan = showSchoolCol ? 10 : 9;
    return `<tr><td colspan="${colSpan}" class="empty-state">No routes defined yet.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();
  const drivers = window.db.getDrivers();

  return routes.map(r => {
    const school = schools.find(s => s.id === r.schoolId);
    const bus = vehicles.find(v => v.id === r.busId);
    const driver = drivers.find(d => d.id === r.driverId);

    return `
      <tr class="table-row">
        <td><code>${escapeHTML(r.routeCode)}</code></td>
        <td><strong>${escapeHTML(r.name)}</strong></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td>${escapeHTML(r.start)}</td>
        <td>${escapeHTML(r.destination)}</td>
        <td><span class="badge badge-neutral">${r.stops} Stops</span></td>
        <td>${escapeHTML(bus ? bus.busNo : 'N/A')}</td>
        <td>${escapeHTML(driver ? driver.name : 'N/A')}</td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Route" onclick="openEditRouteModal(${r.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Route" onclick="deleteRoute(${r.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterRoutesTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('route-search-input')?.value.toLowerCase().trim() || '';
  const schoolFilter = document.getElementById('route-school-filter')?.value || '';

  let list = window.db.getRoutes(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(r =>
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.routeCode && r.routeCode.toLowerCase().includes(query)) ||
      (r.start && r.start.toLowerCase().includes(query))
    );
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(r => r.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('routes-tbody');
  if (tbody) tbody.innerHTML = renderRouteRows(list, !isSchoolUser);
}

function openAddRouteModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles(isSchoolUser ? user.schoolId : null);
  const drivers = window.db.getDrivers(isSchoolUser ? user.schoolId : null);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add New Route';

  body.innerHTML = `
    <form id="route-form" onsubmit="saveRoute(event)">
      <input type="hidden" id="route-id-input" value="">
      <div class="form-group">
        <label>Route Code *</label>
        <input type="text" id="route-code" class="form-control" required placeholder="e.g. R-07">
      </div>
      <div class="form-group">
        <label>Route Name *</label>
        <input type="text" id="route-name" class="form-control" required placeholder="e.g. Kowdiar → Campus">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="route-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="route-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Starting Point *</label>
        <input type="text" id="route-start" class="form-control" required placeholder="e.g. Kowdiar Junction">
      </div>
      <div class="form-group">
        <label>Destination *</label>
        <input type="text" id="route-dest" class="form-control" required placeholder="e.g. School Campus">
      </div>
      <div class="form-group">
        <label>Number of Stops</label>
        <input type="number" id="route-stops" class="form-control" value="5" min="1">
      </div>

      <div class="form-group">
        <label>Assigned Bus</label>
        <select id="route-bus-id" class="form-control">
          <option value="">Select Bus</option>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Assigned Driver</label>
        <select id="route-driver-id" class="form-control">
          <option value="">Select Driver</option>
          ${drivers.map(d => `<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('')}
        </select>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Route</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function openEditRouteModal(id) {
  const route = window.db.getRoutes().find(r => r.id === id);
  if (!route) return;

  openAddRouteModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Route Details';
  document.getElementById('route-id-input').value = route.id;
  document.getElementById('route-code').value = route.routeCode;
  document.getElementById('route-name').value = route.name;
  const schoolSelect = document.getElementById('route-school-id');
  if (schoolSelect) schoolSelect.value = route.schoolId;
  document.getElementById('route-start').value = route.start;
  document.getElementById('route-dest').value = route.destination;
  document.getElementById('route-stops').value = route.stops;
  document.getElementById('route-bus-id').value = route.busId || '';
  document.getElementById('route-driver-id').value = route.driverId || '';
}

function saveRoute(event) {
  event.preventDefault();
  const idVal = document.getElementById('route-id-input').value;
  const routeCode = document.getElementById('route-code').value.trim();
  const name = document.getElementById('route-name').value.trim();
  const schoolId = Number(document.getElementById('route-school-id').value);
  const start = document.getElementById('route-start').value.trim();
  const destination = document.getElementById('route-dest').value.trim();
  const stops = Number(document.getElementById('route-stops').value);
  const busId = Number(document.getElementById('route-bus-id').value) || null;
  const driverId = Number(document.getElementById('route-driver-id').value) || null;

  const data = window.db.getData();

  if (idVal) {
    const idx = data.routes.findIndex(r => r.id === Number(idVal));
    if (idx !== -1) {
      data.routes[idx] = { ...data.routes[idx], routeCode, name, schoolId, start, destination, stops, busId, driverId, status: 'Active' };
      showToast('Route updated', 'success');
    }
  } else {
    data.routes.push({ id: Date.now(), routeCode, name, schoolId, start, destination, stops, busId, driverId, status: 'Active' });
    showToast('New route created', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderRoutesPage();
}

function deleteRoute(id) {
  if (confirm('Are you sure you want to delete this route?')) {
    const data = window.db.getData();
    data.routes = data.routes.filter(r => r.id !== id);
    window.db.saveData(data);
    showToast('Route deleted', 'success');
    renderRoutesPage();
  }
}

window.renderRoutesPage = renderRoutesPage;
window.openAddRouteModal = openAddRouteModal;
window.openEditRouteModal = openEditRouteModal;
window.saveRoute = saveRoute;
window.deleteRoute = deleteRoute;
