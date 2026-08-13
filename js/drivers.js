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
              <th>Age</th>
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
    const colSpan = showSchoolCol ? 9 : 8;
    return `<tr><td colspan="${colSpan}" class="empty-state">No driver records found.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();

  return drivers.map(d => {
    const school = schools.find(s => s.id === d.schoolId);
    const bus = vehicles.find(v => v.id === d.busId);
    const ageDisplay = d.dob ? calculateAge(d.dob) : (d.age ? `${d.age} Years` : 'N/A');

    return `
      <tr class="table-row">
        <td><strong class="driver-name-text" style="color: #0f172a; cursor: pointer; white-space: nowrap;" onclick="openDriverDetailsModal(${d.id})">${escapeHTML(d.name)}</strong></td>
        <td><code class="license-no-text" style="white-space: nowrap;">${escapeHTML(d.license)}</code></td>
        <td><span class="phone-no-text" style="white-space: nowrap;">${escapeHTML(d.phone)}</span></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><span class="bus-no-text" style="white-space: nowrap;">${escapeHTML(bus ? bus.busNo : 'Unassigned')}</span></td>
        <td><span class="badge badge-neutral">${escapeHTML(ageDisplay)}</span></td>
        <td>${formatDate(d.expiry)}</td>
        <td><span class="badge ${d.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${d.status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="View Full Driver Details" onclick="openDriverDetailsModal(${d.id})"><i class="fa-solid fa-eye"></i></button>
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

function updateDriverAgeDisplay() {
  const dobVal = document.getElementById('driver-dob')?.value;
  const ageDisplayEl = document.getElementById('driver-age-display');
  if (!dobVal || !ageDisplayEl) return;
  const ageStr = calculateAge(dobVal);
  ageDisplayEl.value = ageStr || 'N/A';
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

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Date of Birth (DOB) *</label>
          <input type="date" id="driver-dob" class="form-control" required value="1990-02-15" onchange="updateDriverAgeDisplay()">
        </div>
        <div class="form-group">
          <label>Calculated Age</label>
          <input type="text" id="driver-age-display" class="form-control" disabled value="${calculateAge('1990-02-15')}">
        </div>
      </div>

      <div class="form-group">
        <label>Total Experience Selection *</label>
        <select id="driver-experience" class="form-control" required>
          <option value="">Select Total Experience</option>
          <option value="1 Year">1 Year</option>
          <option value="2 Years">2 Years</option>
          <option value="3 Years">3 Years</option>
          <option value="4 Years">4 Years</option>
          <option value="5 Years" selected>5 Years</option>
          <option value="6 Years">6 Years</option>
          <option value="7 Years">7 Years</option>
          <option value="8 Years">8 Years</option>
          <option value="9 Years">9 Years</option>
          <option value="10+ Years">10+ Years</option>
          <option value="15+ Years">15+ Years</option>
        </select>
      </div>

      <div class="form-group">
        <label>Mobile Number *</label>
        <input type="text" id="driver-phone" class="form-control" required placeholder="+91 98765 43210">
      </div>

      ${!isSchoolUser ? `
        <div class="form-group">
          <label>Assign School *</label>
          <select id="driver-school-id" class="form-control" required onchange="updateDriverBusOptions()">
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        </div>
      ` : `
        <input type="hidden" id="driver-school-id" value="${user.schoolId}">
      `}

      <div class="form-group">
        <label>Assign Bus</label>
        <select id="driver-bus-id" class="form-control">
          <option value="">Select Bus</option>
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>License Number *</label>
          <input type="text" id="driver-license" class="form-control" required placeholder="e.g. KL01-2019008876">
        </div>
        <div class="form-group">
          <label>License Expiry Date *</label>
          <input type="date" id="driver-expiry" class="form-control" required value="2028-12-31">
        </div>
      </div>

      <!-- Valid License Upload Control -->
      <div class="form-group" style="padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; margin-bottom: 12px;">
        <label style="font-weight: 600; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
          <span><i class="fa-solid fa-id-badge" style="color: var(--color-income); margin-right: 6px;"></i> Valid License Upload</span>
          <span id="driver-license-doc-status" style="font-size: 11.5px; font-weight: 500; color: #64748b;">No file chosen</span>
        </label>
        <input type="file" id="driver-license-file" class="form-control" style="font-size: 12px; margin-top: 6px;" onchange="handleDriverDocSelect(event, 'license')">
        <input type="hidden" id="driver-license-doc-json" value="">
      </div>

      <!-- PCC Certificate Upload Control -->
      <div class="form-group" style="padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; margin-bottom: 16px;">
        <label style="font-weight: 600; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
          <span><i class="fa-solid fa-file-shield" style="color: var(--color-income); margin-right: 6px;"></i> PCC Upload Certificate</span>
          <span id="driver-pcc-doc-status" style="font-size: 11.5px; font-weight: 500; color: #64748b;">No file chosen</span>
        </label>
        <input type="file" id="driver-pcc-file" class="form-control" style="font-size: 12px; margin-top: 6px;" onchange="handleDriverDocSelect(event, 'pcc')">
        <input type="hidden" id="driver-pcc-doc-json" value="">
      </div>

      <div class="form-group">
        <label>Status *</label>
        <select id="driver-status" class="form-control" required>
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
  updateDriverBusOptions();
}

