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

  const icon = document.createElement('i');
  icon.className = `fa-solid ${iconClass}`;
  const span = document.createElement('span');
  span.textContent = message;
  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  toast.appendChild(icon);
  toast.appendChild(span);
  toast.appendChild(progress);

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
    if (modalId === 'generic-modal') {
      setTimeout(() => {
        if (!modal.classList.contains('active')) {
          const bodyEl = document.getElementById('generic-modal-body');
          if (bodyEl) bodyEl.innerHTML = '';
        }
      }, 200);
    }
  }
}

// Confirmation Modal for Deletion Requirements
function confirmDeleteModal({ contentName, entityType = 'Item', onConfirm }) {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #dc2626; margin-right: 8px;"></i> Confirm Permanent Deletion`;

  body.innerHTML = `
    <div style="padding: 4px 0;">
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; line-height: 1.4;">
        Are you sure you want to permanently delete “<span style="color: #dc2626;">${escapeHTML(contentName)}</span>”?
      </div>
      
      <p style="font-size: 13px; color: #475569; margin-bottom: 16px; font-weight: 500;">
        Confirm the <strong>${escapeHTML(contentName)}</strong> before deletion.
      </p>

      <form onsubmit="handleConfirmDeleteSubmit(event)">
        <div class="form-group" style="margin-bottom: 20px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 6px; font-size: 12px;">
            ${escapeHTML(contentName)}
          </label>
          <input type="text" id="confirm-delete-input" class="form-control" style="font-size: 13px; padding: 8px 12px; font-weight: 600;" placeholder="Type/enter the ${escapeHTML(contentName)} here to confirm deletion" autocomplete="off">
          <div id="confirm-delete-error" style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 6px; display: none;"></div>
        </div>

        <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')" style="width: auto; padding: 8px 18px;">Cancel</button>
          <button type="submit" id="confirm-delete-submit-btn" class="btn-danger" style="width: auto; padding: 8px 18px; background: #dc2626; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Delete</button>
        </div>
      </form>
    </div>
  `;

  window._activeDeleteAction = () => {
    const inputVal = document.getElementById('confirm-delete-input')?.value || '';
    if (inputVal.trim().toLowerCase() === contentName.trim().toLowerCase()) {
      closeModal('generic-modal');
      onConfirm();
    } else {
      const errEl = document.getElementById('confirm-delete-error');
      if (errEl) {
        errEl.innerText = `Incorrect confirmation name. Please enter "${contentName}" to confirm deletion.`;
        errEl.style.display = 'block';
      }
      showToast(`Please enter "${contentName}" to confirm deletion.`, 'warning');
    }
  };

  openModal('generic-modal');

  setTimeout(() => {
    const inputEl = document.getElementById('confirm-delete-input');
    if (inputEl) inputEl.focus();
  }, 150);
}

function handleConfirmDeleteSubmit(event) {
  if (event) event.preventDefault();
  if (typeof window._activeDeleteAction === 'function') {
    window._activeDeleteAction();
  }
}

window.confirmDeleteModal = confirmDeleteModal;
window.handleConfirmDeleteSubmit = handleConfirmDeleteSubmit;

// Standard Item Deletion Confirmation Modal
function showDeleteConfirmationModal({ itemTitle = '', onConfirm }) {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-trash-can" style="color: #dc2626; margin-right: 8px;"></i> Delete Confirmation`;

  body.innerHTML = `
    <div style="padding: 4px 0;">
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.4;">
        Are you sure you want to delete this item? ${itemTitle ? `<span style="font-size: 13px; color: #64748b; font-weight: 600; display: block; margin-top: 4px;">(${escapeHTML(itemTitle)})</span>` : ''}
      </div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        This action cannot be undone.
      </p>

      <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')" style="width: auto; padding: 8px 20px; font-weight: 600;">Cancel</button>
        <button type="button" id="confirm-std-delete-btn" class="btn-danger" style="width: auto; padding: 8px 20px; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Delete</button>
      </div>
    </div>
  `;

  openModal('generic-modal');

  const btn = document.getElementById('confirm-std-delete-btn');
  if (btn) {
    btn.onclick = () => {
      closeModal('generic-modal');
      if (typeof onConfirm === 'function') onConfirm();
    };
  }
}

