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
          <input type="text" id="route-search-input" class="form-control" placeholder="Search route name, code, or boarding point..." oninput="filterRoutesTable()">
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
              <th>Boarding Point</th>
              <th>Destination</th>
              <th>Stops</th>
              <th>Assigned Bus</th>
              <th>Driver Name</th>
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
    let driverName = 'No Driver Assigned';

    if (r.driverName) {
      driverName = r.driverName;
    } else if (r.driverId) {
      const dObj = drivers.find(d => d.id === r.driverId);
      if (dObj) driverName = dObj.name;
    } else if (bus && bus.driver) {
      driverName = bus.driver;
    }

    return `
      <tr class="table-row">
        <td><code>${escapeHTML(r.routeCode)}</code></td>
        <td><strong style="color: #0f172a; cursor: pointer;" onclick="openRouteDetailsModal(${r.id})">${escapeHTML(r.name)}</strong></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td>${escapeHTML(r.start || r.boardingPoint || 'N/A')}</td>
        <td>${escapeHTML(r.destination)}</td>
        <td><span class="badge badge-neutral">${r.stops || 1} Stops</span></td>
        <td><span class="bus-no-text" style="font-weight: 700; white-space: nowrap;">${escapeHTML(bus ? bus.busNo : 'N/A')}</span></td>
        <td><span class="driver-name-text" style="white-space: nowrap;">${escapeHTML(driverName)}</span></td>
        <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status || 'Active'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="View Route Details" onclick="openRouteDetailsModal(${r.id})"><i class="fa-solid fa-eye"></i></button>
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
      (r.start && r.start.toLowerCase().includes(query)) ||
      (r.boardingPoint && r.boardingPoint.toLowerCase().includes(query))
    );
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(r => r.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('routes-tbody');
  if (tbody) tbody.innerHTML = renderRouteRows(list, !isSchoolUser);
}

function updateDriverNameOnBusChange() {
  const busSelect = document.getElementById('route-bus-id');
  const driverInput = document.getElementById('route-driver-name');
  const routeCodeInput = document.getElementById('route-code');
  if (!busSelect) return;

  const busId = Number(busSelect.value);
  const bus = busId ? window.db.getVehicles().find(v => v.id === busId) : null;
  const drivers = window.db.getDrivers();
  const routes = window.db.getRoutes();

  if (bus) {
    // 1. Auto-fetch Route Code for selected bus
    if (routeCodeInput) {
      const existingRoute = routes.find(r => r.busId === bus.id);
      if (existingRoute && existingRoute.routeCode) {
        routeCodeInput.value = existingRoute.routeCode;
      } else if (bus.routeNumber && bus.routeNumber !== 'N/A') {
        routeCodeInput.value = bus.routeNumber;
      } else {
        const busNumDigits = bus.busNo ? bus.busNo.replace(/\D/g, '') : '';
        const numCode = busNumDigits ? busNumDigits.slice(-2).padStart(2, '0') : String(bus.id).padStart(2, '0');
        routeCodeInput.value = 'R-' + numCode;
      }
    }

    // 2. Auto-fetch Driver Name for selected bus
    if (driverInput) {
      const assignedDriverObj = drivers.find(d => d.busId === bus.id || (bus.driver && d.name === bus.driver));
      if (assignedDriverObj) {
        driverInput.value = assignedDriverObj.name;
      } else if (bus.driver && bus.driver !== 'Unassigned') {
        driverInput.value = bus.driver;
      } else {
        driverInput.value = 'No Driver Assigned';
      }
    }
  } else {
    if (driverInput) driverInput.value = 'No Driver Assigned';
    if (routeCodeInput && !document.getElementById('route-id-input')?.value) {
      const schoolSelect = document.getElementById('route-school-id');
      const schoolId = schoolSelect ? Number(schoolSelect.value) : null;
      const schoolRoutes = schoolId ? routes.filter(r => r.schoolId === schoolId) : routes;
      const nextNum = (schoolRoutes.length > 0 ? schoolRoutes.length + 1 : routes.length + 1);
      routeCodeInput.value = 'R-' + String(nextNum).padStart(2, '0');
    }
  }
}

function updateBusesDropdownForRouteSchool() {
  const schoolSelect = document.getElementById('route-school-id');
  const busSelect = document.getElementById('route-bus-id');
  if (!schoolSelect || !busSelect) return;

  const schoolId = Number(schoolSelect.value);
  const vehicles = window.db.getVehicles(schoolId);

  busSelect.innerHTML = `
    <option value="">Select Bus</option>
    ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.model || v.type)})</option>`).join('')}
  `;
  updateDriverNameOnBusChange();
}

function openAddRouteModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles(isSchoolUser ? user.schoolId : null);
  const routes = window.db.getRoutes();
  const defaultRouteCode = 'R-' + String(routes.length + 1).padStart(2, '0');

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add New Route';

  body.innerHTML = `
    <form id="route-form" onsubmit="saveRoute(event)">
      <input type="hidden" id="route-id-input" value="">

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Select School *</label>
          <select id="route-school-id" class="form-control" required onchange="updateBusesDropdownForRouteSchool()">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="route-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Select Bus *</label>
        <select id="route-bus-id" class="form-control" required onchange="updateDriverNameOnBusChange()">
          <option value="">Select Bus</option>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.model || v.type)})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Route Code</label>
        <input type="text" id="route-code" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" value="${defaultRouteCode}">
      </div>

      <div class="form-group">
        <label>Driver Name</label>
        <input type="text" id="route-driver-name" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" value="No Driver Assigned">
      </div>

      <div class="form-group">
        <label>Route Name *</label>
        <input type="text" id="route-name" class="form-control" required placeholder="e.g. Kowdiar → Campus">
      </div>

      <div class="form-group">
        <label>Boarding Point *</label>
        <input type="text" id="route-start" class="form-control" required placeholder="e.g. Kowdiar Junction">
      </div>

      <div class="form-group">
        <label>Destination *</label>
        <input type="text" id="route-dest" class="form-control" required placeholder="e.g. School Campus">
      </div>

      <div class="form-group">
        <label>Number of Stops *</label>
        <input type="number" id="route-stops" class="form-control" required value="5" min="1">
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Route</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
  updateDriverNameOnBusChange();
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
  updateBusesDropdownForRouteSchool();
  
  if (document.getElementById('route-bus-id')) document.getElementById('route-bus-id').value = route.busId || '';
  updateDriverNameOnBusChange();
  if (document.getElementById('route-code')) document.getElementById('route-code').value = route.routeCode;

  document.getElementById('route-start').value = route.start || route.boardingPoint || '';
  document.getElementById('route-dest').value = route.destination || '';
  document.getElementById('route-stops').value = route.stops || 5;
}

function saveRoute(event) {
  event.preventDefault();
  const idVal = document.getElementById('route-id-input').value;
  const routeCode = document.getElementById('route-code').value.trim();
  const name = document.getElementById('route-name').value.trim();
  const schoolId = Number(document.getElementById('route-school-id').value);
  const busId = Number(document.getElementById('route-bus-id').value) || null;
  const driverName = document.getElementById('route-driver-name').value;
  const start = document.getElementById('route-start').value.trim();
  const destination = document.getElementById('route-dest').value.trim();
  const stops = Number(document.getElementById('route-stops').value);

  const drivers = window.db.getDrivers();
  const driverObj = drivers.find(d => d.name === driverName);
  const driverId = driverObj ? driverObj.id : null;

  const data = window.db.getData();

  if (idVal) {
    const idx = data.routes.findIndex(r => r.id === Number(idVal));
    if (idx !== -1) {
      data.routes[idx] = {
        ...data.routes[idx],
        routeCode,
        name,
        schoolId,
        busId,
        driverId,
        driverName,
        start,
        boardingPoint: start,
        destination,
        stops,
        status: 'Active'
      };
      showToast('Route updated successfully', 'success');
    }
  } else {
    data.routes.push({
      id: Date.now(),
      routeCode,
      name,
      schoolId,
      busId,
      driverId,
      driverName,
      start,
      boardingPoint: start,
      destination,
      stops,
      status: 'Active'
    });
    showToast('New route created successfully', 'success');
  }

  // Automatic data propagation to assigned Vehicle record
  if (busId && data.vehicles) {
    const veh = data.vehicles.find(v => v.id === busId);
    if (veh) {
      veh.routeNumber = routeCode;
      veh.schoolId = schoolId;
    }
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderRoutesPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteRoute(id) {
  const numId = Number(id);
  const routeObj = window.db.getRoutes().find(r => r.id === numId);
  const rName = routeObj ? (routeObj.name || routeObj.routeCode || 'Route') : 'Route';

  confirmDeleteModal({
    contentName: rName,
    entityType: 'Route',
    onConfirm: () => {
      const data = window.db.getData();
      if (routeObj && data.vehicles) {
        data.vehicles.forEach(v => {
          if (v.routeNumber === routeObj.routeCode || v.id === routeObj.busId) {
            v.routeNumber = 'N/A';
          }
        });
      }

      data.routes = (data.routes || []).filter(r => r.id !== numId);
      window.db.saveData(data);
      showToast(`Route "${rName}" deleted successfully`, 'success');
      renderRoutesPage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

// Global Route Details Modal Viewer
function openRouteDetailsModal(routeId) {
  const route = window.db.getRoutes().find(r => r.id === Number(routeId));
  if (!route) {
    showToast('Route details not found', 'warning');
    return;
  }

  const school = window.db.getSchools().find(s => s.id === route.schoolId);
  const bus = window.db.getVehicles().find(v => v.id === route.busId);
  const driver = window.db.getDrivers().find(d => d.id === route.driverId || (route.driverName && d.name === route.driverName));
  const driverName = route.driverName || (driver ? driver.name : (bus ? bus.driver : 'No Driver Assigned'));

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerHTML = `<i class="fa-solid fa-route" style="color: var(--color-income); margin-right: 6px;"></i> Route Specifications — ${escapeHTML(route.routeCode)}`;

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Route Code</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;"><code>${escapeHTML(route.routeCode)}</code></div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Route Name</span>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${escapeHTML(route.name)}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Bus</span>
          <div style="font-weight: 700; color: #0f172a; margin-top: 2px; white-space: nowrap;" class="bus-no-text">${escapeHTML(bus ? bus.busNo : 'N/A')} (${escapeHTML(bus ? (bus.model || bus.type) : 'N/A')})</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Driver</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;" class="driver-name-text">${escapeHTML(driverName)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Designated Stops</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><span class="badge badge-neutral">${route.stops || 5} Stops</span></div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Boarding Point</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(route.start || route.boardingPoint || 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Destination</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(route.destination)}</div>
        </div>
      </div>

    </div>

    <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 20px;">
      <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Close Details</button>
    </div>
  `;

  openModal('generic-modal');
}

window.renderRoutesPage = renderRoutesPage;
window.openAddRouteModal = openAddRouteModal;
window.openEditRouteModal = openEditRouteModal;
window.saveRoute = saveRoute;
window.deleteRoute = deleteRoute;
window.updateDriverNameOnBusChange = updateDriverNameOnBusChange;
window.updateBusesDropdownForRouteSchool = updateBusesDropdownForRouteSchool;
window.openRouteDetailsModal = openRouteDetailsModal;