function updateDriverBusOptions(selectedBusId = null) {
  const schoolSelect = document.getElementById('driver-school-id');
  const busSelect = document.getElementById('driver-bus-id');
  if (!busSelect) return;

  const schoolId = schoolSelect ? Number(schoolSelect.value) : null;
  const availableVehicles = schoolId ? window.db.getVehicles(schoolId) : window.db.getVehicles();

  busSelect.innerHTML = `
    <option value="">Select Bus</option>
    ${availableVehicles.map(v => `<option value="${v.id}" ${Number(selectedBusId) === Number(v.id) ? 'selected' : ''}>${escapeHTML(v.busNo)} (${escapeHTML(v.model || v.type)})</option>`).join('')}
  `;
}

function handleDriverDocSelect(event, docType) {
  const file = event.target.files[0];
  const textEl = document.getElementById(`driver-${docType}-doc-status`);
  const hiddenInput = document.getElementById(`driver-${docType}-doc-json`);
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
    showToast(`Attached ${docType.toUpperCase()} document: ${file.name}`, 'info');
  };
  reader.readAsDataURL(file);
}

function openEditDriverModal(id) {
  const driver = window.db.getDrivers().find(d => d.id === id);
  if (!driver) return;

  openAddDriverModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Driver Details';
  document.getElementById('driver-id-input').value = driver.id;
  document.getElementById('driver-name').value = driver.name;
  if (document.getElementById('driver-dob')) {
    document.getElementById('driver-dob').value = driver.dob || '1990-01-01';
    updateDriverAgeDisplay();
  }
  document.getElementById('driver-license').value = driver.license;
  document.getElementById('driver-phone').value = driver.phone;
  const schoolSelect = document.getElementById('driver-school-id');
  if (schoolSelect) schoolSelect.value = driver.schoolId;
  updateDriverBusOptions(driver.busId);
  if (document.getElementById('driver-experience')) {
    document.getElementById('driver-experience').value = driver.experience || '5 Years';
  }
  document.getElementById('driver-expiry').value = driver.expiry || '';
  document.getElementById('driver-status').value = driver.status || 'Active';

  if (driver.licenseDoc) {
    const hiddenVal = typeof driver.licenseDoc === 'object' ? JSON.stringify(driver.licenseDoc) : driver.licenseDoc;
    if (document.getElementById('driver-license-doc-json')) document.getElementById('driver-license-doc-json').value = hiddenVal;
    if (document.getElementById('driver-license-doc-status')) document.getElementById('driver-license-doc-status').innerText = typeof driver.licenseDoc === 'object' ? driver.licenseDoc.name : 'Attached Document';
  }

  if (driver.pccDoc) {
    const hiddenVal = typeof driver.pccDoc === 'object' ? JSON.stringify(driver.pccDoc) : driver.pccDoc;
    if (document.getElementById('driver-pcc-doc-json')) document.getElementById('driver-pcc-doc-json').value = hiddenVal;
    if (document.getElementById('driver-pcc-doc-status')) document.getElementById('driver-pcc-doc-status').innerText = typeof driver.pccDoc === 'object' ? driver.pccDoc.name : 'Attached Certificate';
  }
}

