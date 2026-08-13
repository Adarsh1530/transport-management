/* ==========================================
   SCHOOL BUS STATEMENT CUSTOM REPORT BUILDER
   Two-Panel Editor: Modules Control & Real-Time Live Preview
   ========================================== */

let currentBuilderSchoolId = null;
let currentBuilderConfig = null;

function initReportBuilder(schoolId = null) {
  const schools = window.db.getSchools();
  if (!schools || schools.length === 0) return;

  if (schoolId) {
    currentBuilderSchoolId = Number(schoolId);
  } else if (!currentBuilderSchoolId) {
    currentBuilderSchoolId = schools[0].id;
  }

  currentBuilderConfig = window.db.getSchoolReportConfig(currentBuilderSchoolId);
}

function renderReportBuilderView() {
  const container = document.getElementById('report-builder-container');
  if (!container) return;

  initReportBuilder(currentBuilderSchoolId);

  const schools = window.db.getSchools();

  container.innerHTML = `
    <div class="card motion-stagger-in" style="padding: 24px; margin-bottom: 24px;">
      
      <!-- Top Action & School Selector Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 16px;">
        <div>
          <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-sliders" style="color: var(--color-income);"></i>
            School Bus Statement — Custom Report Builder
          </h3>
          <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
            Customize section titles, field labels, visibility, and drag-and-drop module order per school campus.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 13px; font-weight: 600; color: var(--color-dark); margin: 0;">Campus Scope:</label>
            <select id="builder-school-select" class="form-control" style="width: auto; font-size: 13px; font-weight: 600;" onchange="onBuilderSchoolChange(this.value)">
              ${schools.map(s => `<option value="${s.id}" ${s.id === Number(currentBuilderSchoolId) ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('')}
            </select>
          </div>

          <button type="button" class="btn-primary motion-scale-press" style="width: auto; font-size: 13px; padding: 8px 16px;" onclick="saveCurrentReportBuilderConfig()">
            <i class="fa-solid fa-floppy-disk"></i> Save Configuration
          </button>
          
          <button type="button" class="btn-secondary motion-scale-press" style="width: auto; font-size: 13px; padding: 8px 16px;" onclick="resetCurrentReportBuilderConfig()">
            <i class="fa-solid fa-rotate-left"></i> Reset Defaults
          </button>
        </div>
      </div>

      <!-- TWO-PANEL EDITOR LAYOUT -->
      <div class="report-builder-layout" style="display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: stretch;">
        
        <!-- LEFT PANEL: REPORT MODULES / EDITABLE SECTIONS -->
        <div class="report-builder-left" style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; height: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
            <span style="font-size: 14px; font-weight: 700; color: var(--color-dark); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-list-check" style="color: var(--color-income);"></i> Editable Report Modules
            </span>
            <span class="badge badge-neutral" style="font-size: 11px;">Drag & Drop</span>
          </div>

          <div id="builder-modules-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Rendered by renderBuilderModulesList() -->
          </div>
        </div>

        <!-- RIGHT PANEL: LIVE REPORT PREVIEW -->
        <div class="report-builder-right" style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
            <span style="font-size: 14px; font-weight: 700; color: var(--color-dark); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-eye" style="color: var(--color-profit);"></i> Live Report Preview
            </span>
            <span class="badge badge-active" style="font-size: 11px; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">
              <i class="fa-solid fa-bolt" style="margin-right: 4px;"></i> Real-Time Synchronized
            </span>
          </div>

          <div id="builder-live-preview-container" style="background: #cbd5e1; padding: 24px; border-radius: 8px; width: 100%; height: 720px; overflow-y: auto; flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; scroll-behavior: smooth;">
            <!-- Rendered by renderLiveBuilderPreview() -->
          </div>
        </div>

      </div>
    </div>
  `;

  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function renderTypographyToolbar(styleObj, targetType, modIdx = null) {
  const s = styleObj || {};
  const font = s.fontFamily || 'Inter';
  const size = s.fontSize || '13px';
  const isBold = !!s.bold;
  const isItalic = !!s.italic;
  const isUnderline = !!s.underline;
  const align = s.textAlign || 'left';
  const color = s.color || '#0f172a';

  const fnName = modIdx !== null ? 'updateBuilderModuleStyle' : (targetType === 'header' ? 'updateBuilderHeaderStyle' : 'updateBuilderFooterStyle');

  return `
    <div style="margin-top: 10px; padding: 8px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
      <div style="font-weight: 700; color: #475569; margin-bottom: 6px; font-size: 11px;">
        <i class="fa-solid fa-font" style="color: #64748b; margin-right: 4px;"></i> Section Typography & Font Controls:
      </div>
      <div style="display: grid; grid-template-columns: 1fr 90px; gap: 6px; margin-bottom: 6px; align-items: center;">
        <select class="form-control" style="font-size: 11px; padding: 4px 6px; background: #ffffff;" onchange="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'fontFamily', this.value)">
          <option value="Inter" ${font === 'Inter' ? 'selected' : ''}>Inter (Default)</option>
          <option value="Roboto" ${font === 'Roboto' ? 'selected' : ''}>Roboto</option>
          <option value="Outfit" ${font === 'Outfit' ? 'selected' : ''}>Outfit</option>
          <option value="Arial" ${font === 'Arial' ? 'selected' : ''}>Arial</option>
          <option value="Georgia" ${font === 'Georgia' ? 'selected' : ''}>Georgia (Serif)</option>
          <option value="Times New Roman" ${font === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
          <option value="Courier New" ${font === 'Courier New' ? 'selected' : ''}>Courier New (Monospace)</option>
        </select>
        <select class="form-control" style="font-size: 11px; padding: 4px 6px; background: #ffffff;" onchange="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'fontSize', this.value)">
          <option value="11px" ${size === '11px' ? 'selected' : ''}>11 px</option>
          <option value="12px" ${size === '12px' ? 'selected' : ''}>12 px</option>
          <option value="13px" ${size === '13px' ? 'selected' : ''}>13 px</option>
          <option value="14px" ${size === '14px' ? 'selected' : ''}>14 px</option>
          <option value="15px" ${size === '15px' ? 'selected' : ''}>15 px</option>
          <option value="16px" ${size === '16px' ? 'selected' : ''}>16 px</option>
          <option value="18px" ${size === '18px' ? 'selected' : ''}>18 px</option>
        </select>
      </div>

      <div style="display: flex; align-items: center; gap: 6px;">
        <button type="button" class="btn-secondary" style="padding: 2px 10px; font-size: 11px; font-weight: 800; min-width: 32px; ${isBold ? 'background: #0f172a; color: #ffffff; border-color: #0f172a;' : 'background: #ffffff;'}" title="Bold" onclick="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'bold', ${!isBold})">
          B
        </button>
        <button type="button" class="btn-secondary" style="padding: 2px 10px; font-size: 11px; font-style: italic; font-weight: 700; min-width: 32px; ${isItalic ? 'background: #0f172a; color: #ffffff; border-color: #0f172a;' : 'background: #ffffff;'}" title="Italic" onclick="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'italic', ${!isItalic})">
          I
        </button>
        <button type="button" class="btn-secondary" style="padding: 2px 10px; font-size: 11px; text-decoration: underline; font-weight: 700; min-width: 32px; ${isUnderline ? 'background: #0f172a; color: #ffffff; border-color: #0f172a;' : 'background: #ffffff;'}" title="Underline" onclick="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'underline', ${!isUnderline})">
          U
        </button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 52px;gap:6px;margin-top:6px;align-items:center;">
        <select class="form-control" style="font-size:11px;padding:4px 6px;background:#ffffff;" onchange="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'textAlign', this.value)">
          <option value="left" ${align === 'left' ? 'selected' : ''}>Align Left</option>
          <option value="center" ${align === 'center' ? 'selected' : ''}>Align Center</option>
          <option value="right" ${align === 'right' ? 'selected' : ''}>Align Right</option>
          <option value="justify" ${align === 'justify' ? 'selected' : ''}>Justify</option>
        </select>
        <input type="color" value="${color}" title="Text color" onchange="${fnName}(${modIdx !== null ? `${modIdx}, ` : ''}'color', this.value)" style="width:52px;height:28px;padding:2px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;">
      </div>
    </div>
  `;
}

function renderBuilderModulesList() {
  const container = document.getElementById('builder-modules-list');
  if (!container || !currentBuilderConfig || !currentBuilderConfig.modules) return;

  const openFormIds = [];
  document.querySelectorAll('.builder-edit-form').forEach(f => {
    if (f.style.display !== 'none') openFormIds.push(f.id);
  });

  const modules = currentBuilderConfig.modules;
  const headerCfg = currentBuilderConfig.headerConfig || {};
  const footerCfg = currentBuilderConfig.footerConfig || {};

  const headerCardHTML = `
    <div class="builder-module-card" style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleHeaderEditForm()">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">REPORT HEADER CUSTOMIZATION</span>
        </div>
        <button type="button" class="icon-btn" title="Edit Header Settings">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>
      <div id="builder-header-form" class="builder-edit-form" style="display: none; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 12px;">
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Main Title (School / Campus Name)</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" placeholder="Leave empty for default school name" value="${escapeHTML(headerCfg.title || '')}" oninput="updateBuilderHeaderConfig('title', this.value)">
        </div>
        <div class="form-group" style="margin-bottom: 4px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Statement Subtitle Header</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" placeholder="SCHOOL BUS STATEMENT" value="${escapeHTML(headerCfg.subtitle || '')}" oninput="updateBuilderHeaderConfig('subtitle', this.value)">
        </div>
        ${renderTypographyToolbar(headerCfg.style, 'header')}
      </div>
    </div>
  `;

  const footerCardHTML = `
    <div class="builder-module-card" style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #059669; border-radius: 8px; padding: 12px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleFooterEditForm()">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">REPORT FOOTER CUSTOMIZATION</span>
        </div>
        <button type="button" class="icon-btn" title="Edit Footer Settings">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>
      <div id="builder-footer-form" class="builder-edit-form" style="display: none; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 12px;">
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Footer Left Text</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" value="${escapeHTML(footerCfg.footerLeft !== undefined ? footerCfg.footerLeft : 'VMS PRO | Powered By SparkIT Techno Solutions Pvt. Ltd.')}" oninput="updateBuilderFooterConfig('footerLeft', this.value)">
        </div>
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Footer Middle Text ({schoolName} available)</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" value="${escapeHTML(footerCfg.footerMiddle !== undefined ? footerCfg.footerMiddle : '{schoolName}')}" oninput="updateBuilderFooterConfig('footerMiddle', this.value)">
        </div>
        <div class="form-group" style="margin-bottom: 4px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Footer Right Page Text ({page} available)</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" value="${escapeHTML(footerCfg.footerRight !== undefined ? footerCfg.footerRight : '{page}')}" oninput="updateBuilderFooterConfig('footerRight', this.value)">
        </div>
        ${renderTypographyToolbar(footerCfg.style, 'footer')}
      </div>
    </div>
  `;

  const modulesHTML = modules.map((mod, idx) => `
    <div id="builder-module-card-${idx}" class="builder-module-card" draggable="true" data-index="${idx}" onclick="focusBuilderPreviewSection(${idx})" ondragstart="onBuilderDragStart(event, ${idx})" ondragover="onBuilderDragOver(event)" ondrop="onBuilderDrop(event, ${idx})" style="background: #ffffff; border: 1px solid ${mod.visible !== false ? '#cbd5e1' : '#e2e8f0'}; border-radius: 8px; padding: 12px; opacity: ${mod.visible !== false ? '1' : '0.65'}; transition: all 0.2s ease;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <i class="fa-solid fa-grip-vertical drag-handle" style="color: #94a3b8; cursor: grab;" title="Drag to reorder section"></i>
          <span style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHTML(mod.title)}
          </span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button type="button" class="icon-btn" title="Move Up" onclick="moveBuilderModule(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" class="icon-btn" title="Move Down" onclick="moveBuilderModule(${idx}, 1)" ${idx === modules.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          
          <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: 4px; user-select: none;">
            <input type="checkbox" ${mod.visible !== false ? 'checked' : ''} onchange="toggleBuilderModuleVisibility(${idx}, this.checked)" style="accent-color: var(--color-income); cursor: pointer;">
            <span style="color: ${mod.visible !== false ? '#0f172a' : '#94a3b8'};">${mod.visible !== false ? 'Visible' : 'Hidden'}</span>
          </label>
          
          <button type="button" class="icon-btn" title="Edit Labels" onclick="toggleBuilderModuleEditForm(${idx})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </div>
      </div>

      <!-- Expandable Edit Form -->
      <div id="builder-edit-form-${idx}" class="builder-edit-form" style="display: none; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 12px;">
        <div class="form-group" style="margin-bottom: 10px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Section Title Header</label>
          <input type="text" class="form-control" style="font-size: 12px; padding: 5px 8px; font-weight: 600;" value="${escapeHTML(mod.title)}" oninput="updateBuilderModuleTitle(${idx}, this.value)">
        </div>

        <div style="font-weight: 700; margin-bottom: 6px; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Field Labels:</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${Object.keys(mod.labels || {}).map(fKey => `
            <div style="display: grid; grid-template-columns: 130px 1fr; gap: 6px; align-items: center;">
              <span style="color: #64748b; font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fKey}</span>
              <input type="text" class="form-control" style="font-size: 11.5px; padding: 4px 6px;" value="${escapeHTML(mod.labels[fKey])}" oninput="updateBuilderFieldLabel(${idx}, '${fKey}', this.value)">
            </div>

            ${fKey === 'principalSignature' ? `
              <div style="margin-top: 6px; padding: 8px; background: #f1f5f9; border-radius: 6px; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="font-size: 11px; color: #334155; font-weight: 600;">
                  <i class="fa-solid fa-file-signature" style="color: var(--color-income); margin-right: 4px;"></i> Digital Signature Image (Optional):
                </div>
                <div>
                  <input type="file" id="sig-upload-input-${idx}" accept="image/*" style="display: none;" onchange="handleSignatureImageUpload(event, ${idx})">
                  ${mod.signatureImage ? `
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <img src="${mod.signatureImage}" style="max-height: 26px; max-width: 75px; border: 1px solid #cbd5e1; border-radius: 4px; object-fit: contain; background: #ffffff;">
                      <button type="button" class="btn-danger" style="padding: 2px 6px; font-size: 10px; border-radius: 4px;" title="Remove Signature" onclick="removeSignatureImage(${idx})">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ` : `
                    <button type="button" class="btn-secondary" style="padding: 3px 8px; font-size: 11px; border-radius: 5px; display: flex; align-items: center; gap: 4px; background: #ffffff;" onclick="document.getElementById('sig-upload-input-${idx}').click()">
                      <i class="fa-solid fa-upload" style="color: var(--color-income);"></i> Upload Signature
                    </button>
                  `}
                </div>
              </div>
            ` : ''}
          `).join('')}
        </div>

        ${renderTypographyToolbar(mod.style, 'module', idx)}
      </div>

    </div>
  `).join('');

  container.innerHTML = headerCardHTML + modulesHTML + footerCardHTML;

  openFormIds.forEach(id => {
    const f = document.getElementById(id);
    if (f) f.style.display = 'block';
  });
}

