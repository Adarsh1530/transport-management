/* ==========================================
   TRIPS MANAGEMENT MODULE
   ========================================== */

function renderTripsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('trips-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const trips = window.db.getTrips(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group">
        <select id="trip-status-filter" class="form-control" style="width: auto;" onchange="filterTripsTable()">
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Running">Running</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        ${!isSchoolUser ? `
          <select id="trip-school-filter" class="form-control" style="width: auto;" onchange="filterTripsTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div>
        <button class="btn-primary" onclick="openAddTripModal()">
          <i class="fa-solid fa-plus"></i> Schedule New Trip
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="trips-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Date</th>
              <th>Bus</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Route</th>
              <th>Driver</th>
              <th>Timing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="trips-tbody">
            ${renderTripRows(trips, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTripRows(trips, showSchoolCol = true) {
  if (!trips || !trips.length) {
    const colSpan = showSchoolCol ? 9 : 8;
    return `<tr><td colspan="${colSpan}" class="empty-state">No trips logged today.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();
  const routes = window.db.getRoutes();
  const drivers = window.db.getDrivers();

  return trips.map(t => {
    const school = schools.find(s => s.id === t.schoolId);
    const bus = vehicles.find(v => v.id === t.busId);
    const route = routes.find(r => r.id === t.routeId);
    const driver = drivers.find(d => d.id === t.driverId);

    let statusBadge = 'badge-neutral';
    if (t.status === 'Completed') statusBadge = 'badge-active';
    if (t.status === 'Running') statusBadge = 'badge-under-10';
    if (t.status === 'Cancelled') statusBadge = 'badge-expired';

    return `
      <tr class="table-row">
        <td><code>${escapeHTML(t.tripId)}</code></td>
        <td>${formatDate(t.date)}</td>
        <td><strong>${escapeHTML(bus ? bus.busNo : 'N/A')}</strong></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td>${escapeHTML(route ? route.name : 'N/A')}</td>
        <td>${escapeHTML(driver ? driver.name : 'N/A')}</td>
        <td><small>${escapeHTML(t.startTime)} - ${escapeHTML(t.endTime)}</small></td>
        <td><span class="badge ${statusBadge}"><span class="badge-dot"></span>${t.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="Edit Trip Status" onclick="openEditTripModal(${t.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Trip" onclick="deleteTrip(${t.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTripsTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const statusFilter = document.getElementById('trip-status-filter')?.value || '';
  const schoolFilter = document.getElementById('trip-school-filter')?.value || '';

  let list = window.db.getTrips(isSchoolUser ? schoolId : null);

  if (statusFilter) {
    list = list.filter(t => t.status === statusFilter);
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(t => t.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('trips-tbody');
  if (tbody) tbody.innerHTML = renderTripRows(list, !isSchoolUser);
}

function openAddTripModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles(isSchoolUser ? user.schoolId : null);
  const routes = window.db.getRoutes(isSchoolUser ? user.schoolId : null);
  const drivers = window.db.getDrivers(isSchoolUser ? user.schoolId : null);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Schedule New Trip';

  const todayStr = new Date().toISOString().split('T')[0];

  body.innerHTML = `
    <form id="trip-form" onsubmit="saveTrip(event)">
      <input type="hidden" id="trip-id-input" value="">
      <div class="form-group">
        <label>Trip ID *</label>
        <input type="text" id="trip-code" class="form-control" required value="TRIP-${Math.floor(100 + Math.random() * 900)}">
      </div>
      <div class="form-group">
        <label>Trip Date *</label>
        <input type="date" id="trip-date" class="form-control" required value="${todayStr}">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="trip-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="trip-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Select Bus *</label>
        <select id="trip-bus-id" class="form-control" required>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Select Route *</label>
        <select id="trip-route-id" class="form-control" required>
          ${routes.map(r => `<option value="${r.id}">${escapeHTML(r.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Select Driver *</label>
        <select id="trip-driver-id" class="form-control" required>
          ${drivers.map(d => `<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('')}
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Trip Type</label>
          <select id="trip-type" class="form-control">
            <option value="School">School Trip</option>
            <option value="Additional">Additional Trip</option>
          </select>
        </div>
        <div class="form-group">
          <label>Distance (KM)</label>
          <input type="number" id="trip-distance-km" class="form-control" min="0" step="0.1" placeholder="Report auto-fetches this">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Start Time</label>
          <input type="text" id="trip-start-time" class="form-control" value="07:30 AM">
        </div>
        <div class="form-group">
          <label>End Time</label>
          <input type="text" id="trip-end-time" class="form-control" value="08:30 AM">
        </div>
      </div>

      <div class="form-group">
        <label>Trip Status</label>
        <select id="trip-status" class="form-control">
          <option value="Scheduled">Scheduled</option>
          <option value="Running">Running</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Trip</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function openEditTripModal(id) {
  const trip = window.db.getTrips().find(t => t.id === id);
  if (!trip) return;

  openAddTripModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Trip Details';
  document.getElementById('trip-id-input').value = trip.id;
  document.getElementById('trip-code').value = trip.tripId;
  document.getElementById('trip-date').value = trip.date;
  const schoolSelect = document.getElementById('trip-school-id');
  if (schoolSelect) schoolSelect.value = trip.schoolId;
  document.getElementById('trip-bus-id').value = trip.busId;
  document.getElementById('trip-route-id').value = trip.routeId;
  document.getElementById('trip-driver-id').value = trip.driverId;
  document.getElementById('trip-type').value = trip.tripType || 'School';
  document.getElementById('trip-distance-km').value = trip.distanceKm || '';
  document.getElementById('trip-start-time').value = trip.startTime;
  document.getElementById('trip-end-time').value = trip.endTime;
  document.getElementById('trip-status').value = trip.status;
}

function saveTrip(event) {
  event.preventDefault();
  const idVal = document.getElementById('trip-id-input').value;
  const tripId = document.getElementById('trip-code').value.trim();
  const date = document.getElementById('trip-date').value;
  const schoolId = Number(document.getElementById('trip-school-id').value);
  const busId = Number(document.getElementById('trip-bus-id').value);
  const routeId = Number(document.getElementById('trip-route-id').value);
  const driverId = Number(document.getElementById('trip-driver-id').value);
  const startTime = document.getElementById('trip-start-time').value.trim();
  const endTime = document.getElementById('trip-end-time').value.trim();
  const status = document.getElementById('trip-status').value;
  const tripType = document.getElementById('trip-type').value;
  const distanceKm = Number(document.getElementById('trip-distance-km').value || 0);

  const data = window.db.getData();

  if (idVal) {
    const idx = data.trips.findIndex(t => t.id === Number(idVal));
    if (idx !== -1) {
      data.trips[idx] = { ...data.trips[idx], tripId, date, schoolId, busId, routeId, driverId, startTime, endTime, status, tripType, distanceKm };
      showToast('Trip updated', 'success');
    }
  } else {
    data.trips.push({ id: Date.now(), tripId, date, schoolId, busId, routeId, driverId, startTime, endTime, status, tripType, distanceKm });
    showToast('Trip scheduled successfully', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderTripsPage();
}

function deleteTrip(id) {
  const numId = Number(id);
  const trip = window.db.getTrips().find(t => t.id === numId);
  const tripName = trip ? (trip.tripId || 'Trip Record') : 'Trip Record';

  showDeleteConfirmationModal({
    itemTitle: tripName,
    onConfirm: () => {
      const data = window.db.getData();
      data.trips = data.trips.filter(t => t.id !== numId);
      window.db.saveData(data);
      showToast('Trip record deleted', 'success');
      renderTripsPage();
    }
  });
}

window.renderTripsPage = renderTripsPage;
window.openAddTripModal = openAddTripModal;
window.openEditTripModal = openEditTripModal;
window.saveTrip = saveTrip;
window.deleteTrip = deleteTrip;
