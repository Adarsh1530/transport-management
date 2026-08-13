/* ==========================================
   ATTENDANTS MANAGEMENT MODULE
   ========================================== */

function renderAttendantsPage() {
  const user = window.auth.getCurrentUser();
  if (!user) return;
  const container = document.getElementById('attendants-view');
  if (!container) return;

  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const attendants = window.db.getAttendants(isSchoolUser ? schoolId : null);
  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="attendant-search-input" class="form-control" placeholder="Search attendant name or phone..." oninput="filterAttendantsTable()">
        </div>

        ${!isSchoolUser ? `
          <select id="attendant-school-filter" class="form-control" style="width: auto;" onchange="filterAttendantsTable()">
            <option value="">All Schools</option>
            ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div>
        <button class="btn-primary" onclick="openAddAttendantModal()">
          <i class="fa-solid fa-plus"></i> Add New Attendant
        </button>
      </div>
    </div>

    <div class="card" style="padding: 20px;">
      <div class="table-container">
        <table class="custom-table" id="attendants-table">
          <thead>
            <tr>
              <th>Attendant Name</th>
              <th>Phone Number</th>
              ${!isSchoolUser ? '<th>School</th>' : ''}
              <th>Assigned Bus</th>
              <th>Age</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="attendants-tbody">
            ${renderAttendantRows(attendants, !isSchoolUser)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAttendantRows(attendants, showSchoolCol = true) {
  if (!attendants || !attendants.length) {
    const colSpan = showSchoolCol ? 8 : 7;
    return `<tr><td colspan="${colSpan}" class="empty-state">No attendant records found.</td></tr>`;
  }

  const schools = window.db.getSchools();
  const vehicles = window.db.getVehicles();

  return attendants.map(a => {
    const school = schools.find(s => s.id === a.schoolId);
    const bus = vehicles.find(v => v.id === a.busId);
    const ageDisplay = a.dob ? calculateAge(a.dob) : (a.age ? `${a.age} Years` : 'N/A');

    return `
      <tr class="table-row">
        <td><strong class="driver-name-text" style="color: #0f172a; cursor: pointer; white-space: nowrap;" onclick="openAttendantDetailsModal(${a.id})">${escapeHTML(a.name)}</strong></td>
        <td><span class="phone-no-text" style="white-space: nowrap;">${escapeHTML(a.phone)}</span></td>
        ${showSchoolCol ? `<td>${escapeHTML(school ? school.name : 'N/A')}</td>` : ''}
        <td><span class="bus-no-text" style="white-space: nowrap;">${escapeHTML(bus ? bus.busNo : 'Unassigned')}</span></td>
        <td><span class="badge badge-neutral">${escapeHTML(ageDisplay)}</span></td>
        <td><span style="font-weight: 600; color: #475569;">${escapeHTML(a.experience || 'N/A')}</span></td>
        <td><span class="badge ${a.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${a.status || 'Active'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="icon-btn" title="View Attendant Details" onclick="openAttendantDetailsModal(${a.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="icon-btn" title="Edit Attendant" onclick="openEditAttendantModal(${a.id})"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="icon-btn delete" title="Delete Attendant" onclick="deleteAttendant(${a.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAttendantsTable() {
  const user = window.auth.getCurrentUser();
  if (!user) return;
  const isSchoolUser = user.role === 'School';
  const schoolId = user.schoolId;

  const query = document.getElementById('attendant-search-input')?.value.toLowerCase().trim() || '';
  const schoolFilter = document.getElementById('attendant-school-filter')?.value || '';

  let list = window.db.getAttendants(isSchoolUser ? schoolId : null);

  if (query) {
    list = list.filter(a =>
      (a.name && a.name.toLowerCase().includes(query)) ||
      (a.phone && a.phone.includes(query))
    );
  }

  if (schoolFilter && !isSchoolUser) {
    list = list.filter(a => a.schoolId === Number(schoolFilter));
  }

  const tbody = document.getElementById('attendants-tbody');
  if (tbody) tbody.innerHTML = renderAttendantRows(list, !isSchoolUser);
}

function updateAttendantBusOptions() {
  const schoolSelect = document.getElementById('attendant-school-id');
  const busSelect = document.getElementById('attendant-bus-id');
  if (!schoolSelect || !busSelect) return;

  const schoolId = Number(schoolSelect.value);
  const vehicles = window.db.getVehicles(schoolId);

  busSelect.innerHTML = `
    <option value="">Unassigned (No Bus)</option>
    ${vehicles.map(v => `<option value="${v.id}">${escapeHTML(v.busNo)} (${escapeHTML(v.model || v.type)})</option>`).join('')}
  `;
}

function openAddAttendantModal() {
  const user = window.auth.getCurrentUser();
  if (!user) return;
  const isSchoolUser = user.role === 'School';
  const schools = window.db.getSchools();

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerText = 'Add New Attendant';

  body.innerHTML = `
    <form id="attendant-form" onsubmit="saveAttendant(event)">
      <input type="hidden" id="attendant-id-input" value="">

      <div class="form-group">
        <label>Attendant Full Name *</label>
        <input type="text" id="attendant-name" class="form-control" required placeholder="Enter full name (e.g. Soman P)">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 120px 1fr; gap: 12px;">
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="attendant-dob" class="form-control" onchange="calculateAttendantAgeDisplay()">
        </div>
        <div class="form-group">
          <label>Calculated Age</label>
          <input type="text" id="attendant-age-display" class="form-control" readonly style="background: #f1f5f9; font-weight: 700; text-align: center; color: #0f172a;" value="N/A">
        </div>
        <div class="form-group">
          <label>Total Experience</label>
          <select id="attendant-experience" class="form-control">
            <option value="Below 1 Year">Below 1 Year</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3-5 Years" selected>3-5 Years</option>
            <option value="5-10 Years">5-10 Years</option>
            <option value="10+ Years">10+ Years</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Phone / Contact Number *</label>
        <input type="text" id="attendant-phone" class="form-control" required placeholder="+91 98470 12345">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${!isSchoolUser ? `
          <div class="form-group">
            <label>Assign to School *</label>
            <select id="attendant-school-id" class="form-control" required onchange="updateAttendantBusOptions()">
              ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('')}
            </select>
          </div>
        ` : `
          <input type="hidden" id="attendant-school-id" value="${user.schoolId}">
        `}

        <div class="form-group" style="${isSchoolUser ? 'grid-column: span 2;' : ''}">
          <label>Assign Bus</label>
          <select id="attendant-bus-id" class="form-control">
            <option value="">Unassigned (No Bus)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Address / Residential Location</label>
        <input type="text" id="attendant-address" class="form-control" placeholder="e.g. Kowdiar, Thiruvananthapuram">
      </div>

      <div class="form-group">
        <label>Status *</label>
        <select id="attendant-status" class="form-control" required>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      <!-- ID Proof Upload Control -->
      <div class="form-group" style="padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px;">
        <label style="font-weight: 600; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
          <span><i class="fa-solid fa-address-card" style="color: var(--color-income); margin-right: 6px;"></i> ID Proof Document Upload</span>
          <span id="attendant-doc-status" style="font-size: 11.5px; font-weight: 500; color: #64748b;">No file chosen</span>
        </label>
        <input type="file" id="attendant-doc-file" class="form-control" style="font-size: 12px; margin-top: 6px;" onchange="handleAttendantDocSelect(event)">
        <input type="hidden" id="attendant-doc-json" value="">
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Save Attendant</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
  updateAttendantBusOptions();
}

function calculateAttendantAgeDisplay() {
  const dobVal = document.getElementById('attendant-dob')?.value;
  const ageEl = document.getElementById('attendant-age-display');
  if (!ageEl) return;
  if (dobVal) {
    ageEl.value = calculateAge(dobVal);
  } else {
    ageEl.value = 'N/A';
  }
}

function handleAttendantDocSelect(event) {
  const file = event.target.files[0];
  const statusEl = document.getElementById('attendant-doc-status');
  const hiddenInput = document.getElementById('attendant-doc-json');
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

function openEditAttendantModal(id) {
  const attendant = window.db.getAttendants().find(a => a.id === Number(id));
  if (!attendant) return;

  openAddAttendantModal();
  document.getElementById('generic-modal-title').innerText = 'Edit Attendant Details';
  document.getElementById('attendant-id-input').value = attendant.id;
  document.getElementById('attendant-name').value = attendant.name;
  if (document.getElementById('attendant-dob')) {
    document.getElementById('attendant-dob').value = attendant.dob || '';
    calculateAttendantAgeDisplay();
  }
  if (document.getElementById('attendant-experience')) document.getElementById('attendant-experience').value = attendant.experience || '3-5 Years';
  document.getElementById('attendant-phone').value = attendant.phone;
  
  const schoolSelect = document.getElementById('attendant-school-id');
  if (schoolSelect) schoolSelect.value = attendant.schoolId;
  updateAttendantBusOptions();

  if (document.getElementById('attendant-bus-id')) document.getElementById('attendant-bus-id').value = attendant.busId || '';
  if (document.getElementById('attendant-address')) document.getElementById('attendant-address').value = attendant.address || '';
  document.getElementById('attendant-status').value = attendant.status || 'Active';

  if (attendant.doc) {
    const hiddenInput = document.getElementById('attendant-doc-json');
    const statusEl = document.getElementById('attendant-doc-status');
    if (hiddenInput) hiddenInput.value = typeof attendant.doc === 'object' ? JSON.stringify(attendant.doc) : attendant.doc;
    if (statusEl) statusEl.innerText = typeof attendant.doc === 'object' ? attendant.doc.name : 'Document attached';
  }
}

function saveAttendant(event) {
  event.preventDefault();
  const idVal = document.getElementById('attendant-id-input').value;
  const name = document.getElementById('attendant-name').value.trim();
  const dob = document.getElementById('attendant-dob')?.value || '';
  const experience = document.getElementById('attendant-experience')?.value || '3-5 Years';
  const phone = document.getElementById('attendant-phone').value.trim();
  const schoolId = Number(document.getElementById('attendant-school-id').value);
  const busId = Number(document.getElementById('attendant-bus-id').value) || null;
  const address = document.getElementById('attendant-address')?.value.trim() || '';
  const status = document.getElementById('attendant-status').value;

  const docJsonStr = document.getElementById('attendant-doc-json')?.value;
  let docObj = null;
  if (docJsonStr) {
    try {
      docObj = JSON.parse(docJsonStr);
    } catch (e) {
      docObj = docJsonStr;
    }
  }

  const data = window.db.getData();
  if (!data.attendants) data.attendants = [];

  if (idVal) {
    const idx = data.attendants.findIndex(a => a.id === Number(idVal));
    if (idx !== -1) {
      data.attendants[idx] = {
        ...data.attendants[idx],
        name,
        dob,
        experience,
        phone,
        schoolId,
        busId,
        address,
        status,
        doc: docObj || data.attendants[idx].doc
      };
      showToast(`Attendant ${name} details updated successfully`, 'success');
    }
  } else {
    data.attendants.push({
      id: Date.now(),
      name,
      dob,
      experience,
      phone,
      schoolId,
      busId,
      address,
      status,
      doc: docObj
    });
    showToast(`Attendant ${name} added successfully`, 'success');
  }

  // Automatic data propagation to assigned Vehicle record
  if (busId && data.vehicles) {
    const veh = data.vehicles.find(v => v.id === busId);
    if (veh) {
      veh.attendant = name;
      veh.schoolId = schoolId;
    }
  }

  window.db.saveData(data);
  closeModal('generic-modal');
  renderAttendantsPage();
  if (typeof updateVehicleDriverDropdownBySchool === 'function') {
    updateVehicleDriverDropdownBySchool();
  }
}

function deleteAttendant(id) {
  const numId = Number(id);
  const attendantObj = window.db.getAttendants().find(a => a.id === numId);
  const aName = attendantObj ? attendantObj.name : 'Attendant';

  confirmDeleteModal({
    contentName: aName,
    entityType: 'Attendant',
    onConfirm: () => {
      const data = window.db.getData();
      if (attendantObj && data.vehicles) {
        data.vehicles.forEach(v => {
          if (v.attendant === attendantObj.name || v.id === attendantObj.busId) {
            v.attendant = 'Unassigned';
          }
        });
      }

      data.attendants = (data.attendants || []).filter(a => a.id !== numId);
      window.db.saveData(data);
      showToast(`Attendant "${aName}" deleted successfully`, 'info');
      renderAttendantsPage();
      if (typeof updateVehicleDriverDropdownBySchool === 'function') {
        updateVehicleDriverDropdownBySchool();
      }
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  });
}

function openAttendantDetailsModal(id) {
  const attendant = window.db.getAttendants().find(a => a.id === Number(id));
  if (!attendant) return;

  const school = window.db.getSchools().find(s => s.id === attendant.schoolId);
  const bus = window.db.getVehicles().find(v => v.id === attendant.busId);
  const ageDisplay = attendant.dob ? calculateAge(attendant.dob) : 'N/A';

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  title.innerHTML = `<i class="fa-solid fa-user-shield" style="color: var(--color-income); margin-right: 6px;"></i> Attendant Profile — ${escapeHTML(attendant.name)}`;

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Attendant Name</span>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;" class="driver-name-text">${escapeHTML(attendant.name)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Contact Number</span>
          <div style="font-size: 15px; font-weight: 700; color: var(--color-income); margin-top: 2px;" class="phone-no-text">${escapeHTML(attendant.phone)}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Campus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(school ? school.name : 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Assigned Bus</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;" class="bus-no-text">${escapeHTML(bus ? bus.busNo : 'Unassigned')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date of Birth & Age</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${formatDate(attendant.dob)} (${ageDisplay})</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Experience</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(attendant.experience || 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Residential Address</span>
          <div style="font-weight: 600; color: #1e293b; margin-top: 2px;">${escapeHTML(attendant.address || 'N/A')}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Status</span>
          <div style="margin-top: 4px;">
            <span class="badge ${attendant.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${attendant.status || 'Active'}</span>
          </div>
        </div>
      </div>

      <div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fa-solid fa-file-contract" style="font-size: 24px; color: var(--color-income);"></i>
          <div>
            <strong style="font-size: 13.5px; color: #0f172a; display: block;">ID Proof / Registration Verification</strong>
            <span style="font-size: 12px; color: #64748b;">${attendant.doc ? (typeof attendant.doc === 'object' ? escapeHTML(attendant.doc.name) : 'Verification Document attached') : 'No ID document uploaded'}</span>
          </div>
        </div>
        ${attendant.doc ? `
          <button class="btn-sm btn-primary" onclick="openDocumentViewerModal(window.db.getAttendants().find(a => a.id === ${attendant.id})?.doc)">
            <i class="fa-solid fa-eye"></i> View Document
          </button>
        ` : `<span style="font-size: 12px; color: #94a3b8;">No Document</span>`}
      </div>

      <div class="modal-footer" style="padding-top: 0;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')">Close Profile</button>
      </div>
    </div>
  `;

  openModal('generic-modal');
}

window.renderAttendantsPage = renderAttendantsPage;
window.filterAttendantsTable = filterAttendantsTable;
window.updateAttendantBusOptions = updateAttendantBusOptions;
window.openAddAttendantModal = openAddAttendantModal;
window.calculateAttendantAgeDisplay = calculateAttendantAgeDisplay;
window.handleAttendantDocSelect = handleAttendantDocSelect;
window.openEditAttendantModal = openEditAttendantModal;
window.saveAttendant = saveAttendant;
window.deleteAttendant = deleteAttendant;
window.openAttendantDetailsModal = openAttendantDetailsModal;
