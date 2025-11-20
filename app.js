(function () {
  const PRIMARY_COLOR = '#6C63FF';
  const DAYS_ORDER = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'];

  // Firebase init (Compat SDK included via index.html)
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
  const db = window.firebase ? window.firebase.database() : null;

  // Live routine dataset keyed by semester->section->day (filled from RTDB or cache)
  const routineData = {};

  // Define how many sections per semester (example: some 5, some 3)
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

  // Live CR details loaded from DB
  const crDetails = {};
  // Live version labels loaded from DB
  const versionLabels = {};

  const els = {
    screens: {
      landing: document.getElementById('landing'),
      student: document.getElementById('student'),
      teacher: document.getElementById('teacher'),
      empty: document.getElementById('empty'),
      query: document.getElementById('query')
    },
    // Query screen elements
    roomQueryTab: document.getElementById('roomQueryTab'),
    crInfoTab: document.getElementById('crInfoTab'),
    roomQueryInterface: document.getElementById('roomQueryInterface'),
    crInfoInterface: document.getElementById('crInfoInterface'),
    roomQueryDepartment: document.getElementById('roomQueryDepartment'),
    roomQuerySearchBy: document.getElementById('roomQuerySearchBy'),
    roomQueryThirdSelect: document.getElementById('roomQueryThirdSelect'),
    roomQueryThirdLabel: document.getElementById('roomQueryThirdLabel'),
    roomQueryDaySelectorWrapper: document.getElementById('roomQueryDaySelectorWrapper'),
    roomQueryDayTitle: document.getElementById('roomQueryDayTitle'),
    roomQueryDayScroller: document.getElementById('roomQueryDayScroller'),
    roomQueryDateToday: document.getElementById('roomQueryDateToday'),
    roomQueryResults: document.getElementById('roomQueryResults'),
    crInfoDepartment: document.getElementById('crInfoDepartment'),
    crInfoSemester: document.getElementById('crInfoSemester'),
    crInfoSection: document.getElementById('crInfoSection'),
    crInfoResults: document.getElementById('crInfoResults'),
    department: document.getElementById('department'),
    lottie: document.getElementById('lottie'),
    getSchedule: document.getElementById('getSchedule'),
    landingError: document.getElementById('landingError'),
    semester: document.getElementById('semester'),
    section: document.getElementById('section'),
    // student screen
    departmentDisplay: document.getElementById('departmentDisplay'),
    semesterDisplay: document.getElementById('semesterDisplay'),
    sectionDisplay: document.getElementById('sectionDisplay'),
    // removed edit/apply buttons; direct editing instead
    detailsSemester: document.getElementById('detailsSemester'),
    detailsSection: document.getElementById('detailsSection'),
    detailsTotal: document.getElementById('detailsTotal'),
    detailsVersion: document.getElementById('detailsVersion'),
    detailsCR1: document.getElementById('detailsCR1'),
    detailsCR2: document.getElementById('detailsCR2'),
    dayScroller: document.getElementById('dayScroller'),
    dateToday: document.getElementById('dateToday'),
    scheduleContainer: document.getElementById('scheduleContainer'),
    emptyMessage: document.getElementById('emptyMessage'),
    emptyLottie: document.getElementById('emptyLottie'),
    networkMessage: document.getElementById('networkMessage'),
    tabs: Array.from(document.querySelectorAll('.tabbar .tab')),
    // teacher screen
    teacherSearch: document.getElementById('teacherSearch'),
    teacherSuggestions: document.getElementById('teacherSuggestions'),
    teacherDepartment: document.getElementById('teacherDepartment'),
    teacherDetailsName: document.getElementById('teacherDetailsName'),
    teacherDetailsBatch: document.getElementById('teacherDetailsBatch'),
    teacherDetailsTotal: document.getElementById('teacherDetailsTotal'),
    teacherDetailsVersion: document.getElementById('teacherDetailsVersion'),
    teacherDayScroller: document.getElementById('teacherDayScroller'),
    teacherDateToday: document.getElementById('teacherDateToday'),
    teacherScheduleContainer: document.getElementById('teacherScheduleContainer'),
    teacherEmptyMessage: document.getElementById('teacherEmptyMessage'),
    teacherNetworkMessage: document.getElementById('teacherNetworkMessage'),
    teacherContactBtn: document.getElementById('teacherContactBtn'),
    teacherContactPopup: document.getElementById('teacherContactPopup'),
    teacherContactClose: document.getElementById('teacherContactClose'),
    teacherContactTitle: document.getElementById('teacherContactTitle'),
    teacherContactDesignation: document.getElementById('teacherContactDesignation'),
    teacherContactPhone: document.getElementById('teacherContactPhone'),
    teacherContactEmail: document.getElementById('teacherContactEmail'),
    teacherContactDepartment: document.getElementById('teacherContactDepartment')
  };

  function enableRipple(node) {
    if (!node || node.dataset.ripple === 'true') return;
    node.dataset.ripple = 'true';
    node.addEventListener('pointerdown', handleRipple);
  }

  function handleRipple(event) {
    const target = event.currentTarget;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    const maxDimension = Math.max(rect.width, rect.height);
    const baseSize = Math.min(Math.max(maxDimension * 1.35, 80), 140);
    const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY);
    const originX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const originY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    ripple.style.width = ripple.style.height = `${baseSize}px`;
    ripple.style.left = `${originX - baseSize / 2}px`;
    ripple.style.top = `${originY - baseSize / 2}px`;
    ripple.style.animationDuration = '360ms';
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // Init Lottie animation (first visit landing screen)
  function initLottie() {
    if (!window.lottie || !els.lottie) return;
    try {
      window.lottie.loadAnimation({
        container: els.lottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://assets10.lottiefiles.com/packages/lf20_mK7G3Y.json' // student working
      });
    } catch (_) {}
  }

  // Track empty Lottie animation instance
  let emptyLottieInstance = null;

  // Init empty Lottie animation (panda sleeping)
  function initEmptyLottie() {
    // Wait for Lottie library to be available
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      console.warn('Lottie library not loaded yet, retrying...');
      // Retry after a short delay
      setTimeout(() => {
        initEmptyLottie();
      }, 100);
      return;
    }
    if (!els.emptyLottie) {
      console.warn('Empty Lottie container not found');
      return;
    }
    // Check if container is visible
    if (els.emptyMessage.classList.contains('hidden')) {
      console.warn('Empty message is hidden, skipping animation load');
      return;
    }
    // Destroy previous instance if exists
    if (emptyLottieInstance) {
      emptyLottieInstance.destroy();
      emptyLottieInstance = null;
    }
    // Clear container before loading new animation
    els.emptyLottie.innerHTML = '';
    
    // Fetch the JSON file and load it
    fetch('animation_file/Panda sleeping waiting lottie animation.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (els.emptyMessage.classList.contains('hidden')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          console.error('Lottie library not available when trying to load animation');
          return;
        }
        try {
          emptyLottieInstance = window.lottie.loadAnimation({
            container: els.emptyLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          console.log('Lottie animation loaded successfully');
        } catch (e) {
          console.error('Failed to initialize Lottie animation:', e);
        }
      })
      .catch(error => {
        console.error('Failed to load empty Lottie animation file:', error);
        // Fallback: try using path directly
        if (!els.emptyMessage.classList.contains('hidden') && window.lottie && typeof window.lottie.loadAnimation === 'function') {
          try {
            emptyLottieInstance = window.lottie.loadAnimation({
              container: els.emptyLottie,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              path: 'animation_file/Panda sleeping waiting lottie animation.json'
            });
            console.log('Lottie animation loaded using path fallback');
          } catch (e2) {
            console.error('Fallback path method also failed:', e2);
          }
        }
      });
  }

  // Utilities
  function setScreen(name) {
    Object.entries(els.screens).forEach(([key, node]) => {
      if (!node) return;
      if (key === name) node.classList.remove('hidden'); else node.classList.add('hidden');
    });
    els.tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
    
    // Update icons based on active page
    updateTabIcons(name);
    
    // Convert landing screen selects to custom dropdowns
    if (name === 'landing') {
      setTimeout(() => {
        [els.department, els.semester, els.section].forEach(select => {
          if (select && !select.dataset.converted) {
            convertSelectToCustomDropdown(select);
          }
        });
      }, 50);
    }
    
    // Convert selects to custom dropdowns when student screen is shown
    if (name === 'student') {
      setTimeout(() => {
        if (els.departmentDisplay && !els.departmentDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.departmentDisplay);
        }
        if (els.semesterDisplay && !els.semesterDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.semesterDisplay);
        }
        if (els.sectionDisplay && !els.sectionDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.sectionDisplay);
        }
      }, 50);
    }
    
    // Convert selects to custom dropdowns when teacher screen is shown
    if (name === 'teacher') {
      setTimeout(() => {
        if (els.teacherDepartment && !els.teacherDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.teacherDepartment);
        }
      }, 50);
    }
    
    // Convert selects to custom dropdowns when query screen is shown
    if (name === 'query') {
      setTimeout(() => {
        // Hide day selector initially (will show after selecting a value)
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
        
        // Room Query Interface dropdowns
        if (els.roomQueryDepartment && !els.roomQueryDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQueryDepartment);
        }
        if (els.roomQuerySearchBy && !els.roomQuerySearchBy.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQuerySearchBy);
        }
        if (els.roomQueryThirdSelect && !els.roomQueryThirdSelect.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQueryThirdSelect);
        }
        // CR Info Interface dropdowns
        if (els.crInfoDepartment && !els.crInfoDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoDepartment);
        }
        if (els.crInfoSemester && !els.crInfoSemester.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoSemester);
        }
        if (els.crInfoSection && !els.crInfoSection.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoSection);
        }
      }, 50);
    }
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

  // Convert native select to custom animated dropdown
  function convertSelectToCustomDropdown(selectElement) {
    if (!selectElement || selectElement.dataset.converted === 'true') return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-dropdown-button';
    if (selectElement.disabled) button.classList.add('disabled');
    
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu hidden';
    
    // Get current selected option
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    button.textContent = selectedOption ? selectedOption.textContent : '';
    
    // Populate menu with options
    function updateMenu() {
      menu.innerHTML = '';
      Array.from(selectElement.options).forEach((option, index) => {
        const item = document.createElement('div');
        item.className = 'custom-dropdown-item';
        if (option.selected) item.classList.add('selected');
        if (option.disabled) item.classList.add('disabled');
        item.textContent = option.textContent;
        item.dataset.value = option.value;
        item.dataset.index = index;
        
        item.addEventListener('click', (e) => {
          if (option.disabled) return;
          e.stopPropagation();
          selectElement.selectedIndex = index;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          button.textContent = option.textContent;
          hideDropdown(menu);
          button.classList.remove('open');
          // Update selected state
          menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });
        
        menu.appendChild(item);
      });
    }
    
    updateMenu();
    
    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectElement.disabled) return;
      
      const isOpen = menu.classList.contains('showing');
      
      // Close all other dropdowns
      document.querySelectorAll('.custom-dropdown-menu.showing').forEach(dd => {
        if (dd !== menu) {
          hideDropdown(dd);
          dd.closest('.custom-dropdown')?.querySelector('.custom-dropdown-button')?.classList.remove('open');
        }
      });
      
      if (isOpen) {
        hideDropdown(menu);
        button.classList.remove('open');
      } else {
        showDropdown(menu);
        button.classList.add('open');
      }
    });
    
    // Close dropdown when clicking outside - handled by global listener
    
    // Update button when select changes programmatically
    const observer = new MutationObserver(() => {
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      button.textContent = selectedOption ? selectedOption.textContent : '';
      updateMenu();
    });
    observer.observe(selectElement, { childList: true, attributes: true, attributeFilter: ['selected'] });
    
    // Handle disabled state changes
    const disabledObserver = new MutationObserver(() => {
      if (selectElement.disabled) {
        button.classList.add('disabled');
        hideDropdown(menu);
        button.classList.remove('open');
      } else {
        button.classList.remove('disabled');
      }
    });
    disabledObserver.observe(selectElement, { attributes: true, attributeFilter: ['disabled'] });
    
    wrapper.appendChild(button);
    wrapper.appendChild(menu);
    
    // Replace select with custom dropdown
    selectElement.style.display = 'none';
    selectElement.dataset.converted = 'true';
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement); // Keep select for form submission
    
    return wrapper;
  }

  // Update tab icons based on active page
  function updateTabIcons(activeTab) {
    const studentIcon = document.getElementById('student-icon');
    const teacherIcon = document.getElementById('teacher-icon');
    const queryIcon = document.getElementById('query-icon');
    
    if (!studentIcon || !teacherIcon || !queryIcon) return;
    
    // Reset all icons to inactive state
    if (activeTab === 'student') {
      studentIcon.src = 'attachment/student.png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
    } else if (activeTab === 'teacher') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card.png';
      queryIcon.src = 'attachment/history (1).png';
    } else if (activeTab === 'query') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history.png';
    } else {
      // For landing or other pages, use inactive icons
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
    }
  }

  // Cache helpers for offline support
  function getCacheKey(semester, section) {
    return `cse.routine.${semester}.${section}`;
  }

  function saveRoutineToCache(semester, section, data) {
    try {
      localStorage.setItem(getCacheKey(semester, section), JSON.stringify(data || {}));
    } catch (_) {}
  }

  function loadRoutineFromCache(semester, section) {
    try {
      const raw = localStorage.getItem(getCacheKey(semester, section));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function ensureNested(obj, k1, k2) {
    if (!obj[k1]) obj[k1] = {};
    if (!obj[k1][k2]) obj[k1][k2] = { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
    return obj[k1][k2];
  }

  let currentSemester = '';
  let currentSection = '';
  let currentDay = '';
  
  // Teacher page state
  let allTeachers = {}; // { shortForm: { fullName, contact, mail, designation } }
  let currentTeacherShort = '';
  let currentTeacherDept = '';
  let teacherRoutineData = {}; // { semester: { section: { day: [slots] } } }
  let currentTeacherDay = '';
  let activeTeacherDbRef = null;

  // Attach real-time listener to RTDB path routines/{semester}/{section}
  let activeDbRef = null;
  function attachRoutineListener(semester, section) {
    if (!db) return;
    if (activeDbRef) activeDbRef.off();
    const ref = db.ref(`routines/${semester}/${section}`);
    activeDbRef = ref;
    ref.on('value', (snap) => {
      const value = snap.val() || { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
      ensureNested(routineData, semester, section);
      routineData[semester][section] = value;
      saveRoutineToCache(semester, section, value);
      // If user is viewing this sem/sec, refresh current day
      if (semester === currentSemester && section === currentSection) {
        const dayToRender = currentDay || getTodayInfo().dayName || 'Saturday';
        renderDay(dayToRender);
      }
    }, () => {
      // On error, fallback silently; UI shows last cached
    });

    // Also listen to CRs for this semester and section
    try {
      db.ref(`cr/${semester}/${section}`).on('value', (snap) => {
        if (!crDetails[semester]) crDetails[semester] = {};
        crDetails[semester][section] = snap.val() || null;
        updateCRUI(semester, section);
      });
      // Also listen to version for this semester
      db.ref(`versions/${semester}`).on('value', (snap) => {
        versionLabels[semester] = snap.val() || '';
        updateVersionUI(semester);
        // Update teacher version if on teacher page
        if (currentTeacherShort) {
          updateTeacherVersionInfo();
        }
      });
    } catch (_) {}
  }

  function persistSelection(semester, section) {
    localStorage.setItem('cse.semester', semester);
    localStorage.setItem('cse.section', section);
    localStorage.setItem('cse.hasVisited', '1');
  }

  function getPersistedSelection() {
    const semester = localStorage.getItem('cse.semester');
    const section = localStorage.getItem('cse.section');
    return semester && section ? { semester, section } : null;
  }

  function getTodayInfo() {
    const now = new Date();
    const wd = now.getDay(); // 0 Sun .. 6 Sat
    // Map to our Saturday-first order index (Friday removed)
    const map = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    const dayName = map[wd];
    const dd = String(now.getDate()).padStart(2, '0');
    const short = now.toLocaleString(undefined, { weekday: 'short' });
    return { dayName, label: `${short} ${dd}` };
  }

  function getDateForDay(dayName) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Saturday': 6 };
    const targetDay = dayMap[dayName];
    
    // Calculate days to add to get to the target day
    let daysToAdd = targetDay - currentDay;
    
    // If the target day has already passed this week, show next week's date
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    return String(targetDate.getDate()).padStart(2, '0');
  }

  // Map internal semester codes (1-1) to displayed labels (1st, 2nd, ...)
  function semLabel(code) {
    const map = {
      '1-1': '1st', '1-2': '2nd',
      '2-1': '3rd', '2-2': '4th',
      '3-1': '5th', '3-2': '6th',
      '4-1': '7th', '4-2': '8th'
    };
    return map[code] || code || '';
  }

  // Landing: Get Schedule
  els.getSchedule.addEventListener('click', () => {
    const sem = els.semester.value.trim();
    const sec = els.section.value.trim();
    if (!sem || !sec) {
      els.landingError.textContent = 'Please select Semester and Section.';
      return;
    }
    els.landingError.textContent = '';
    persistSelection(sem, sec);
    loadStudent(sem, sec);
    setScreen('student');
  });

  // Bottom tabs
  els.tabs.forEach(btn => {
    enableRipple(btn);
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      setScreen(tab);
      // Load last teacher when teacher tab is clicked
      if (tab === 'teacher') {
        setTimeout(() => {
          loadLastTeacher();
        }, 100);
      }
    });
  });

  // Landing: dependent section options
  els.semester.addEventListener('change', () => {
    const sem = els.semester.value.trim();
    populateSections(els.section, sem);
  });

  // Student screen: direct change handlers
  function onStudentSemesterChange() {
    const sem = els.semesterDisplay.value.trim();
    populateSections(els.sectionDisplay, sem);
    const sec = els.sectionDisplay.value.trim();
    if (sem && sec) {
      persistSelection(sem, sec);
      loadStudent(sem, sec);
    }
  }

  function onStudentSectionChange() {
    const sem = els.semesterDisplay.value.trim();
    const sec = els.sectionDisplay.value.trim();
    if (sem && sec) {
      persistSelection(sem, sec);
      loadStudent(sem, sec);
    }
  }

  // Days scroller build
  function buildDays(activeDay) {
    els.dayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;
      
      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0,3);
      
      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);
      
      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderDay(day));
      enableRipple(btn);
      els.dayScroller.appendChild(btn);
    });
  }

  function renderDay(day) {
    const sem = els.semesterDisplay.value;
    const sec = els.sectionDisplay.value;
    currentDay = day;
    // Update day active UI
    Array.from(els.dayScroller.children).forEach(btn => {
      if (btn.classList.contains('day')) {
        btn.classList.toggle('active', btn.title === day);
      }
    });
    // Update date hint for chosen day if it's today
    const today = getTodayInfo();
    els.dateToday.textContent = day === today.dayName ? today.label : '';

    try {
      const items = (((routineData || {})[sem] || {})[sec] || {})[day] || [];
      renderSchedule(items);
    } catch (e) {
      showNetworkError();
    }
  }

  function renderSchedule(items) {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.add('hidden');
    // Destroy empty Lottie animation when there are items
    if (emptyLottieInstance) {
      emptyLottieInstance.destroy();
      emptyLottieInstance = null;
    }
    if (!items || items.length === 0) {
      // Show empty message first
      els.emptyMessage.classList.remove('hidden');
      // Wait a bit longer to ensure the element is fully visible in the DOM
      // Initialize Lottie animation when showing empty message
      setTimeout(() => {
        initEmptyLottie();
      }, 150);
      return;
    }
    els.detailsTotal.textContent = String(items.length);
    for (const it of items) {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = it.time.replace('-', '→');

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = it.course;

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', it.code));
      grid.appendChild(kv('Section', (it.section || els.sectionDisplay.value)));
  grid.appendChild(kv('Semester', semLabel(els.semesterDisplay.value)));
      grid.appendChild(kv('Room', it.room));

      const teacher = document.createElement('div');
      teacher.className = 'kv';
      const k = document.createElement('span'); k.textContent = 'Teacher:';
      const v = document.createElement('b'); v.innerHTML = `<span class="teacher" data-t="${it.teacher}">${it.teacher}</span>`;
      teacher.appendChild(k); teacher.appendChild(v);

      main.appendChild(title);
      main.appendChild(grid);
      main.appendChild(teacher);

      card.appendChild(time);
      card.appendChild(main);
      els.scheduleContainer.appendChild(card);
    }

    els.scheduleContainer.querySelectorAll('.teacher').forEach(node => {
      node.addEventListener('click', () => {
        alert(`Teacher: ${node.dataset.t}`);
      });
    });
  }

  function kv(label, value) {
    const el = document.createElement('div');
    el.className = 'kv';
    const k = document.createElement('span'); k.textContent = label + ':';
    const v = document.createElement('b'); v.textContent = value;
    el.appendChild(k); el.appendChild(v);
    return el;
  }

  function showNetworkError() {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.remove('hidden');
  }

  function loadStudent(semester, section) {
    // Fill disabled displays
    fillSemesterSelect(els.semesterDisplay, semester);
    populateSections(els.sectionDisplay, semester, section);
  els.detailsSemester.textContent = semLabel(semester);
  els.detailsSection.textContent = section;

    updateCRUI(semester, section);

    // Track current selection
    currentSemester = semester;
    currentSection = section;

    // Load from cache immediately for offline/first paint
    const cached = loadRoutineFromCache(semester, section);
    if (cached) {
      ensureNested(routineData, semester, section);
      routineData[semester][section] = cached;
    } else {
      // ensure path exists to avoid errors before data arrives
      ensureNested(routineData, semester, section);
    }

    // Subscribe to live updates
    attachRoutineListener(semester, section);

    // Build day scroller and select default (today if present)
    const today = getTodayInfo();
    buildDays(today.dayName);

    // Render today or first day from cache; live listener will refresh
    const startDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    renderDay(startDay);

    // Show version label if loaded
    updateVersionUI(semester);
  }

  function fillSemesterSelect(select, selected) {
    const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Semester';
    select.appendChild(placeholder);
    semesters.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s; opt.textContent = semLabel(s); if (s === selected) opt.selected = true;
      select.appendChild(opt);
    });
    // wire listeners once
    if (!select.__wired) {
      select.addEventListener('change', onStudentSemesterChange);
      select.__wired = true;
    }
    // Update custom dropdown if it exists
    const customWrapper = select.closest('.custom-dropdown');
    if (customWrapper) {
      const button = customWrapper.querySelector('.custom-dropdown-button');
      const menu = customWrapper.querySelector('.custom-dropdown-menu');
      if (button && menu) {
        const selectedOption = select.options[select.selectedIndex];
        button.textContent = selectedOption ? selectedOption.textContent : '';
        menu.innerHTML = '';
        Array.from(select.options).forEach((option, index) => {
          const item = document.createElement('div');
          item.className = 'custom-dropdown-item';
          if (option.selected) item.classList.add('selected');
          if (option.disabled) item.classList.add('disabled');
          item.textContent = option.textContent;
          item.dataset.value = option.value;
          item.dataset.index = index;
          
          item.addEventListener('click', (e) => {
            if (option.disabled) return;
            e.stopPropagation();
            select.selectedIndex = index;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            button.textContent = option.textContent;
            hideDropdown(menu);
            button.classList.remove('open');
            menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
          });
          
          menu.appendChild(item);
        });
      }
    }
  }

  function populateSections(select, semester, selectedSection) {
    const list = semesterToSections[semester] || [];
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = list.length ? 'Select Section' : 'Select Section';
    select.appendChild(placeholder);
    list.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec; opt.textContent = sec; if (sec === selectedSection) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = list.length === 0;
    // attach handler if student select
    if (select.id === 'sectionDisplay' && !select.__wired) {
      select.addEventListener('change', onStudentSectionChange);
      select.__wired = true;
    }
    // Update custom dropdown if it exists
    const customWrapper = select.closest('.custom-dropdown');
    if (customWrapper) {
      const button = customWrapper.querySelector('.custom-dropdown-button');
      const menu = customWrapper.querySelector('.custom-dropdown-menu');
      if (button && menu) {
        const selectedOption = select.options[select.selectedIndex];
        button.textContent = selectedOption ? selectedOption.textContent : '';
        if (select.disabled) {
          button.classList.add('disabled');
        } else {
          button.classList.remove('disabled');
        }
        menu.innerHTML = '';
        Array.from(select.options).forEach((option, index) => {
          const item = document.createElement('div');
          item.className = 'custom-dropdown-item';
          if (option.selected) item.classList.add('selected');
          if (option.disabled) item.classList.add('disabled');
          item.textContent = option.textContent;
          item.dataset.value = option.value;
          item.dataset.index = index;
          
          item.addEventListener('click', (e) => {
            if (option.disabled) return;
            e.stopPropagation();
            select.selectedIndex = index;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            button.textContent = option.textContent;
            hideDropdown(menu);
            button.classList.remove('open');
            menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
          });
          
          menu.appendChild(item);
        });
      }
    }
  }

  function updateCRUI(semester, section) {
    const node1 = document.getElementById('detailsCR1');
    const node2 = document.getElementById('detailsCR2');
    if (!node1 || !node2) return;
    const info = ((crDetails[semester] || {})[section]) || null;
    if (info && (info.cr1 || info.cr2)) {
      const cr1 = info.cr1 || {};
      const cr2 = info.cr2 || {};
      node1.textContent = cr1.name ? `${cr1.name} (${cr1.phone||''})` : 'Not assigned';
      node2.textContent = cr2.name ? `${cr2.name} (${cr2.phone||''})` : 'Not assigned';
    } else {
      node1.textContent = 'Not assigned';
      node2.textContent = 'Not assigned';
    }
  }

  function updateVersionUI(semester) {
    const node = document.getElementById('detailsVersion');
    if (!node) return;
    const label = versionLabels[semester] || '';
    node.textContent = label || '—';
  }

  // ========== TEACHER PAGE FUNCTIONALITY ==========
  
  // Load all teachers from database
  function loadAllTeachers() {
    if (!db) return;
    db.ref('teachers').on('value', (snap) => {
      const teachers = snap.val() || {};
      allTeachers = teachers;
    });
  }

  // Teacher search autocomplete
  function showTeacherSuggestions(query) {
    if (!els.teacherSuggestions) return;
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    const matches = [];
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      const fullName = (data.fullName || '').toLowerCase();
      const shortFormLower = shortForm.toLowerCase();
      
      if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
        matches.push({ shortForm, fullName: data.fullName || shortForm });
      }
    });

    els.teacherSuggestions.innerHTML = '';
    if (matches.length === 0) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

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
        els.teacherSearch.value = shortForm;
        hideDropdown(els.teacherSuggestions);
        currentTeacherShort = shortForm;
        // Save last searched teacher
        localStorage.setItem('cse.lastTeacher', shortForm);
        localStorage.setItem('cse.lastTeacherDept', els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept);
        // Update teacher details
        const teacherInfo = allTeachers[shortForm] || {};
        if (els.teacherDetailsName) {
          els.teacherDetailsName.textContent = shortForm;
        }
        // Load routine if department is already selected
        const dept = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept;
        if (dept) {
          currentTeacherDept = dept;
          loadTeacherRoutine(shortForm, dept);
        }
      };
      item.addEventListener('mousedown', handleSelect);
      item.addEventListener('touchstart', handleSelect);
      els.teacherSuggestions.appendChild(item);
    });
    showDropdown(els.teacherSuggestions);
  }

  // Teacher search input handler
  if (els.teacherSearch) {
    els.teacherSearch.addEventListener('input', (e) => {
      showTeacherSuggestions(e.target.value);
    });

    els.teacherSearch.addEventListener('blur', () => {
      // Hide suggestions after a delay to allow clicks
      setTimeout(() => {
        if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
      }, 200);
    });
  }

  // Teacher department change handler
  if (els.teacherDepartment) {
    els.teacherDepartment.addEventListener('change', () => {
      currentTeacherDept = els.teacherDepartment.value;
      // Save to localStorage
      if (currentTeacherShort) {
        localStorage.setItem('cse.lastTeacher', currentTeacherShort);
        localStorage.setItem('cse.lastTeacherDept', currentTeacherDept);
        loadTeacherRoutine(currentTeacherShort, currentTeacherDept);
      }
    });
    
    // Initialize department value
    currentTeacherDept = els.teacherDepartment.value;
  }

  // Teacher Contact Popup handlers
  function showTeacherContactPopup() {
    if (!currentTeacherShort || !els.teacherContactPopup) return;
    
    const teacherInfo = allTeachers[currentTeacherShort] || {};
    const fullName = teacherInfo.fullName || currentTeacherShort;
    const designation = teacherInfo.designation || '—';
    const phone = teacherInfo.contact || '—';
    const email = teacherInfo.mail || '—';
    const department = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept || '—';
    
    // Set popup content
    if (els.teacherContactTitle) {
      els.teacherContactTitle.textContent = `${fullName} (${currentTeacherShort})`;
    }
    if (els.teacherContactDesignation) {
      els.teacherContactDesignation.textContent = designation;
    }
    if (els.teacherContactPhone) {
      els.teacherContactPhone.textContent = phone;
    }
    if (els.teacherContactEmail) {
      els.teacherContactEmail.textContent = email;
    }
    if (els.teacherContactDepartment) {
      els.teacherContactDepartment.textContent = department;
    }
    
    // Show popup with animation
    els.teacherContactPopup.classList.remove('hidden');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('showing');
    }, 10);
  }

  function hideTeacherContactPopup() {
    if (!els.teacherContactPopup) return;
    els.teacherContactPopup.classList.remove('showing');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('hidden');
    }, 200);
  }

  if (els.teacherContactBtn) {
    els.teacherContactBtn.addEventListener('click', () => {
      if (currentTeacherShort) {
        showTeacherContactPopup();
      }
    });
  }

  if (els.teacherContactClose) {
    els.teacherContactClose.addEventListener('click', hideTeacherContactPopup);
  }

  // Close popup when clicking outside
  if (els.teacherContactPopup) {
    els.teacherContactPopup.addEventListener('click', (e) => {
      if (e.target === els.teacherContactPopup) {
        hideTeacherContactPopup();
      }
    });
  }

  // Close popup with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.teacherContactPopup && els.teacherContactPopup.classList.contains('showing')) {
      hideTeacherContactPopup();
    }
  });

  // Load teacher routine for selected teacher and department
  function loadTeacherRoutine(teacherShort, department) {
    if (!db || !teacherShort || !department) return;
    
    // Clear previous listener
    if (activeTeacherDbRef) {
      activeTeacherDbRef.off();
      activeTeacherDbRef = null;
    }

    // Update UI
    if (els.teacherDetailsName) {
      els.teacherDetailsName.textContent = teacherShort;
    }

    // Load all routines and filter by teacher
    teacherRoutineData = {};
    const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
    let loadedCount = 0;
    const totalLoads = semesters.reduce((sum, sem) => sum + (semesterToSections[sem] || []).length, 0);
    
    semesters.forEach(sem => {
      const sections = semesterToSections[sem] || [];
      sections.forEach(sec => {
        const ref = db.ref(`routines/${sem}/${sec}`);
        ref.once('value', (snap) => {
          const dayData = snap.val() || {};
          DAYS_ORDER.forEach(day => {
            const slots = dayData[day] || [];
            const teacherSlots = slots.filter(slot => 
              slot.teacher && slot.teacher.toLowerCase().trim() === teacherShort.toLowerCase().trim()
            );
            
            if (teacherSlots.length > 0) {
              if (!teacherRoutineData[sem]) teacherRoutineData[sem] = {};
              if (!teacherRoutineData[sem][sec]) teacherRoutineData[sem][sec] = {};
              teacherRoutineData[sem][sec][day] = teacherSlots;
            }
          });
          
          loadedCount++;
          // When all data is loaded, show today's day (don't shift to other days)
          if (loadedCount === totalLoads) {
            // Always use today's day, don't shift to days with classes
            const today = getTodayInfo();
            const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
            
            // Build day scroller and render
            buildTeacherDays(dayToShow);
            renderTeacherDay(dayToShow);
            
            // Update batch info (show all semesters that have classes)
            updateTeacherBatchInfo();
            updateTeacherVersionInfo();
          }
        });
      });
    });

    // Build day scroller initially (will be updated when data loads)
    const today = getTodayInfo();
    buildTeacherDays(today.dayName);
  }
  
  // Update teacher batch info
  function updateTeacherBatchInfo() {
    if (!els.teacherDetailsBatch) return;
    const semesters = new Set();
    Object.keys(teacherRoutineData).forEach(sem => {
      semesters.add(sem);
    });
    const batchLabels = Array.from(semesters).map(sem => semLabel(sem)).join(', ');
    els.teacherDetailsBatch.textContent = batchLabels || '—';
  }
  
  // Update teacher version info
  function updateTeacherVersionInfo() {
    if (!els.teacherDetailsVersion) return;
    // Get version from first semester that has classes
    const firstSem = Object.keys(teacherRoutineData)[0];
    if (firstSem && versionLabels[firstSem]) {
      els.teacherDetailsVersion.textContent = versionLabels[firstSem];
    } else {
      els.teacherDetailsVersion.textContent = '—';
    }
  }

  // Build teacher days scroller
  function buildTeacherDays(activeDay) {
    if (!els.teacherDayScroller) return;
    els.teacherDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;
      
      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0,3);
      
      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);
      
      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderTeacherDay(day));
      enableRipple(btn);
      els.teacherDayScroller.appendChild(btn);
    });
  }

  // Render teacher day schedule
  function renderTeacherDay(day) {
    if (!els.teacherScheduleContainer) return;
    currentTeacherDay = day;
    
    // Update day active UI
    if (els.teacherDayScroller) {
      Array.from(els.teacherDayScroller.children).forEach(btn => {
        if (btn.classList.contains('day')) {
          btn.classList.toggle('active', btn.title === day);
        }
      });
    }

    // Update date hint
    const today = getTodayInfo();
    if (els.teacherDateToday) {
      els.teacherDateToday.textContent = day === today.dayName ? today.label : '';
    }

    // Collect all classes for this day across all semesters/sections
    const allClasses = [];
    Object.entries(teacherRoutineData).forEach(([sem, sections]) => {
      Object.entries(sections).forEach(([sec, days]) => {
        const daySlots = days[day] || [];
        daySlots.forEach(slot => {
          allClasses.push({
            ...slot,
            semester: sem,
            section: sec
          });
        });
      });
    });

    // Sort by time
    allClasses.sort((a, b) => {
      const timeA = parseTime(a.time || '0:00');
      const timeB = parseTime(b.time || '0:00');
      return timeA - timeB;
    });

    // Render
    els.teacherScheduleContainer.innerHTML = '';
    els.teacherEmptyMessage?.classList.add('hidden');
    els.teacherNetworkMessage?.classList.add('hidden');

    if (allClasses.length === 0) {
      els.teacherEmptyMessage?.classList.remove('hidden');
      if (els.teacherDetailsTotal) els.teacherDetailsTotal.textContent = '0';
      return;
    }

    if (els.teacherDetailsTotal) {
      els.teacherDetailsTotal.textContent = String(allClasses.length);
    }

    allClasses.forEach(slot => {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = (slot.time || '').replace('-', '→');

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = slot.course || '';

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', slot.code || ''));
      grid.appendChild(kv('Section', slot.section || ''));
      grid.appendChild(kv('Semester', semLabel(slot.semester || '')));
      grid.appendChild(kv('Room', slot.room || ''));

      main.appendChild(title);
      main.appendChild(grid);

      card.appendChild(time);
      card.appendChild(main);
      els.teacherScheduleContainer.appendChild(card);
    });
  }

  function parseTime(timeStr) {
    const m = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return parseInt(m[1],10) * 60 + parseInt(m[2],10);
  }

  // Load last searched teacher when teacher tab is clicked
  function loadLastTeacher() {
    const lastTeacher = localStorage.getItem('cse.lastTeacher');
    const lastDept = localStorage.getItem('cse.lastTeacherDept') || 'EEE';
    
    if (lastTeacher && els.teacherSearch && els.teacherDepartment) {
      els.teacherSearch.value = lastTeacher;
      els.teacherDepartment.value = lastDept;
      currentTeacherShort = lastTeacher;
      currentTeacherDept = lastDept;
      if (els.teacherDetailsName) {
        els.teacherDetailsName.textContent = lastTeacher;
      }
      // Load version labels for all semesters
      const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
      semesters.forEach(sem => {
        if (db) {
          db.ref(`versions/${sem}`).once('value', (snap) => {
            versionLabels[sem] = snap.val() || '';
          });
        }
      });
      loadTeacherRoutine(lastTeacher, lastDept);
    }
  }

  function initEntry() {
    initLottie();
    // Initialize landing selectors
    // semester options already in HTML; ensure section is gated
    populateSections(els.section, els.semester.value.trim());
    // Force department to EEE always
    try {
      if (els.department) {
        els.department.value = 'EEE';
        els.department.addEventListener('change', () => { els.department.value = 'EEE'; });
      }
      if (els.departmentDisplay) {
        els.departmentDisplay.value = 'EEE';
        els.departmentDisplay.addEventListener('change', () => { els.departmentDisplay.value = 'EEE'; });
      }
    } catch (_) {}
    
    // Set up global click handler for closing dropdowns
    if (!document.__dropdownCloseHandler) {
      document.__dropdownCloseHandler = true;
      document.addEventListener('click', (e) => {
        document.querySelectorAll('.custom-dropdown-menu.showing').forEach(openMenu => {
          const openWrapper = openMenu.closest('.custom-dropdown');
          if (openWrapper && !openWrapper.contains(e.target)) {
            hideDropdown(openMenu);
            openWrapper.querySelector('.custom-dropdown-button')?.classList.remove('open');
          }
        });
      }, true);
    }
    
    // Convert student page selects to custom animated dropdowns (if student screen is shown)
    // This will be handled by setScreen when student screen is displayed
    
    // Load teachers
    loadAllTeachers();
    
    const persisted = getPersistedSelection();
    const hasVisited = localStorage.getItem('cse.hasVisited') === '1';
    if (persisted && hasVisited) {
      // Skip landing, go straight to student
      loadStudent(persisted.semester, persisted.section);
      setScreen('student');
    } else {
      // Show landing
      setScreen('landing');
    }
  }

  // ========== QUERY PAGE FUNCTIONALITY ==========
  
  // Tab switching for Room Query / CR Info
  if (els.roomQueryTab && els.crInfoTab) {
    els.roomQueryTab.addEventListener('click', () => {
      els.roomQueryTab.classList.add('active');
      els.crInfoTab.classList.remove('active');
      els.roomQueryInterface.classList.remove('hidden');
      els.crInfoInterface.classList.add('hidden');
    });
    
    els.crInfoTab.addEventListener('click', () => {
      els.crInfoTab.classList.add('active');
      els.roomQueryTab.classList.remove('active');
      els.crInfoInterface.classList.remove('hidden');
      els.roomQueryInterface.classList.add('hidden');
    });
  }

  // Room Query functionality
  let roomQueryCurrentDay = null;
  let roomQuerySelectedTimeSlot = null;
  
  // Format time slot to AM/PM format
  function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    return timeSlot.split(' - ').map(time => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const m = minutes || '00';
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHour}:${m} ${period}`;
    }).join(' - ');
  }
  
  // Build day scroller for room query
  function buildRoomQueryDays(activeDay) {
    if (!els.roomQueryDayScroller) return;
    els.roomQueryDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;
      
      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0,3);
      
      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);
      
      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => {
        roomQueryCurrentDay = day;
        // Update active state
        Array.from(els.roomQueryDayScroller.children).forEach(b => {
          if (b.classList.contains('day')) {
            b.classList.toggle('active', b.title === day);
          }
        });
        // Update date hint
        const today = getTodayInfo();
        if (els.roomQueryDateToday) {
          els.roomQueryDateToday.textContent = day === today.dayName ? today.label : '';
        }
        // Re-run query if we have selections
        const searchBy = els.roomQuerySearchBy?.value;
        const value = els.roomQueryThirdSelect?.value;
        const department = els.roomQueryDepartment?.value || 'EEE';
        if (searchBy === 'room' && value) {
          queryRoomByNumber(value, department);
        } else if (searchBy === 'timeslot' && value) {
          queryRoomByTimeSlot(value, department, day);
        }
      });
      enableRipple(btn);
      els.roomQueryDayScroller.appendChild(btn);
    });
    
    // Set initial day to today
    const today = getTodayInfo();
    roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    if (els.roomQueryDateToday) {
      els.roomQueryDateToday.textContent = roomQueryCurrentDay === today.dayName ? today.label : '';
    }
  }
  
  function populateRoomNumbers(department) {
    if (!els.roomQueryThirdSelect) return;
    els.roomQueryThirdSelect.innerHTML = '<option value="">Select Room</option>';
    els.roomQueryThirdSelect.disabled = true;
    
    if (!db || !department) return;
    
    // Collect all unique room numbers from all routines for this department
    const allRooms = new Set();
    const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
    
    let loadCount = 0;
    const totalLoads = semesters.reduce((sum, sem) => sum + (semesterToSections[sem] || []).length, 0);
    
    semesters.forEach(sem => {
      const sections = semesterToSections[sem] || [];
      sections.forEach(sec => {
        db.ref(`routines/${sem}/${sec}`).once('value', (snap) => {
          const dayData = snap.val() || {};
          DAYS_ORDER.forEach(day => {
            const slots = dayData[day] || [];
            slots.forEach(slot => {
              if (slot.room) allRooms.add(slot.room);
            });
          });
          
          loadCount++;
          if (loadCount === totalLoads) {
            const sortedRooms = Array.from(allRooms).sort();
            sortedRooms.forEach(room => {
              const opt = document.createElement('option');
              opt.value = room;
              opt.textContent = room;
              els.roomQueryThirdSelect.appendChild(opt);
            });
            els.roomQueryThirdSelect.disabled = false;
          }
        });
      });
    });
  }

  function populateTimeSlots() {
    if (!els.roomQueryThirdSelect) return;
    const timeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    
    els.roomQueryThirdSelect.innerHTML = '<option value="">Select Time Slot</option>';
    timeSlots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = slot;
      els.roomQueryThirdSelect.appendChild(opt);
    });
    els.roomQueryThirdSelect.disabled = false;
  }

  function queryRoomByNumber(roomNumber, department) {
    if (!db || !roomNumber) return;
    
    // All possible time slots
    const allTimeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    
    const occupiedSlots = new Set();
    const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
    let loadCount = 0;
    const totalLoads = semesters.reduce((sum, sem) => sum + (semesterToSections[sem] || []).length, 0);
    
    // Check all days for room number search (no day filter)
    semesters.forEach(sem => {
      const sections = semesterToSections[sem] || [];
      sections.forEach(sec => {
        db.ref(`routines/${sem}/${sec}`).once('value', (snap) => {
          const dayData = snap.val() || {};
          DAYS_ORDER.forEach(day => {
            const slots = dayData[day] || [];
            slots.forEach(slot => {
              if (slot.room === roomNumber && slot.time) {
                occupiedSlots.add(slot.time);
              }
            });
          });
          
          loadCount++;
          if (loadCount === totalLoads) {
            // Find free time slots (across all days)
            const freeSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot));
            renderRoomQueryResults(freeSlots.map(slot => ({ room: roomNumber, timeSlot: slot })), 'room', roomNumber);
          }
        });
      });
    });
  }

  function queryRoomByTimeSlot(timeSlot, department, selectedDay) {
    if (!db || !timeSlot) return;
    if (!selectedDay) selectedDay = roomQueryCurrentDay || DAYS_ORDER[0];
    
    // Get all rooms from department routines
    const allRooms = new Set();
    const occupiedRooms = new Set();
    const semesters = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
    let loadCount = 0;
    const totalLoads = semesters.reduce((sum, sem) => sum + (semesterToSections[sem] || []).length, 0);
    
    semesters.forEach(sem => {
      const sections = semesterToSections[sem] || [];
      sections.forEach(sec => {
        db.ref(`routines/${sem}/${sec}`).once('value', (snap) => {
          const dayData = snap.val() || {};
          const slots = dayData[selectedDay] || [];
          slots.forEach(slot => {
            if (slot.room) {
              allRooms.add(slot.room);
              if (slot.time === timeSlot) {
                occupiedRooms.add(slot.room);
              }
            }
          });
          
          loadCount++;
          if (loadCount === totalLoads) {
            // Find free rooms for this time slot on selected day
            const freeRooms = Array.from(allRooms).filter(room => !occupiedRooms.has(room));
            renderRoomQueryResults(freeRooms.map(room => ({ room: room, timeSlot: timeSlot })), 'timeslot', timeSlot, selectedDay);
          }
        });
      });
    });
  }

  function renderRoomQueryResults(data, type, queryValue, selectedDay) {
    if (!els.roomQueryResults) return;
    els.roomQueryResults.innerHTML = '';
    
    if (data.length === 0) {
      if (type === 'room') {
        els.roomQueryResults.innerHTML = '<div class="empty">No free time slots available for this room.</div>';
      } else {
        els.roomQueryResults.innerHTML = '<div class="empty">No empty rooms available for this time slot on the selected day.</div>';
      }
      return;
    }
    
    if (type === 'timeslot') {
      // Display empty rooms as full-width blocks (same style as room number search)
      const container = document.createElement('div');
      container.className = 'room-query-free-slots';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.marginTop = '16px';
      
      data.forEach(item => {
        const block = document.createElement('div');
        block.className = 'room-query-free-slot-block';
        block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%;';
        
        const title = document.createElement('div');
        title.className = 'room-query-free-slot-title';
        title.style.cssText = 'color: var(--text); margin-bottom: 6px;';
        title.textContent = `Room: ${item.room}`;
        
        const subtitle = document.createElement('div');
        subtitle.className = 'room-query-free-slot-time';
        subtitle.style.cssText = 'color: var(--muted);';
        subtitle.textContent = item.timeSlot;
        
        block.appendChild(title);
        block.appendChild(subtitle);
        container.appendChild(block);
      });
      
      els.roomQueryResults.appendChild(container);
    } else {
      // Display free time slots as full-width blocks for room number search (one after another)
      const container = document.createElement('div');
      container.className = 'room-query-free-slots';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.marginTop = '16px';
      
      data.forEach(item => {
        const block = document.createElement('div');
        block.className = 'room-query-free-slot-block';
        block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%;';
        
        const title = document.createElement('div');
        title.className = 'room-query-free-slot-title';
        title.style.cssText = 'color: var(--text); margin-bottom: 6px;';
        title.textContent = `Room: ${item.room}`;
        
        const subtitle = document.createElement('div');
        subtitle.className = 'room-query-free-slot-time';
        subtitle.style.cssText = 'color: var(--muted);';
        subtitle.textContent = item.timeSlot;
        
        block.appendChild(title);
        block.appendChild(subtitle);
        container.appendChild(block);
      });
      
      els.roomQueryResults.appendChild(container);
    }
  }

  // Room Query event handlers
  if (els.roomQuerySearchBy) {
    els.roomQuerySearchBy.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy.value;
      
      // Clear previous selections and results when changing search type
      if (els.roomQueryThirdSelect) {
        els.roomQueryThirdSelect.value = '';
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select Option</option>';
      }
      if (els.roomQueryResults) {
        els.roomQueryResults.innerHTML = '';
      }
      // Hide and clear day selector when search type changes (will show after selecting value)
      if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
      if (els.roomQueryDayScroller) els.roomQueryDayScroller.innerHTML = '';
      if (els.roomQueryDateToday) els.roomQueryDateToday.textContent = '';
      roomQuerySelectedTimeSlot = null;
      roomQueryCurrentDay = null;
      
      if (searchBy === 'room') {
        els.roomQueryThirdLabel.textContent = 'Room Number';
        populateRoomNumbers(els.roomQueryDepartment?.value || 'EEE');
      } else if (searchBy === 'timeslot') {
        els.roomQueryThirdLabel.textContent = 'Time Slot';
        populateTimeSlots();
      } else {
        els.roomQueryThirdSelect.disabled = true;
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select type</option>';
        els.roomQueryResults.innerHTML = '';
      }
    });
  }

  if (els.roomQueryThirdSelect) {
    els.roomQueryThirdSelect.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      const value = els.roomQueryThirdSelect.value;
      const department = els.roomQueryDepartment?.value || 'EEE';
      
      if (searchBy === 'room' && value) {
        // Show day selector for room number search
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            els.roomQueryDayTitle.textContent = `Free slots for Room ${value}`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        queryRoomByNumber(value, department);
      } else if (searchBy === 'timeslot' && value) {
        roomQuerySelectedTimeSlot = value;
        // Show day selector for time slot search (empty rooms)
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            const formattedTime = formatTimeSlot(value);
            els.roomQueryDayTitle.textContent = `Free slots for this time (${formattedTime})`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        const selectedDay = roomQueryCurrentDay || DAYS_ORDER[0];
        queryRoomByTimeSlot(value, department, selectedDay);
      } else {
        // Hide day selector when no value selected
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
        roomQuerySelectedTimeSlot = null;
      }
    });
  }

  if (els.roomQueryDepartment) {
    els.roomQueryDepartment.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      if (searchBy === 'room') {
        populateRoomNumbers(els.roomQueryDepartment.value);
      }
      els.roomQueryResults.innerHTML = '';
    });
  }

  // CR Info functionality
  function loadCRInfo(semester, section) {
    if (!db || !semester || !section) return;
    
    // Load CR data
    db.ref(`cr/${semester}/${section}`).once('value', (snap) => {
      const crData = snap.val() || {};
      
      // Load section info (batch, coordinator, total students)
      db.ref(`sectionInfo/${semester}/${section}`).once('value', (sectionSnap) => {
        const sectionInfo = sectionSnap.val() || {};
        
        renderCRInfo({
          semester,
          section,
          crData,
          sectionInfo
        });
      });
    });
  }

  function renderCRInfo(data) {
    if (!els.crInfoResults) return;
    els.crInfoResults.innerHTML = '';
    
    const { semester, section, crData, sectionInfo } = data;
    
    // Block 1: Basic Info
    const block1 = document.createElement('div');
    block1.className = 'cr-info-block';
    block1.innerHTML = `
      <div class="cr-info-block-title">Basic Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Batch</span>
        <span class="cr-info-value">${sectionInfo.batch || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Semester</span>
        <span class="cr-info-value">${semLabel(semester)}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Section</span>
        <span class="cr-info-value">${section}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Total Students</span>
        <span class="cr-info-value">${sectionInfo.totalStudents || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block1);
    
    // Block 2: Coordinator Info
    const block2 = document.createElement('div');
    block2.className = 'cr-info-block';
    block2.innerHTML = `
      <div class="cr-info-block-title">Coordinator Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${sectionInfo.coordinatorName || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone</span>
        <span class="cr-info-value">${sectionInfo.coordinatorPhone || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Email</span>
        <span class="cr-info-value">${sectionInfo.coordinatorEmail || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block2);
    
    // Block 3: First CR Info
    const block3 = document.createElement('div');
    block3.className = 'cr-info-block';
    const cr1 = crData.cr1 || {};
    block3.innerHTML = `
      <div class="cr-info-block-title">First CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr1.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr1.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr1.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block3);
    
    // Block 4: Second CR Info
    const block4 = document.createElement('div');
    block4.className = 'cr-info-block';
    const cr2 = crData.cr2 || {};
    block4.innerHTML = `
      <div class="cr-info-block-title">Second CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr2.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr2.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr2.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block4);
  }

  // CR Info event handlers
  if (els.crInfoSemester) {
    els.crInfoSemester.addEventListener('change', () => {
      const sem = els.crInfoSemester.value;
      if (sem) {
        populateSections(els.crInfoSection, sem);
      } else {
        els.crInfoSection.disabled = true;
        els.crInfoSection.innerHTML = '<option value="">Select Semester first</option>';
        els.crInfoResults.innerHTML = '';
      }
    });
  }

  if (els.crInfoSection) {
    els.crInfoSection.addEventListener('change', () => {
      const sem = els.crInfoSemester?.value;
      const sec = els.crInfoSection.value;
      if (sem && sec) {
        loadCRInfo(sem, sec);
      } else {
        els.crInfoResults.innerHTML = '';
      }
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', initEntry);
})();

