(function () {
  const DAYS_ORDER = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];

  // Firebase init (Compat)
  const firebaseConfig = {
    apiKey: "AIzaSyBJDhjAO85qtK4SexkvvLIgvs36i3Chyf4",
    authDomain: "eee-routine.firebaseapp.com",
    databaseURL: "https://eee-routine-default-rtdb.firebaseio.com",
    projectId: "eee-routine",
    storageBucket: "eee-routine.firebasestorage.app",
    messagingSenderId: "1001291186233",
    appId: "1:1001291186233:web:801a065bc6f3304e1d8de8",
    measurementId: "G-16X655Y9KQ"
  };
  if (window.firebase && !window.firebase.apps?.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
  const db = window.firebase.database();

  const els = {
    semester: document.getElementById('a_semester'),
    section: document.getElementById('a_section'),
    day: document.getElementById('a_day'),
    time: document.getElementById('a_time'),
    course: document.getElementById('a_course'),
    code: document.getElementById('a_code'),
    teacher: document.getElementById('a_teacher'),
    room: document.getElementById('a_room'),
    list: document.getElementById('a_list'),
    status: document.getElementById('a_status'),
    add: document.getElementById('btn_add'),
    del: document.getElementById('btn_delete'),
    publish: document.getElementById('btn_publish'),
    // CR/Co-CR & version elements
    cr1Name: document.getElementById('a_cr1_name'),
    cr1Id: document.getElementById('a_cr1_id'),
    cr1Phone: document.getElementById('a_cr1_phone'),
    cr2Name: document.getElementById('a_cr2_name'),
    cr2Id: document.getElementById('a_cr2_id'),
    cr2Phone: document.getElementById('a_cr2_phone'),
    saveCr: document.getElementById('btn_save_cr'),
    crStatus: document.getElementById('a_cr_status'),
    version: document.getElementById('a_version'),
    saveVersion: document.getElementById('btn_save_version'),
    versionStatus: document.getElementById('a_version_status'),
    // Teacher autocomplete elements
    teacherSuggestions: document.getElementById('a_teacher_suggestions'),
    teacherNewForm: document.getElementById('a_teacher_new_form'),
    teacherName: document.getElementById('a_teacher_name'),
    teacherContact: document.getElementById('a_teacher_contact'),
    teacherMail: document.getElementById('a_teacher_mail'),
    teacherDesignation: document.getElementById('a_teacher_designation'),
    teacherSave: document.getElementById('a_teacher_save'),
    teacherStatus: document.getElementById('a_teacher_status'),
    // Section info elements
    sectionInfoToggle: document.getElementById('sectionInfoToggle'),
    sectionInfoForm: document.getElementById('sectionInfoForm'),
    batch: document.getElementById('a_batch'),
    totalStudents: document.getElementById('a_total_students'),
    coordinatorName: document.getElementById('a_coordinator_name'),
    coordinatorPhone: document.getElementById('a_coordinator_phone'),
    coordinatorEmail: document.getElementById('a_coordinator_email'),
    saveSectionInfo: document.getElementById('btn_save_section_info'),
    deleteSectionInfo: document.getElementById('btn_delete_section_info'),
    sectionInfoStatus: document.getElementById('a_section_info_status')
  };

  const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
  const semesterToSections = {
    '1-1': ['A','B','C','D','E'],
    '1-2': ['A','B','C'],
    '2-1': ['A','B','C','D'],
    '2-2': ['A','B','C'],
    '3-1': ['A','B','C','D','E'],
    '3-2': ['A','B','C'],
    '4-1': ['A','B','C'],
    '4-2': ['A','B']
  };

  function semLabel(code) {
    const map = {
      '1-1': '1st','1-2':'2nd','2-1':'3rd','2-2':'4th','3-1':'5th','3-2':'6th','4-1':'7th','4-2':'8th'
    };
    return map[code] || code;
  }

  function fillSemesters() {
    els.semester.innerHTML = '';
    const ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Select Semester';
    els.semester.appendChild(ph);
    semesters.forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = semLabel(s);
      els.semester.appendChild(o);
    });
  }

  function fillSections(sem) {
    const list = semesterToSections[sem] || [];
    els.section.innerHTML = '';
    const ph = document.createElement('option'); ph.value=''; ph.textContent = list.length?'Select Section':'Select Section';
    els.section.appendChild(ph);
    list.forEach(sec => {
      const o = document.createElement('option'); o.value = sec; o.textContent = sec; els.section.appendChild(o);
    });
    els.section.disabled = list.length === 0;
  }

  function parseStart(timeStr) {
    // Expect format: HH:MM - HH:MM
    const m = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return parseInt(m[1],10) * 60 + parseInt(m[2],10);
  }

  function sortSlots(slots) {
    return [...(slots||[])].sort((a,b) => parseStart(a.time||'0:00') - parseStart(b.time||'0:00'));
  }

  // Local state for current day
  let daySlots = [];
  let selectedIndex = -1;
  let activeRef = null;

  function renderList() {
    els.list.innerHTML = '';
    const sorted = sortSlots(daySlots);
    sorted.forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'slot-card' + (idx === selectedIndex ? ' selected' : '');
      li.style.cursor = 'pointer';
      li.dataset.idx = String(idx);
      li.innerHTML = `
        <div class="slot-time">${(s.time||'').replace('-', '→')}</div>
        <div class="slot-main">
          <div class="slot-title">${s.course||''}</div>
          <div class="grid">
            <div class="kv"><span>Course:</span><b>${s.code||''}</b></div>
            <div class="kv"><span>Teacher:</span><b>${s.teacher||''}</b></div>
            <div class="kv"><span>Room:</span><b>${s.room||''}</b></div>
          </div>
        </div>`;
      li.addEventListener('click', () => {
        selectedIndex = idx;
        // visual selection
        Array.from(els.list.children).forEach(n => n.classList.remove('selected'));
        li.classList.add('selected');
        const item = s;
        els.time.value = item.time||'';
        els.course.value = item.course||'';
        els.code.value = item.code||'';
        els.teacher.value = item.teacher||'';
        els.room.value = item.room||'';
        els.status.textContent = `Editing slot #${idx+1}`;
      });
      els.list.appendChild(li);
    });
  }

  function listenDay(sem, sec, day) {
    if (activeRef) activeRef.off();
    const ref = db.ref(`routines/${sem}/${sec}/${day}`);
    activeRef = ref;
    ref.on('value', (snap) => {
      daySlots = Array.isArray(snap.val()) ? snap.val() : (snap.val() ? Object.values(snap.val()) : []);
      selectedIndex = -1;
      renderList();
      els.status.textContent = `Loaded ${daySlots.length} slot(s).`;
    }, () => {
      els.status.textContent = 'Failed to load day; using last known data if any.';
    });
  }

  function currentSel() {
    const sem = els.semester.value.trim();
    const sec = els.section.value.trim();
    const day = els.day.value.trim();
    return { sem, sec, day };
  }

  function validateInputs() {
    if (!els.semester.value || !els.section.value || !els.day.value) return 'Select semester, section, and day';
    if (!els.time.value || !els.course.value || !els.code.value || !els.teacher.value || !els.room.value) return 'Fill all fields';
    return '';
  }

  async function publishDay() {
    const { sem, sec, day } = currentSel();
    if (!sem || !sec || !day) { els.status.textContent = 'Select semester/section/day first'; return; }
    const sorted = sortSlots(daySlots);
    await db.ref(`routines/${sem}/${sec}/${day}`).set(sorted);
    els.status.textContent = 'Published day successfully';
  }

  // Events
  els.semester.addEventListener('change', () => {
    fillSections(els.semester.value);
    // Load version when semester changes
    const sem = els.semester.value.trim();
    if (sem) {
      loadVersion(sem);
    }
  });
  els.section.addEventListener('change', () => {
    const { sem, sec, day } = currentSel();
    if (sem && sec && day) listenDay(sem, sec, day);
    // Load CRs, section info, and version when section changes
    if (sem && sec) {
      loadCRs(sem, sec);
      loadVersion(sem);
      // Check if section info exists and auto-show form
      db.ref(`sectionInfo/${sem}/${sec}`).once('value').then(snap => {
        const v = snap.val() || {};
        if (v.batch && els.sectionInfoToggle && els.sectionInfoForm) {
          els.sectionInfoToggle.checked = true;
          els.sectionInfoForm.classList.remove('hidden');
        }
        loadSectionInfo(sem, sec);
      }).catch(() => {
        loadSectionInfo(sem, sec);
      });
    }
  });
  els.day.addEventListener('change', () => {
    const { sem, sec, day } = currentSel();
    if (sem && sec && day) listenDay(sem, sec, day);
  });

  els.add.addEventListener('click', async () => {
    const err = validateInputs();
    if (err) { els.status.textContent = err; return; }
    const slot = {
      time: els.time.value.trim(),
      course: els.course.value.trim(),
      code: els.code.value.trim(),
      teacher: els.teacher.value.trim(),
      room: els.room.value.trim()
    };
    if (selectedIndex >= 0) {
      daySlots[selectedIndex] = slot;
      selectedIndex = -1;
      els.status.textContent = 'Updated slot locally. Click Publish to save.';
    } else {
      daySlots.push(slot);
      els.status.textContent = 'Added slot locally. Click Publish to save.';
    }
    renderList();
  });

  els.del.addEventListener('click', () => {
    if (selectedIndex < 0) { els.status.textContent = 'Select a slot to delete.'; return; }
    const slot = daySlots[selectedIndex];
    const slotInfo = `${slot.time || 'Unknown time'} - ${slot.course || slot.code || 'Unknown course'}`;
    const confirmed = window.confirm(`Are you sure you want to delete this slot?\n\n${slotInfo}\n\nThis action cannot be undone. Click "Publish Day" to save changes.`);
    if (!confirmed) {
      els.status.textContent = 'Deletion cancelled.';
      return;
    }
    daySlots.splice(selectedIndex, 1);
    selectedIndex = -1;
    renderList();
    els.status.textContent = 'Deleted slot locally. Click Publish to save.';
  });

  els.publish.addEventListener('click', () => {
    publishDay().catch(() => { els.status.textContent = 'Failed to publish.'; });
  });

  // ----- CR / Co-CR management -----
  async function saveCRs() {
    const sem = els.semester.value.trim();
    const sec = els.section.value.trim();
    if (!sem) { els.crStatus.textContent = 'Select a semester first.'; return; }
    if (!sec) { els.crStatus.textContent = 'Select a section first.'; return; }
    const payload = {
      cr1: { name: (els.cr1Name.value||'').trim(), id: (els.cr1Id.value||'').trim(), phone: (els.cr1Phone.value||'').trim() },
      cr2: { name: (els.cr2Name.value||'').trim(), id: (els.cr2Id.value||'').trim(), phone: (els.cr2Phone.value||'').trim() }
    };
    try {
      // Save CR data per semester and per section
      await db.ref(`cr/${sem}/${sec}`).set(payload);
      els.crStatus.textContent = `Saved CRs for ${sem} ${sec}.`;
    } catch (_) {
      els.crStatus.textContent = 'Failed to save CRs.';
    }
  }

  function loadCRs(sem, sec) {
    if (!sem || !sec) return;
    db.ref(`cr/${sem}/${sec}`).once('value').then(snap => {
      const v = snap.val() || {};
      const cr1 = v.cr1 || {};
      const cr2 = v.cr2 || {};
      if (els.cr1Name) els.cr1Name.value = cr1.name || '';
      if (els.cr1Id) els.cr1Id.value = cr1.id || '';
      if (els.cr1Phone) els.cr1Phone.value = cr1.phone || '';
      if (els.cr2Name) els.cr2Name.value = cr2.name || '';
      if (els.cr2Id) els.cr2Id.value = cr2.id || '';
      if (els.cr2Phone) els.cr2Phone.value = cr2.phone || '';
      if (els.crStatus) els.crStatus.textContent = 'Loaded CR data.';
    }).catch(() => {
      if (els.crStatus) els.crStatus.textContent = 'No CR data found.';
      // Clear fields if no data
      if (els.cr1Name) els.cr1Name.value = '';
      if (els.cr1Id) els.cr1Id.value = '';
      if (els.cr1Phone) els.cr1Phone.value = '';
      if (els.cr2Name) els.cr2Name.value = '';
      if (els.cr2Id) els.cr2Id.value = '';
      if (els.cr2Phone) els.cr2Phone.value = '';
    });
  }

  // ----- Routine version management -----
  async function saveVersion() {
    const sem = els.semester.value.trim();
    if (!sem) { els.versionStatus.textContent = 'Select a semester first.'; return; }
    const label = (els.version?.value || '').trim();
    if (!label) { els.versionStatus.textContent = 'Enter version label.'; return; }
    try {
      await db.ref(`versions/${sem}`).set(label);
      els.versionStatus.textContent = 'Saved version.';
    } catch (_) {
      els.versionStatus.textContent = 'Failed to save version.';
    }
  }

  function loadVersion(sem) {
    db.ref(`versions/${sem}`).once('value').then(snap => {
      const v = snap.val() || '';
      if (els.version) els.version.value = v;
      if (els.versionStatus) els.versionStatus.textContent = v ? 'Loaded version.' : 'No version set.';
    }).catch(() => {
      if (els.versionStatus) els.versionStatus.textContent = 'Failed to load version.';
    });
  }

  if (els.saveCr) els.saveCr.addEventListener('click', () => { saveCRs(); });
  if (els.saveVersion) els.saveVersion.addEventListener('click', () => { saveVersion(); });

  // ========== SECTION INFO MANAGEMENT ==========
  
  // Toggle section info form
  if (els.sectionInfoToggle) {
    els.sectionInfoToggle.addEventListener('change', () => {
      if (els.sectionInfoForm) {
        if (els.sectionInfoToggle.checked) {
          els.sectionInfoForm.classList.remove('hidden');
          const { sem, sec } = currentSel();
          if (sem && sec) {
            loadSectionInfo(sem, sec);
          }
        } else {
          els.sectionInfoForm.classList.add('hidden');
        }
      }
    });
  }

  // Load section info
  function loadSectionInfo(sem, sec) {
    if (!sem || !sec) return;
    db.ref(`sectionInfo/${sem}/${sec}`).once('value').then(snap => {
      const v = snap.val() || {};
      if (els.batch) els.batch.value = v.batch || '';
      if (els.totalStudents) els.totalStudents.value = v.totalStudents || '';
      if (els.coordinatorName) els.coordinatorName.value = v.coordinatorName || '';
      if (els.coordinatorPhone) els.coordinatorPhone.value = v.coordinatorPhone || '';
      if (els.coordinatorEmail) els.coordinatorEmail.value = v.coordinatorEmail || '';
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = v.batch ? 'Loaded section info.' : 'No section info found.';
      // Enable toggle if data exists
      if (els.sectionInfoToggle && v.batch) {
        els.sectionInfoToggle.checked = true;
        if (els.sectionInfoForm) els.sectionInfoForm.classList.remove('hidden');
      }
    }).catch(() => {
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'No section info found.';
    });
  }

  // Save section info
  async function saveSectionInfo() {
    const { sem, sec } = currentSel();
    if (!sem) { 
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Select a semester first.'; 
      return; 
    }
    if (!sec) { 
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Select a section first.'; 
      return; 
    }
    
    const payload = {
      batch: (els.batch?.value || '').trim(),
      totalStudents: (els.totalStudents?.value || '').trim(),
      coordinatorName: (els.coordinatorName?.value || '').trim(),
      coordinatorPhone: (els.coordinatorPhone?.value || '').trim(),
      coordinatorEmail: (els.coordinatorEmail?.value || '').trim()
    };
    
    try {
      await db.ref(`sectionInfo/${sem}/${sec}`).set(payload);
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = `Saved section info for ${sem} ${sec}.`;
    } catch (_) {
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Failed to save section info.';
    }
  }

  // Delete section info
  async function deleteSectionInfo() {
    const { sem, sec } = currentSel();
    if (!sem || !sec) {
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Select semester and section first.';
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to delete section info for ${sem} ${sec}?`);
    if (!confirmed) {
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Deletion cancelled.';
      return;
    }
    
    try {
      await db.ref(`sectionInfo/${sem}/${sec}`).remove();
      // Clear form
      if (els.batch) els.batch.value = '';
      if (els.totalStudents) els.totalStudents.value = '';
      if (els.coordinatorName) els.coordinatorName.value = '';
      if (els.coordinatorPhone) els.coordinatorPhone.value = '';
      if (els.coordinatorEmail) els.coordinatorEmail.value = '';
      if (els.sectionInfoToggle) els.sectionInfoToggle.checked = false;
      if (els.sectionInfoForm) els.sectionInfoForm.classList.add('hidden');
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Section info deleted.';
    } catch (_) {
      if (els.sectionInfoStatus) els.sectionInfoStatus.textContent = 'Failed to delete section info.';
    }
  }

  if (els.saveSectionInfo) els.saveSectionInfo.addEventListener('click', () => { saveSectionInfo(); });
  if (els.deleteSectionInfo) els.deleteSectionInfo.addEventListener('click', () => { deleteSectionInfo(); });

  // ========== TEACHER AUTComplete & NEW TEACHER FORM ==========
  let allTeachers = {}; // { shortForm: { fullName, contact, mail, designation } }

  // Load all teachers
  function loadAllTeachers() {
    db.ref('teachers').on('value', (snap) => {
      allTeachers = snap.val() || {};
    });
  }

  // Dropdown animation helpers
  function showDropdown(dropdown) {
    if (!dropdown) return;
    // Remove hidden class first to make element visible
    dropdown.classList.remove('hidden', 'hiding');
    // Force reflow to ensure display change is applied
    dropdown.offsetHeight;
    // Add showing class to trigger animation
    dropdown.classList.add('showing');
  }

  function hideDropdown(dropdown) {
    if (!dropdown) return;
    // Remove showing class and add hiding class to trigger close animation
    dropdown.classList.remove('showing');
    dropdown.classList.add('hiding');
    // Wait for animation to complete before hiding
    setTimeout(() => {
      dropdown.classList.remove('hiding');
      dropdown.classList.add('hidden');
    }, 200); // Match CSS transition duration
  }

  // Show teacher suggestions
  function showAdminTeacherSuggestions(query) {
    if (!els.teacherSuggestions) return;
    const queryLower = query.toLowerCase().trim();
    
    // Check if query matches any existing teacher
    const matches = [];
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      const fullName = (data.fullName || '').toLowerCase();
      const shortFormLower = shortForm.toLowerCase();
      
      if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
        matches.push({ shortForm, fullName: data.fullName || shortForm });
      }
    });

    // If no matches and query is not empty, show new teacher form
    if (matches.length === 0 && queryLower.length > 0) {
      hideDropdown(els.teacherSuggestions);
      els.teacherNewForm.classList.remove('hidden');
      // Pre-fill short form if it's being typed
      if (els.teacher) {
        const currentShort = els.teacher.value.trim();
        // Don't pre-fill if it's already there
      }
    } else {
      els.teacherNewForm.classList.add('hidden');
    }

    // Show suggestions if there are matches
    if (matches.length === 0) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    els.teacherSuggestions.innerHTML = '';
    matches.forEach(({ shortForm, fullName }) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div class="autocomplete-item-name">${fullName} (${shortForm})</div>
      `;
      // Use mousedown instead of click for better trackpad support
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        els.teacher.value = shortForm;
        hideDropdown(els.teacherSuggestions);
        els.teacherNewForm.classList.add('hidden');
      };
      item.addEventListener('mousedown', handleSelect);
      item.addEventListener('touchstart', handleSelect);
      els.teacherSuggestions.appendChild(item);
    });
    showDropdown(els.teacherSuggestions);
  }

  // Teacher input handler
  if (els.teacher) {
    els.teacher.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      showAdminTeacherSuggestions(query);
    });

    els.teacher.addEventListener('blur', () => {
      setTimeout(() => {
        if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
      }, 200);
    });
  }

  // Save new teacher
  async function saveNewTeacher() {
    const shortForm = els.teacher.value.trim();
    const fullName = els.teacherName.value.trim();
    const contact = els.teacherContact.value.trim();
    const mail = els.teacherMail.value.trim();
    const designation = els.teacherDesignation.value.trim();

    if (!shortForm) {
      if (els.teacherStatus) els.teacherStatus.textContent = 'Enter teacher short form first.';
      return;
    }

    if (!fullName) {
      if (els.teacherStatus) els.teacherStatus.textContent = 'Enter teacher full name.';
      return;
    }

    // Check if teacher already exists
    if (allTeachers[shortForm]) {
      if (els.teacherStatus) els.teacherStatus.textContent = 'Teacher with this short form already exists.';
      return;
    }

    try {
      await db.ref(`teachers/${shortForm}`).set({
        fullName: fullName,
        contact: contact,
        mail: mail,
        designation: designation
      });
      
      if (els.teacherStatus) els.teacherStatus.textContent = 'Teacher saved successfully!';
      els.teacherNewForm.classList.add('hidden');
      // Clear form
      els.teacherName.value = '';
      els.teacherContact.value = '';
      els.teacherMail.value = '';
      els.teacherDesignation.value = '';
      
      // Reload teachers
      loadAllTeachers();
    } catch (e) {
      if (els.teacherStatus) els.teacherStatus.textContent = 'Failed to save teacher.';
    }
  }

  if (els.teacherSave) {
    els.teacherSave.addEventListener('click', saveNewTeacher);
  }

  // Seed demo removed

  // Init
  function init() {
    fillSemesters();
    loadAllTeachers();
  }
  document.addEventListener('DOMContentLoaded', init);
})();


