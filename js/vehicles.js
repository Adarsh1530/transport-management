/* ==========================================
   VEHICLE MANAGEMENT MODULE
   ========================================== */

function renderVehiclesPage() {
  const user = window.auth.getCurrentUser();
  const container = document.getElementById('vehicles-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const vehicles = window.db.getVehicles(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="vehicle-search-input" class="form-control" placeholder="Search Bus No, Vehicle Type, or Driver..." oninput="filterVehiclesTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="vehicle-school-filter" class="form-control" style="width: auto;" onchange="filterVehiclesTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}

        <select id="vehicle-status-filter" class="form-control" style="width: auto;" onchange="filterVehiclesTable()">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inactive">Inactive</option>
          <option value="Fitness Test">Fitness Test</option>
        </select>
      </div>

      <div>
        <button class="btn-primary" onclick="openAddVehicleModal()">
          <i class="fa-solid fa-plus"></i> Add New Vehicle
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="vehicles-table">
          <thead>
            <tr>
              <th>Bus No</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Vehicle Type</th>
              <th>Fuel Type</th>
              <th>Route Number</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="vehicles-tbody">
            ${renderVehicleRows(vehicles, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderVehicleRows(vehicles, showSchoolCol = true) {
  if (!vehicles || !vehicles.length) {
    const colSpan = showSchoolCol ? 8 : 7;
    return `<tr><td colspan="${colSpan}" class="empty-state">No vehicles found.</td></tr>`;
  }

  const schools = window.db.getSchools();

  return vehicles.map(v => {
    const school = schools.find(s => s.id === v.schoolId);
    let badgeClass = 'badge-active';
    if (v.status === 'Maintenance') badgeClass = 'badge-maintenance';
    if (v.status === 'Inactive') badgeClass = 'badge-inactive';
    if (v.status === 'Fitness Test') badgeClass = 'badge-fitness-test';

    return `
      <tr class="table-row">
        <td>
          <span class="bus-no-text" style="color: #111827 !important; text-decoration: none !important; font-weight: 700; cursor: pointer; white-space: nowrap;" onclick="openBusDetailsModal(${v.id})" title="Click to view full bus details">
            <i class="fa-solid fa-bus" style="font-size: 12px; margin-right: 6px; color: #64748b;"></i>${escapeHTML(v.busNo)}
          </span>
        </td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><strong>${escapeHTML(v.type || v.model || 'Ashok Leyland Sunshine')}</strong></td>
        <td><span class="badge badge-neutral">${escapeHTML(v.fuelType || 'Diesel')}</span></td>
        <td><code>${escapeHTML(v.routeNumber || 'N/A')}</code></td>
        <td><span class="driver-name-text" style="white-space: nowrap;">${escapeHTML(v.driver || 'Unassigned')}</span></td>
        <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${v.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="View Complete Details" onclick="openBusDetailsModal(${v.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="icon-btn" title="Edit Vehicle" onclick="openEditVehicleModal(${v.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn" title="Update Daily Status" onclick="openQuickVehicleStatusModal(${v.id})" style="color: var(--color-primary);"><i class="fa-solid fa-sliders"></i></button>
            <button class="icon-btn delete" title="Delete Vehicle" onclick="deleteVehicle(${v.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterVehiclesTable() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('vehicle-search-input')?.value.toLowerCase().trim() || '';
  const schoolFilter = document.getElementById('vehicle-school-filter')?.value || '';
  const statusFilter = document.getElementById('vehicle-status-filter')?.value || '';

  let list = window.db.getVehicles(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(v =>
      (v.busNo && v.busNo.toLowerCase().includes(query)) ||
      (v.type && v.type.toLowerCase().includes(query)) ||
      (v.model && v.model.toLowerCase().includes(query)) ||
      (v.driver && v.driver.toLowerCase().includes(query))
    );
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(v => v.schoolId === Number(schoolFilter));
  }

  if (statusFilter) {
    list = list.filter(v => v.status === statusFilter);
  }

  const tbody = document.getElementById('vehicles-tbody');
  if (tbody) tbody.innerHTML = renderVehicleRows(list, !isSchoolUser);
}

function onVehicleDriverSelectChange() {
  const driverSelect = document.getElementById('vehicle-driver');
  const driverNameInput = document.getElementById('vehicle-driver-name');
  const contactInput = document.getElementById('vehicle-contact-person');
  if (!driverSelect) return;

  const driverName = driverSelect.value;
  if (!driverName) {
    if (driverNameInput) driverNameInput.value = '';
    if (contactInput) contactInput.value = '';
    return;
  }

  const schoolSelect = document.getElementById('vehicle-school-id');
  const schoolId = schoolSelect ? Number(schoolSelect.value) : null;
  const drivers = window.db.getDrivers(schoolId);
  const allDrivers = window.db.getDrivers();
  const driverObj = drivers.find(d => d.name === driverName) || allDrivers.find(d => d.name === driverName);

  if (driverObj) {
    if (driverNameInput) driverNameInput.value = driverObj.name;
    if (contactInput) contactInput.value = driverObj.phone || 'N/A';
  } else {
    if (driverNameInput) driverNameInput.value = driverName;
    if (contactInput) contactInput.value = 'N/A';
  }
}

function updateVehicleDriverDropdownBySchool() {
  const schoolSelect = document.getElementById('vehicle-school-id');
  const driverSelect = document.getElementById('vehicle-driver');
  const attendantSelect = document.getElementById('vehicle-attendant-select');

  const schoolId = schoolSelect ? Number(schoolSelect.value) : null;
  const drivers = window.db.getDrivers(schoolId);
  const attendants = window.db.getAttendants(schoolId);

  const prevDriver = driverSelect ? driverSelect.value : '';
  const prevAttendant = attendantSelect ? attendantSelect.value : '';

  if (driverSelect) {
    driverSelect.innerHTML = `
      <option value="">Select Driver</option>
      ${drivers.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)} (${escapeHTML(d.phone || '')})</option>`).join('')}
    `;
    if (prevDriver && drivers.some(d => d.name === prevDriver)) {
      driverSelect.value = prevDriver;
    } else if (prevDriver) {
      driverSelect.innerHTML += `<option value="${escapeHTML(prevDriver)}" selected>${escapeHTML(prevDriver)}</option>`;
    }
    onVehicleDriverSelectChange();
  }

  if (attendantSelect) {
    attendantSelect.innerHTML = `
      <option value="">Select Attendant</option>
      ${attendants.map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)} (${escapeHTML(a.phone || '')})</option>`).join('')}
    `;
    if (prevAttendant && attendants.some(a => a.name === prevAttendant)) {
      attendantSelect.value = prevAttendant;
    } else if (prevAttendant) {
      attendantSelect.innerHTML += `<option value="${escapeHTML(prevAttendant)}" selected>${escapeHTML(prevAttendant)}</option>`;
    }
    onVehicleAttendantSelectChange();
  }
}

function onVehicleAttendantSelectChange() {
  const attendantSelect = document.getElementById('vehicle-attendant-select');
  const nameInput = document.getElementById('vehicle-attendant-name');
  const phoneInput = document.getElementById('vehicle-attendant-phone');
  if (!attendantSelect) return;

  const attendantName = attendantSelect.value;
  if (!attendantName) {
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    return;
  }

  const schoolSelect = document.getElementById('vehicle-school-id');
  const schoolId = schoolSelect ? Number(schoolSelect.value) : null;
  const attendants = window.db.getAttendants(schoolId);
  const allAttendants = window.db.getAttendants();
  const attendantObj = attendants.find(a => a.name === attendantName) || allAttendants.find(a => a.name === attendantName);

  if (attendantObj) {
    if (nameInput) nameInput.value = attendantObj.name;
    if (phoneInput) phoneInput.value = attendantObj.phone || 'N/A';
  } else {
    if (nameInput) nameInput.value = attendantName;
    if (phoneInput) phoneInput.value = 'N/A';
  }
}

function onFuelTypeChange(fuelType) {
  const labelEl = document.getElementById('vehicle-total-fuel-label');
  const fuelInput = document.getElementById('vehicle-total-diesel');

  if (labelEl) {
    if (fuelType === 'Petrol') {
      labelEl.innerText = 'Total Petrol (L)';
    } else if (fuelType === 'CNG') {
      labelEl.innerText = 'Total CNG (kg)';
    } else if (fuelType === 'EV / Electric') {
      labelEl.innerText = 'Total Energy (kWh)';
    } else {
      labelEl.innerText = 'Total Diesel (L)';
    }
  }

  if (fuelInput) {
    if (fuelType === 'EV / Electric') {
      fuelInput.placeholder = 'e.g. 15';
    } else {
      fuelInput.placeholder = 'e.g. 10';
    }
  }

  calculateVehicleMileage();
}

function calculateVehicleMileage() {
  const fuelTypeSelect = document.getElementById('vehicle-fuel-type');
  const fuelType = fuelTypeSelect ? fuelTypeSelect.value : 'Diesel';

  const openingKm = parseFloat(document.getElementById('vehicle-opening-km')?.value) || 0;
  const closingKm = parseFloat(document.getElementById('vehicle-closing-km')?.value) || 0;
  const totalDiesel = parseFloat(document.getElementById('vehicle-total-diesel')?.value) || 0;

  const avgMileageInput = document.getElementById('vehicle-avg-mileage');
  const fuelEfficiencyInput = document.getElementById('vehicle-fuel-efficiency');

  let unit = 'km/l';
  if (fuelType === 'CNG') unit = 'km/kg';
  else if (fuelType === 'EV / Electric') unit = 'km/kWh';

  if (closingKm > openingKm && totalDiesel > 0) {
    const distance = closingKm - openingKm;
    const mileage = (distance / totalDiesel).toFixed(1);
    const mileageStr = `${mileage} ${unit}`;

    if (avgMileageInput) avgMileageInput.value = mileageStr;
    if (fuelEfficiencyInput) {
      fuelEfficiencyInput.value = mileageStr;
    }
  } else if (closingKm <= openingKm && closingKm > 0) {
    if (avgMileageInput) avgMileageInput.value = 'Invalid KM Range';
  } else {
    if (avgMileageInput) avgMileageInput.value = '';
  }
}

// Add/Edit Vehicle Modals
function openAddVehicleModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const drivers = window.db.getDrivers(isSchoolUser ? user.schoolId : null);
  const attendants = window.db.getAttendants(isSchoolUser ? user.schoolId : null);
  const rtos = window.db.getRtos();

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Vehicle';

  body.innerHTML = `
    <form id="vehicle-form" onsubmit="saveVehicle(event)">
      <input type="hidden" id="vehicle-id-input" value="">
      
      <div class="form-group">
        <label>Vehicle Name *</label>
        <input type="text" id="vehicle-name" class="form-control" required placeholder="Enter vehicle name (e.g. Green Valley Bus 01)">
      </div>

      <div class="form-group">
        <label>Vehicle No. *</label>
        <input type="text" id="vehicle-busno" class="form-control" required placeholder="Enter vehicle registration number (e.g. KL-01-AB-1234)">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Vehicle Make (Company) *</label>
          <select id="vehicle-manufacturer" class="form-control" required>
            <option value="Ashok Leyland" selected>Ashok Leyland</option>
            <option value="Tata Motors">Tata Motors</option>
            <option value="Eicher Motors">Eicher Motors</option>
            <option value="Volvo">Volvo</option>
            <option value="Force Motors">Force Motors</option>
            <option value="BharatBenz">BharatBenz</option>
            <option value="SML Isuzu">SML Isuzu</option>
            <option value="Mahindra">Mahindra</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Vehicle Type *</label>
          <select id="vehicle-type" class="form-control" required onchange="toggleBusNumberFieldVisibility()">
            <option value="School Bus" selected>School Bus</option>
            <option value="Mini Bus">Mini Bus</option>
            <option value="Van">Van</option>
            <option value="Omni">Omni</option>
            <option value="Car">Car</option>
            <option value="SUV">SUV</option>
          </select>
        </div>
        <div id="bus-number-container" class="form-group">
          <label>Bus Number <span style="font-size: 11px; color: #64748b; font-weight: 400;"></span></label>
          <input type="text" id="vehicle-bus-number" class="form-control" placeholder="e.g. Bus 01 or Bus 34">
        </div>
        <div class="form-group">
          <label>Ownership *</label>
          <select id="vehicle-ownership" class="form-control" required>
            <option value="School Owned" selected>School Owned</option>
            <option value="Hired / Contract">Hired / Contract</option>
            <option value="Third Party Lease">Third Party Lease</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Fuel Type *</label>
          <select id="vehicle-fuel-type" class="form-control" required>
            <option value="Diesel" selected>Diesel</option>
            <option value="Petrol">Petrol</option>
            <option value="CNG">CNG</option>
            <option value="EV / Electric">EV / Electric</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fuel Efficiency</label>
          <input type="text" id="vehicle-fuel-efficiency" class="form-control" placeholder="e.g. 12 km/l or 4.5 km/kg">
        </div>
        <div class="form-group">
          <label>Hired Driver Name</label>
          <input type="text" id="vehicle-hired-driver" class="form-control" placeholder="e.g. NA or Hired Driver Name" value="NA">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Route Number *</label>
          <input type="text" id="vehicle-route-number" class="form-control" required placeholder="e.g. R-07">
        </div>
        <div class="form-group">
          <label>RTO Code *</label>
          <select id="vehicle-rto" class="form-control" required>
            <option value="">Select RTO</option>
            ${rtos.map(r => `<option value="${r.code}">${r.code} (${escapeHTML(r.city)})</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Chassis Number</label>
          <input type="text" id="vehicle-chassis-no" class="form-control" placeholder="e.g. CH-2022-KL01-9981">
        </div>
        <div class="form-group">
          <label>Engine Number</label>
          <input type="text" id="vehicle-engine-no" class="form-control" placeholder="e.g. ENG-AL-55412">
        </div>
        <div class="form-group">
          <label>Registration Date</label>
          <input type="date" id="vehicle-reg-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>No. of Seats *</label>
          <input type="number" id="vehicle-seats" class="form-control" required min="1" placeholder="e.g. 50" value="50">
        </div>
        <div class="form-group">
          <label>Status *</label>
          <select id="vehicle-status" class="form-control" required>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
            <option value="Fitness Test">Fitness Test</option>
          </select>
        </div>
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign to School *</label>
          <select id="vehicle-school-id" class="form-control" required onchange="updateVehicleDriverDropdownBySchool()">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="vehicle-school-id" value="${user.schoolId}">
      `}

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Assign Driver *</label>
          <select id="vehicle-driver" class="form-control" onchange="onVehicleDriverSelectChange()">
            <option value="">Select Driver</option>
            ${drivers.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)} (${escapeHTML(d.phone || '')})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Driver Name</label>
          <input type="text" id="vehicle-driver-name" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" placeholder="Driver Name">
        </div>
        <div class="form-group">
          <label>Driver Phone Number</label>
          <input type="text" id="vehicle-contact-person" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" placeholder="Phone Number">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Assign Attendant *</label>
          <select id="vehicle-attendant-select" class="form-control" onchange="onVehicleAttendantSelectChange()">
            <option value="">Select Attendant</option>
            ${attendants.map(a => `<option value="${escapeHTML(a.name)}">${escapeHTML(a.name)} (${escapeHTML(a.phone || '')})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Attendant Name</label>
          <input type="text" id="vehicle-attendant-name" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" placeholder="Attendant Name">
        </div>
        <div class="form-group">
          <label>Attendant Phone Number</label>
          <input type="text" id="vehicle-attendant-phone" class="form-control" readonly style="background: #f1f5f9; font-weight: 600; color: #0f172a;" placeholder="Phone Number">
        </div>
      </div>

      <!-- Document Upload Control -->
      <div class="form-group" style="padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px;">
        <label style="font-weight: 600; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
          <span><i class="fa-solid fa-paperclip" style="color: var(--color-income); margin-right: 6px;"></i> Upload Document</span>
          <span id="vehicle-doc-status-text" style="font-size: 11.5px; font-weight: 500; color: #64748b;">No file chosen</span>
        </label>
        <input type="file" id="vehicle-doc-file" class="form-control" style="font-size: 12px; margin-top: 6px;" onchange="handleVehicleDocFileSelect(event)">
        <input type="hidden" id="vehicle-doc-json" value="">
      </div>

      <!-- Custom Document Upload Section -->
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--color-border); margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--color-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-folder-plus" style="color: var(--color-income);"></i> Custom Document Uploads
          </span>
          <button type="button" class="btn-sm btn-secondary" onclick="appendCustomDocField()">
            <i class="fa-solid fa-plus"></i> Add Custom Document
          </button>
        </div>
        <div id="custom-docs-container"></div>
      </div>

      <!-- Renewal Dates Fields -->
      <div style="border-top: 1px solid var(--color-border); margin-top: 16px; padding-top: 16px;">
        <h4 style="font-size: 13.5px; font-weight: 700; color: var(--color-dark); margin-bottom: 14px;">Compliance & Renewal Dates</h4>
        
        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Insurance Renewal Date</span>
            <span id="ins-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-insurance-date" class="form-control" placeholder="Insurance Renewal Date" oninput="calculateValidityExpiry('vehicle-insurance-date', 'vehicle-insurance-duration', 'ins-pred-tag')">
            <select id="vehicle-insurance-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-insurance-date', 'vehicle-insurance-duration', 'ins-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Pollution Renewal Date</span>
            <span id="pol-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-pollution-date" class="form-control" placeholder="Pollution Renewal Date" oninput="calculateValidityExpiry('vehicle-pollution-date', 'vehicle-pollution-duration', 'pol-pred-tag')">
            <select id="vehicle-pollution-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-pollution-date', 'vehicle-pollution-duration', 'pol-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Permit Renewal Date</span>
            <span id="per-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-permit-date" class="form-control" placeholder="Permit Renewal Date" oninput="calculateValidityExpiry('vehicle-permit-date', 'vehicle-permit-duration', 'per-pred-tag')">
            <select id="vehicle-permit-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-permit-date', 'vehicle-permit-duration', 'per-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Fitness Renewal Date</span>
            <span id="fit-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-fitness-date" class="form-control" placeholder="Fitness Renewal Date" oninput="calculateValidityExpiry('vehicle-fitness-date', 'vehicle-fitness-duration', 'fit-pred-tag')">
            <select id="vehicle-fitness-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-fitness-date', 'vehicle-fitness-duration', 'fit-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Road Tax Renewal Date</span>
            <span id="tax-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-tax-date" class="form-control" placeholder="Road Tax Renewal Date" oninput="calculateValidityExpiry('vehicle-tax-date', 'vehicle-tax-duration', 'tax-pred-tag')">
            <select id="vehicle-tax-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-tax-date', 'vehicle-tax-duration', 'tax-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Fire & Safety Renewal Date</span>
            <span id="fire-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
          </label>
          <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
            <input type="date" id="vehicle-firesafety-date" class="form-control" placeholder="Fire & Safety Renewal Date" oninput="calculateValidityExpiry('vehicle-firesafety-date', 'vehicle-firesafety-duration', 'fire-pred-tag')">
            <select id="vehicle-firesafety-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('vehicle-firesafety-date', 'vehicle-firesafety-duration', 'fire-pred-tag')">
              <option value="">Validity Upto...</option>
              <option value="1_year">1 Year</option>
              <option value="6_months">6 Months</option>
              <option value="1_month">1 Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <!-- Dynamic Container for Custom Renewals -->
        <div id="custom-renewals-container"></div>

        <!-- Custom Renewal Creator Feature -->
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--color-border);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 600; color: var(--color-dark);">Custom Renewal Date</span>
            <button type="button" class="btn-sm btn-secondary" onclick="toggleCustomRenewalBox()">
              <i class="fa-solid fa-plus"></i> Add Custom Renewal
            </button>
          </div>

          <div id="custom-renewal-creation-box" style="display: none; padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; margin-top: 8px;">
            <div class="form-group" style="margin-bottom: 10px;">
              <label style="font-size: 12px;">Custom Renewal Policy Name *</label>
              <input type="text" id="new-custom-policy-name" class="form-control" placeholder="e.g. GPS Speed Governor Test / Board Clearance">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                <span>Renewal Date</span>
                <span id="new-custom-pred-tag" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
              </label>
              <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
                <input type="date" id="new-custom-policy-date" class="form-control" oninput="calculateValidityExpiry('new-custom-policy-date', 'new-custom-policy-duration', 'new-custom-pred-tag')">
                <select id="new-custom-policy-duration" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('new-custom-policy-date', 'new-custom-policy-duration', 'new-custom-pred-tag')">
                  <option value="">Validity Upto...</option>
                  <option value="1_year">1 Year</option>
                  <option value="6_months">6 Months</option>
                  <option value="1_month">1 Month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <button type="button" class="btn-sm btn-primary" style="width: auto;" onclick="appendCustomRenewalField()">+ Insert Custom Renewal Field</button>
          </div>
        </div>

      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 20px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Vehicle</button>
      </div>
    </form>
  `;
  openModal('generic-modal');
  toggleBusNumberFieldVisibility();
}

function handleVehicleDocFileSelect(event) {
  const file = event.target.files[0];
  const textEl = document.getElementById('vehicle-doc-status-text');
  const hiddenInput = document.getElementById('vehicle-doc-json');
  if (!file) return;

  if (textEl) textEl.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

  const reader = new FileReader();
  reader.onload = function(e) {
    const docData = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: e.target.result
    };
    if (hiddenInput) hiddenInput.value = JSON.stringify(docData);
    showToast(`Attached document: ${file.name}`, 'info');
  };
  reader.readAsDataURL(file);
}

function handleCustomDocFileSelect(event, rowId) {
  const file = event.target.files[0];
  const row = document.getElementById(rowId);
  if (!file || !row) return;

  const statusText = row.querySelector('.custom-doc-status');
  const hiddenInput = row.querySelector('.custom-doc-json');

  if (statusText) statusText.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

  const reader = new FileReader();
  reader.onload = function(e) {
    const docData = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: e.target.result
    };
    if (hiddenInput) hiddenInput.value = JSON.stringify(docData);
    showToast(`Attached custom document: ${file.name}`, 'info');
  };
  reader.readAsDataURL(file);
}

function appendCustomDocField(titleVal = '', docJson = null) {
  const container = document.getElementById('custom-docs-container');
  if (!container) return;

  const randId = Math.floor(Math.random() * 100000);
  const rowId = 'custom-doc-row-' + randId;

  const row = document.createElement('div');
  row.className = 'form-group custom-doc-row';
  row.id = rowId;
  row.style.cssText = 'padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 10px;';

  const jsonValue = docJson ? (typeof docJson === 'string' ? docJson : JSON.stringify(docJson)) : '';
  const fileNameDisplay = docJson ? (typeof docJson === 'object' ? docJson.name : 'Document Attached') : 'No file chosen';

  row.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <label style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 0;">
        <i class="fa-solid fa-file-circle-plus" style="color: var(--color-income); margin-right: 4px;"></i> Document Title / Name
      </label>
      <button type="button" class="icon-btn delete" onclick="document.getElementById('${rowId}').remove()" title="Remove Custom Document">
        <i class="fa-solid fa-trash-can" style="font-size: 12px;"></i>
      </button>
    </div>
    <input type="text" class="form-control custom-doc-title" placeholder="Enter document name (e.g. Tax Receipt, Speed Governor, NOC)" value="${escapeHTML(titleVal)}" style="margin-bottom: 8px; font-size: 12.5px;" onkeydown="if(event.key==='Enter'){ event.preventDefault(); appendCustomDocField(); }">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <input type="file" class="form-control custom-doc-file" style="font-size: 12px; flex: 1;" onchange="handleCustomDocFileSelect(event, '${rowId}')">
      <span class="custom-doc-status" style="font-size: 11.5px; font-weight: 500; color: #64748b; white-space: nowrap;">${escapeHTML(fileNameDisplay)}</span>
    </div>
    <input type="hidden" class="custom-doc-json" value="${escapeHTML(jsonValue)}">
  `;

  container.appendChild(row);

  if (!titleVal) {
    const titleInput = row.querySelector('.custom-doc-title');
    if (titleInput) titleInput.focus();
  }
}

function toggleCustomRenewalBox() {
  const box = document.getElementById('custom-renewal-creation-box');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

function appendCustomRenewalField(nameVal = '', dateVal = '') {
  const inputName = nameVal || document.getElementById('new-custom-policy-name')?.value.trim();
  const inputDate = dateVal || document.getElementById('new-custom-policy-date')?.value;

  if (!inputName) {
    showToast('Please enter a custom renewal policy name', 'warning');
    return;
  }

  const container = document.getElementById('custom-renewals-container');
  if (!container) return;

  const randId = Math.floor(Math.random() * 10000);
  const fieldId = 'custom-ren-' + randId;
  const inputId = 'custom-ren-input-' + randId;
  const durationId = 'custom-ren-duration-' + randId;
  const tagId = 'custom-ren-tag-' + randId;

  const group = document.createElement('div');
  group.className = 'form-group custom-renewal-group';
  group.id = fieldId;
  group.innerHTML = `
    <label style="display: flex; justify-content: space-between; align-items: center;">
      <span>${escapeHTML(inputName)} Renewal Date</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span id="${tagId}" style="font-size: 11.5px; font-weight: 600; color: var(--color-profit);"></span>
        <button type="button" class="icon-btn delete" onclick="document.getElementById('${fieldId}').remove()" title="Remove Custom Renewal">
          <i class="fa-solid fa-trash-can" style="font-size: 12px;"></i>
        </button>
      </div>
    </label>
    <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;">
      <input type="date" id="${inputId}" class="form-control custom-renewal-item" data-custom-name="${escapeHTML(inputName)}" value="${inputDate}" oninput="calculateValidityExpiry('${inputId}', '${durationId}', '${tagId}')">
      <select id="${durationId}" class="form-control" style="font-size: 12px; padding: 6px 8px;" onchange="calculateValidityExpiry('${inputId}', '${durationId}', '${tagId}')">
        <option value="">Validity Upto...</option>
        <option value="1_year">1 Year</option>
        <option value="6_months">6 Months</option>
        <option value="1_month">1 Month</option>
        <option value="custom">Custom</option>
      </select>
    </div>
  `;

  container.appendChild(group);

  if (!nameVal) {
    document.getElementById('new-custom-policy-name').value = '';
    document.getElementById('new-custom-policy-date').value = '';
    document.getElementById('custom-renewal-creation-box').style.display = 'none';
    showToast(`Added custom renewal field: ${inputName}`, 'info');
  }
}

function toggleBusNumberFieldVisibility() {
  const typeSelect = document.getElementById('vehicle-type');
  const busNumContainer = document.getElementById('bus-number-container');
  if (!typeSelect || !busNumContainer) return;

  const type = typeSelect.value;
  if (type === 'School Bus') {
    busNumContainer.style.display = 'block';
  } else {
    busNumContainer.style.display = 'none';
  }
}

function openEditVehicleModal(id) {
  const vehicle = window.db.getVehicles().find(v => v.id === id);
  if (!vehicle) return;

  openAddVehicleModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Vehicle';
  document.getElementById('vehicle-id-input').value = vehicle.id;
  document.getElementById('vehicle-name').value = vehicle.vehicleName || `Bus ${vehicle.busNo}`;
  document.getElementById('vehicle-busno').value = vehicle.busNo;
  if (document.getElementById('vehicle-manufacturer')) document.getElementById('vehicle-manufacturer').value = vehicle.manufacturer || 'Ashok Leyland';
  if (document.getElementById('vehicle-type')) {
    document.getElementById('vehicle-type').value = vehicle.type || 'School Bus';
    toggleBusNumberFieldVisibility();
  }
  if (document.getElementById('vehicle-bus-number')) {
    document.getElementById('vehicle-bus-number').value = vehicle.busNumber || vehicle.busNoShort || '';
  }
  if (document.getElementById('vehicle-ownership')) document.getElementById('vehicle-ownership').value = vehicle.ownership || 'School Owned';
  if (document.getElementById('vehicle-hired-driver')) document.getElementById('vehicle-hired-driver').value = vehicle.hiredDriver || 'NA';

  if (document.getElementById('vehicle-fuel-type')) {
    document.getElementById('vehicle-fuel-type').value = vehicle.fuelType || 'Diesel';
    onFuelTypeChange(vehicle.fuelType || 'Diesel');
  }
  if (document.getElementById('vehicle-fuel-efficiency')) document.getElementById('vehicle-fuel-efficiency').value = vehicle.fuelEfficiency || '12 km/l';
  if (document.getElementById('vehicle-route-number')) document.getElementById('vehicle-route-number').value = vehicle.routeNumber || 'R-01';
  if (document.getElementById('vehicle-chassis-no')) document.getElementById('vehicle-chassis-no').value = vehicle.chassisNo || '';
  if (document.getElementById('vehicle-engine-no')) document.getElementById('vehicle-engine-no').value = vehicle.engineNo || '';
  if (document.getElementById('vehicle-reg-date')) document.getElementById('vehicle-reg-date').value = vehicle.regDate || '';
  if (document.getElementById('vehicle-rto')) document.getElementById('vehicle-rto').value = vehicle.rto || 'KL-01';

  document.getElementById('vehicle-seats').value = vehicle.seats || 50;
  document.getElementById('vehicle-contact-person').value = vehicle.contactPerson || vehicle.driver || 'Transport Incharge';
  
  const schoolSelect = document.getElementById('vehicle-school-id');
  if (schoolSelect) schoolSelect.value = vehicle.schoolId;
  updateVehicleDriverDropdownBySchool();
  if (document.getElementById('vehicle-driver')) document.getElementById('vehicle-driver').value = vehicle.driver || '';
  onVehicleDriverSelectChange();
  if (document.getElementById('vehicle-attendant-select')) document.getElementById('vehicle-attendant-select').value = vehicle.attendant || vehicle.attendantName || '';
  onVehicleAttendantSelectChange();
  document.getElementById('vehicle-status').value = vehicle.status || 'Active';

  if (vehicle.document) {
    const hiddenInput = document.getElementById('vehicle-doc-json');
    const textEl = document.getElementById('vehicle-doc-status-text');
    if (hiddenInput) hiddenInput.value = typeof vehicle.document === 'object' ? JSON.stringify(vehicle.document) : vehicle.document;
    if (textEl) textEl.innerText = typeof vehicle.document === 'object' ? vehicle.document.name : 'Attached Document';
  }

  if (vehicle.customDocuments && Array.isArray(vehicle.customDocuments)) {
    vehicle.customDocuments.forEach(cd => {
      appendCustomDocField(cd.title || '', cd.file || null);
    });
  }

  // Load existing renewal dates
  const standardTypes = ['Insurance', 'Pollution', 'Permit', 'Fitness', 'Tax', 'Road Tax', 'Fire & Safety', 'Fire Safety'];
  const busRenewals = window.db.getRenewals().filter(r => r.vehicleId === vehicle.id);

  busRenewals.forEach(r => {
    if (r.type === 'Insurance') document.getElementById('vehicle-insurance-date').value = r.renewalDate;
    else if (r.type === 'Pollution') document.getElementById('vehicle-pollution-date').value = r.renewalDate;
    else if (r.type === 'Permit') document.getElementById('vehicle-permit-date').value = r.renewalDate;
    else if (r.type === 'Fitness') document.getElementById('vehicle-fitness-date').value = r.renewalDate;
    else if (r.type === 'Tax' || r.type === 'Road Tax') document.getElementById('vehicle-tax-date').value = r.renewalDate;
    else if (r.type === 'Fire & Safety' || r.type === 'Fire Safety') document.getElementById('vehicle-firesafety-date').value = r.renewalDate;
    else if (!standardTypes.includes(r.type)) {
      appendCustomRenewalField(r.type, r.renewalDate);
    }
  });
}

function saveVehicle(event) {
  event.preventDefault();
  const idVal = document.getElementById('vehicle-id-input').value;
  const vehicleName = document.getElementById('vehicle-name').value.trim();
  const busNo = document.getElementById('vehicle-busno').value.trim();
  const busNumber = document.getElementById('vehicle-bus-number')?.value.trim() || '';
  const manufacturer = document.getElementById('vehicle-manufacturer')?.value || 'Ashok Leyland';
  const type = document.getElementById('vehicle-type')?.value || 'School Bus';
  const ownership = document.getElementById('vehicle-ownership')?.value || 'School Owned';
  const hiredDriver = document.getElementById('vehicle-hired-driver')?.value.trim() || 'NA';
  const model = `${manufacturer} ${type}`;
  const fuelType = document.getElementById('vehicle-fuel-type').value;
  const fuelEfficiency = document.getElementById('vehicle-fuel-efficiency')?.value.trim() || '';
  const routeNumber = document.getElementById('vehicle-route-number').value.trim();
  const rto = document.getElementById('vehicle-rto').value;
  const chassisNo = document.getElementById('vehicle-chassis-no')?.value.trim() || '';
  const engineNo = document.getElementById('vehicle-engine-no')?.value.trim() || '';
  const regDate = document.getElementById('vehicle-reg-date')?.value || new Date().toISOString().split('T')[0];
  const seats = Number(document.getElementById('vehicle-seats').value);
  const contactPerson = document.getElementById('vehicle-contact-person').value.trim();
  const schoolId = Number(document.getElementById('vehicle-school-id').value);
  const driver = document.getElementById('vehicle-driver').value;
  const attendantSelectVal = document.getElementById('vehicle-attendant-select')?.value || '';
  const attendantName = document.getElementById('vehicle-attendant-name')?.value.trim() || attendantSelectVal;
  const attendantPhone = document.getElementById('vehicle-attendant-phone')?.value.trim() || '';
  const attendant = attendantName;
  const status = document.getElementById('vehicle-status').value;

  const docJsonStr = document.getElementById('vehicle-doc-json')?.value;
  let documentObj = null;
  if (docJsonStr) {
    try {
      documentObj = JSON.parse(docJsonStr);
    } catch (e) {
      documentObj = docJsonStr;
    }
  }

  const customDocs = [];
  document.querySelectorAll('.custom-doc-row').forEach(row => {
    const titleInput = row.querySelector('.custom-doc-title');
    const jsonInput = row.querySelector('.custom-doc-json');
    const title = titleInput ? titleInput.value.trim() : '';
    const jsonStr = jsonInput ? jsonInput.value : '';
    let fileObj = null;
    if (jsonStr) {
      try {
        fileObj = JSON.parse(jsonStr);
      } catch (e) {
        fileObj = jsonStr;
      }
    }
    if (title || fileObj) {
      customDocs.push({ title: title || 'Custom Document', file: fileObj });
    }
  });

  const getEffectiveDate = (inputId) => {
    const el = document.getElementById(inputId);
    if (!el) return '';
    return el.dataset.calculatedExpiry || el.value;
  };

  const insuranceDate = getEffectiveDate('vehicle-insurance-date');
  const pollutionDate = getEffectiveDate('vehicle-pollution-date');
  const permitDate = getEffectiveDate('vehicle-permit-date');
  const fitnessDate = getEffectiveDate('vehicle-fitness-date');
  const taxDate = getEffectiveDate('vehicle-tax-date');
  const fireSafetyDate = getEffectiveDate('vehicle-firesafety-date');

  const data = window.db.getData();

  let existingVehicle = null;
  if (idVal) {
    existingVehicle = data.vehicles.find(v => v.id === Number(idVal));
  } else {
    existingVehicle = data.vehicles.find(v => v.busNo.toLowerCase() === busNo.toLowerCase());
  }

  let targetVehicleId;

  if (existingVehicle) {
    targetVehicleId = existingVehicle.id;
    existingVehicle.vehicleName = vehicleName;
    existingVehicle.busNo = busNo;
    existingVehicle.busNumber = busNumber;
    existingVehicle.model = model;
    existingVehicle.manufacturer = manufacturer;
    existingVehicle.type = type;
    existingVehicle.ownership = ownership;
    existingVehicle.hiredDriver = hiredDriver;
    existingVehicle.fuelType = fuelType;
    existingVehicle.fuelEfficiency = fuelEfficiency;
    existingVehicle.routeNumber = routeNumber;
    existingVehicle.rto = rto;
    existingVehicle.chassisNo = chassisNo;
    existingVehicle.engineNo = engineNo;
    existingVehicle.regDate = regDate;
    existingVehicle.seats = seats;
    existingVehicle.maxAllowed = seats;
    existingVehicle.noOfStudents = seats;
    existingVehicle.contactPerson = contactPerson;
    existingVehicle.schoolId = schoolId;
    existingVehicle.driver = driver;
    existingVehicle.attendant = attendant;
    existingVehicle.status = status;
    if (documentObj) existingVehicle.document = documentObj;
    existingVehicle.customDocuments = customDocs;
    showToast(`Vehicle ${busNo} details updated successfully`, 'success');
  } else {
    targetVehicleId = Date.now();
    data.vehicles.push({
      id: targetVehicleId,
      vehicleName,
      busNo,
      busNumber,
      model,
      manufacturer,
      type,
      ownership,
      hiredDriver,
      fuelType,
      fuelEfficiency,
      routeNumber,
      rto,
      chassisNo,
      engineNo,
      regDate,
      seats,
      maxAllowed: seats,
      noOfStudents: seats,
      contactPerson,
      schoolId,
      driver,
      attendant,
      status,
      openingKm: 54700,
      closingKm: 56278,
      totalDiesel: 317.5,
      avgMileage: '4.97 km/l',
      document: documentObj,
      customDocuments: customDocs
    });
    showToast(`Vehicle ${busNo} added successfully`, 'success');
  }

  // Update or insert standard renewal compliance dates
  const renewalInputs = [
    { type: 'Insurance', dateVal: insuranceDate },
    { type: 'Pollution', dateVal: pollutionDate },
    { type: 'Permit', dateVal: permitDate },
    { type: 'Fitness', dateVal: fitnessDate },
    { type: 'Tax', dateVal: taxDate },
    { type: 'Fire & Safety', dateVal: fireSafetyDate }
  ];

  const customItems = document.querySelectorAll('.custom-renewal-item');
  customItems.forEach(item => {
    const cName = item.dataset.customName;
    const cDate = item.dataset.calculatedExpiry || item.value;
    if (cName) {
      renewalInputs.push({ type: cName, dateVal: cDate });
    }
  });

  const activeTypes = renewalInputs.filter(item => item.dateVal).map(item => item.type);

  data.renewals = data.renewals.filter(r => {
    if (r.vehicleId !== targetVehicleId) return true;
    const isStandard = ['Insurance', 'Pollution', 'Permit', 'Fitness', 'Tax', 'Road Tax', 'Fire & Safety', 'Fire Safety'].includes(r.type);
    if (!isStandard && !activeTypes.includes(r.type)) return false;
    return true;
  });

  renewalInputs.forEach(item => {
    if (item.dateVal) {
      const existingRen = data.renewals.find(r => r.vehicleId === targetVehicleId && r.type === item.type);
      if (existingRen) {
        existingRen.renewalDate = item.dateVal;
        existingRen.schoolId = schoolId;
      } else {
        data.renewals.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          vehicleId: targetVehicleId,
          schoolId,
          type: item.type,
          renewalDate: item.dateVal
        });
      }
    }
  });

  // Automatic data propagation to assigned Driver, Route, and Attendant records
  if (driver && driver !== 'Unassigned') {
    if (data.drivers) {
      // Clear previous assignment for this vehicle
      data.drivers.forEach(d => {
        if (d.busId === targetVehicleId && d.name !== driver) d.busId = null;
      });
      // Assign selected driver
      const dObj = data.drivers.find(d => d.name === driver || d.id === Number(driver));
      if (dObj) {
        dObj.busId = targetVehicleId;
        dObj.schoolId = schoolId;
      }
    }
  }

  if (routeNumber && routeNumber !== 'N/A') {
    if (data.routes) {
      const rObj = data.routes.find(r => r.routeCode === routeNumber || r.busId === targetVehicleId);
      if (rObj) {
        rObj.busId = targetVehicleId;
        rObj.routeCode = routeNumber;
        rObj.schoolId = schoolId;
      }
    }
  }

  if (attendant && attendant !== 'Unassigned') {
    if (data.attendants) {
      const aObj = data.attendants.find(a => a.name === attendant);
      if (aObj) {
        aObj.busId = targetVehicleId;
        aObj.schoolId = schoolId;
      }
    }
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderVehiclesPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteVehicle(id) {
  const numId = Number(id);
  const vObj = window.db.getVehicles().find(v => v.id === numId);
  const busNo = vObj ? vObj.busNo : 'Vehicle';

  confirmDeleteModal({
    contentName: busNo,
    entityType: 'Vehicle',
    onConfirm: () => {
      const data = window.db.getData();
      data.vehicles = (data.vehicles || []).filter(v => v.id !== numId);
      data.renewals = (data.renewals || []).filter(r => r.vehicleId !== numId);

      if (data.drivers) {
        data.drivers.forEach(d => {
          if (d.busId === numId) d.busId = null;
        });
      }
      if (data.routes) {
        data.routes.forEach(r => {
          if (r.busId === numId) r.busId = null;
        });
      }
      if (data.attendants) {
        data.attendants.forEach(a => {
          if (a.busId === numId) a.busId = null;
        });
      }

      window.db.saveData(data);
      showToast(`Vehicle "${busNo}" deleted successfully`, 'success');
      renderVehiclesPage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

// Global Complete Bus Details View Modal Renderer
function openBusDetailsModal(vehicleId) {
  const vehicle = window.db.getVehicles().find(v => v.id === Number(vehicleId));
  if (!vehicle) {
    showToast('Vehicle information not found', 'warning');
    return;
  }

  const school = window.db.getSchools().find(s => s.id === vehicle.schoolId);
  const driver = window.db.getDrivers().find(d => d.busId === vehicle.id || (vehicle.driver && d.name === vehicle.driver));
  const route = window.db.getRoutes().find(r => r.busId === vehicle.id || (vehicle.routeNumber && r.routeCode === vehicle.routeNumber));
  const busRenewals = window.db.getRenewals().filter(r => r.vehicleId === vehicle.id);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerHTML = `<i class="fa-solid fa-bus" style="color: var(--color-income); margin-right: 6px;"></i> Complete Vehicle Specifications — ${escapeHTML(vehicle.busNo)}`;

  let statusBadge = 'badge-active';
  if (vehicle.status === 'Maintenance') statusBadge = 'badge-maintenance';
  if (vehicle.status === 'Inactive') statusBadge = 'badge-inactive';
  if (vehicle.status === 'Fitness Test') statusBadge = 'badge-fitness-test';

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Primary Specs Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Name</span>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${escapeHTML(vehicle.vehicleName || 'Bus ' + vehicle.busNo)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Bus Registration No</span>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; white-space: nowrap;">${escapeHTML(vehicle.busNo)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Status</span>
          <div style="margin-top: 4px;">
            <span class="badge ${statusBadge}"><span class="badge-dot"></span>${vehicle.status}</span>
          </div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Make (Company)</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.manufacturer || 'Ashok Leyland')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Type</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.type || 'School Bus')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Ownership</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><span class="badge badge-neutral">${escapeHTML(vehicle.ownership || 'School Owned')}</span></div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Fuel Type</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.fuelType || 'Diesel')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Fuel Efficiency</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.fuelEfficiency || '12 km/l')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Hired Driver Name</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.hiredDriver || 'NA')}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Route Number</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><code>${escapeHTML(vehicle.routeNumber || 'N/A')}</code></div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Registration Date</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${formatDate(vehicle.regDate)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">RTO Office</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.rto || 'KL-01')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Chassis Number</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><code>${escapeHTML(vehicle.chassisNo || 'CH-2022-KL01-9981')}</code></div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Engine Number</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><code>${escapeHTML(vehicle.engineNo || 'ENG-AL-55412')}</code></div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Seating Capacity</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${vehicle.seats || 50} Seats</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Attendant Name</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.attendant || 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Driver Contact</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;" class="phone-no-text">${escapeHTML(vehicle.contactPerson || vehicle.driver || 'N/A')}</div>
        </div>
      </div>

      <!-- Driver & Route Breakdown -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
          <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-id-card" style="color: var(--color-income);"></i> Driver Assignment
          </h4>
          <div style="font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color: var(--color-text-secondary);">Driver:</span> <strong class="driver-name-text" style="white-space: nowrap;">${escapeHTML(driver ? driver.name : (vehicle.driver || 'Unassigned'))}</strong></div>
            <div><span style="color: var(--color-text-secondary);">Phone:</span> <span class="phone-no-text" style="white-space: nowrap;">${escapeHTML(driver ? driver.phone : 'N/A')}</span></div>
            <div><span style="color: var(--color-text-secondary);">License:</span> <code class="license-no-text" style="white-space: nowrap;">${escapeHTML(driver ? driver.license : 'N/A')}</code></div>
            <div><span style="color: var(--color-text-secondary);">Expiry:</span> ${formatDate(driver ? driver.expiry : null)}</div>
          </div>
        </div>

        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
          <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-route" style="color: var(--color-income);"></i> Route Assignment
          </h4>
          <div style="font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color: var(--color-text-secondary);">Route Code:</span> <code>${escapeHTML(route ? route.routeCode : (vehicle.routeNumber || 'Unassigned'))}</code></div>
            <div><span style="color: var(--color-text-secondary);">Route Name:</span> <strong>${escapeHTML(route ? route.name : 'No route assigned')}</strong></div>
            <div><span style="color: var(--color-text-secondary);">Boarding → Dest:</span> ${escapeHTML(route ? (route.start || route.boardingPoint) + ' → ' + route.destination : 'N/A')}</div>
            <div><span style="color: var(--color-text-secondary);">Stops:</span> ${route ? route.stops + ' designated stops' : 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Uploaded Document Section -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fa-solid fa-file-pdf" style="font-size: 24px; color: var(--color-income);"></i>
            <div>
              <strong style="font-size: 13.5px; color: #0f172a; display: block;">Primary Vehicle RC / Registration Document</strong>
              <span style="font-size: 12px; color: #64748b;">${vehicle.document ? (typeof vehicle.document === 'object' ? escapeHTML(vehicle.document.name) : 'Vehicle RC Document attached') : 'No primary document attached'}</span>
            </div>
          </div>
          ${vehicle.document ? `
            <button class="btn-sm btn-primary" onclick="openDocumentViewerModal(window.db.getVehicles().find(v => v.id === ${vehicle.id})?.document)">
              <i class="fa-solid fa-eye"></i> View Document
            </button>
          ` : `<span style="font-size: 12px; color: #94a3b8;">No Document</span>`}
        </div>

        ${(vehicle.customDocuments && vehicle.customDocuments.length) ? vehicle.customDocuments.map(cd => `
          <div style="padding: 14px; border: 1px solid #cbd5e1; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i class="fa-solid fa-file-contract" style="font-size: 22px; color: var(--color-income);"></i>
              <div>
                <strong style="font-size: 13px; color: #0f172a; display: block;">${escapeHTML(cd.title || 'Custom Document')}</strong>
                <span style="font-size: 11.5px; color: #64748b;">${cd.file && typeof cd.file === 'object' ? escapeHTML(cd.file.name) : (cd.file ? 'File attached' : 'No file uploaded')}</span>
              </div>
            </div>
            ${cd.file ? `
              <button class="btn-sm btn-secondary" onclick="openDocumentViewerModal(${JSON.stringify(cd.file).replace(/"/g, '&quot;')})">
                <i class="fa-solid fa-eye"></i> View File
              </button>
            ` : `<span style="font-size: 12px; color: #94a3b8;">No File</span>`}
          </div>
        `).join('') : ''}
      </div>

      <!-- Renewals & Compliance Table -->
      <div>
        <h4 style="font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-shield-halved" style="color: var(--color-income);"></i> Compliance & Renewal Deadlines
        </h4>
        <div class="table-container" style="border: 1px solid #e2e8f0;">
          <table class="custom-table" style="font-size: 12.5px;">
            <thead>
              <tr>
                <th>Compliance Type</th>
                <th>Renewal Date</th>
                <th>Days Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${busRenewals.length ? busRenewals.map(r => {
                const st = getRenewalStatus(r.renewalDate);
                return `
                  <tr>
                    <td><strong>${escapeHTML(r.type)}</strong></td>
                    <td>${formatDate(r.renewalDate)}</td>
                    <td><strong>${st.days < 0 ? 'Overdue' : st.days + ' Days'}</strong></td>
                    <td><span class="badge ${st.badgeClass}"><span class="badge-dot"></span>${st.text}</span></td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="4" class="empty-state">No specific renewals registered for this bus.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 20px;">
      <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Close Details</button>
    </div>
  `;

  openModal('generic-modal');
}

function openQuickVehicleStatusModal(id) {
  const veh = window.db.getVehicles().find(v => v.id === Number(id));
  if (!veh) return;

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = `Update Daily Status — ${veh.busNo}`;

  body.innerHTML = `
    <form id="quick-status-form" onsubmit="saveQuickVehicleStatus(event, ${veh.id})">
      <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 18px;">
        <div style="font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 4px;">${escapeHTML(veh.busNo)}</div>
        <div style="font-size: 13px; color: #64748b;">Model / Type: ${escapeHTML(veh.type || veh.model || 'N/A')}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Assigned Route: <strong>${escapeHTML(veh.routeNumber || 'N/A')}</strong></div>
      </div>

      <div class="form-group">
        <label style="font-weight: 600; color: #0f172a;">Daily Bus Status *</label>
        <select id="quick-vehicle-status-select" class="form-control" required style="font-weight: 600;">
          <option value="Active" ${veh.status === 'Active' ? 'selected' : ''} style="color: #15803d;">🟢 Active (In Service)</option>
          <option value="Inactive" ${veh.status === 'Inactive' ? 'selected' : ''} style="color: #dc2626;">🔴 Inactive (Off Duty)</option>
          <option value="Fitness Test" ${veh.status === 'Fitness Test' ? 'selected' : ''} style="color: #1d4ed8;">🔵 Fitness Test (Inspection)</option>
          <option value="Maintenance" ${veh.status === 'Maintenance' ? 'selected' : ''} style="color: #b45309;">🟡 Maintenance (Under Repair)</option>
        </select>
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;"><i class="fa-solid fa-floppy-disk"></i> Save Status</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
}

function saveQuickVehicleStatus(event, id) {
  event.preventDefault();
  const newStatus = document.getElementById('quick-vehicle-status-select').value;
  const data = window.db.getData();
  const idx = data.vehicles.findIndex(v => v.id === Number(id));
  if (idx !== -1) {
    data.vehicles[idx].status = newStatus;
    window.db.saveData(data);
    showToast(`Vehicle ${data.vehicles[idx].busNo} status updated to "${newStatus}"`, 'success');
    closeModal('generic-modal');
    renderVehiclesPage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

window.openBusDetailsModal = openBusDetailsModal;
window.renderVehiclesPage = renderVehiclesPage;
window.openAddVehicleModal = openAddVehicleModal;
window.openEditVehicleModal = openEditVehicleModal;
window.saveVehicle = saveVehicle;
window.deleteVehicle = deleteVehicle;
window.appendCustomRenewalField = appendCustomRenewalField;
window.toggleCustomRenewalBox = toggleCustomRenewalBox;
window.handleVehicleDocFileSelect = handleVehicleDocFileSelect;
window.appendCustomDocField = appendCustomDocField;
window.handleCustomDocFileSelect = handleCustomDocFileSelect;
window.onVehicleDriverSelectChange = onVehicleDriverSelectChange;
window.onVehicleAttendantSelectChange = onVehicleAttendantSelectChange;
window.updateVehicleDriverDropdownBySchool = updateVehicleDriverDropdownBySchool;
window.calculateVehicleMileage = calculateVehicleMileage;
window.onFuelTypeChange = onFuelTypeChange;
window.openQuickVehicleStatusModal = openQuickVehicleStatusModal;
window.saveQuickVehicleStatus = saveQuickVehicleStatus;