// Reset to Default Confirmation Modal
function showResetDefaultModal({ onConfirm }) {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-rotate-left" style="color: #0284c7; margin-right: 8px;"></i> Reset to Default`;

  body.innerHTML = `
    <div style="padding: 4px 0;">
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.4;">
        Are you sure you want to reset to the default settings?
      </div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
        Your current changes will be lost.
      </p>

      <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')" style="width: auto; padding: 8px 20px; font-weight: 600;">Cancel</button>
        <button type="button" id="confirm-reset-default-btn" class="btn-primary" style="width: auto; padding: 8px 20px; background: #0284c7; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">Reset to Default</button>
      </div>
    </div>
  `;

  openModal('generic-modal');

  const btn = document.getElementById('confirm-reset-default-btn');
  if (btn) {
    btn.onclick = () => {
      closeModal('generic-modal');
      if (typeof onConfirm === 'function') onConfirm();
    };
  }
}

// Reset All Data Confirmation Modal
function showResetAllDataModal({ onConfirm }) {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #dc2626; margin-right: 8px;"></i> Reset All Data`;

  body.innerHTML = `
    <div style="padding: 4px 0;">
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px; line-height: 1.4;">
        Are you sure you want to reset all data?
      </div>
      <p style="font-size: 13.5px; color: #dc2626; margin-bottom: 20px; font-weight: 600;">
        This action will permanently delete all entered data and cannot be undone.
      </p>

      <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')" style="width: auto; padding: 8px 20px; font-weight: 700;">Cancel</button>
        <button type="button" id="confirm-reset-all-btn" class="btn-danger" style="width: auto; padding: 8px 20px; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; cursor: pointer;">Reset All Data</button>
      </div>
    </div>
  `;

  openModal('generic-modal');

  const btn = document.getElementById('confirm-reset-all-btn');
  if (btn) {
    btn.onclick = () => {
      closeModal('generic-modal');
      if (typeof onConfirm === 'function') onConfirm();
    };
  }
}