function saveDriver(event) {
  event.preventDefault();
  const idVal = document.getElementById('driver-id-input').value;
  const name = document.getElementById('driver-name').value.trim();
  const dob = document.getElementById('driver-dob')?.value || '';
  const experience = document.getElementById('driver-experience')?.value || '5 Years';
  const license = document.getElementById('driver-license').value.trim();
  const phone = document.getElementById('driver-phone').value.trim();
  const schoolId = Number(document.getElementById('driver-school-id').value);
  const busId = Number(document.getElementById('driver-bus-id').value) || null;
  const expiry = document.getElementById('driver-expiry').value;
  const status = document.getElementById('driver-status').value;

  const licenseDocStr = document.getElementById('driver-license-doc-json')?.value;
  const pccDocStr = document.getElementById('driver-pcc-doc-json')?.value;

  let licenseDoc = null, pccDoc = null;
  if (licenseDocStr) { try { licenseDoc = JSON.parse(licenseDocStr); } catch (e) { licenseDoc = licenseDocStr; } }
  if (pccDocStr) { try { pccDoc = JSON.parse(pccDocStr); } catch (e) { pccDoc = pccDocStr; } }

  const data = window.db.getData();

  if (idVal) {
    const idx = data.drivers.findIndex(d => d.id === Number(idVal));
    if (idx !== -1) {
      data.drivers[idx] = {
        ...data.drivers[idx],
        name,
        dob,
        experience,
        license,
        phone,
        schoolId,
        busId,
        expiry,
        status,
        licenseDoc: licenseDoc || data.drivers[idx].licenseDoc,
        pccDoc: pccDoc || data.drivers[idx].pccDoc
      };
      showToast('Driver details updated', 'success');
    }
  } else {
    data.drivers.push({ id: Date.now(), name, dob, experience, license, phone, schoolId, busId, expiry, status, licenseDoc, pccDoc });
    showToast('New driver registered successfully', 'success');
  }

  // Automatic data propagation to assigned Vehicle and Route records
  if (busId && data.vehicles) {
    const veh = data.vehicles.find(v => v.id === busId);
    if (veh) {
      veh.driver = name;
      veh.schoolId = schoolId;
    }
    // Clear old vehicle assignment if driver switched bus
    data.vehicles.forEach(v => {
      if (v.id !== busId && v.driver === name) {
        v.driver = 'Unassigned';
      }
    });
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderDriversPage();
  if (typeof renderDashboard === 'function') renderDashboard();
}

function deleteDriver(id) {
  const numId = Number(id);
  const driverObj = window.db.getDrivers().find(d => d.id === numId);
  const dName = driverObj ? driverObj.name : 'Driver';

  confirmDeleteModal({
    contentName: dName,
    entityType: 'Driver',
    onConfirm: () => {
      const data = window.db.getData();
      if (driverObj) {
        if (data.vehicles) {
          data.vehicles.forEach(v => {
            if (v.driver === driverObj.name || v.id === driverObj.busId) {
              v.driver = 'Unassigned';
            }
          });
        }
        if (data.routes) {
          data.routes.forEach(r => {
            if (r.driverId === numId || r.driverName === driverObj.name) {
              r.driverId = null;
              r.driverName = 'No Driver Assigned';
            }
          });
        }
      }

      data.drivers = (data.drivers || []).filter(d => d.id !== numId);
      window.db.saveData(data);
      showToast(`Driver "${dName}" deleted successfully`, 'success');
      renderDriversPage();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

// Global Complete Driver Details View Modal
function openDriverDetailsModal(driverId) {
  const driver = window.db.getDrivers().find(d => d.id === Number(driverId));
  if (!driver) {
    showToast('Driver details not found', 'warning');
    return;
  }

  const school = window.db.getSchools().find(s => s.id === driver.schoolId);
  const bus = window.db.getVehicles().find(v => v.id === driver.busId);
  const ageStr = driver.dob ? calculateAge(driver.dob) : 'N/A';

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerHTML = `<i class="fa-solid fa-id-card" style="color: var(--color-income); margin-right: 6px;"></i> Complete Driver Information — ${escapeHTML(driver.name)}`;

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Full Name</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; white-space: nowrap;" class="driver-name-text">${escapeHTML(driver.name)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Status</span>
          <div style="margin-top: 4px;">
            <span class="badge ${driver.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${driver.status}</span>
          </div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date of Birth (DOB)</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${formatDate(driver.dob)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Auto-Calculated Age</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><span class="badge badge-neutral">${ageStr}</span></div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Experience</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;"><span class="badge badge-paid">${escapeHTML(driver.experience || '5 Years')}</span></div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Mobile Phone</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;" class="phone-no-text">${escapeHTML(driver.phone)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>

        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Driving License No</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;"><code class="license-no-text">${escapeHTML(driver.license)}</code></div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">License Expiry Date</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${formatDate(driver.expiry)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Vehicle</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px; white-space: nowrap;" class="bus-no-text">${escapeHTML(bus ? bus.busNo : 'Unassigned')}</div>
        </div>
      </div>

      <!-- Driver Documents Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
          <div>
            <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-bottom: 4px;"><i class="fa-solid fa-id-badge" style="color: var(--color-income); margin-right: 6px;"></i> Driving License Document</strong>
            <span style="font-size: 12px; color: #64748b;">${driver.licenseDoc ? (typeof driver.licenseDoc === 'object' ? escapeHTML(driver.licenseDoc.name) : 'License document attached') : 'No license document uploaded'}</span>
          </div>
          ${driver.licenseDoc ? `
            <button class="btn-sm btn-primary" onclick="openDocumentViewerModal(window.db.getDrivers().find(d => d.id === ${driver.id})?.licenseDoc)">
              <i class="fa-solid fa-eye"></i> View Document
            </button>
          ` : `<span style="font-size: 12px; color: #94a3b8;">No File</span>`}
        </div>

        <div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
          <div>
            <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-bottom: 4px;"><i class="fa-solid fa-file-shield" style="color: var(--color-income); margin-right: 6px;"></i> PCC Certificate</strong>
            <span style="font-size: 12px; color: #64748b;">${driver.pccDoc ? (typeof driver.pccDoc === 'object' ? escapeHTML(driver.pccDoc.name) : 'PCC Certificate attached') : 'No PCC certificate uploaded'}</span>
          </div>
          ${driver.pccDoc ? `
            <button class="btn-sm btn-primary" onclick="openDocumentViewerModal(window.db.getDrivers().find(d => d.id === ${driver.id})?.pccDoc)">
              <i class="fa-solid fa-eye"></i> View Document
            </button>
          ` : `<span style="font-size: 12px; color: #94a3b8;">No File</span>`}
        </div>
      </div>

    </div>

    <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 20px;">
      <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Close Details</button>
    </div>
  `;

  openModal('generic-modal');
}

window.renderDriversPage = renderDriversPage;
window.openAddDriverModal = openAddDriverModal;
window.openEditDriverModal = openEditDriverModal;
window.saveDriver = saveDriver;
window.deleteDriver = deleteDriver;
window.openDriverDetailsModal = openDriverDetailsModal;
window.updateDriverAgeDisplay = updateDriverAgeDisplay;
window.updateDriverBusOptions = updateDriverBusOptions;
window.handleDriverDocSelect = handleDriverDocSelect;
