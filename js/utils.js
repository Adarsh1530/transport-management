/* ==========================================
   UTILITY FUNCTIONS (CURRENCY, DATE, TOASTS)
   ========================================== */

// Indian Currency Formatter (e.g. ₹5,20,000)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Pretty Date Formatter (e.g. 15 Aug 2026)
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

// Dynamic Renewal Status & Days Remaining Calculation
function getRenewalStatus(renewalDateStr) {
  if (!renewalDateStr) {
    return { days: 0, text: 'No Date', badgeClass: 'badge-neutral', urgencyScore: 999 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(renewalDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      text: 'Expired',
      badgeClass: 'badge-expired',
      urgencyScore: 1
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      text: 'Due Today',
      badgeClass: 'badge-due-today',
      urgencyScore: 2
    };
  } else if (diffDays <= 10) {
    return {
      days: diffDays,
      text: `${diffDays} Days Left`,
      badgeClass: 'badge-under-10',
      urgencyScore: 3
    };
  } else if (diffDays <= 30) {
    return {
      days: diffDays,
      text: `${diffDays} Days Left`,
      badgeClass: 'badge-under-30',
      urgencyScore: 4
    };
  } else {
    return {
      days: diffDays,
      text: `${diffDays} Days Left`,
      badgeClass: 'badge-upcoming',
      urgencyScore: 5
    };
  }
}

// Toast Notifications System
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-triangle-exclamation';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px) scale(0.95)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Dialog Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Sanitize HTML string to prevent XSS
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Export Data to CSV
function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    showToast('No data available to export', 'warning');
    return;
  }

  const processRow = function (row) {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  let csvFile = '';
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report generated successfully', 'success');
  }
}