window.showDeleteConfirmationModal = showDeleteConfirmationModal;
window.showResetDefaultModal = showResetDefaultModal;
window.showResetAllDataModal = showResetAllDataModal;

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

  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  const processRow = function (row) {
    row = Array.isArray(row) ? row : [row];
    let finalVal = '';
    for (let j = 0; j < columnCount; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      // Prevent Excel formula execution for imported user-entered text.
      if (/^[=+\-@]/.test(innerValue.trim())) innerValue = `'${innerValue}`;
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\r\n';
  };

  // UTF-8 BOM and separator directive ensure Excel opens Indian currency,
  // Malayalam/Unicode names, commas, and aligned columns correctly.
  let csvFile = '\uFEFFsep=,\r\n';
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

// Generate printable HTML report
function exportFilteredReportToPDF(title, columns, rows, finalTotal) {
  let html = `
    <div style="font-family: sans-serif; padding: 20px; color: #000;">
      <h2 style="text-align: center; margin-bottom: 20px;">${escapeHTML(title)}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr>
            ${columns.map(col => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${escapeHTML(col)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td style="border: 1px solid #ddd; padding: 8px;">${escapeHTML(String(cell !== null && cell !== undefined ? cell : ''))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="${columns.length - 1}" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Final Total:</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">₹${Number(finalTotal).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        </tfoot>
      </table>
      <div style="text-align: right; font-size: 12px; color: #555;">
        Generated on: ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  let printContainer = document.getElementById('report-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'report-print-container';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = html;
  document.body.classList.add('printing-statement-active');
  
  // Add print styles dynamically if not present
  if (!document.getElementById('print-report-style')) {
    const style = document.createElement('style');
    style.id = 'print-report-style';
    style.innerHTML = `
      @media print {
        body > *:not(.printing-statement-active):not(#report-print-container) { display: none !important; }
        #report-print-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
        @page { margin: 10mm; }
      }
    `;
    document.head.appendChild(style);
  }

  window.print();
  
  setTimeout(() => {
    document.body.classList.remove('printing-statement-active');
    printContainer.innerHTML = '';
  }, 500);
}

function exportFilteredReportToExcel(filename, columns, rows, finalTotal) {
  const csvRows = [];
  csvRows.push(columns);
  
  rows.forEach(row => {
    csvRows.push(row);
  });
  
  // Add total row
  const totalRow = new Array(columns.length).fill('');
  totalRow[columns.length - 2] = 'Final Total:';
  totalRow[columns.length - 1] = Number(finalTotal);
  csvRows.push(totalRow);
  
  exportToCSV(filename, csvRows);
}


function normalizeExcelFilename(filename) {
  const base = String(filename || 'Report')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\.(csv|xls|xlsx)$/i, '');
  return `${base}.xls`;
}

function excelText(value) {
  if (value === null || value === undefined || value === '') return '';
  return escapeHTML(String(value));
}

function excelNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function excelCell(value, type = 'text') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { type, ...value };
  }
  return { value, type };
}

function renderExcelCell(cell, column = {}, tag = 'td') {
  const normalized = excelCell(cell, column.type || 'text');
  const type = normalized.type || column.type || 'text';
  const align = normalized.align || column.align || '';
  const colspan = normalized.colspan ? ` colspan="${Number(normalized.colspan)}"` : '';
  const extraClass = normalized.className ? ` ${normalized.className}` : '';
  const cssClass = `excel-${type}${align ? ` text-${align}` : ''}${extraClass}`;
  let value = normalized.value;

  if (type === 'currency' || type === 'number' || type === 'decimal' || type === 'percent') {
    value = excelNumber(value);
  } else if (type === 'date' && value) {
    value = formatDate(value);
  } else {
    value = excelText(value);
  }

  return `<${tag} class="${cssClass}"${colspan}>${value}</${tag}>`;
}

function renderExcelSection(section, index) {
  const columns = section.columns || [];
  const columnCount = Math.max(columns.length, 1);
  const rows = section.rows || [];
  const notes = section.notes || [];

  const colgroup = columns.length
    ? `<colgroup>${columns.map(col => `<col style="width:${Number(col.width || 120)}px;">`).join('')}</colgroup>`
    : '';

  const header = columns.length
    ? `<tr>${columns.map(col => renderExcelCell({ value: col.label, type: 'header', align: col.align }, col, 'th')).join('')}</tr>`
    : '';

  return `
    <table class="excel-section-table">
      ${colgroup}
      <tr>
        <td class="excel-section-title" colspan="${columnCount}">
          ${index + 1}. ${excelText(section.title || 'Report Section')}
        </td>
      </tr>
      ${section.subtitle ? `<tr><td class="excel-section-subtitle" colspan="${columnCount}">${excelText(section.subtitle)}</td></tr>` : ''}
      ${notes.map(note => `<tr><td class="excel-note" colspan="${columnCount}">${excelText(note)}</td></tr>`).join('')}
      ${header}
      ${rows.length ? rows.map(row => {
        const cells = Array.isArray(row) ? row : (row.cells || []);
        const rowClass = row && row.className ? ` class="${row.className}"` : '';
        return `<tr${rowClass}>${columns.map((col, cellIndex) => renderExcelCell(cells[cellIndex], col)).join('')}</tr>`;
      }).join('') : `<tr><td class="excel-muted" colspan="${columnCount}">No records found</td></tr>`}
    </table>
  `;
}

function buildProfessionalExcelReportHTML(config = {}) {
  const title = excelText(config.title || 'Professional Report');
  const subtitle = excelText(config.subtitle || '');
  const generatedOn = excelText(config.generatedOn || new Date().toLocaleString());
  const metaRows = config.metaRows || [];
  const summaryCards = config.summaryCards || [];
  const sections = config.sections || [];

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:HorizontalResolution>600</x:HorizontalResolution>
                    <x:VerticalResolution>600</x:VerticalResolution>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
          .excel-sheet { width: 1120px; }
          .excel-title { background: #0f172a; color: #ffffff; font-size: 22px; font-weight: 700; text-align: center; padding: 18px; border: 1px solid #0f172a; }
          .excel-subtitle { color: #475569; font-size: 12px; text-align: center; padding: 8px; border: 1px solid #cbd5e1; }
          .excel-meta-label { width: 180px; background: #e2e8f0; color: #334155; font-weight: 700; padding: 8px; border: 1px solid #cbd5e1; }
          .excel-meta-value { width: 380px; padding: 8px; border: 1px solid #cbd5e1; }
          .excel-card-label { background: #eff6ff; color: #1e3a8a; font-weight: 700; text-align: center; padding: 8px; border: 1px solid #bfdbfe; }
          .excel-card-value { font-size: 16px; font-weight: 700; text-align: center; padding: 10px; border: 1px solid #bfdbfe; }
          .excel-section-table { border-collapse: collapse; width: 1120px; margin-top: 16px; }
          .excel-section-title { background: #1e3a8a; color: #ffffff; font-size: 15px; font-weight: 700; padding: 10px; border: 1px solid #1e3a8a; }
          .excel-section-subtitle, .excel-note { background: #f8fafc; color: #64748b; font-size: 11px; padding: 7px; border: 1px solid #cbd5e1; }
          th.excel-header { background: #dbeafe; color: #0f172a; font-weight: 700; text-align: center; padding: 8px; border: 1px solid #94a3b8; }
          td { padding: 7px; border: 1px solid #cbd5e1; vertical-align: middle; }
          .excel-label { background: #f8fafc; font-weight: 700; color: #334155; }
          .excel-text { mso-number-format:"\\@"; }
          .excel-number { mso-number-format:"#,##0"; text-align: right; }
          .excel-decimal { mso-number-format:"#,##0.00"; text-align: right; }
          .excel-currency { mso-number-format:"INR #,##0.00"; text-align: right; }
          .excel-percent { mso-number-format:"0.00%"; text-align: right; }
          .excel-date { mso-number-format:"dd-mmm-yyyy"; text-align: center; }
          .excel-total td, tr.excel-total td { background: #ecfdf5; font-weight: 700; color: #065f46; }
          .excel-warning td, tr.excel-warning td { background: #fff7ed; font-weight: 700; color: #9a3412; }
          .excel-muted { color: #64748b; text-align: center; padding: 12px; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <table class="excel-sheet" cellspacing="0" cellpadding="0">
          <tr><td class="excel-title" colspan="6">${title}</td></tr>
          ${subtitle ? `<tr><td class="excel-subtitle" colspan="6">${subtitle}</td></tr>` : ''}
          <tr><td class="excel-meta-label">Generated On</td><td class="excel-meta-value" colspan="5">${generatedOn}</td></tr>
          ${metaRows.map(row => `
            <tr>
              <td class="excel-meta-label">${excelText(row.label)}</td>
              <td class="excel-meta-value" colspan="5">${excelText(row.value)}</td>
            </tr>
          `).join('')}
          ${summaryCards.length ? `
            <tr>${summaryCards.map(card => `<td class="excel-card-label">${excelText(card.label)}</td>`).join('')}</tr>
            <tr>${summaryCards.map(card => renderExcelCell({ value: card.value, type: card.type || 'text', className: 'excel-card-value' })).join('')}</tr>
          ` : ''}
        </table>
        ${sections.map(renderExcelSection).join('')}
      </body>
    </html>
  `;
}

function exportProfessionalExcelReport(filename, config) {
  const safeFilename = normalizeExcelFilename(filename);
  const html = buildProfessionalExcelReportHTML(config);
  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', safeFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Professional Excel report generated successfully', 'success');
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

  const safeDateStr = formatDate(rawDateStr);
  body.innerHTML = `
    <form id="custom-duration-form">
      <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px;">
        Specify custom duration (monthly or yearly) starting from <strong>${escapeHTML(safeDateStr)}</strong>:
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
        <button type="button" id="custom-duration-cancel" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary" style="width: auto;">Apply Custom Duration</button>
      </div>
    </form>
  `;

  document.getElementById('custom-duration-cancel').addEventListener('click', () => {
    closeModal('generic-modal');
    resetDurationSelect(durationSelectIdOrVal);
  });

  document.getElementById('custom-duration-form').addEventListener('submit', (event) => {
    applyCustomDuration(event, dateInputId, durationSelectIdOrVal, tagId);
  });

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

// Calculate Age from Date of Birth
function calculateAge(dobString) {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} Years` : '';
}

// Universal Document Preview / Download Modal Viewer
function openDocumentViewerModal(docObj) {
  if (!docObj) {
    showToast('No document attached to this record', 'warning');
    return;
  }
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  const docName = typeof docObj === 'string' ? docObj : (docObj.name || 'Attached Document');
  const docDataUrl = typeof docObj === 'object' ? (docObj.dataUrl || docObj.data) : null;
  title.innerHTML = `<i class="fa-solid fa-file-lines" style="color: var(--color-income); margin-right: 6px;"></i> Document Preview — ${escapeHTML(docName)}`;

  // Validate docDataUrl is a safe data: or blob: URL — reject javascript: and any other scheme
  const isSafeUrl = (url) => typeof url === 'string' && /^(data:(image\/|application\/pdf)|blob:)/i.test(url);
  const safeDataUrl = isSafeUrl(docDataUrl) ? docDataUrl : null;

  body.innerHTML = '';
  const wrapper = document.createElement('div');

  if (typeof docObj === 'object' && safeDataUrl) {
    if (docObj.type && docObj.type.startsWith('image/')) {
      const imgWrap = document.createElement('div');
      imgWrap.style.cssText = 'text-align:center;max-height:450px;overflow:auto;';
      const img = document.createElement('img');
      img.src = safeDataUrl;
      img.alt = docName;
      img.style.cssText = 'max-width:100%;border-radius:8px;border:1px solid #cbd5e1;';
      imgWrap.appendChild(img);
      wrapper.appendChild(imgWrap);
    } else if (docObj.type === 'application/pdf') {
      const iframe = document.createElement('iframe');
      iframe.src = safeDataUrl;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.style.cssText = 'width:100%;height:450px;border:none;border-radius:8px;';
      wrapper.appendChild(iframe);
    } else {
      const fileSize = docObj.size ? (docObj.size / 1024).toFixed(1) + ' KB' : 'Binary Format';
      wrapper.innerHTML = `<div style="padding:24px;text-align:center;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;">
        <i class="fa-solid fa-file-arrow-down" style="font-size:48px;color:var(--color-income);margin-bottom:12px;"></i>
        <h4 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px;">${escapeHTML(docName)}</h4>
        <p style="font-size:13px;color:#64748b;margin-bottom:16px;">Attached File (${escapeHTML(fileSize)})</p>
      </div>`;
      const dlBtn = document.createElement('a');
      dlBtn.href = safeDataUrl;
      dlBtn.download = docName;
      dlBtn.className = 'btn-primary';
      dlBtn.style.cssText = 'display:inline-flex;width:auto;';
      dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download File';
      wrapper.querySelector('div').appendChild(dlBtn);
    }
  } else {
    wrapper.innerHTML = `<div style="padding:24px;text-align:center;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;">
      <i class="fa-solid fa-file-circle-check" style="font-size:48px;color:var(--color-profit);margin-bottom:12px;"></i>
      <h4 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px;">${escapeHTML(docName)}</h4>
      <p style="font-size:13px;color:#64748b;">Document reference attached to system record.</p>
    </div>`;
  }

  body.appendChild(wrapper);

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:16px 0 0 0;margin-top:20px;';
  footer.className = 'modal-footer';
  if (safeDataUrl) {
    const dlBtn = document.createElement('a');
    dlBtn.href = safeDataUrl;
    dlBtn.download = docName;
    dlBtn.className = 'btn-primary';
    dlBtn.style.width = 'auto';
    dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download File';
    footer.appendChild(dlBtn);
  }
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-secondary';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => closeModal('generic-modal'));
  footer.appendChild(closeBtn);
  body.appendChild(footer);

  openModal('generic-modal');
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
window.exportProfessionalExcelReport = exportProfessionalExcelReport;
window.calculateValidityExpiry = calculateValidityExpiry;
window.openCustomDurationModal = openCustomDurationModal;
window.applyCustomDuration = applyCustomDuration;
window.resetDurationSelect = resetDurationSelect;
window.calculateAge = calculateAge;
window.openDocumentViewerModal = openDocumentViewerModal;


