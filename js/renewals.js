/* ==========================================
   VEHICLE RENEWALS MANAGEMENT MODULE
   ========================================== */

let currentRenewalFilter = 'all';
let currentQuickTypeFilter = 'all';

function renderRenewalsPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('renewals-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const renewals = window.db.getRenewals(isSchoolUser ? schoolId : null);
  const drivers = window.db.getDrivers(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  const quickTypes = [
    { id: 'Driving License Expires', label: 'Driving License Expires', icon: 'fa-id-card', bg: '#eff6ff', color: '#2563eb' },
    { id: 'Insurance', label: 'Insurance', icon: 'fa-shield-halved', bg: '#f0fdf4', color: '#16a34a' },
    { id: 'Pollution', label: 'Pollution', icon: 'fa-smog', bg: '#fef3c7', color: '#b45309' },
    { id: 'Permit', label: 'Permit', icon: 'fa-passport', bg: '#f3e8ff', color: '#7c3aed' },
    { id: 'Fitness', label: 'Fitness', icon: 'fa-truck-medical', bg: '#ecfeff', color: '#0891b2' },
    { id: 'Road Tax', label: 'Road Tax', icon: 'fa-file-invoice-dollar', bg: '#fff7ed', color: '#c2410c' },
    { id: 'Fire & Safety', label: 'Fire & Safety', icon: 'fa-fire-extinguisher', bg: '#fef2f2', color: '#dc2626' },
    { id: 'Other Renewals', label: 'Other Renewals', icon: 'fa-bell', bg: '#f1f5f9', color: '#475569' }
  ];

  container.innerHTML = `
    <!-- Top 8 Quick Filter Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;">
      ${quickTypes.map(q => {
        let count = 0;
        if (q.id === 'Driving License Expires') {
          count = drivers.length;
        } else if (q.id === 'Other Renewals') {
          const std = ['Insurance', 'Pollution', 'Permit', 'Fitness', 'Road Tax', 'Tax', 'Fire & Safety', 'Fire Safety'];
          count = renewals.filter(r => !std.includes(r.type)).length;
        } else {
          count = renewals.filter(r => r.type === q.id || (q.id === 'Road Tax' && r.type === 'Tax') || (q.id === 'Fire & Safety' && r.type === 'Fire Safety')).length;
        }
        const isActive = currentQuickTypeFilter === q.id;

        return `
          <div class="card metric-card" onclick="setQuickTypeFilter('${q.id}')" style="cursor: pointer; padding: 16px; border: 2px solid ${isActive ? q.color : 'transparent'}; background: ${isActive ? q.bg : 'white'};" title="Filter by ${q.label}">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-size: 11.5px; font-weight: 700; color: ${q.color}; text-transform: uppercase;">${escapeHTML(q.label)}</span>
                <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${count} Records</div>
              </div>
              <div style="width: 36px; height: 36px; border-radius: 10px; background: ${q.bg}; color: ${q.color}; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                <i class="fa-solid ${q.icon}"></i>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- 1st Line: Add Renewal Button -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
      <button class="btn-primary" style="width: auto;" onclick="openAddRenewalModal()">
        <i class="fa-solid fa-plus"></i> Add Renewal
      </button>
    </div>

    <!-- 2nd Line: Left Group (Directory Title + Pills) & Right Group (Filter Title + Dropdowns) -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
      <!-- Left Group: Title + Tab Pills -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0;">Vehicle Compliance & Renewal Directory</h3>
        <div class="tab-pills">
          <button class="tab-pill ${currentRenewalFilter === 'all' ? 'active' : ''}" onclick="setRenewalFilter('all', this)">All</button>
          <button class="tab-pill ${currentRenewalFilter === 'expired' ? 'active' : ''}" onclick="setRenewalFilter('expired', this)">Expired</button>
          <button class="tab-pill ${currentRenewalFilter === 'due_today' ? 'active' : ''}" onclick="setRenewalFilter('due_today', this)">Due Today</button>
          <button class="tab-pill ${currentRenewalFilter === 'under_10' ? 'active' : ''}" onclick="setRenewalFilter('under_10', this)">Within 10 Days</button>
          <button class="tab-pill ${currentRenewalFilter === 'under_30' ? 'active' : ''}" onclick="setRenewalFilter('under_30', this)">Within 30 Days</button>
          <button class="tab-pill ${currentRenewalFilter === 'upcoming' ? 'active' : ''}" onclick="setRenewalFilter('upcoming', this)">Upcoming</button>
        </div>
      </div>

      <!-- Right Group: Title + Filter Dropdowns -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <span style="font-size: 18px; font-weight: 700; color: #0f172a;">Filter the data by Renewal Type and School</span>
        <div class="filter-group">
          <!-- Renewal Type Filter -->
          <select id="renewal-type-filter" class="form-control" style="width: auto;" onchange="filterRenewalsTable()">
            <option value="all">All Renewal Types</option>
            <option value="Insurance">Insurance</option>
            <option value="Pollution">Pollution</option>
            <option value="Permit">Permit</option>
            <option value="Fitness">Fitness</option>
            <option value="Road Tax">Road Tax</option>
            <option value="Fire & Safety">Fire & Safety</option>
            <option value="Driving License Expires">Driving License Expires</option>
            <option value="Other Renewals">Other Renewals</option>
          </select>

          ${!isSchoolUser ? `
            <select id="renewal-school-filter" class="form-control" style="width: auto;" onchange="filterRenewalsTable()">
              <option value="">All Schools</option>
              ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
            </select>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Main Table Card -->
    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="renewals-table">
          <thead>
            <tr>
              <th>Bus / Driver</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Renewal Type</th>
              <th>Renewal Date</th>
              <th>Current Date</th>
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

function setQuickTypeFilter(typeId) {
  if (currentQuickTypeFilter === typeId) {
    currentQuickTypeFilter = 'all';
  } else {
    currentQuickTypeFilter = typeId;
  }

  const selectEl = document.getElementById('renewal-type-filter');
  if (selectEl) selectEl.value = currentQuickTypeFilter;

  renderRenewalsPage();
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

function renderRenewalFullRows(renewals, showSchoolCol = true) {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const vehicles = window.db.getVehicles();
  const schools = window.db.getSchools();
  const drivers = window.db.getDrivers(isSchoolUser ? schoolId : null);

  const todayStr = formatDate(new Date());

  let list = [];

  if (currentQuickTypeFilter === 'Driving License Expires' || document.getElementById('renewal-type-filter')?.value === 'Driving License Expires') {
    list = drivers.map(d => {
      const school = schools.find(s => s.id === d.schoolId);
      const bus = vehicles.find(v => v.id === d.busId);
      const statusObj = getRenewalStatus(d.expiry);
      return {
        id: 'dl-' + d.id,
        isDriver: true,
        driverObj: d,
        busNo: d.name + ' (DL)',
        schoolName: school ? school.name : 'N/A',
        type: 'Driving License',
        renewalDate: d.expiry,
        statusObj
      };
    });
  } else {
    list = renewals.map(r => {
      const bus = vehicles.find(v => v.id === r.vehicleId);
      const school = schools.find(s => s.id === r.schoolId);
      const statusObj = getRenewalStatus(r.renewalDate);
      return {
        ...r,
        isDriver: false,
        vehicleId: r.vehicleId || 0,
        busNo: bus ? bus.busNo : 'N/A',
        schoolName: school ? school.name : 'N/A',
        statusObj
      };
    });
  }

  // Filter by Type
  const typeFilter = document.getElementById('renewal-type-filter')?.value || currentQuickTypeFilter;
  if (typeFilter && typeFilter !== 'all' && typeFilter !== 'Driving License Expires') {
    if (typeFilter === 'Other Renewals') {
      const std = ['Insurance', 'Pollution', 'Permit', 'Fitness', 'Road Tax', 'Tax', 'Fire & Safety', 'Fire Safety'];
      list = list.filter(r => !std.includes(r.type));
    } else {
      list = list.filter(r => r.type === typeFilter || (typeFilter === 'Road Tax' && r.type === 'Tax') || (typeFilter === 'Fire & Safety' && r.type === 'Fire Safety'));
    }
  }

  // Filter by School
  const schoolFilter = document.getElementById('renewal-school-filter')?.value || '';
  if (schoolFilter && !isSchoolUser) {
    list = list.filter(r => r.schoolId === Number(schoolFilter));
  }

  // Filter by Status Tab
  if (currentRenewalFilter !== 'all') {
    list = list.filter(r => {
      const st = r.statusObj;
      if (currentRenewalFilter === 'expired') return st.days < 0;
      if (currentRenewalFilter === 'due_today') return st.days === 0;
      if (currentRenewalFilter === 'under_10') return st.days >= 0 && st.days <= 10;
      if (currentRenewalFilter === 'under_30') return st.days >= 0 && st.days <= 30;
      if (currentRenewalFilter === 'upcoming') return st.days > 30;
      return true;
    });
  }

  if (!list || !list.length) {
    const colSpan = showSchoolCol ? 8 : 7;
    return `<tr><td colspan="${colSpan}" class="empty-state">No matching compliance or renewal records found.</td></tr>`;
  }

  list.sort((a, b) => (a.statusObj?.urgencyScore || 99) - (b.statusObj?.urgencyScore || 99));

  return list.map(r => `
    <tr class="table-row" onclick="openRenewalDetailsModal('${r.id}')" style="cursor: pointer;" title="Click to view complete renewal details">
      <td><span class="bus-no-text" style="color: #111827 !important; text-decoration: none !important; font-weight: 700; white-space: nowrap;"><i class="fa-solid ${r.isDriver ? 'fa-id-card' : 'fa-bus'}" style="font-size: 12px; margin-right: 6px; color: #64748b;"></i>${escapeHTML(r.busNo)}</span></td>
      ${showSchoolCol ? `<td>${escapeHTML(r.schoolName)}</td>` : ''}
      <td><strong>${escapeHTML(r.type || 'Standard Policy')}</strong></td>
      <td>${formatDate(r.renewalDate)}</td>
      <td><small style="color: #64748b;">${todayStr}</small></td>
      <td><strong>${r.statusObj.days < 0 ? Math.abs(r.statusObj.days) + ' Days Overdue' : r.statusObj.days + ' Days Left'}</strong></td>
      <td>
        <span class="badge ${r.statusObj.badgeClass}">
          <span class="badge-dot"></span>
          ${r.statusObj.text}
        </span>
      </td>
      <td>
        <div class="action-buttons" onclick="event.stopPropagation()">
          <button class="icon-btn" title="View Full Details" onclick="openRenewalDetailsModal('${r.id}')"><i class="fa-solid fa-eye"></i></button>
          ${!r.isDriver ? `
            <button class="icon-btn" title="Edit Renewal" onclick="openEditRenewalModal(${r.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Renewal" onclick="deleteRenewal(${r.id})"><i class="fa-solid fa-trash-can"></i></button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRenewalsTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;
  const renewals = window.db.getRenewals(isSchoolUser ? schoolId : null);

  const tbody = document.getElementById('renewals-tbody');
  if (tbody) tbody.innerHTML = renderRenewalFullRows(renewals, !isSchoolUser);
}

function updateRenewalVehicleListBySchool() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user ? user.role === 'School' : false;
  const schoolSelect = document.getElementById('renewal-school-id');
  const container = document.getElementById('renewal-vehicles-checklist');
  if (!container) return;

  const rawSchoolVal = isSchoolUser ? String(user.schoolId) : (schoolSelect ? schoolSelect.value : 'all');
  const isAll = rawSchoolVal === 'all';
  const schoolId = (!isAll && rawSchoolVal) ? Number(rawSchoolVal) : null;

  const vehicles = window.db.getVehicles(schoolId);
  const schools = window.db.getSchools();
  const routes = (window.db.getRoutes() || []);

  if (!vehicles || !vehicles.length) {
    container.innerHTML = '<div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 10px;">No vehicles found for selected school.</div>';
    return;
  }

  container.innerHTML = vehicles.map(v => {
    const routeObj = routes.find(r => r.busId === v.id);
    const routeCode = v.routeNumber || (routeObj ? routeObj.routeCode : null) || `R-0${v.id}`;
    const schoolObj = schools.find(s => s.id === v.schoolId);
    const schoolTag = isAll && schoolObj ? `<span style="font-weight: 500; color: #64748b;">[${escapeHTML(schoolObj.name)}] </span>` : '';

    return `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #1e293b; cursor: pointer; padding: 6px 10px; border-radius: 6px; background: white; border: 1px solid #e2e8f0;">
        <input type="checkbox" class="renewal-vehicle-checkbox" value="${v.id}" checked>
        <strong style="color: #0f172a;" class="bus-no-text">${escapeHTML(v.busNo)}</strong>
        <span style="color: #64748b;">(${escapeHTML(v.type || v.name)}) ${schoolTag}— <strong style="color: var(--color-primary);">${escapeHTML(routeCode)}</strong></span>
      </label>
    `;
  }).join('');

  const selectAllCb = document.getElementById('renewal-select-all-vehicles');
  if (selectAllCb) selectAllCb.checked = true;
}

function toggleAllRenewalVehicles(checked) {
  const checkboxes = document.querySelectorAll('.renewal-vehicle-checkbox');
  checkboxes.forEach(cb => {
    const parentLabel = cb.closest('label');
    if (!parentLabel || parentLabel.style.display !== 'none') {
      cb.checked = checked;
    }
  });
}

function filterRenewalVehiclesByRouteCode(query) {
  const q = (query || '').toLowerCase().trim();
  const labels = document.querySelectorAll('#renewal-vehicles-checklist label');
  labels.forEach(lbl => {
    const text = lbl.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      lbl.style.display = 'flex';
    } else {
      lbl.style.display = 'none';
    }
  });
}

function handleRenewalDocSelect(event) {
  const file = event.target.files[0];
  const statusEl = document.getElementById('renewal-doc-status');
  const hiddenInput = document.getElementById('renewal-doc-json');
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const docObj = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: e.target.result
    };
    if (hiddenInput) hiddenInput.value = JSON.stringify(docObj);
    if (statusEl) statusEl.innerText = file.name;
  };
  reader.readAsDataURL(file);
}

function openAddRenewalModal() {
  const user = window.auth.getCurrentUser();
  if (!user) return;
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Renewal';

  body.innerHTML = `
    <form id="renewal-form" onsubmit="saveBatchRenewal(event)">
      <input type="hidden" id="renewal-id-input" value="">

      ${!isSchoolUser ? `
        <div class="form-group">
          <label style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Select School *</label>
          <select id="renewal-school-id" class="form-control" required onchange="updateRenewalVehicleListBySchool()">
            <option value="all" selected>All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="renewal-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
          <label style="font-weight: 700; color: #0f172a; margin: 0;">Select Vehicles / Buses *</label>
          <input type="text" id="renewal-search-route-code" placeholder="Search bus via Route Code..." oninput="filterRenewalVehiclesByRouteCode(this.value)" class="form-control" style="width: 220px; height: 32px; font-size: 12px;">
          <label style="font-size: 12px; font-weight: 600; color: var(--color-primary); cursor: pointer; margin: 0;">
            <input type="checkbox" id="renewal-select-all-vehicles" onchange="toggleAllRenewalVehicles(this.checked)" checked> Select All
          </label>
        </div>
        <div id="renewal-vehicles-checklist" style="max-height: 480px; overflow-y: auto; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; gap: 8px;">
          <!-- Dynamic Checkbox list of vehicles -->
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Renewal Type *</label>
          <select id="renewal-type" class="form-control" required>
            <option value="Insurance">Insurance</option>
            <option value="Pollution">Pollution</option>
            <option value="Permit">Permit</option>
            <option value="Fitness">Fitness</option>
            <option value="Road Tax">Road Tax</option>
            <option value="Fire & Safety">Fire & Safety</option>
            <option value="Speed Governor">Speed Governor</option>
            <option value="Custom">Custom Renewal</option>
          </select>
        </div>

        <div class="form-group">
          <label>Renewal Expiry Date *</label>
          <input type="date" id="renewal-date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Renewal</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
  updateRenewalVehicleListBySchool();
}

function openEditRenewalModal(id) {
  const ren = window.db.getRenewals().find(r => r.id === Number(id));
  if (!ren) return;

  const schools = window.db.getSchools();
  const schoolObj = schools.find(s => s.id === ren.schoolId);
  const schoolName = schoolObj ? schoolObj.name : 'All Schools';

  const vehicles = window.db.getVehicles();
  const veh = vehicles.find(v => v.id === ren.vehicleId);
  const routes = (window.db.getRoutes() || []);
  const rt = veh ? routes.find(r => r.busId === veh.id) : null;

  let vehFormatted = 'Vehicle';
  if (veh) {
    const vType = veh.name || veh.type || 'Bus';
    const rCode = rt && rt.routeCode ? ` - ${rt.routeCode}` : '';
    vehFormatted = `${veh.busNo} (${vType})${rCode}`;
  }

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Edit Renewal';

  body.innerHTML = `
    <form id="renewal-form" onsubmit="saveBatchRenewal(event)">
      <input type="hidden" id="renewal-id-input" value="${ren.id}">
      <input type="hidden" id="renewal-school-id" value="${ren.schoolId}">
      <input type="hidden" id="renewal-single-vehicle-id" value="${ren.vehicleId}">
      <input type="hidden" id="renewal-type" value="${escapeHTML(ren.type)}">

      <div class="form-group" style="margin-bottom: 14px;">
        <label style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Select School *</label>
        <input type="text" class="form-control" value="${escapeHTML(schoolName)}" disabled style="background-color: #f1f5f9; cursor: not-allowed; font-weight: 500; color: #334155;">
      </div>

      <div class="form-group" style="margin-bottom: 14px;">
        <label style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Target Vehicle / Bus *</label>
        <input type="text" class="form-control" value="${escapeHTML(vehFormatted)}" disabled style="background-color: #f1f5f9; cursor: not-allowed; font-weight: 500; color: #334155;">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Renewal Type *</label>
          <input type="text" class="form-control" value="${escapeHTML(ren.type)}" disabled style="background-color: #f1f5f9; cursor: not-allowed; font-weight: 500; color: #334155;">
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Renewal Expiry Date *</label>
          <input type="date" id="renewal-date" class="form-control" required value="${ren.renewalDate || ''}">
        </div>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Renewal</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
}

function saveBatchRenewal(event) {
  event.preventDefault();
  const idVal = document.getElementById('renewal-id-input')?.value;
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user ? user.role === 'School' : false;
  const rawSchool = document.getElementById('renewal-school-id')?.value;
  const type = document.getElementById('renewal-type').value;
  const renewalDate = document.getElementById('renewal-date').value;
  const refNo = document.getElementById('renewal-ref-no')?.value.trim() || '';

  const docJsonStr = document.getElementById('renewal-doc-json')?.value;
  let docObj = null;
  if (docJsonStr) {
    try { docObj = JSON.parse(docJsonStr); } catch (e) { docObj = docJsonStr; }
  }

  const data = window.db.getData();
  if (!data.renewals) data.renewals = [];
  const allVehicles = window.db.getVehicles();

  if (idVal) {
    const singleVehicleId = Number(document.getElementById('renewal-single-vehicle-id')?.value);
    const singleVeh = allVehicles.find(v => v.id === singleVehicleId);
    const targetSchoolId = (rawSchool === 'all' || !rawSchool)
      ? (singleVeh ? singleVeh.schoolId : (user ? user.schoolId : 1))
      : Number(rawSchool);

    const idx = data.renewals.findIndex(r => r.id === Number(idVal));
    if (idx !== -1) {
      data.renewals[idx] = {
        ...data.renewals[idx],
        schoolId: targetSchoolId,
        vehicleId: singleVehicleId || data.renewals[idx].vehicleId,
        type,
        renewalDate,
        refNo,
        doc: docObj || data.renewals[idx].doc
      };
      
      // Update vehicle record compliance date
      if (data.vehicles && singleVehicleId) {
        const vRec = data.vehicles.find(v => v.id === singleVehicleId);
        if (vRec) {
          if (type === 'Insurance') vRec.insuranceDate = renewalDate;
          if (type === 'Pollution') vRec.pollutionDate = renewalDate;
          if (type === 'Permit') vRec.permitDate = renewalDate;
          if (type === 'Fitness') vRec.fitnessDate = renewalDate;
          if (type === 'Road Tax' || type === 'Tax') vRec.taxDate = renewalDate;
          if (type === 'Fire & Safety' || type === 'Fire Safety') vRec.fireSafetyDate = renewalDate;
        }
      }

      showToast('Renewal record updated successfully', 'success');
    }
  } else {
    const checkboxes = document.querySelectorAll('.renewal-vehicle-checkbox:checked');
    const selectedVehicleIds = Array.from(checkboxes).map(cb => Number(cb.value));

    if (!selectedVehicleIds.length) {
      showToast('Please select at least one vehicle', 'warning');
      return;
    }

    let count = 0;
    selectedVehicleIds.forEach(vId => {
      const vehObj = allVehicles.find(v => v.id === vId);
      const targetSchoolId = (rawSchool === 'all' || !rawSchool || isSchoolUser)
        ? (vehObj ? vehObj.schoolId : (user ? user.schoolId : 1))
        : Number(rawSchool);

      data.renewals.push({
        id: Date.now() + Math.floor(Math.random() * 1000) + count,
        schoolId: targetSchoolId,
        vehicleId: vId,
        type,
        renewalDate,
        refNo,
        doc: docObj
      });

      // Synchronize vehicle object compliance date
      if (data.vehicles) {
        const vRec = data.vehicles.find(v => v.id === vId);
        if (vRec) {
          if (type === 'Insurance') vRec.insuranceDate = renewalDate;
          if (type === 'Pollution') vRec.pollutionDate = renewalDate;
          if (type === 'Permit') vRec.permitDate = renewalDate;
          if (type === 'Fitness') vRec.fitnessDate = renewalDate;
          if (type === 'Road Tax' || type === 'Tax') vRec.taxDate = renewalDate;
          if (type === 'Fire & Safety' || type === 'Fire Safety') vRec.fireSafetyDate = renewalDate;
        }
      }

      count++;
    });
    showToast(`Renewal saved for ${count} vehicle(s)`, 'success');
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderRenewalsPage();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (window.app) window.app.updateNotifications();
}

function deleteRenewal(id) {
  const numId = Number(id);
  const ren = window.db.getRenewals().find(r => r.id === numId);
  const vObj = ren ? window.db.getVehicles().find(v => v.id === ren.vehicleId) : null;
  const renName = ren ? `${ren.type} (${vObj ? vObj.busNo : 'Vehicle'})` : 'Renewal Record';

  showDeleteConfirmationModal({
    itemTitle: renName,
    onConfirm: () => {
      const data = window.db.getData();
      data.renewals = data.renewals.filter(r => r.id !== numId);
      window.db.saveData(data);
      showToast('Renewal alert deleted', 'success');
      renderRenewalsPage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

// Global Complete Renewal Details View Modal
function openRenewalDetailsModal(recId) {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  if (typeof recId === 'string' && recId.startsWith('dl-')) {
    const driverId = Number(recId.replace('dl-', ''));
    if (typeof openDriverDetailsModal === 'function') {
      openDriverDetailsModal(driverId);
      return;
    }
  }

  const renewal = window.db.getRenewals().find(r => r.id === Number(recId));
  if (!renewal) {
    showToast('Renewal details not found', 'warning');
    return;
  }

  const school = window.db.getSchools().find(s => s.id === renewal.schoolId);
  const vehicle = window.db.getVehicles().find(v => v.id === renewal.vehicleId);
  const statusObj = getRenewalStatus(renewal.renewalDate);
  const todayStr = formatDate(new Date());

  title.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: var(--color-income); margin-right: 6px;"></i> Compliance Renewal Details — ${escapeHTML(renewal.type)}`;

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Registration No</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; white-space: nowrap;">${escapeHTML(vehicle ? vehicle.busNo : 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Compliance Status</span>
          <div style="margin-top: 4px;">
            <span class="badge ${statusObj.badgeClass}"><span class="badge-dot"></span>${statusObj.text}</span>
          </div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Renewal Type</span>
          <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${escapeHTML(renewal.type)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Renewal Expiry Date</span>
          <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${formatDate(renewal.renewalDate)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">System Current Date</span>
          <div style="font-weight: 600; color: #475569; margin-top: 2px;">${todayStr}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Calculated Days Remaining</span>
          <div style="font-size: 15px; font-weight: 800; color: ${statusObj.days < 0 ? 'var(--color-expense)' : 'var(--color-income)'}; margin-top: 2px;">
            ${statusObj.days < 0 ? Math.abs(statusObj.days) + ' Days Overdue' : statusObj.days + ' Days Remaining'}
          </div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Driver</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;" class="driver-name-text">${escapeHTML(vehicle ? (vehicle.driver || 'Unassigned') : 'N/A')}</div>
        </div>
      </div>

      ${vehicle && vehicle.document ? `
        <div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fa-solid fa-file-contract" style="font-size: 24px; color: var(--color-income);"></i>
            <div>
              <strong style="font-size: 13.5px; color: #0f172a; display: block;">Attached Vehicle Certificate Document</strong>
              <span style="font-size: 12px; color: #64748b;">${typeof vehicle.document === 'object' ? escapeHTML(vehicle.document.name) : 'Certificate Document attached'}</span>
            </div>
          </div>
          <button class="btn-sm btn-primary" onclick="openDocumentViewerModal(window.db.getVehicles().find(v => v.id === ${vehicle.id})?.document)">
            <i class="fa-solid fa-eye"></i> View Document
          </button>
        </div>
      ` : ''}

    </div>

    <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 20px;">
      <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Close Details</button>
    </div>
  `;

  openModal('generic-modal');
}

window.renderRenewalsPage = renderRenewalsPage;
window.setRenewalFilter = setRenewalFilter;
window.setQuickTypeFilter = setQuickTypeFilter;
window.openAddRenewalModal = openAddRenewalModal;
window.openEditRenewalModal = openEditRenewalModal;
window.saveRenewal = saveBatchRenewal;
window.saveBatchRenewal = saveBatchRenewal;
window.deleteRenewal = deleteRenewal;
window.openRenewalDetailsModal = openRenewalDetailsModal;
window.updateRenewalVehicleListBySchool = updateRenewalVehicleListBySchool;
window.toggleAllRenewalVehicles = toggleAllRenewalVehicles;
window.filterRenewalVehiclesByRouteCode = filterRenewalVehiclesByRouteCode;
window.handleRenewalDocSelect = handleRenewalDocSelect;