// Calculate Validity Expiry (e.g. 1 Year, 6 Months, 1 Month, or Custom)
function calculateValidityExpiry(dateInputId, durationSelectIdOrVal, tagId) {
  const inputEl = document.getElementById(dateInputId);
  if (!inputEl) return;

  const tagEl = tagId ? document.getElementById(tagId) : null;
  
  let durationVal = '';
  let selEl = null;
  if (typeof durationSelectIdOrVal === 'string' && (durationSelectIdOrVal.startsWith('1_') || durationSelectIdOrVal.startsWith('6_') || durationSelectIdOrVal.startsWith('custom') || durationSelectIdOrVal === '')) {
    durationVal = durationSelectIdOrVal;
  } else if (typeof durationSelectIdOrVal === 'string') {
    selEl = document.getElementById(durationSelectIdOrVal);
    if (selEl) durationVal = selEl.value;
  }

  if (durationVal === 'custom') {
    openCustomDurationModal(dateInputId, durationSelectIdOrVal, tagId);
    return;
  }

  if (!durationVal) {
    delete inputEl.dataset.calculatedExpiry;
    if (tagEl) tagEl.innerHTML = '';
    return;
  }

  const rawDateStr = inputEl.value;
  if (!rawDateStr) {
    delete inputEl.dataset.calculatedExpiry;
    if (tagEl) tagEl.innerHTML = '<span style="color: var(--color-expense); font-size: 11px;">Select date first</span>';
    return;
  }

  let baseDate = new Date(rawDateStr);
  if (isNaN(baseDate.getTime())) {
    delete inputEl.dataset.calculatedExpiry;
    if (tagEl) tagEl.innerHTML = '';
    return;
  }

  const targetDate = new Date(baseDate);
  let textLabel = '1 Year';

  if (durationVal === '1_year') {
    targetDate.setFullYear(targetDate.getFullYear() + 1);
    textLabel = '1 Year';
  } else if (durationVal === '6_months') {
    targetDate.setMonth(targetDate.getMonth() + 6);
    textLabel = '6 Months';
  } else if (durationVal === '1_month') {
    targetDate.setMonth(targetDate.getMonth() + 1);
    textLabel = '1 Month';
  } else if (durationVal.startsWith('custom_')) {
    const parts = durationVal.split('_'); // ['custom', count, unit]
    const count = Number(parts[1]) || 1;
    const unit = parts[2] || 'months';

    if (unit === 'years') {
      targetDate.setFullYear(targetDate.getFullYear() + count);
      textLabel = `${count} Year${count > 1 ? 's' : ''}`;
    } else if (unit === 'months') {
      targetDate.setMonth(targetDate.getMonth() + count);
      textLabel = `${count} Month${count > 1 ? 's' : ''}`;
    } else if (unit === 'days') {
      targetDate.setDate(targetDate.getDate() + count);
      textLabel = `${count} Day${count > 1 ? 's' : ''}`;
    }
  }

  const formattedStr = targetDate.toISOString().split('T')[0];
  inputEl.dataset.calculatedExpiry = formattedStr;

  if (tagEl) {
    tagEl.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="color: var(--color-profit);"></i> Valid Upto: <strong style="color: #0f172a;">${formatDate(formattedStr)}</strong> (${textLabel})`;
  }

  showToast(`End date calculated: ${formatDate(formattedStr)}`, 'info');
}

// Open Custom Duration Modal
function openCustomDurationModal(dateInputId, durationSelectIdOrVal, tagId) {
  const inputEl = document.getElementById(dateInputId);
  const selEl = typeof durationSelectIdOrVal === 'string' ? document.getElementById(durationSelectIdOrVal) : null;
  const rawDateStr = inputEl ? inputEl.value : '';

  if (!rawDateStr) {
    showToast('Please select or enter the renewal start date first', 'warning');
    if (selEl) selEl.value = '';
    return;
  }

  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-clock-rotate-left" style="color: var(--color-income); margin-right: 6px;"></i> Custom Renewal Duration`;

  body.innerHTML = `
    <form id="custom-duration-form" onsubmit="applyCustomDuration(event, '${dateInputId}', '${durationSelectIdOrVal}', '${tagId || ''}')">
      <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px;">
        Specify custom duration (monthly or yearly) starting from <strong>${formatDate(rawDateStr)}</strong>:
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div class="form-group">
          <label>Duration Value *</label>
          <input type="number" id="custom-duration-count" class="form-control" min="1" max="120" value="3" required placeholder="e.g. 3">
        </div>
        <div class="form-group">
          <label>Time Unit *</label>
          <select id="custom-duration-unit" class="form-control" required>
            <option value="months" selected>Months</option>
            <option value="years">Years</option>
            <option value="days">Days</option>
          </select>
        </div>
      </div>

      <div style="padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 16px; font-size: 12.5px; color: #1e40af;">
        <i class="fa-solid fa-circle-info"></i> The calculated end date will automatically update upon application.
      </div>

      <div class="modal-footer" style="padding: 16px 0 0 0;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal'); resetDurationSelect('${durationSelectIdOrVal}');">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Apply Custom Duration</button>
      </div>
    </form>
  `;

  openModal('generic-modal');
}

function resetDurationSelect(durationSelectIdOrVal) {
  const selEl = typeof durationSelectIdOrVal === 'string' ? document.getElementById(durationSelectIdOrVal) : null;
  if (selEl && selEl.value === 'custom') {
    selEl.value = '';
  }
}

function applyCustomDuration(event, dateInputId, durationSelectIdOrVal, tagId) {
  event.preventDefault();
  const count = Number(document.getElementById('custom-duration-count').value) || 1;
  const unit = document.getElementById('custom-duration-unit').value || 'months';

  const customKey = `custom_${count}_${unit}`;

  const selEl = typeof durationSelectIdOrVal === 'string' ? document.getElementById(durationSelectIdOrVal) : null;
  if (selEl) {
    let opt = selEl.querySelector(`option[value="${customKey}"]`);
    if (!opt) {
      opt = document.createElement('option');
      opt.value = customKey;
      let unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
      opt.text = `${count} ${unitLabel} (Custom)`;
      selEl.appendChild(opt);
    }
    selEl.value = customKey;
  }

  closeModal('generic-modal');
  calculateValidityExpiry(dateInputId, customKey, tagId);
}

// Global Exports
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getRenewalStatus = getRenewalStatus;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.escapeHTML = escapeHTML;
window.exportToCSV = exportToCSV;
window.calculateValidityExpiry = calculateValidityExpiry;
window.openCustomDurationModal = openCustomDurationModal;
window.applyCustomDuration = applyCustomDuration;
window.resetDurationSelect = resetDurationSelect;