function updateBuilderModuleStyle(idx, property, value) {
  if (!currentBuilderConfig || !currentBuilderConfig.modules || !currentBuilderConfig.modules[idx]) return;
  if (!currentBuilderConfig.modules[idx].style) currentBuilderConfig.modules[idx].style = {};
  currentBuilderConfig.modules[idx].style[property] = value;
  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function updateBuilderHeaderStyle(property, value) {
  if (!currentBuilderConfig) return;
  if (!currentBuilderConfig.headerConfig) currentBuilderConfig.headerConfig = {};
  if (!currentBuilderConfig.headerConfig.style) currentBuilderConfig.headerConfig.style = {};
  currentBuilderConfig.headerConfig.style[property] = value;
  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function updateBuilderFooterStyle(property, value) {
  if (!currentBuilderConfig) return;
  if (!currentBuilderConfig.footerConfig) currentBuilderConfig.footerConfig = {};
  if (!currentBuilderConfig.footerConfig.style) currentBuilderConfig.footerConfig.style = {};
  currentBuilderConfig.footerConfig.style[property] = value;
  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function toggleHeaderEditForm() {
  const form = document.getElementById('builder-header-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function toggleFooterEditForm() {
  const form = document.getElementById('builder-footer-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function updateBuilderHeaderConfig(key, value) {
  if (!currentBuilderConfig) return;
  if (!currentBuilderConfig.headerConfig) currentBuilderConfig.headerConfig = {};
  currentBuilderConfig.headerConfig[key] = value;
  renderLiveBuilderPreview();
}

function updateBuilderFooterConfig(key, value) {
  if (!currentBuilderConfig) return;
  if (!currentBuilderConfig.footerConfig) currentBuilderConfig.footerConfig = {};
  currentBuilderConfig.footerConfig[key] = value;
  renderLiveBuilderPreview();
}

function renderLiveBuilderPreview() {
  const container = document.getElementById('builder-live-preview-container');
  if (!container || !currentBuilderConfig) return;

  const html = buildSchoolBusStatementTemplatePreviewHTML(currentBuilderSchoolId, currentBuilderConfig);

  container.innerHTML = html;
  setupBuilderPreviewSync();
}

function setupBuilderPreviewSync() {
  const container = document.getElementById('builder-live-preview-container');
  if (!container) return;
  const sections = Array.from(container.querySelectorAll('[id^="sec-stmt-"]'));
  if (!sections.length) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const key = visible.target.id.replace('sec-stmt-', '');
    const idx = currentBuilderConfig.modules.findIndex(m => m.key === key);
    document.querySelectorAll('.builder-module-card.builder-active').forEach(el => el.classList.remove('builder-active'));
    const card = document.getElementById(`builder-module-card-${idx}`);
    if (card) {
      card.classList.add('builder-active');
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, { root: container, threshold: [0.15, 0.5, 0.85] });
  sections.forEach(section => observer.observe(section));
}

function focusBuilderPreviewSection(idx) {
  const mod = currentBuilderConfig?.modules?.[idx];
  const container = document.getElementById('builder-live-preview-container');
  if (!mod || !container) return;
  const section = container.querySelector(`#sec-stmt-${CSS.escape(mod.key)}`);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onBuilderSchoolChange(schoolId) {
  currentBuilderSchoolId = Number(schoolId);
  currentBuilderConfig = window.db.getSchoolReportConfig(currentBuilderSchoolId);
  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function moveBuilderModule(idx, delta) {
  if (!currentBuilderConfig || !currentBuilderConfig.modules) return;
  const modules = currentBuilderConfig.modules;
  const newIdx = idx + delta;

  if (newIdx < 0 || newIdx >= modules.length) return;

  const temp = modules[idx];
  modules[idx] = modules[newIdx];
  modules[newIdx] = temp;

  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function toggleBuilderModuleVisibility(idx, isChecked) {
  if (!currentBuilderConfig || !currentBuilderConfig.modules[idx]) return;
  currentBuilderConfig.modules[idx].visible = isChecked;
  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function toggleBuilderModuleEditForm(idx) {
  const formEl = document.getElementById(`builder-edit-form-${idx}`);
  if (formEl) {
    const isHidden = formEl.style.display === 'none';
    formEl.style.display = isHidden ? 'block' : 'none';
  }
}

function updateBuilderModuleTitle(idx, val) {
  if (!currentBuilderConfig || !currentBuilderConfig.modules[idx]) return;
  currentBuilderConfig.modules[idx].title = val;
  renderLiveBuilderPreview();
}

function updateBuilderFieldLabel(idx, fieldKey, val) {
  if (!currentBuilderConfig || !currentBuilderConfig.modules[idx]) return;
  if (!currentBuilderConfig.modules[idx].labels) currentBuilderConfig.modules[idx].labels = {};
  currentBuilderConfig.modules[idx].labels[fieldKey] = val;
  renderLiveBuilderPreview();
}

let draggedBuilderIndex = null;
function onBuilderDragStart(e, idx) {
  draggedBuilderIndex = idx;
  e.dataTransfer.effectAllowed = 'move';
}

function onBuilderDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onBuilderDrop(e, dropIdx) {
  e.preventDefault();
  if (draggedBuilderIndex === null || draggedBuilderIndex === dropIdx) return;

  const modules = currentBuilderConfig.modules;
  const draggedItem = modules[draggedBuilderIndex];
  modules.splice(draggedBuilderIndex, 1);
  modules.splice(dropIdx, 0, draggedItem);
  draggedBuilderIndex = null;

  renderBuilderModulesList();
  renderLiveBuilderPreview();
}

function saveCurrentReportBuilderConfig() {
  if (!currentBuilderSchoolId || !currentBuilderConfig) return;

  const schoolObj = window.db.getSchools().find(s => s.id === Number(currentBuilderSchoolId));
  const schoolName = schoolObj ? schoolObj.name : 'School';

  window.db.saveSchoolReportConfig(currentBuilderSchoolId, currentBuilderConfig);
  showToast(`Custom report configuration saved for ${schoolName}!`, 'success');
  
  if (typeof renderReportsPage === 'function') renderReportsPage();
}

function resetCurrentReportBuilderConfig() {
  if (!currentBuilderSchoolId) return;

  const schoolObj = window.db.getSchools().find(s => s.id === Number(currentBuilderSchoolId));
  const schoolName = schoolObj ? schoolObj.name : 'School';

  showResetDefaultModal({
    onConfirm: () => {
      currentBuilderConfig = window.db.resetSchoolReportConfig(currentBuilderSchoolId);
      renderBuilderModulesList();
      renderLiveBuilderPreview();
      showToast(`Report configuration reset to factory defaults for ${schoolName}`, 'info');
      if (typeof renderReportsPage === 'function') renderReportsPage();
    }
  });
}

function handleSignatureImageUpload(event, modIdx) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG/JPG).', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    if (currentBuilderConfig && currentBuilderConfig.modules && currentBuilderConfig.modules[modIdx]) {
      currentBuilderConfig.modules[modIdx].signatureImage = e.target.result;
      renderBuilderModulesList();
      renderLiveBuilderPreview();
      showToast('Principal signature image uploaded successfully.', 'success');
    }
  };
  reader.readAsDataURL(file);
}

function removeSignatureImage(modIdx) {
  if (currentBuilderConfig && currentBuilderConfig.modules && currentBuilderConfig.modules[modIdx]) {
    delete currentBuilderConfig.modules[modIdx].signatureImage;
    renderBuilderModulesList();
    renderLiveBuilderPreview();
    showToast('Digital signature removed. Default manual signature line restored.', 'info');
  }
}

// Global exports
window.initReportBuilder = initReportBuilder;
window.renderReportBuilderView = renderReportBuilderView;
window.onBuilderSchoolChange = onBuilderSchoolChange;
window.moveBuilderModule = moveBuilderModule;
window.toggleBuilderModuleVisibility = toggleBuilderModuleVisibility;
window.toggleBuilderModuleEditForm = toggleBuilderModuleEditForm;
window.updateBuilderModuleTitle = updateBuilderModuleTitle;
window.updateBuilderFieldLabel = updateBuilderFieldLabel;
window.onBuilderDragStart = onBuilderDragStart;
window.onBuilderDragOver = onBuilderDragOver;
window.onBuilderDrop = onBuilderDrop;
window.saveCurrentReportBuilderConfig = saveCurrentReportBuilderConfig;
window.resetCurrentReportBuilderConfig = resetCurrentReportBuilderConfig;
window.handleSignatureImageUpload = handleSignatureImageUpload;
window.removeSignatureImage = removeSignatureImage;
window.toggleHeaderEditForm = toggleHeaderEditForm;
window.toggleFooterEditForm = toggleFooterEditForm;
window.updateBuilderHeaderConfig = updateBuilderHeaderConfig;
window.updateBuilderFooterConfig = updateBuilderFooterConfig;
window.updateBuilderModuleStyle = updateBuilderModuleStyle;
window.updateBuilderHeaderStyle = updateBuilderHeaderStyle;
window.updateBuilderFooterStyle = updateBuilderFooterStyle;
window.focusBuilderPreviewSection = focusBuilderPreviewSection;
