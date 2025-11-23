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

  // Global state
  let departments = [];
  let draggedElement = null;

  const els = {
    // All Info Edit page
    department: document.getElementById('a_department'),
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
    // Teacher autocomplete elements
    teacherSuggestions: document.getElementById('a_teacher_suggestions'),
    teacherNewForm: document.getElementById('a_teacher_new_form'),
    teacherShort: document.getElementById('a_teacher_short'),
    teacherName: document.getElementById('a_teacher_name'),
    teacherContact: document.getElementById('a_teacher_contact'),
    teacherMail: document.getElementById('a_teacher_mail'),
    teacherDesignation: document.getElementById('a_teacher_designation'),
    teacherSave: document.getElementById('a_teacher_save'),
    teacherStatus: document.getElementById('a_teacher_status'),
    // Department management
    newDepartmentName: document.getElementById('new_department_name'),
    addDepartmentBtn: document.getElementById('btn_add_department'),
    departmentStatus: document.getElementById('department_status'),
    departmentList: document.getElementById('department_list'),
    deptSectionDepartment: document.getElementById('dept_section_department'),
    deptSectionSemester: document.getElementById('dept_section_semester'),
    newSectionName: document.getElementById('new_section_name'),
    addSectionBtn: document.getElementById('btn_add_section'),
    sectionListDisplay: document.getElementById('section_list_display'),
    sectionStatus: document.getElementById('section_status'),
    // CR Info Edit page
    crDept: document.getElementById('cr_dept'),
    crSemester: document.getElementById('cr_semester'),
    crSection: document.getElementById('cr_section'),
    crCr1Name: document.getElementById('cr_cr1_name'),
    crCr1Id: document.getElementById('cr_cr1_id'),
    crCr1Phone: document.getElementById('cr_cr1_phone'),
    crCr2Name: document.getElementById('cr_cr2_name'),
    crCr2Id: document.getElementById('cr_cr2_id'),
    crCr2Phone: document.getElementById('cr_cr2_phone'),
    saveCrBtn: document.getElementById('btn_save_cr'),
    crStatus: document.getElementById('cr_status'),
    // Section Info Edit page
    secInfoDept: document.getElementById('sec_info_dept'),
    secInfoSemester: document.getElementById('sec_info_semester'),
    secInfoSection: document.getElementById('sec_info_section'),
    secInfoBatch: document.getElementById('sec_info_batch'),
    secInfoTotalStudents: document.getElementById('sec_info_total_students'),
    secInfoCoordinatorName: document.getElementById('sec_info_coordinator_name'),
    secInfoCoordinatorPhone: document.getElementById('sec_info_coordinator_phone'),
    secInfoCoordinatorEmail: document.getElementById('sec_info_coordinator_email'),
    saveSecInfoBtn: document.getElementById('btn_save_section_info'),
    deleteSecInfoBtn: document.getElementById('btn_delete_section_info'),
    secInfoStatus: document.getElementById('sec_info_status'),
    // Routine Version page
    versionDept: document.getElementById('version_dept'),
    versionSemester: document.getElementById('version_semester'),
    versionLabel: document.getElementById('version_label'),
    saveVersionBtn: document.getElementById('btn_save_version'),
    versionStatus: document.getElementById('version_status'),
    // Teacher Info Edit page
    teacherEditSearch: document.getElementById('teacher_edit_search'),
    teacherEditSuggestions: document.getElementById('teacher_edit_suggestions'),
    teacherEditForm: document.getElementById('teacher_edit_form'),
    teacherEditNewForm: document.getElementById('teacher_edit_new_form'),
    teacherEditShort: document.getElementById('teacher_edit_short'),
    teacherEditName: document.getElementById('teacher_edit_name'),
    teacherEditContact: document.getElementById('teacher_edit_contact'),
    teacherEditMail: document.getElementById('teacher_edit_mail'),
    teacherEditDesignation: document.getElementById('teacher_edit_designation'),
    teacherEditNewShort: document.getElementById('teacher_edit_new_short'),
    teacherEditNewName: document.getElementById('teacher_edit_new_name'),
    teacherEditNewContact: document.getElementById('teacher_edit_new_contact'),
    teacherEditNewMail: document.getElementById('teacher_edit_new_mail'),
    teacherEditNewDesignation: document.getElementById('teacher_edit_new_designation'),
    teacherEditNewSave: document.getElementById('teacher_edit_new_save'),
    teacherEditNewStatus: document.getElementById('teacher_edit_new_status'),
    updateTeacherBtn: document.getElementById('btn_update_teacher'),
    deleteTeacherBtn: document.getElementById('btn_delete_teacher'),
    teacherEditStatus: document.getElementById('teacher_edit_status'),
    teacherList: document.getElementById('teacher_list'),
    // Full Info Edit page
    fullDept: document.getElementById('full_dept'),
    fullSemester: document.getElementById('full_semester'),
    fullSection: document.getElementById('full_section'),
    fullDay: document.getElementById('full_day'),
    fullTime: document.getElementById('full_time'),
    fullCourse: document.getElementById('full_course'),
    fullCode: document.getElementById('full_code'),
    fullTeacher: document.getElementById('full_teacher'),
    fullRoom: document.getElementById('full_room'),
    fullList: document.getElementById('full_list'),
    fullStatus: document.getElementById('full_status'),
    fullAdd: document.getElementById('btn_full_add'),
    fullDel: document.getElementById('btn_full_delete'),
    fullPublish: document.getElementById('btn_full_publish'),
    fullTeacherSuggestions: document.getElementById('full_teacher_suggestions')
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

  function renderList(pagePrefix = 'a') {
    const listEl = document.getElementById(`${pagePrefix}_list`);
    if (!listEl) return;
    listEl.innerHTML = '';
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
        Array.from(listEl.children).forEach(n => n.classList.remove('selected'));
        li.classList.add('selected');
        const item = s;
        const timeEl = document.getElementById(`${pagePrefix}_time`);
        const courseEl = document.getElementById(`${pagePrefix}_course`);
        const codeEl = document.getElementById(`${pagePrefix}_code`);
        const teacherEl = document.getElementById(`${pagePrefix}_teacher`);
        const roomEl = document.getElementById(`${pagePrefix}_room`);
        const statusEl = document.getElementById(`${pagePrefix}_status`);
        if (timeEl) timeEl.value = item.time||'';
        if (courseEl) courseEl.value = item.course||'';
        if (codeEl) codeEl.value = item.code||'';
        if (teacherEl) teacherEl.value = item.teacher||'';
        if (roomEl) roomEl.value = item.room||'';
        if (statusEl) statusEl.textContent = `Editing slot #${idx+1}`;
      });
      listEl.appendChild(li);
    });
  }

  function listenDay(dept, sem, sec, day, pagePrefix = 'a') {
    if (activeRef) activeRef.off();
    const ref = db.ref(getRoutinePath(dept, sem, sec, day));
    activeRef = ref;
    ref.on('value', (snap) => {
      daySlots = Array.isArray(snap.val()) ? snap.val() : (snap.val() ? Object.values(snap.val()) : []);
      selectedIndex = -1;
      renderList(pagePrefix);
      const statusEl = document.getElementById(`${pagePrefix}_status`);
      if (statusEl) statusEl.textContent = `Loaded ${daySlots.length} slot(s).`;
    }, () => {
      const statusEl = document.getElementById(`${pagePrefix}_status`);
      if (statusEl) statusEl.textContent = 'Failed to load day; using last known data if any.';
    });
  }

  function currentSel(pagePrefix = 'a') {
    const deptEl = document.getElementById(`${pagePrefix === 'a' ? 'a' : pagePrefix}_department`) || 
                   document.getElementById(`${pagePrefix === 'a' ? 'a' : pagePrefix}_dept`);
    const semEl = document.getElementById(`${pagePrefix}_semester`);
    const secEl = document.getElementById(`${pagePrefix}_section`);
    const dayEl = document.getElementById(`${pagePrefix}_day`);
    const dept = deptEl ? deptEl.value.trim() : '';
    const sem = semEl ? semEl.value.trim() : '';
    const sec = secEl ? secEl.value.trim() : '';
    const day = dayEl ? dayEl.value.trim() : '';
    return { dept, sem, sec, day };
  }

  function validateInputs(pagePrefix = 'a') {
    const sel = currentSel(pagePrefix);
    if (!sel.dept || !sel.sem || !sel.sec || !sel.day) return 'Select department, semester, section, and day';
    const timeEl = document.getElementById(`${pagePrefix}_time`);
    const courseEl = document.getElementById(`${pagePrefix}_course`);
    const codeEl = document.getElementById(`${pagePrefix}_code`);
    const teacherEl = document.getElementById(`${pagePrefix}_teacher`);
    const roomEl = document.getElementById(`${pagePrefix}_room`);
    if (!timeEl?.value || !courseEl?.value || !codeEl?.value || !teacherEl?.value || !roomEl?.value) return 'Fill all fields';
    return '';
  }

  async function publishDay(pagePrefix = 'a') {
    const { dept, sem, sec, day } = currentSel(pagePrefix);
    if (!dept || !sem || !sec || !day) {
      const statusEl = document.getElementById(`${pagePrefix}_status`);
      if (statusEl) statusEl.textContent = 'Select department/semester/section/day first';
      return;
    }
    const sorted = sortSlots(daySlots);
    await db.ref(getRoutinePath(dept, sem, sec, day)).set(sorted);
    const statusEl = document.getElementById(`${pagePrefix}_status`);
    if (statusEl) statusEl.textContent = 'Published day successfully';
  }

  // Old event handlers removed - now handled in init() function

  // Section Info Management is now handled in separate page handlers above

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
      if (els.teacher && els.teacherShort) {
        const currentShort = els.teacher.value.trim();
        if (currentShort) {
          els.teacherShort.value = currentShort;
        }
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

    els.teacher.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query.length > 0) {
          const queryLower = query.toLowerCase();
          const matches = [];
          Object.entries(allTeachers).forEach(([shortForm, data]) => {
            const fullName = (data.fullName || '').toLowerCase();
            const shortFormLower = shortForm.toLowerCase();
            if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
              matches.push({ shortForm, fullName: data.fullName || shortForm });
            }
          });
            // If no matches, show add form
            if (matches.length === 0) {
              if (els.teacherNewForm) {
                els.teacherNewForm.classList.remove('hidden');
                // Pre-fill short form
                if (els.teacher && els.teacherShort) {
                  const currentShort = els.teacher.value.trim();
                  if (currentShort) {
                    els.teacherShort.value = currentShort;
                  }
                }
                if (els.teacherShort) els.teacherShort.focus();
                else if (els.teacherName) els.teacherName.focus();
              }
              if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
            }
        }
      }
    });

    els.teacher.addEventListener('blur', () => {
      setTimeout(() => {
        if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
      }, 200);
    });
  }

  // Save new teacher
  async function saveNewTeacher() {
    const shortForm = els.teacherShort?.value.trim() || els.teacher.value.trim();
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
      if (els.teacherShort) els.teacherShort.value = '';
      els.teacherName.value = '';
      els.teacherContact.value = '';
      els.teacherMail.value = '';
      els.teacherDesignation.value = '';
      // Set the teacher input to the short form
      if (els.teacher) els.teacher.value = shortForm;
      
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

  // ========== SIDE MENU NAVIGATION ==========
  function initSideMenu() {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    
    // Restore last active page from localStorage
    const lastActivePage = localStorage.getItem('adminActivePage') || 'dashboard';
    showPage(lastActivePage);
    
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const pageId = item.dataset.page;
        showPage(pageId);
      });
    });
  }
  
  function showPage(pageId) {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    const pages = document.querySelectorAll('.admin-page');
    
    // Update menu active state
    menuItems.forEach(mi => {
      if (mi.dataset.page === pageId) {
        mi.classList.add('active');
      } else {
        mi.classList.remove('active');
      }
    });
    
    // Update page visibility
    pages.forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });
    
    // Save to localStorage
    localStorage.setItem('adminActivePage', pageId);
    
    // Load dashboard data if dashboard page is selected
    if (pageId === 'dashboard') {
      loadDashboardData();
    }
  }
  
  // ========== DASHBOARD FUNCTIONALITY ==========
  async function loadDashboardData() {
    if (!db) return;
    
    try {
      // For demo purposes, we'll use mock data since Firebase Analytics requires proper setup
      // In production, you would use Firebase Analytics API or store analytics data in Realtime Database
      
      // Try to get analytics data from database (if stored)
      const analyticsRef = db.ref('analytics');
      const snap = await analyticsRef.once('value');
      const analyticsData = snap.val() || {};
      
      // Set default values if no data exists
      const totalUsers = analyticsData.totalUsers || 1250;
      const activeUsers = analyticsData.activeUsers || 342;
      const todayUsers = analyticsData.todayUsers || 89;
      const realtimeUsers = analyticsData.realtimeUsers || 12;
      
      const totalUsersGrowth = analyticsData.totalUsersGrowth || 12.5;
      const activeUsersGrowth = analyticsData.activeUsersGrowth || 8.3;
      const todayUsersGrowth = analyticsData.todayUsersGrowth || 5.2;
      
      // Update UI
      const totalUsersEl = document.getElementById('dashboard-total-users');
      const activeUsersEl = document.getElementById('dashboard-active-users');
      const todayUsersEl = document.getElementById('dashboard-today-users');
      const realtimeUsersEl = document.getElementById('dashboard-realtime-users');
      
      const totalUsersGrowthEl = document.getElementById('dashboard-total-users-growth');
      const activeUsersGrowthEl = document.getElementById('dashboard-active-users-growth');
      const todayUsersGrowthEl = document.getElementById('dashboard-today-users-growth');
      
      if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();
      if (activeUsersEl) activeUsersEl.textContent = activeUsers.toLocaleString();
      if (todayUsersEl) todayUsersEl.textContent = todayUsers.toLocaleString();
      if (realtimeUsersEl) realtimeUsersEl.textContent = realtimeUsers.toLocaleString();
      
      if (totalUsersGrowthEl) totalUsersGrowthEl.textContent = `${totalUsersGrowth}%`;
      if (activeUsersGrowthEl) activeUsersGrowthEl.textContent = `${activeUsersGrowth}%`;
      if (todayUsersGrowthEl) todayUsersGrowthEl.textContent = `${todayUsersGrowth}%`;
      
      // Set up real-time listener for real-time users (update every 5 seconds)
      if (analyticsRef) {
        analyticsRef.on('value', (snap) => {
          const data = snap.val() || {};
          if (realtimeUsersEl && data.realtimeUsers !== undefined) {
            realtimeUsersEl.textContent = data.realtimeUsers.toLocaleString();
          }
        });
      }
      
      // Simulate real-time updates (in production, this would come from Firebase Analytics)
      setInterval(() => {
        if (realtimeUsersEl) {
          const current = parseInt(realtimeUsersEl.textContent.replace(/,/g, '')) || 0;
          const change = Math.floor(Math.random() * 5) - 2; // Random change between -2 and +2
          const newValue = Math.max(0, current + change);
          realtimeUsersEl.textContent = newValue.toLocaleString();
        }
      }, 5000);
      
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
      // Set default values on error
      const totalUsersEl = document.getElementById('dashboard-total-users');
      const activeUsersEl = document.getElementById('dashboard-active-users');
      const todayUsersEl = document.getElementById('dashboard-today-users');
      const realtimeUsersEl = document.getElementById('dashboard-realtime-users');
      
      if (totalUsersEl) totalUsersEl.textContent = '0';
      if (activeUsersEl) activeUsersEl.textContent = '0';
      if (todayUsersEl) todayUsersEl.textContent = '0';
      if (realtimeUsersEl) realtimeUsersEl.textContent = '0';
    }
  }

  // ========== DEPARTMENT MANAGEMENT ==========
  async function loadDepartments() {
    try {
      const snap = await db.ref('departments').once('value');
      const deptData = snap.val();
      if (deptData && Array.isArray(deptData)) {
        departments = deptData.sort((a, b) => (a.order || 0) - (b.order || 0));
      } else if (deptData) {
        departments = Object.values(deptData).sort((a, b) => (a.order || 0) - (b.order || 0));
      } else {
        departments = [{ name: 'EEE', order: 0 }];
        await db.ref('departments').set(departments);
      }
      renderDepartments();
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to load departments:', e);
      departments = [{ name: 'EEE', order: 0 }];
      renderDepartments();
      updateAllDepartmentDropdowns();
    }
  }

  function renderDepartments() {
    if (!els.departmentList) return;
    els.departmentList.innerHTML = '';
    departments.forEach((dept, idx) => {
      const item = document.createElement('li');
      item.className = 'department-item';
      item.draggable = true;
      item.dataset.index = idx;
      item.dataset.dept = dept.name;
      item.innerHTML = `
        <span class="department-drag-handle">☰</span>
        <span class="department-name">${dept.name}</span>
        <div class="department-actions">
          <button class="ghost-btn small" onclick="window.adminDeleteDepartment('${dept.name}')" style="padding:4px 8px;font-size:11px;">Delete</button>
        </div>
      `;
      item.addEventListener('dragstart', (e) => {
        draggedElement = item;
        e.dataTransfer.effectAllowed = 'move';
        item.style.opacity = '0.5';
      });
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        draggedElement = null;
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedElement && draggedElement !== item) {
          const fromIndex = parseInt(draggedElement.dataset.index);
          const toIndex = parseInt(item.dataset.index);
          const moved = departments.splice(fromIndex, 1)[0];
          departments.splice(toIndex, 0, moved);
          departments.forEach((d, i) => d.order = i);
          saveDepartmentsOrder();
          renderDepartments();
        }
      });
      els.departmentList.appendChild(item);
    });
  }

  window.adminDeleteDepartment = async function(deptName) {
    if (!confirm(`Delete department "${deptName}"? This will also delete all its sections and routines.`)) return;
    departments = departments.filter(d => d.name !== deptName);
    departments.forEach((d, i) => d.order = i);
    await db.ref('departments').set(departments);
    await db.ref(`departmentSections/${deptName}`).remove();
    renderDepartments();
    updateAllDepartmentDropdowns();
  };

  async function saveDepartmentsOrder() {
    try {
      await db.ref('departments').set(departments);
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to save department order:', e);
    }
  }

  function updateAllDepartmentDropdowns() {
    const selects = [
      els.department, els.crDept, els.secInfoDept, els.versionDept, 
      els.fullDept, els.deptSectionDepartment
    ].filter(el => el);
    selects.forEach(select => {
      const currentVal = select.value;
      select.innerHTML = '<option value="">Select Department</option>';
      departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.name;
        opt.textContent = dept.name;
        if (dept.name === currentVal) opt.selected = true;
        select.appendChild(opt);
      });
    });
  }

  async function addDepartment() {
    const name = (els.newDepartmentName?.value || '').trim().toUpperCase();
    if (!name) {
      if (els.departmentStatus) els.departmentStatus.textContent = 'Enter department name.';
      return;
    }
    if (departments.find(d => d.name === name)) {
      if (els.departmentStatus) els.departmentStatus.textContent = 'Department already exists.';
      return;
    }
    try {
      const newDept = { name, order: departments.length };
      departments.push(newDept);
      await db.ref('departments').set(departments);
      if (els.newDepartmentName) els.newDepartmentName.value = '';
      if (els.departmentStatus) els.departmentStatus.textContent = `Added department "${name}".`;
      renderDepartments();
      updateAllDepartmentDropdowns();
    } catch (e) {
      if (els.departmentStatus) els.departmentStatus.textContent = 'Failed to add department.';
      console.error(e);
    }
  }

  async function loadDepartmentSections(dept, semester) {
    if (!dept || !semester) return [];
    try {
      const snap = await db.ref(`departmentSections/${dept}/${semester}`).once('value');
      return snap.val() || [];
    } catch (e) {
      return [];
    }
  }

  async function saveDepartmentSections(dept, semester, sections) {
    try {
      await db.ref(`departmentSections/${dept}/${semester}`).set(sections);
    } catch (e) {
      console.error('Failed to save sections:', e);
    }
  }

  async function updateSectionsDisplay() {
    const dept = els.deptSectionDepartment?.value;
    const sem = els.deptSectionSemester?.value;
    if (!els.sectionListDisplay) return;
    els.sectionListDisplay.innerHTML = '';
    if (!dept || !sem) {
      if (els.sectionStatus) els.sectionStatus.textContent = 'Select department and semester.';
      return;
    }
    const sections = await loadDepartmentSections(dept, sem);
    sections.forEach(sec => {
      const item = document.createElement('div');
      item.className = 'section-item';
      item.innerHTML = `
        <span>${sec}</span>
        <button class="ghost-btn small" onclick="window.adminDeleteSection('${dept}', '${sem}', '${sec}')" style="padding:4px 8px;font-size:11px;">Delete</button>
      `;
      els.sectionListDisplay.appendChild(item);
    });
    if (els.sectionStatus) els.sectionStatus.textContent = sections.length ? `Loaded ${sections.length} section(s).` : 'No sections.';
  }

  window.adminDeleteSection = async function(dept, sem, sec) {
    if (!confirm(`Delete section "${sec}" for ${dept} ${semLabel(sem)}?`)) return;
    const sections = await loadDepartmentSections(dept, sem);
    const newSections = sections.filter(s => s !== sec);
    await saveDepartmentSections(dept, sem, newSections);
    updateSectionsDisplay();
    updateSectionDropdowns(dept, sem);
  };

  async function addSection() {
    const dept = els.deptSectionDepartment?.value;
    const sem = els.deptSectionSemester?.value;
    const name = (els.newSectionName?.value || '').trim().toUpperCase();
    if (!dept || !sem) {
      if (els.sectionStatus) els.sectionStatus.textContent = 'Select department and semester first.';
      return;
    }
    if (!name) {
      if (els.sectionStatus) els.sectionStatus.textContent = 'Enter section name.';
      return;
    }
    const sections = await loadDepartmentSections(dept, sem);
    if (sections.includes(name)) {
      if (els.sectionStatus) els.sectionStatus.textContent = 'Section already exists.';
      return;
    }
    sections.push(name);
    await saveDepartmentSections(dept, sem, sections);
    if (els.newSectionName) els.newSectionName.value = '';
    if (els.sectionStatus) els.sectionStatus.textContent = `Added section "${name}".`;
    updateSectionsDisplay();
    updateSectionDropdowns(dept, sem);
  }

  function updateSectionDropdowns(dept, sem, selectId) {
    if (!dept || !sem) return;
    loadDepartmentSections(dept, sem).then(sections => {
      const selectIds = selectId ? [selectId] : [
        'a_section', 'cr_section', 'sec_info_section', 'full_section'
      ];
      selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Select Section</option>';
        sections.forEach(sec => {
          const opt = document.createElement('option');
          opt.value = sec;
          opt.textContent = sec;
          if (sec === currentVal) opt.selected = true;
          select.appendChild(opt);
        });
        select.disabled = sections.length === 0;
      });
    });
  }

  // Update routine path to include department
  function getRoutinePath(dept, sem, sec, day) {
    return `routines/${dept}/${sem}/${sec}/${day}`;
  }

  // ========== CR INFO EDIT PAGE ==========
  async function saveCRs() {
    const dept = els.crDept?.value.trim();
    const sem = els.crSemester?.value.trim();
    const sec = els.crSection?.value.trim();
    if (!dept || !sem || !sec) {
      if (els.crStatus) els.crStatus.textContent = 'Select department, semester, and section.';
      return;
    }
    const payload = {
      cr1: { 
        name: (els.crCr1Name?.value||'').trim(), 
        id: (els.crCr1Id?.value||'').trim(), 
        phone: (els.crCr1Phone?.value||'').trim() 
      },
      cr2: { 
        name: (els.crCr2Name?.value||'').trim(), 
        id: (els.crCr2Id?.value||'').trim(), 
        phone: (els.crCr2Phone?.value||'').trim() 
      }
    };
    try {
      await db.ref(`cr/${dept}/${sem}/${sec}`).set(payload);
      if (els.crStatus) els.crStatus.textContent = `Saved CRs for ${dept} ${sem} ${sec}.`;
    } catch (_) {
      if (els.crStatus) els.crStatus.textContent = 'Failed to save CRs.';
    }
  }

  async function loadCRs(dept, sem, sec) {
    if (!dept || !sem || !sec) return;
    try {
      const snap = await db.ref(`cr/${dept}/${sem}/${sec}`).once('value');
      const v = snap.val() || {};
      const cr1 = v.cr1 || {};
      const cr2 = v.cr2 || {};
      if (els.crCr1Name) els.crCr1Name.value = cr1.name || '';
      if (els.crCr1Id) els.crCr1Id.value = cr1.id || '';
      if (els.crCr1Phone) els.crCr1Phone.value = cr1.phone || '';
      if (els.crCr2Name) els.crCr2Name.value = cr2.name || '';
      if (els.crCr2Id) els.crCr2Id.value = cr2.id || '';
      if (els.crCr2Phone) els.crCr2Phone.value = cr2.phone || '';
      if (els.crStatus) els.crStatus.textContent = 'Loaded CR data.';
    } catch (_) {
      if (els.crStatus) els.crStatus.textContent = 'No CR data found.';
      if (els.crCr1Name) els.crCr1Name.value = '';
      if (els.crCr1Id) els.crCr1Id.value = '';
      if (els.crCr1Phone) els.crCr1Phone.value = '';
      if (els.crCr2Name) els.crCr2Name.value = '';
      if (els.crCr2Id) els.crCr2Id.value = '';
      if (els.crCr2Phone) els.crCr2Phone.value = '';
    }
  }

  // ========== SECTION INFO EDIT PAGE ==========
  async function saveSectionInfo() {
    const dept = els.secInfoDept?.value.trim();
    const sem = els.secInfoSemester?.value.trim();
    const sec = els.secInfoSection?.value.trim();
    if (!dept || !sem || !sec) {
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'Select department, semester, and section.';
      return;
    }
    const payload = {
      batch: (els.secInfoBatch?.value || '').trim(),
      totalStudents: (els.secInfoTotalStudents?.value || '').trim(),
      coordinatorName: (els.secInfoCoordinatorName?.value || '').trim(),
      coordinatorPhone: (els.secInfoCoordinatorPhone?.value || '').trim(),
      coordinatorEmail: (els.secInfoCoordinatorEmail?.value || '').trim()
    };
    try {
      await db.ref(`sectionInfo/${dept}/${sem}/${sec}`).set(payload);
      if (els.secInfoStatus) els.secInfoStatus.textContent = `Saved section info for ${dept} ${sem} ${sec}.`;
    } catch (_) {
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'Failed to save section info.';
    }
  }

  async function deleteSectionInfo() {
    const dept = els.secInfoDept?.value.trim();
    const sem = els.secInfoSemester?.value.trim();
    const sec = els.secInfoSection?.value.trim();
    if (!dept || !sem || !sec) {
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'Select department, semester, and section.';
      return;
    }
    if (!confirm(`Delete section info for ${dept} ${sem} ${sec}?`)) return;
    try {
      await db.ref(`sectionInfo/${dept}/${sem}/${sec}`).remove();
      if (els.secInfoBatch) els.secInfoBatch.value = '';
      if (els.secInfoTotalStudents) els.secInfoTotalStudents.value = '';
      if (els.secInfoCoordinatorName) els.secInfoCoordinatorName.value = '';
      if (els.secInfoCoordinatorPhone) els.secInfoCoordinatorPhone.value = '';
      if (els.secInfoCoordinatorEmail) els.secInfoCoordinatorEmail.value = '';
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'Section info deleted.';
    } catch (_) {
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'Failed to delete section info.';
    }
  }

  async function loadSectionInfo(dept, sem, sec) {
    if (!dept || !sem || !sec) return;
    try {
      const snap = await db.ref(`sectionInfo/${dept}/${sem}/${sec}`).once('value');
      const v = snap.val() || {};
      if (els.secInfoBatch) els.secInfoBatch.value = v.batch || '';
      if (els.secInfoTotalStudents) els.secInfoTotalStudents.value = v.totalStudents || '';
      if (els.secInfoCoordinatorName) els.secInfoCoordinatorName.value = v.coordinatorName || '';
      if (els.secInfoCoordinatorPhone) els.secInfoCoordinatorPhone.value = v.coordinatorPhone || '';
      if (els.secInfoCoordinatorEmail) els.secInfoCoordinatorEmail.value = v.coordinatorEmail || '';
      if (els.secInfoStatus) els.secInfoStatus.textContent = v.batch ? 'Loaded section info.' : 'No section info found.';
    } catch (_) {
      if (els.secInfoStatus) els.secInfoStatus.textContent = 'No section info found.';
    }
  }

  // ========== ROUTINE VERSION PAGE ==========
  async function saveVersion() {
    const dept = els.versionDept?.value.trim();
    const sem = els.versionSemester?.value.trim();
    if (!dept || !sem) {
      if (els.versionStatus) els.versionStatus.textContent = 'Select department and semester.';
      return;
    }
    const label = (els.versionLabel?.value || '').trim();
    if (!label) {
      if (els.versionStatus) els.versionStatus.textContent = 'Enter version label.';
      return;
    }
    try {
      await db.ref(`versions/${dept}/${sem}`).set(label);
      if (els.versionStatus) els.versionStatus.textContent = 'Saved version.';
    } catch (_) {
      if (els.versionStatus) els.versionStatus.textContent = 'Failed to save version.';
    }
  }

  async function loadVersion(dept, sem) {
    if (!dept || !sem) return;
    try {
      const snap = await db.ref(`versions/${dept}/${sem}`).once('value');
      const v = snap.val() || '';
      if (els.versionLabel) els.versionLabel.value = v;
      if (els.versionStatus) els.versionStatus.textContent = v ? 'Loaded version.' : 'No version set.';
    } catch (_) {
      if (els.versionStatus) els.versionStatus.textContent = 'Failed to load version.';
    }
  }

  // ========== TEACHER INFO EDIT PAGE ==========
  function showTeacherEditSuggestions(query) {
    if (!els.teacherEditSuggestions) return;
    const queryLower = query.toLowerCase().trim();
    const matches = [];
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      const fullName = (data.fullName || '').toLowerCase();
      const shortFormLower = shortForm.toLowerCase();
      if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
        matches.push({ shortForm, fullName: data.fullName || shortForm });
      }
    });
    els.teacherEditSuggestions.innerHTML = '';
    if (matches.length === 0 && queryLower.length > 0) {
      hideDropdown(els.teacherEditSuggestions);
      // Show new teacher form if no matches
      if (els.teacherEditNewForm) {
        els.teacherEditNewForm.classList.remove('hidden');
        // Pre-fill short form if it's being typed
        if (els.teacherEditSearch && els.teacherEditNewShort) {
          const currentShort = els.teacherEditSearch.value.trim();
          if (currentShort) {
            els.teacherEditNewShort.value = currentShort;
          }
        }
      }
      return;
    } else {
      // Hide new teacher form if there are matches
      if (els.teacherEditNewForm) {
        els.teacherEditNewForm.classList.add('hidden');
      }
    }
    matches.forEach(({ shortForm, fullName }) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `<div class="autocomplete-item-name">${fullName} (${shortForm})</div>`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadTeacherForEdit(shortForm);
        hideDropdown(els.teacherEditSuggestions);
        if (els.teacherEditNewForm) {
          els.teacherEditNewForm.classList.add('hidden');
        }
      });
      els.teacherEditSuggestions.appendChild(item);
    });
    showDropdown(els.teacherEditSuggestions);
  }

  async function loadTeacherForEdit(shortForm) {
    const teacher = allTeachers[shortForm];
    if (!teacher) return;
    if (els.teacherEditShort) els.teacherEditShort.value = shortForm;
    if (els.teacherEditName) els.teacherEditName.value = teacher.fullName || '';
    if (els.teacherEditContact) els.teacherEditContact.value = teacher.contact || '';
    if (els.teacherEditMail) els.teacherEditMail.value = teacher.mail || '';
    if (els.teacherEditDesignation) els.teacherEditDesignation.value = teacher.designation || '';
    if (els.teacherEditForm) els.teacherEditForm.classList.remove('hidden');
    if (els.teacherEditSearch) els.teacherEditSearch.value = shortForm;
    // Hide new teacher form when loading existing teacher
    if (els.teacherEditNewForm) els.teacherEditNewForm.classList.add('hidden');
  }

  async function updateTeacher() {
    const shortForm = els.teacherEditShort?.value.trim();
    if (!shortForm) {
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'No teacher selected.';
      return;
    }
    try {
      await db.ref(`teachers/${shortForm}`).set({
        fullName: (els.teacherEditName?.value || '').trim(),
        contact: (els.teacherEditContact?.value || '').trim(),
        mail: (els.teacherEditMail?.value || '').trim(),
        designation: (els.teacherEditDesignation?.value || '').trim()
      });
      loadAllTeachers();
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'Teacher updated successfully!';
    } catch (_) {
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'Failed to update teacher.';
    }
  }

  async function deleteTeacher() {
    const shortForm = els.teacherEditShort?.value.trim();
    if (!shortForm) {
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'No teacher selected.';
      return;
    }
    if (!confirm(`Delete teacher "${shortForm}"?`)) return;
    try {
      await db.ref(`teachers/${shortForm}`).remove();
      loadAllTeachers();
      if (els.teacherEditForm) els.teacherEditForm.classList.add('hidden');
      if (els.teacherEditSearch) els.teacherEditSearch.value = '';
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'Teacher deleted.';
    } catch (_) {
      if (els.teacherEditStatus) els.teacherEditStatus.textContent = 'Failed to delete teacher.';
    }
  }

  async function saveNewTeacherFromEdit() {
    const shortForm = els.teacherEditNewShort?.value.trim() || els.teacherEditSearch?.value.trim();
    const fullName = els.teacherEditNewName?.value.trim();
    const contact = els.teacherEditNewContact?.value.trim();
    const mail = els.teacherEditNewMail?.value.trim();
    const designation = els.teacherEditNewDesignation?.value.trim();

    if (!shortForm) {
      if (els.teacherEditNewStatus) els.teacherEditNewStatus.textContent = 'Enter teacher short form first.';
      return;
    }

    if (!fullName) {
      if (els.teacherEditNewStatus) els.teacherEditNewStatus.textContent = 'Enter teacher full name.';
      return;
    }

    // Check if teacher already exists
    if (allTeachers[shortForm]) {
      if (els.teacherEditNewStatus) els.teacherEditNewStatus.textContent = 'Teacher with this short form already exists.';
      return;
    }

    try {
      await db.ref(`teachers/${shortForm}`).set({
        fullName: fullName,
        contact: contact,
        mail: mail,
        designation: designation
      });
      
      if (els.teacherEditNewStatus) els.teacherEditNewStatus.textContent = 'Teacher saved successfully!';
      if (els.teacherEditNewForm) els.teacherEditNewForm.classList.add('hidden');
      // Clear form
      if (els.teacherEditNewShort) els.teacherEditNewShort.value = '';
      if (els.teacherEditNewName) els.teacherEditNewName.value = '';
      if (els.teacherEditNewContact) els.teacherEditNewContact.value = '';
      if (els.teacherEditNewMail) els.teacherEditNewMail.value = '';
      if (els.teacherEditNewDesignation) els.teacherEditNewDesignation.value = '';
      
      // Load the teacher for edit
      loadTeacherForEdit(shortForm);
      
      // Reload teachers
      loadAllTeachers();
    } catch (e) {
      if (els.teacherEditNewStatus) els.teacherEditNewStatus.textContent = 'Failed to save teacher.';
    }
  }

  function renderTeacherList() {
    if (!els.teacherList) return;
    els.teacherList.innerHTML = '';
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      const item = document.createElement('div');
      item.className = 'section-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <span><b>${shortForm}</b> - ${data.fullName || ''}</span>
      `;
      item.addEventListener('click', () => loadTeacherForEdit(shortForm));
      els.teacherList.appendChild(item);
    });
  }

  // ========== FULL INFO EDIT PAGE (Same as All Info but separate instance) ==========
  // This uses the same functions as All Info but with 'full' prefix
  // Handlers will be set up in init function

  // ========== ALL INFO EDIT PAGE - Updated to use department ==========
  // Event handlers are set up in init function

  // Fill all semester selects across all pages
  function fillAllSemesterSelects() {
    const semesterSelects = [
      'a_semester', 'cr_semester', 'sec_info_semester', 'version_semester', 
      'full_semester', 'dept_section_semester'
    ];
    
    semesterSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        // Save current value if exists
        const currentVal = select.value || '';
        // Clear and populate
        select.innerHTML = '';
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = 'Select Semester';
        select.appendChild(ph);
        semesters.forEach(sem => {
          const opt = document.createElement('option');
          opt.value = sem;
          opt.textContent = semLabel(sem);
          if (sem === currentVal) opt.selected = true;
          select.appendChild(opt);
        });
      } else {
        console.warn(`Select element not found: ${selectId}`);
      }
    });
  }

  // Init
  function init() {
    initSideMenu(); // This will restore the last active page and load dashboard if needed
    fillAllSemesterSelects();
    fillSemesters(); // Keep for backward compatibility
    loadAllTeachers();
    loadDepartments();
    
    // Department management handlers
    if (els.addDepartmentBtn) els.addDepartmentBtn.addEventListener('click', addDepartment);
    if (els.addSectionBtn) els.addSectionBtn.addEventListener('click', addSection);
    if (els.deptSectionDepartment) {
      els.deptSectionDepartment.addEventListener('change', updateSectionsDisplay);
    }
    if (els.deptSectionSemester) {
      els.deptSectionSemester.addEventListener('change', updateSectionsDisplay);
    }
    
    // CR Info Edit page handlers
    if (els.saveCrBtn) els.saveCrBtn.addEventListener('click', saveCRs);
    if (els.crSection) {
      els.crSection.addEventListener('change', () => {
        const dept = els.crDept?.value;
        const sem = els.crSemester?.value;
        const sec = els.crSection?.value;
        if (dept && sem && sec) loadCRs(dept, sem, sec);
      });
    }
    
    // Section Info Edit page handlers
    if (els.saveSecInfoBtn) els.saveSecInfoBtn.addEventListener('click', saveSectionInfo);
    if (els.deleteSecInfoBtn) els.deleteSecInfoBtn.addEventListener('click', deleteSectionInfo);
    if (els.secInfoSection) {
      els.secInfoSection.addEventListener('change', () => {
        const dept = els.secInfoDept?.value;
        const sem = els.secInfoSemester?.value;
        const sec = els.secInfoSection?.value;
        if (dept && sem && sec) loadSectionInfo(dept, sem, sec);
      });
    }
    
    // Routine Version page handlers
    if (els.saveVersionBtn) els.saveVersionBtn.addEventListener('click', saveVersion);
    if (els.versionSemester) {
      els.versionSemester.addEventListener('change', () => {
        const dept = els.versionDept?.value;
        const sem = els.versionSemester?.value;
        if (dept && sem) loadVersion(dept, sem);
      });
    }
    
    // Teacher Info Edit page handlers
    if (els.teacherEditSearch) {
      els.teacherEditSearch.addEventListener('input', (e) => {
        showTeacherEditSuggestions(e.target.value);
      });
      els.teacherEditSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query.length > 0) {
            const queryLower = query.toLowerCase();
            const matches = [];
            Object.entries(allTeachers).forEach(([shortForm, data]) => {
              const fullName = (data.fullName || '').toLowerCase();
              const shortFormLower = shortForm.toLowerCase();
              if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
                matches.push({ shortForm, fullName: data.fullName || shortForm });
              }
            });
            // If no matches, show add form
            if (matches.length === 0) {
              if (els.teacherEditNewForm) {
                els.teacherEditNewForm.classList.remove('hidden');
                // Pre-fill short form
                if (els.teacherEditSearch && els.teacherEditNewShort) {
                  const currentShort = els.teacherEditSearch.value.trim();
                  if (currentShort) {
                    els.teacherEditNewShort.value = currentShort;
                  }
                }
                if (els.teacherEditNewShort) els.teacherEditNewShort.focus();
                else if (els.teacherEditNewName) els.teacherEditNewName.focus();
              }
              if (els.teacherEditSuggestions) hideDropdown(els.teacherEditSuggestions);
            }
          }
        }
      });
      els.teacherEditSearch.addEventListener('blur', () => {
        setTimeout(() => {
          if (els.teacherEditSuggestions) hideDropdown(els.teacherEditSuggestions);
        }, 200);
      });
    }
    if (els.teacherEditNewSave) {
      els.teacherEditNewSave.addEventListener('click', saveNewTeacherFromEdit);
    }
    if (els.updateTeacherBtn) els.updateTeacherBtn.addEventListener('click', updateTeacher);
    if (els.deleteTeacherBtn) els.deleteTeacherBtn.addEventListener('click', deleteTeacher);
    
    // Load all teachers and render list
    db.ref('teachers').on('value', (snap) => {
      allTeachers = snap.val() || {};
      renderTeacherList();
    });
    
    // All Info Edit page - CR, Section Info, and Version handlers
    const aCr1Name = document.getElementById('a_cr1_name');
    const aCr1Id = document.getElementById('a_cr1_id');
    const aCr1Phone = document.getElementById('a_cr1_phone');
    const aCr2Name = document.getElementById('a_cr2_name');
    const aCr2Id = document.getElementById('a_cr2_id');
    const aCr2Phone = document.getElementById('a_cr2_phone');
    const aBtnSaveCr = document.getElementById('a_btn_save_cr');
    const aCrStatus = document.getElementById('a_cr_status');
    
    const aSectionInfoToggle = document.getElementById('a_sectionInfoToggle');
    const aSectionInfoForm = document.getElementById('a_sectionInfoForm');
    const aBatch = document.getElementById('a_batch');
    const aTotalStudents = document.getElementById('a_total_students');
    const aCoordinatorName = document.getElementById('a_coordinator_name');
    const aCoordinatorPhone = document.getElementById('a_coordinator_phone');
    const aCoordinatorEmail = document.getElementById('a_coordinator_email');
    const aBtnSaveSectionInfo = document.getElementById('a_btn_save_section_info');
    const aBtnDeleteSectionInfo = document.getElementById('a_btn_delete_section_info');
    const aSectionInfoStatus = document.getElementById('a_section_info_status');
    
    const aVersion = document.getElementById('a_version');
    const aBtnSaveVersion = document.getElementById('a_btn_save_version');
    const aVersionStatus = document.getElementById('a_version_status');
    
    // All Info Edit - CR save handler
    if (aBtnSaveCr) {
      aBtnSaveCr.addEventListener('click', async () => {
        const dept = els.department?.value.trim();
        const sem = els.semester?.value.trim();
        const sec = els.section?.value.trim();
        if (!dept || !sem || !sec) {
          if (aCrStatus) aCrStatus.textContent = 'Select department, semester, and section.';
          return;
        }
        const payload = {
          cr1: {
            name: (aCr1Name?.value || '').trim(),
            id: (aCr1Id?.value || '').trim(),
            phone: (aCr1Phone?.value || '').trim()
          },
          cr2: {
            name: (aCr2Name?.value || '').trim(),
            id: (aCr2Id?.value || '').trim(),
            phone: (aCr2Phone?.value || '').trim()
          }
        };
        try {
          await db.ref(`cr/${dept}/${sem}/${sec}`).set(payload);
          if (aCrStatus) aCrStatus.textContent = `Saved CRs for ${dept} ${sem} ${sec}.`;
        } catch (_) {
          if (aCrStatus) aCrStatus.textContent = 'Failed to save CRs.';
        }
      });
    }
    
    // All Info Edit - Load CRs when section changes
    if (els.section) {
      els.section.addEventListener('change', () => {
        const dept = els.department?.value;
        const sem = els.semester?.value;
        const sec = els.section?.value;
        if (dept && sem && sec) {
          // Load CR data
          db.ref(`cr/${dept}/${sem}/${sec}`).once('value').then(snap => {
            const v = snap.val() || {};
            const cr1 = v.cr1 || {};
            const cr2 = v.cr2 || {};
            if (aCr1Name) aCr1Name.value = cr1.name || '';
            if (aCr1Id) aCr1Id.value = cr1.id || '';
            if (aCr1Phone) aCr1Phone.value = cr1.phone || '';
            if (aCr2Name) aCr2Name.value = cr2.name || '';
            if (aCr2Id) aCr2Id.value = cr2.id || '';
            if (aCr2Phone) aCr2Phone.value = cr2.phone || '';
            if (aCrStatus) aCrStatus.textContent = 'Loaded CR data.';
          }).catch(() => {
            if (aCrStatus) aCrStatus.textContent = 'No CR data found.';
            if (aCr1Name) aCr1Name.value = '';
            if (aCr1Id) aCr1Id.value = '';
            if (aCr1Phone) aCr1Phone.value = '';
            if (aCr2Name) aCr2Name.value = '';
            if (aCr2Id) aCr2Id.value = '';
            if (aCr2Phone) aCr2Phone.value = '';
          });
          
          // Auto-load section info if exists
          db.ref(`sectionInfo/${dept}/${sem}/${sec}`).once('value').then(snap => {
            const v = snap.val() || {};
            if (v.batch && aSectionInfoToggle && aSectionInfoForm) {
              aSectionInfoToggle.checked = true;
              aSectionInfoForm.classList.remove('hidden');
            }
            if (aBatch) aBatch.value = v.batch || '';
            if (aTotalStudents) aTotalStudents.value = v.totalStudents || '';
            if (aCoordinatorName) aCoordinatorName.value = v.coordinatorName || '';
            if (aCoordinatorPhone) aCoordinatorPhone.value = v.coordinatorPhone || '';
            if (aCoordinatorEmail) aCoordinatorEmail.value = v.coordinatorEmail || '';
            if (aSectionInfoStatus) aSectionInfoStatus.textContent = v.batch ? 'Loaded section info.' : 'No section info found.';
          }).catch(() => {
            if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'No section info found.';
          });
        }
      });
    }
    
    // All Info Edit - Section Info toggle
    if (aSectionInfoToggle) {
      aSectionInfoToggle.addEventListener('change', () => {
        if (aSectionInfoForm) {
          if (aSectionInfoToggle.checked) {
            aSectionInfoForm.classList.remove('hidden');
            const dept = els.department?.value;
            const sem = els.semester?.value;
            const sec = els.section?.value;
            if (dept && sem && sec) {
              db.ref(`sectionInfo/${dept}/${sem}/${sec}`).once('value').then(snap => {
                const v = snap.val() || {};
                if (aBatch) aBatch.value = v.batch || '';
                if (aTotalStudents) aTotalStudents.value = v.totalStudents || '';
                if (aCoordinatorName) aCoordinatorName.value = v.coordinatorName || '';
                if (aCoordinatorPhone) aCoordinatorPhone.value = v.coordinatorPhone || '';
                if (aCoordinatorEmail) aCoordinatorEmail.value = v.coordinatorEmail || '';
                if (aSectionInfoStatus) aSectionInfoStatus.textContent = v.batch ? 'Loaded section info.' : 'No section info found.';
              }).catch(() => {
                if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'No section info found.';
              });
            }
          } else {
            aSectionInfoForm.classList.add('hidden');
          }
        }
      });
    }
    
    // All Info Edit - Save Section Info
    if (aBtnSaveSectionInfo) {
      aBtnSaveSectionInfo.addEventListener('click', async () => {
        const dept = els.department?.value.trim();
        const sem = els.semester?.value.trim();
        const sec = els.section?.value.trim();
        if (!dept || !sem || !sec) {
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'Select department, semester, and section.';
          return;
        }
        const payload = {
          batch: (aBatch?.value || '').trim(),
          totalStudents: (aTotalStudents?.value || '').trim(),
          coordinatorName: (aCoordinatorName?.value || '').trim(),
          coordinatorPhone: (aCoordinatorPhone?.value || '').trim(),
          coordinatorEmail: (aCoordinatorEmail?.value || '').trim()
        };
        try {
          await db.ref(`sectionInfo/${dept}/${sem}/${sec}`).set(payload);
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = `Saved section info for ${dept} ${sem} ${sec}.`;
        } catch (_) {
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'Failed to save section info.';
        }
      });
    }
    
    // All Info Edit - Delete Section Info
    if (aBtnDeleteSectionInfo) {
      aBtnDeleteSectionInfo.addEventListener('click', async () => {
        const dept = els.department?.value.trim();
        const sem = els.semester?.value.trim();
        const sec = els.section?.value.trim();
        if (!dept || !sem || !sec) {
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'Select department, semester, and section.';
          return;
        }
        if (!confirm(`Delete section info for ${dept} ${sem} ${sec}?`)) return;
        try {
          await db.ref(`sectionInfo/${dept}/${sem}/${sec}`).remove();
          if (aBatch) aBatch.value = '';
          if (aTotalStudents) aTotalStudents.value = '';
          if (aCoordinatorName) aCoordinatorName.value = '';
          if (aCoordinatorPhone) aCoordinatorPhone.value = '';
          if (aCoordinatorEmail) aCoordinatorEmail.value = '';
          if (aSectionInfoToggle) aSectionInfoToggle.checked = false;
          if (aSectionInfoForm) aSectionInfoForm.classList.add('hidden');
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'Section info deleted.';
        } catch (_) {
          if (aSectionInfoStatus) aSectionInfoStatus.textContent = 'Failed to delete section info.';
        }
      });
    }
    
    // All Info Edit - Save Version
    if (aBtnSaveVersion) {
      aBtnSaveVersion.addEventListener('click', async () => {
        const dept = els.department?.value.trim();
        const sem = els.semester?.value.trim();
        if (!dept || !sem) {
          if (aVersionStatus) aVersionStatus.textContent = 'Select department and semester.';
          return;
        }
        const label = (aVersion?.value || '').trim();
        if (!label) {
          if (aVersionStatus) aVersionStatus.textContent = 'Enter version label.';
          return;
        }
        try {
          await db.ref(`versions/${dept}/${sem}`).set(label);
          if (aVersionStatus) aVersionStatus.textContent = 'Saved version.';
        } catch (_) {
          if (aVersionStatus) aVersionStatus.textContent = 'Failed to save version.';
        }
      });
    }
    
    // All Info Edit - Load Version when semester changes
    if (els.semester) {
      els.semester.addEventListener('change', () => {
        const dept = els.department?.value;
        const sem = els.semester?.value;
        if (dept && sem) {
          db.ref(`versions/${dept}/${sem}`).once('value').then(snap => {
            const v = snap.val() || '';
            if (aVersion) aVersion.value = v;
            if (aVersionStatus) aVersionStatus.textContent = v ? 'Loaded version.' : 'No version set.';
          }).catch(() => {
            if (aVersionStatus) aVersionStatus.textContent = 'Failed to load version.';
          });
        }
      });
    }
    
    // All Info Edit page - updated handlers
    if (els.department && els.semester && els.section) {
      els.department.addEventListener('change', () => {
        const dept = els.department.value;
        const sem = els.semester.value;
        if (dept && sem) updateSectionDropdowns(dept, sem, 'a_section');
      });
      els.semester.addEventListener('change', () => {
        const dept = els.department.value;
        const sem = els.semester.value;
        if (dept && sem) updateSectionDropdowns(dept, sem, 'a_section');
      });
      els.section.addEventListener('change', () => {
        const { dept, sem, sec, day } = currentSel('a');
        if (dept && sem && sec && day) listenDay(dept, sem, sec, day, 'a');
      });
      if (els.day) {
        els.day.addEventListener('change', () => {
          const { dept, sem, sec, day } = currentSel('a');
          if (dept && sem && sec && day) listenDay(dept, sem, sec, day, 'a');
        });
      }
    }
    if (els.add) {
      els.add.addEventListener('click', async () => {
        const err = validateInputs('a');
        if (err) {
          if (els.status) els.status.textContent = err;
          return;
        }
        const { dept, sem } = currentSel('a');
        const timeEl = document.getElementById('a_time');
        const courseEl = document.getElementById('a_course');
        const codeEl = document.getElementById('a_code');
        const teacherEl = document.getElementById('a_teacher');
        const roomEl = document.getElementById('a_room');
        const slot = {
          time: timeEl?.value.trim() || '',
          course: courseEl?.value.trim() || '',
          code: codeEl?.value.trim() || '',
          teacher: teacherEl?.value.trim() || '',
          room: roomEl?.value.trim() || ''
        };
        if (selectedIndex >= 0) {
          daySlots[selectedIndex] = slot;
          selectedIndex = -1;
          if (els.status) els.status.textContent = 'Updated slot locally. Click Publish to save.';
        } else {
          daySlots.push(slot);
          if (els.status) els.status.textContent = 'Added slot locally. Click Publish to save.';
        }
        renderList('a');
      });
    }
    if (els.del) {
      els.del.addEventListener('click', () => {
        if (selectedIndex < 0) {
          if (els.status) els.status.textContent = 'Select a slot to delete.';
          return;
        }
        const slot = daySlots[selectedIndex];
        const slotInfo = `${slot.time || 'Unknown time'} - ${slot.course || slot.code || 'Unknown course'}`;
        if (!confirm(`Delete slot?\n\n${slotInfo}`)) return;
        daySlots.splice(selectedIndex, 1);
        selectedIndex = -1;
        renderList('a');
        if (els.status) els.status.textContent = 'Deleted slot locally. Click Publish to save.';
      });
    }
    if (els.publish) {
      els.publish.addEventListener('click', () => {
        publishDay('a').catch(() => {
          if (els.status) els.status.textContent = 'Failed to publish.';
        });
      });
    }
    
    // Full Info Edit page - same handlers as All Info but with 'full' prefix
    if (els.fullDept && els.fullSemester && els.fullSection) {
      els.fullDept.addEventListener('change', () => {
        const dept = els.fullDept.value;
        const sem = els.fullSemester.value;
        if (dept && sem) updateSectionDropdowns(dept, sem, 'full_section');
      });
      els.fullSemester.addEventListener('change', () => {
        const dept = els.fullDept.value;
        const sem = els.fullSemester.value;
        if (dept && sem) updateSectionDropdowns(dept, sem, 'full_section');
      });
      els.fullSection.addEventListener('change', () => {
        const { dept, sem, sec, day } = currentSel('full');
        if (dept && sem && sec && day) listenDay(dept, sem, sec, day, 'full');
      });
      if (els.fullDay) {
        els.fullDay.addEventListener('change', () => {
          const { dept, sem, sec, day } = currentSel('full');
          if (dept && sem && sec && day) listenDay(dept, sem, sec, day, 'full');
        });
      }
    }
    if (els.fullAdd) {
      els.fullAdd.addEventListener('click', async () => {
        const err = validateInputs('full');
        if (err) {
          if (els.fullStatus) els.fullStatus.textContent = err;
          return;
        }
        const timeEl = document.getElementById('full_time');
        const courseEl = document.getElementById('full_course');
        const codeEl = document.getElementById('full_code');
        const teacherEl = document.getElementById('full_teacher');
        const roomEl = document.getElementById('full_room');
        const slot = {
          time: timeEl?.value.trim() || '',
          course: courseEl?.value.trim() || '',
          code: codeEl?.value.trim() || '',
          teacher: teacherEl?.value.trim() || '',
          room: roomEl?.value.trim() || ''
        };
        if (selectedIndex >= 0) {
          daySlots[selectedIndex] = slot;
          selectedIndex = -1;
          if (els.fullStatus) els.fullStatus.textContent = 'Updated slot locally. Click Publish to save.';
        } else {
          daySlots.push(slot);
          if (els.fullStatus) els.fullStatus.textContent = 'Added slot locally. Click Publish to save.';
        }
        renderList('full');
      });
    }
    if (els.fullDel) {
      els.fullDel.addEventListener('click', () => {
        if (selectedIndex < 0) {
          if (els.fullStatus) els.fullStatus.textContent = 'Select a slot to delete.';
          return;
        }
        const slot = daySlots[selectedIndex];
        if (!confirm(`Delete slot?`)) return;
        daySlots.splice(selectedIndex, 1);
        selectedIndex = -1;
        renderList('full');
        if (els.fullStatus) els.fullStatus.textContent = 'Deleted slot locally. Click Publish to save.';
      });
    }
    if (els.fullPublish) {
      els.fullPublish.addEventListener('click', () => {
        publishDay('full').catch(() => {
          if (els.fullStatus) els.fullStatus.textContent = 'Failed to publish.';
        });
      });
    }
    
    // Teacher autocomplete for All Info and Full Info pages
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
    if (els.teacherSave) {
      els.teacherSave.addEventListener('click', saveNewTeacher);
    }
    if (els.fullTeacher) {
      els.fullTeacher.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        showAdminTeacherSuggestions(query);
      });
      els.fullTeacher.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query.length > 0) {
            const queryLower = query.toLowerCase();
            const matches = [];
            Object.entries(allTeachers).forEach(([shortForm, data]) => {
              const fullName = (data.fullName || '').toLowerCase();
              const shortFormLower = shortForm.toLowerCase();
              if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
                matches.push({ shortForm, fullName: data.fullName || shortForm });
              }
            });
            // If no matches, show add form (for All Info page)
            if (matches.length === 0) {
              if (els.teacherNewForm) {
                els.teacherNewForm.classList.remove('hidden');
                if (els.teacherName) els.teacherName.focus();
              }
              if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
            }
          }
        }
      });
    }
    
    // Event handlers for department management
    if (els.addDepartmentBtn) els.addDepartmentBtn.addEventListener('click', addDepartment);
    if (els.addSectionBtn) els.addSectionBtn.addEventListener('click', addSection);
    if (els.deptSectionDepartment) els.deptSectionDepartment.addEventListener('change', updateSectionsDisplay);
    if (els.deptSectionSemester) els.deptSectionSemester.addEventListener('change', updateSectionsDisplay);
    
    // Department change handlers for all pages
    [els.department, els.crDept, els.secInfoDept, els.versionDept, els.fullDept].forEach(select => {
      if (select) {
        select.addEventListener('change', function() {
          const dept = this.value;
          const sem = this.closest('.admin-page')?.querySelector('[id$="_semester"]')?.value;
          if (dept && sem) updateSectionDropdowns(dept, sem);
        });
      }
    });

    // Semester change handlers
    [els.semester, els.crSemester, els.secInfoSemester, els.versionSemester, els.fullSemester].forEach(select => {
      if (select) {
        select.addEventListener('change', function() {
          const sem = this.value;
          const dept = this.closest('.admin-page')?.querySelector('[id$="_dept"]')?.value || 
                      this.closest('.admin-page')?.querySelector('[id$="_department"]')?.value;
          if (dept && sem) updateSectionDropdowns(dept, sem);
        });
      }
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();


