/* ==========================================
   VEHICLES MANAGEMENT MODULE
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
          <input type="text" id="vehicle-search-input" class="form-control" placeholder="Search Bus No or Driver..." oninput="filterVehiclesTable()">
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
              <th>Driver</th>
              <th>Registration Date</th>
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
    const colSpan = showSchoolCol ? 7 : 6;
    return `<tr><td colspan="${colSpan}" class="empty-state">No vehicles found.</td></tr>`;
  }

  const schools = window.db.getSchools();

  return vehicles.map(v => {
    const school = schools.find(s => s.id === v.schoolId);
    let badgeClass = 'badge-active';
    if (v.status === 'Maintenance') badgeClass = 'badge-maintenance';
    if (v.status === 'Inactive') badgeClass = 'badge-inactive';

    return `
      <tr class="table-row">
        <td><span class="bus-no-text" style="color: #111827 !important; text-decoration: none !important; font-weight: 700; cursor: pointer;" onclick="openBusDetailsModal(${v.id})" title="Click to view full bus details"><i class="fa-solid fa-bus" style="font-size: 12px; margin-right: 6px; color: #64748b;"></i>${escapeHTML(v.busNo)}</span></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td>${escapeHTML(v.type)}</td>
        <td>${escapeHTML(v.driver || 'Unassigned')}</td>
        <td>${formatDate(v.regDate)}</td>
        <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${v.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="View Full Bus Details" onclick="openBusDetailsModal(${v.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="icon-btn" title="Edit Vehicle" onclick="openEditVehicleModal(${v.id})"><i class="fa-solid fa-pen-to-square"></i></button>
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
      v.busNo.toLowerCase().includes(query) ||
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

// Add/Edit Vehicle Modals
function openAddVehicleModal() {
  const user = window.auth.getCurrentUser();
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();
  const drivers = window.db.getDrivers(isSchoolUser ? user.schoolId : null);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add Vehicle';

  body.innerHTML = `
    <form id="vehicle-form" onsubmit="saveVehicle(event)">
      <input type="hidden" id="vehicle-id-input" value="">
      
      <div class="form-group">
        <label>Vehicle Name. *</label>
        <input type="text" id="vehicle-name" class="form-control" required placeholder="Enter vehicle name (e.g. Green Valley Bus 01)">
      </div>

      <div class="form-group">
        <label>Vehicle No. *</label>
        <input type="text" id="vehicle-busno" class="form-control" required placeholder="Enter vehicle registration number (e.g. KL-01-AB-1234)">
      </div>

      <div class="form-group">
        <label>Vehicle model. *</label>
        <input type="text" id="vehicle-model" class="form-control" required placeholder="Enter vehicle model (e.g. Ashok Leyland 2022)">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>No. of Seats *</label>
          <input type="number" id="vehicle-seats" class="form-control" required min="1" placeholder="e.g. 50">
        </div>
        <div class="form-group">
          <label>Maximum Allowed *</label>
          <input type="number" id="vehicle-max-allowed" class="form-control" required min="1" placeholder="e.g. 50">
        </div>
      </div>

      <div class="form-group">
        <label>Vehicle Type *</label>
        <select id="vehicle-type" class="form-control" required>
          <option value="">Please select</option>
          <option value="School Bus (50 Seater)">School Bus (50 Seater)</option>
          <option value="Mini Bus (30 Seater)">Mini Bus (30 Seater)</option>
          <option value="Heavy Bus (60 Seater)">Heavy Bus (60 Seater)</option>
          <option value="Van (14 Seater)">Van (14 Seater)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Contact Person *</label>
        <input type="text" id="vehicle-contact-person" class="form-control" required placeholder="Enter contact person name & phone">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign to School *</label>
          <select id="vehicle-school-id" class="form-control" required>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="vehicle-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Assigned Driver</label>
        <select id="vehicle-driver" class="form-control">
          <option value="">Select Driver</option>
          ${drivers.map(d => `<option value="${escapeHTML(d.name)}">${escapeHTML(d.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Status</label>
        <select id="vehicle-status" class="form-control">
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inactive">Inactive</option>
        </select>
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

  // Clear creation box
  if (!nameVal) {
    document.getElementById('new-custom-policy-name').value = '';
    document.getElementById('new-custom-policy-date').value = '';
    document.getElementById('custom-renewal-creation-box').style.display = 'none';
    showToast(`Added custom renewal field: ${inputName}`, 'info');
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
  document.getElementById('vehicle-model').value = vehicle.model || 'Standard School Fleet';
  document.getElementById('vehicle-seats').value = vehicle.seats || 50;
  document.getElementById('vehicle-max-allowed').value = vehicle.maxAllowed || 50;
  document.getElementById('vehicle-type').value = vehicle.type || 'School Bus (50 Seater)';
  document.getElementById('vehicle-contact-person').value = vehicle.contactPerson || vehicle.driver || 'Fleet Incharge';
  
  const schoolSelect = document.getElementById('vehicle-school-id');
  if (schoolSelect) schoolSelect.value = vehicle.schoolId;
  document.getElementById('vehicle-driver').value = vehicle.driver || '';
  document.getElementById('vehicle-status').value = vehicle.status || 'Active';

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
      // Render Custom Renewal field
      appendCustomRenewalField(r.type, r.renewalDate);
    }
  });
}

function saveVehicle(event) {
  event.preventDefault();
  const idVal = document.getElementById('vehicle-id-input').value;
  const vehicleName = document.getElementById('vehicle-name').value.trim();
  const busNo = document.getElementById('vehicle-busno').value.trim();
  const model = document.getElementById('vehicle-model').value.trim();
  const seats = Number(document.getElementById('vehicle-seats').value);
  const maxAllowed = Number(document.getElementById('vehicle-max-allowed').value);
  const type = document.getElementById('vehicle-type').value;
  const contactPerson = document.getElementById('vehicle-contact-person').value.trim();
  const schoolId = Number(document.getElementById('vehicle-school-id').value);
  const driver = document.getElementById('vehicle-driver').value;
  const status = document.getElementById('vehicle-status').value;

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

  // Check if vehicle exists by ID or by registration number
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
    existingVehicle.model = model;
    existingVehicle.seats = seats;
    existingVehicle.maxAllowed = maxAllowed;
    existingVehicle.type = type;
    existingVehicle.contactPerson = contactPerson;
    existingVehicle.schoolId = schoolId;
    existingVehicle.driver = driver;
    existingVehicle.status = status;
    showToast(`Vehicle ${busNo} details updated successfully`, 'success');
  } else {
    targetVehicleId = Date.now();
    data.vehicles.push({
      id: targetVehicleId,
      vehicleName,
      busNo,
      model,
      seats,
      maxAllowed,
      type,
      contactPerson,
      schoolId,
      driver,
      regDate: new Date().toISOString().split('T')[0],
      status
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

  // Process custom renewals
  const customItems = document.querySelectorAll('.custom-renewal-item');
  customItems.forEach(item => {
    const cName = item.dataset.customName;
    const cDate = item.dataset.calculatedExpiry || item.value;
    if (cName) {
      renewalInputs.push({ type: cName, dateVal: cDate });
    }
  });

  // Also check if a new custom policy field is partially filled in creation box
  const pendingCName = document.getElementById('new-custom-policy-name')?.value.trim();
  const pendingCDate = document.getElementById('new-custom-policy-date')?.value;
  if (pendingCName) {
    renewalInputs.push({ type: pendingCName, dateVal: pendingCDate });
  }

  const activeTypes = renewalInputs.filter(item => item.dateVal).map(item => item.type);

  // Remove any custom renewals for targetVehicleId that were deleted in the form
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

  window.db.saveData(data);
  closeModal('generic-modal');
  renderVehiclesPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteVehicle(id) {
  if (confirm('Are you sure you want to delete this vehicle?')) {
    const data = window.db.getData();
    data.vehicles = data.vehicles.filter(v => v.id !== id);
    window.db.saveData(data);
    showToast('Vehicle deleted successfully', 'success');
    renderVehiclesPage();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
}

// Global Bus Details Modal Renderer
function openBusDetailsModal(vehicleId) {
  const vehicle = window.db.getVehicles().find(v => v.id === Number(vehicleId));
  if (!vehicle) {
    showToast('Vehicle information not found', 'warning');
    return;
  }

  const school = window.db.getSchools().find(s => s.id === vehicle.schoolId);
  const driver = window.db.getDrivers().find(d => d.busId === vehicle.id || (vehicle.driver && d.name === vehicle.driver));
  const route = window.db.getRoutes().find(r => r.busId === vehicle.id);
  const busRenewals = window.db.getRenewals().filter(r => r.vehicleId === vehicle.id);
  const busTrips = window.db.getTrips().filter(t => t.busId === vehicle.id);

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerHTML = `<i class="fa-solid fa-bus" style="color: var(--color-income); margin-right: 6px;"></i> Specifications & Compliance — ${escapeHTML(vehicle.busNo)}`;

  let statusBadge = 'badge-active';
  if (vehicle.status === 'Maintenance') statusBadge = 'badge-maintenance';
  if (vehicle.status === 'Inactive') statusBadge = 'badge-inactive';

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- Primary Info Summary -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Bus Number</span>
          <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px;">${escapeHTML(vehicle.busNo)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Status</span>
          <div style="margin-top: 4px;">
            <span class="badge ${statusBadge}"><span class="badge-dot"></span>${vehicle.status}</span>
          </div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vehicle Classification</span>
          <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(vehicle.type)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>
      </div>

      <!-- Driver & Route Breakdown -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
          <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-id-card" style="color: var(--color-income);"></i> Driver Info
          </h4>
          <div style="font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color: var(--color-text-secondary);">Driver:</span> <strong>${escapeHTML(driver ? driver.name : (vehicle.driver || 'Unassigned'))}</strong></div>
            <div><span style="color: var(--color-text-secondary);">Phone:</span> ${escapeHTML(driver ? driver.phone : 'N/A')}</div>
            <div><span style="color: var(--color-text-secondary);">License:</span> <code>${escapeHTML(driver ? driver.license : 'N/A')}</code></div>
            <div><span style="color: var(--color-text-secondary);">Expiry:</span> ${formatDate(driver ? driver.expiry : null)}</div>
          </div>
        </div>

        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white;">
          <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-route" style="color: var(--color-income);"></i> Route Assignment
          </h4>
          <div style="font-size: 13px; display: flex; flex-direction: column; gap: 6px;">
            <div><span style="color: var(--color-text-secondary);">Route Code:</span> <code>${escapeHTML(route ? route.routeCode : 'Unassigned')}</code></div>
            <div><span style="color: var(--color-text-secondary);">Route Name:</span> <strong>${escapeHTML(route ? route.name : 'No route assigned')}</strong></div>
            <div><span style="color: var(--color-text-secondary);">Route Path:</span> ${escapeHTML(route ? route.start + ' → ' + route.destination : 'N/A')}</div>
            <div><span style="color: var(--color-text-secondary);">Stops:</span> ${route ? route.stops + ' designated stops' : 'N/A'}</div>
          </div>
        </div>
      </div>

      <!-- Renewals & Compliance Table -->
      <div>
        <h4 style="font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-shield-halved" style="color: var(--color-income);"></i> Vehicle Compliance & Renewal Deadlines
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

      <!-- Recent Dispatch Trips -->
      <div>
        <h4 style="font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-clock-rotate-left" style="color: var(--color-income);"></i> Recent Dispatch Trips
        </h4>
        <div class="table-container" style="border: 1px solid #e2e8f0;">
          <table class="custom-table" style="font-size: 12.5px;">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Date</th>
                <th>Timing</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${busTrips.length ? busTrips.map(t => `
                <tr>
                  <td><code>${escapeHTML(t.tripId)}</code></td>
                  <td>${formatDate(t.date)}</td>
                  <td>${escapeHTML(t.startTime)} - ${escapeHTML(t.endTime)}</td>
                  <td><span class="badge badge-neutral">${escapeHTML(t.status)}</span></td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="empty-state">No trips logged for this bus.</td></tr>`}
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

window.openBusDetailsModal = openBusDetailsModal;
window.renderVehiclesPage = renderVehiclesPage;
window.openAddVehicleModal = openAddVehicleModal;
window.openEditVehicleModal = openEditVehicleModal;
window.saveVehicle = saveVehicle;
window.deleteVehicle = deleteVehicle;
window.appendCustomRenewalField = appendCustomRenewalField;
window.toggleCustomRenewalBox = toggleCustomRenewalBox;

