/* ==========================================
   VEHICLE RENEWALS MANAGEMENT MODULE
   ========================================== */

let currentRenewalFilter = 'all';

function renderRenewalsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('renewals-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const renewals = window.db.getRenewals(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="tab-pills">
        <button class="tab-pill ${currentRenewalFilter === 'all' ? 'active' : ''}" onclick="setRenewalFilter('all', this)">All</button>
        <button class="tab-pill ${currentRenewalFilter === 'expired' ? 'active' : ''}" onclick="setRenewalFilter('expired', this)">Expired</button>
        <button class="tab-pill ${currentRenewalFilter === 'due_today' ? 'active' : ''}" onclick="setRenewalFilter('due_today', this)">Due Today</button>
        <button class="tab-pill ${currentRenewalFilter === 'under_10' ? 'active' : ''}" onclick="setRenewalFilter('under_10', this)">Within 10 Days</button>
        <button class="tab-pill ${currentRenewalFilter === 'under_30' ? 'active' : ''}" onclick="setRenewalFilter('under_30', this)">Within 30 Days</button>
        <button class="tab-pill ${currentRenewalFilter === 'upcoming' ? 'active' : ''}" onclick="setRenewalFilter('upcoming', this)">Upcoming</button>
      </div>

      <div class="filter-group">
        ${!isSchoolUser ? `
          <select id="renewal-school-filter" class="form-control" style="width: auto;" onchange="filterRenewalsTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}

        <button class="btn-primary" onclick="openAddRenewalModal()">
          <i class="fa-solid fa-plus"></i> Add Renewal Alert
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="renewals-table">
          <thead>
            <tr>
              <th>Bus No</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Renewal Type</th>
              <th>Renewal Date</th>
              <th>Days Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="renewals-tbody">
            ${renderRenewalFullRows(renewals, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRenewalFullRows(renewals, showSchoolCol = true) {
  if (!renewals || !renewals.length) {
    const colSpan = showSchoolCol ? 7 : 6;
    return `<tr><td colspan="${colSpan}" class="empty-state">No renewal records found.</td></tr>`;
  }

  const vehicles = window.db.getVehicles();
  const schools = window.db.getSchools();

  const enriched = renewals.map(r => {
    const bus = vehicles.find(v => v.id === r.vehicleId);
    const school = schools.find(s => s.id === r.schoolId);
    const statusObj = getRenewalStatus(r.renewalDate);
    return {
      ...r,
      vehicleId: r.vehicleId || 0,
      busNo: bus ? bus.busNo : 'N/A',
      schoolName: school ? school.name : 'N/A',
      statusObj
    };
  });

  // Sort by urgency priority
  enriched.sort((a, b) => (a.statusObj?.urgencyScore || 99) - (b.statusObj?.urgencyScore || 99));

  return enriched.map(r => `
    <tr class="table-row" onclick="if(${r.vehicleId}) openBusDetailsModal(${r.vehicleId})" style="cursor: pointer;" title="Click to view complete details for Bus ${escapeHTML(r.busNo)}">
      <td><span class="bus-no-text" style="color: #111827 !important; text-decoration: none !important; font-weight: 700;"><i class="fa-solid fa-bus" style="font-size: 12px; margin-right: 6px; color: #64748b;"></i>${escapeHTML(r.busNo)}</span></td>
      ${showSchoolCol ? `<td>${escapeHTML(r.schoolName)}</td>` : ''}
      <td>${escapeHTML(r.type || 'Standard Policy')}</td>
      <td>${formatDate(r.renewalDate)}</td>
      <td><strong>${r.statusObj.days < 0 ? 'Overdue' : r.statusObj.days + ' Days'}</strong></td>
      <td>
        <span class="badge ${r.statusObj.badgeClass}">
          <span class="badge-dot"></span>
          ${r.statusObj.text}
        </span>
      </td>
      <td>
        <div class="action-buttons" onclick="event.stopPropagation()">
          <button class="icon-btn" title="View Full Bus Details" onclick="if(${r.vehicleId}) openBusDetailsModal(${r.vehicleId})"><i class="fa-solid fa-eye"></i></button>
          <button class="icon-btn" title="Edit Renewal" onclick="openEditRenewalModal(${r.id})"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="icon-btn delete" title="Delete Renewal" onclick="deleteRenewal(${r.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setRenewalFilter(filterName, btnElem = null) {
  currentRenewalFilter = filterName;
  filterRenewalsTable();

  const pills = document.querySelectorAll('.tab-pill');
  pills.forEach(p => p.classList.remove('active'));

  if (btnElem) {
    btnElem.classList.add('active');
  } else if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
}

function filterRenewalsTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const schoolFilter = document.getElementById('renewal-school-filter')?.value || '';

  let list = window.db.getRenewals(isSchoolUser ? schoolId : null);

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(r => r.schoolId === Number(schoolFilter));
  }

  // Filter by Tab
  if (currentRenewalFilter !== 'all') {
    list = list.filter(r => {
      const st = getRenewalStatus(r.renewalDate);
      if (currentRenewalFilter === 'expired') return st.days < 0;
      if (currentRenewalFilter === 'due_today') return st.days === 0;
      if (currentRenewalFilter === 'under_10') return st.days >= 0 && st.days <= 10;
      if (currentRenewalFilter === 'under_30') return st.days >= 0 && st.days <= 30;
      if (currentRenewalFilter === 'upcoming') return st.days > 30;
      return true;
    });
  }

  const tbody = document.getElementById('renewals-tbody');
  if (tbody) tbody.innerHTML = renderRenewalFullRows(list, !isSchoolUser);
}

function openAddRenewalModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles(isSchoolUser ? user.schoolId : null);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Renewal Alert';

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 15);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  body.innerHTML = `
    <form id="renewal-form" onsubmit="saveRenewal(event)">
      <input type="hidden" id="renewal-id-input" value="">
      
      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Select School *</label>
          <select id="renewal-school-id" class="form-control" required onchange="updateVehicleDropdownForRenewal()">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="renewal-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Select Vehicle *</label>
        <select id="renewal-vehicle-id" class="form-control" required>
          ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.type)})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Renewal Type *</label>
        <select id="renewal-type" class="form-control" required>
          <option value="Insurance">Insurance</option>
          <option value="Pollution">Pollution</option>
          <option value="Fitness">Fitness</option>
          <option value="Service">Service</option>
          <option value="Permit">Permit</option>
          <option value="Tax">Tax</option>
          <option value="Registration">Registration</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label style="display: flex; justify-content: space-between; align-items: center;">
          <span>Renewal Expiry Date *</span>
          <span id="ren-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
        </label>
        <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
          <input type="date" id="renewal-date" class="form-control" required value="${defaultDateStr}" oninput="calculateValidityExpiry('renewal-date', 'renewal-duration', 'ren-pred-tag')">
          <select id="renewal-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('renewal-date', 'renewal-duration', 'ren-pred-tag')">
            <option value="">Validity Upto...</option>
            <option value="1_year">1 Year</option>
            <option value="6_months">6 Months</option>
            <option value="1_month">1 Month</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Renewal Alert</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
}

function updateVehicleDropdownForRenewal() {
  const schoolId = Number(document.getElementById('renewal-school-id')?.value);
  const vehicles = window.db.getVehicles(schoolId);
  const vehicleSelect = document.getElementById('renewal-vehicle-id');
  if (vehicleSelect) {
    vehicleSelect.innerHTML = vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.type)})</option>`).join('');
  }
}

function openEditRenewalModal(id) {
  const ren = window.db.getRenewals().find(r => r.id === id);
  if (!ren) return;

  openAddRenewalModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Renewal Alert';
  document.getElementById('renewal-id-input').value = ren.id;
  const schoolSelect = document.getElementById('renewal-school-id');
  if (schoolSelect) schoolSelect.value = ren.schoolId;
  updateVehicleDropdownForRenewal();
  document.getElementById('renewal-vehicle-id').value = ren.vehicleId;
  document.getElementById('renewal-type').value = ren.type;
  document.getElementById('renewal-date').value = ren.renewalDate;
}

function saveRenewal(event) {
  event.preventDefault();
  const idVal = document.getElementById('renewal-id-input').value;
  const schoolId = Number(document.getElementById('renewal-school-id').value);
  const vehicleId = Number(document.getElementById('renewal-vehicle-id').value);
  const type = document.getElementById('renewal-type').value;
  const renEl = document.getElementById('renewal-date');
  const renewalDate = renEl.dataset.calculatedExpiry || renEl.value;

  const data = window.db.getData();

  if (idVal) {
    const idx = data.renewals.findIndex(r => r.id === Number(idVal));
    if (idx !== -1) {
      data.renewals[idx] = { ...data.renewals[idx], schoolId, vehicleId, type, renewalDate };
      showToast('Renewal alert updated', 'success');
    }
  } else {
    data.renewals.push({ id: Date.now(), schoolId, vehicleId, type, renewalDate });
    showToast('New renewal alert created', 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderRenewalsPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteRenewal(id) {
  if (confirm('Are you sure you want to delete this renewal record?')) {
    const data = window.db.getData();
    data.renewals = data.renewals.filter(r => r.id !== id);
    window.db.saveData(data);
    showToast('Renewal alert deleted', 'success');
    renderRenewalsPage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

window.renderRenewalsPage = renderRenewalsPage;
window.setRenewalFilter = setRenewalFilter;
window.openAddRenewalModal = openAddRenewalModal;
window.openEditRenewalModal = openEditRenewalModal;
window.saveRenewal = saveRenewal;
window.deleteRenewal = deleteRenewal;
