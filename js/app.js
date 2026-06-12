// State Management
let tasks = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let activeView = 'list'; // 'list' or 'calendar'
let taskIdToDelete = null;

// DOM Elements
const taskModal = document.getElementById('task-modal');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const detailModal = document.getElementById('detail-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const subjectDatalist = document.getElementById('subject-list');
const subjectFilterSelect = document.getElementById('subject-filter');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  initEventListeners();
  updateDashboard();
  renderActiveView();
  updateSubjectOptions();
});

// Event Listeners Initialization
function initEventListeners() {
  // Modal Buttons
  document.getElementById('open-add-modal-btn').addEventListener('click', () => openTaskModal());
  document.getElementById('close-modal-btn').addEventListener('click', closeTaskModal);
  document.getElementById('cancel-modal-btn').addEventListener('click', closeTaskModal);
  
  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
    if (e.target === deleteConfirmModal) closeDeleteConfirmModal();
    if (e.target === detailModal) closeDetailModal();
  });

  // Delete Confirm Modal Buttons
  document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteConfirmModal);
  document.getElementById('confirm-delete-btn').addEventListener('click', executeDeleteTask);

  // Detail Modal Buttons
  document.getElementById('close-detail-modal-btn').addEventListener('click', closeDetailModal);
  
  // Prevent date field empty constraints, set minimum date to today optionally, but usually let user type any date
}

// Load tasks from LocalStorage
function loadTasks() {
  const storedTasks = localStorage.getItem('univ_tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    // Inject mock data for a pleasant first-time load
    injectMockData();
  }
}

// Inject mock data if no storage exists
function injectMockData() {
  const today = new Date();
  
  // Helper to format date relative to today
  const getRelativeDateStr = (daysOffset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  tasks = [
    {
      id: 'mock-1',
      subject: '컴퓨터네트워크',
      title: 'Wireshark 패킷 분석 보고서 제출',
      description: 'HTTP/DNS 패킷을 캡처하고 3-way handshake 과정을 스크린샷과 함께 정리하여 제출하시오.',
      dueDate: getRelativeDateStr(0), // Today (D-Day)
      dueTime: '23:59',
      priority: 'high',
      completed: false,
      completedDate: null
    },
    {
      id: 'mock-2',
      subject: '마케팅원론',
      title: '시장 분석 및 STP 전략 수립',
      description: '선택한 브랜드를 대상으로 STP 전략을 분석하고 PPT 15장 내외로 작성할 것 (팀 프로젝트)',
      dueDate: getRelativeDateStr(1), // Tomorrow (D-1)
      dueTime: '18:00',
      priority: 'high',
      completed: false,
      completedDate: null
    },
    {
      id: 'mock-3',
      subject: '자료구조',
      title: 'Binary Search Tree 구현 과제',
      description: 'C++ 또는 Java를 사용하여 이진 탐색 트리 검색, 삽입, 삭제 알고리즘을 소스코드로 작성하고 기한 내 깃허브 제출.',
      dueDate: getRelativeDateStr(3), // D-3
      dueTime: '23:59',
      priority: 'medium',
      completed: false,
      completedDate: null
    },
    {
      id: 'mock-4',
      subject: '글쓰기와소통',
      title: '자유 주제 논설문 작성',
      description: '사회적 이슈 중 하나를 선택하여 자신의 주장이 담긴 A4 2매 분량의 에세이 제출.',
      dueDate: getRelativeDateStr(5), // D-5
      dueTime: '13:00',
      priority: 'low',
      completed: false,
      completedDate: null
    },
    {
      id: 'mock-5',
      subject: '선형대수학',
      title: '고유값과 고유벡터 증명 과제',
      description: '교재 4장 연습문제 5, 8, 12번 풀이하여 스캔본 제출.',
      dueDate: getRelativeDateStr(-2), // Completed
      dueTime: '23:59',
      priority: 'medium',
      completed: true,
      completedDate: getRelativeDateStr(-2) + ' 15:45'
    }
  ];
  saveTasks();
}

// Save tasks to LocalStorage
function saveTasks() {
  localStorage.setItem('univ_tasks', JSON.stringify(tasks));
}

// Update subject recommendations (datalist & filter options)
function updateSubjectOptions() {
  const subjects = [...new Set(tasks.map(task => task.subject.trim()))].filter(Boolean).sort();
  
  // 1. Update form datalist
  subjectDatalist.innerHTML = '';
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    subjectDatalist.appendChild(option);
  });

  // 2. Update subject filter (keep user selection if still exists)
  const currentSelection = subjectFilterSelect.value;
  subjectFilterSelect.innerHTML = '<option value="">모든 과목</option>';
  
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    if (subject === currentSelection) {
      option.selected = true;
    }
    subjectFilterSelect.appendChild(option);
  });
}

// Calculate D-Day Information
function getDDayStatus(dueDateStr, dueTimeStr, isCompleted) {
  if (isCompleted) {
    return { text: '완료됨', class: 'completed', diffDays: null, isOverdue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Precise deadline comparison for time check
  const now = new Date();
  const [hour, minute] = dueTimeStr.split(':').map(Number);
  const exactDeadline = new Date(year, month - 1, day, hour, minute, 59);

  const isOverdue = now.getTime() > exactDeadline.getTime();

  if (isOverdue) {
    return { text: '마감 지남', class: 'overdue', diffDays: diffDays, isOverdue: true };
  }

  if (diffDays === 0) {
    return { text: 'D-Day', class: 'urgent-today', diffDays: 0, isOverdue: false };
  } else if (diffDays === 1) {
    return { text: 'D-1', class: 'urgent-danger', diffDays: 1, isOverdue: false };
  } else if (diffDays <= 3) {
    return { text: `D-${diffDays}`, class: 'urgent-warning', diffDays: diffDays, isOverdue: false };
  } else {
    return { text: `D-${diffDays}`, class: 'normal', diffDays: diffDays, isOverdue: false };
  }
}

// Refresh Dashboard Stats
function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-ratio').textContent = `${ratio}%`;
  document.getElementById('stat-progress-bar').style.width = `${ratio}%`;
}

// Switch between List and Calendar View
function switchView(view) {
  activeView = view;
  
  // Toggle tab buttons
  document.getElementById('tab-list-btn').classList.toggle('active', view === 'list');
  document.getElementById('tab-calendar-btn').classList.toggle('active', view === 'calendar');

  // Toggle view panels
  document.getElementById('list-view').classList.toggle('active', view === 'list');
  document.getElementById('calendar-view').classList.toggle('active', view === 'calendar');

  renderActiveView();
}

// Render dynamic elements based on selected view
function renderActiveView() {
  if (activeView === 'list') {
    renderListView();
  } else {
    renderCalendarView();
  }
}

// Get filtered and sorted tasks list
function getProcessedTasks() {
  const searchQuery = searchInput.value.toLowerCase().trim();
  const selectedSubject = subjectFilterSelect.value;
  const sortBy = sortSelect.value;

  // 1. Filter tasks
  let processed = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(searchQuery) || 
                        task.subject.toLowerCase().includes(searchQuery);
    const matchSubject = selectedSubject === '' || task.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  // 2. Sort tasks
  processed.sort((a, b) => {
    if (sortBy === 'dueAsc') {
      // Sort by Due Date & Time Ascending
      const aDateTime = new Date(`${a.dueDate}T${a.dueTime}`);
      const bDateTime = new Date(`${b.dueDate}T${b.dueTime}`);
      return aDateTime - bDateTime;
    } else if (sortBy === 'dueDesc') {
      // Sort by Due Date & Time Descending
      const aDateTime = new Date(`${a.dueDate}T${a.dueTime}`);
      const bDateTime = new Date(`${b.dueDate}T${b.dueTime}`);
      return bDateTime - aDateTime;
    } else if (sortBy === 'priorityDesc') {
      // Sort by Priority High -> Medium -> Low
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      // If priorities are equal, sort by due date ascending
      const aDateTime = new Date(`${a.dueDate}T${a.dueTime}`);
      const bDateTime = new Date(`${b.dueDate}T${b.dueTime}`);
      return aDateTime - bDateTime;
    }
    return 0;
  });

  return processed;
}

// Trigger filter or search change
function handleFilterChange() {
  renderActiveView();
}

// Render list view columns
function renderListView() {
  const activeTasksContainer = document.getElementById('active-tasks-container');
  const completedTasksContainer = document.getElementById('completed-tasks-container');
  
  activeTasksContainer.innerHTML = '';
  completedTasksContainer.innerHTML = '';

  const processedList = getProcessedTasks();
  const activeList = processedList.filter(t => !t.completed);
  const completedList = processedList.filter(t => t.completed);

  // Update lists count labels
  document.getElementById('active-count').textContent = activeList.length;
  document.getElementById('completed-count').textContent = completedList.length;

  // Render active tasks
  if (activeList.length === 0) {
    activeTasksContainer.innerHTML = createEmptyStateHTML('진행 중인 과제가 없습니다.');
  } else {
    activeList.forEach(task => {
      activeTasksContainer.appendChild(createTaskCardElement(task));
    });
  }

  // Render completed tasks
  if (completedList.length === 0) {
    completedTasksContainer.innerHTML = createEmptyStateHTML('완료된 과제가 없습니다.');
  } else {
    completedList.forEach(task => {
      completedTasksContainer.appendChild(createTaskCardElement(task));
    });
  }
}

// HTML generator for Empty States
function createEmptyStateHTML(message) {
  return `
    <div class="empty-state">
      <i class="fa-solid fa-list-check"></i>
      <p>${message}</p>
    </div>
  `;
}

// Create single card DOM element
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  
  // Calculate D-Day status
  const ddayStatus = getDDayStatus(task.dueDate, task.dueTime, task.completed);
  
  // Apply urgent styling classes
  if (!task.completed) {
    if (ddayStatus.isOverdue) {
      card.classList.add('urgent-danger'); // Style expired tasks red too
    } else if (ddayStatus.class === 'urgent-today') {
      card.classList.add('urgent-today');
    } else if (ddayStatus.class === 'urgent-danger') {
      card.classList.add('urgent-danger');
    } else if (ddayStatus.class === 'urgent-warning') {
      card.classList.add('urgent-warning');
    }
  }

  const priorityLabel = task.priority === 'high' ? '상' : task.priority === 'medium' ? '중' : '하';
  const displayDdayText = ddayStatus.isOverdue ? '마감 지남' : ddayStatus.text;

  card.innerHTML = `
    <div class="card-header-row">
      <span class="subject-badge">${escapeHTML(task.subject)}</span>
      <div class="card-actions">
        <button class="card-action-btn edit-btn" title="수정" onclick="event.stopPropagation(); openEditTask('${task.id}')">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="card-action-btn delete-btn" title="삭제" onclick="event.stopPropagation(); confirmDeleteTask('${task.id}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
    
    <h3 class="task-title">${escapeHTML(task.title)}</h3>
    ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
    
    <div class="card-footer-row">
      ${task.completed ? `
        <div class="completed-date-info">
          <i class="fa-solid fa-check-circle"></i>
          <span>완료일: ${task.completedDate}</span>
        </div>
      ` : `
        <div class="due-info">
          <i class="fa-regular fa-calendar-check"></i>
          <span>${task.dueDate} ${task.dueTime}</span>
        </div>
      `}

      <div class="card-badges">
        <span class="priority-badge ${task.priority}">${priorityLabel}</span>
        <span class="dday-badge">${displayDdayText}</span>
        <button class="complete-btn-quick" title="${task.completed ? '진행 중으로 변경' : '완료로 변경'}" onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}')">
          <i class="fa-solid ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
        </button>
      </div>
    </div>
  `;

  // Attach click listener for detail popup modal
  card.addEventListener('click', () => openDetailModal(task.id));

  return card;
}

// Safe HTML strings escaping
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Task CRUD Operations
function openTaskModal(taskId = null) {
  taskForm.reset();
  
  if (taskId) {
    // Edit Mode
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    modalTitle.textContent = '과제 수정';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-subject').value = task.subject;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-due-date').value = task.dueDate;
    document.getElementById('task-due-time').value = task.dueTime;
    
    // Select priority radio button
    const priorityRadios = document.getElementsByName('task-priority');
    priorityRadios.forEach(radio => {
      radio.checked = radio.value === task.priority;
    });
  } else {
    // Create Mode
    modalTitle.textContent = '새 과제 등록';
    document.getElementById('task-id').value = '';
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    document.getElementById('task-due-date').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('task-due-time').value = '23:59';
  }

  taskModal.classList.add('open');
}

function closeTaskModal() {
  taskModal.classList.remove('open');
}

function saveTask(event) {
  event.preventDefault();

  const id = document.getElementById('task-id').value;
  const subject = document.getElementById('task-subject').value.trim();
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const dueDate = document.getElementById('task-due-date').value;
  const dueTime = document.getElementById('task-due-time').value;

  // Retrieve priority
  let priority = 'high';
  const priorityRadios = document.getElementsByName('task-priority');
  priorityRadios.forEach(radio => {
    if (radio.checked) priority = radio.value;
  });

  if (id) {
    // Edit existing task
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        subject,
        title,
        description,
        dueDate,
        dueTime,
        priority
      };
    }
  } else {
    // Create new task
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      subject,
      title,
      description,
      dueDate,
      dueTime,
      priority,
      completed: false,
      completedDate: null
    };
    tasks.push(newTask);
  }

  saveTasks();
  updateDashboard();
  updateSubjectOptions();
  renderActiveView();
  closeTaskModal();
}

function openEditTask(taskId) {
  openTaskModal(taskId);
}

// Toggle Task Completion State
function toggleTaskCompletion(taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    const isNowCompleted = !tasks[taskIndex].completed;
    tasks[taskIndex].completed = isNowCompleted;
    
    if (isNowCompleted) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      tasks[taskIndex].completedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } else {
      tasks[taskIndex].completedDate = null;
    }

    saveTasks();
    updateDashboard();
    renderActiveView();
    
    // If detail modal is open, refresh it
    if (detailModal.classList.contains('open')) {
      const openDetailId = document.getElementById('detail-complete-btn').getAttribute('data-id');
      if (openDetailId === taskId) {
        openDetailModal(taskId);
      }
    }
  }
}

// Delete Dialog confirmation logic
function confirmDeleteTask(taskId) {
  taskIdToDelete = taskId;
  deleteConfirmModal.classList.add('open');
}

function closeDeleteConfirmModal() {
  deleteConfirmModal.classList.remove('open');
  taskIdToDelete = null;
}

function executeDeleteTask() {
  if (taskIdToDelete) {
    tasks = tasks.filter(t => t.id !== taskIdToDelete);
    saveTasks();
    updateDashboard();
    updateSubjectOptions();
    renderActiveView();
    
    // Close detail modal too if it was deleting from details
    closeDetailModal();
  }
  closeDeleteConfirmModal();
}

// Detail View Modal Control
function openDetailModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('detail-subject').textContent = task.subject;
  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-due').textContent = `${task.dueDate} ${task.dueTime}`;
  
  const priorityText = task.priority === 'high' ? '상 (High)' : task.priority === 'medium' ? '중 (Medium)' : '하 (Low)';
  document.getElementById('detail-priority').textContent = priorityText;

  const descElem = document.getElementById('detail-description');
  if (task.description) {
    descElem.textContent = task.description;
    descElem.classList.remove('text-light');
  } else {
    descElem.textContent = '설명이 입력되지 않은 과제입니다.';
    descElem.classList.add('text-light');
  }

  const completeBtn = document.getElementById('detail-complete-btn');
  completeBtn.setAttribute('data-id', task.id);
  if (task.completed) {
    document.getElementById('detail-completed-date-wrapper').style.display = 'flex';
    document.getElementById('detail-completed-date').textContent = task.completedDate;
    completeBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> 진행 중으로 변경';
  } else {
    document.getElementById('detail-completed-date-wrapper').style.display = 'none';
    completeBtn.innerHTML = '<i class="fa-solid fa-check"></i> 과제 완료';
  }

  // Wire buttons in details modal
  completeBtn.onclick = () => toggleTaskCompletion(task.id);
  
  document.getElementById('detail-edit-btn').onclick = () => {
    closeDetailModal();
    openEditTask(task.id);
  };
  
  document.getElementById('detail-delete-btn').onclick = () => {
    confirmDeleteTask(task.id);
  };

  detailModal.classList.add('open');
}

function closeDetailModal() {
  detailModal.classList.remove('open');
}

// Calendar Engine (7 columns matrix render)
function renderCalendarView() {
  const calendarDaysContainer = document.getElementById('calendar-days');
  const calendarMonthYearLabel = document.getElementById('calendar-month-year');
  calendarDaysContainer.innerHTML = '';

  // Current month header
  calendarMonthYearLabel.textContent = `${currentYear}년 ${currentMonth + 1}월`;

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Total days in current month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Total days in previous month
  const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  // Create grid cells array
  let dayCells = [];

  // 1. Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevTotalDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
    dayCells.push({
      day,
      month: prevMonthIdx,
      year: prevYearIdx,
      isCurrentMonth: false
    });
  }

  // 2. Current month days
  for (let i = 1; i <= totalDays; i++) {
    dayCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }

  // 3. Next month leading days (fill up to grid multiple of 7)
  const remainingCells = 42 - dayCells.length; // 6 rows of 7 = 42
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
    dayCells.push({
      day: i,
      month: nextMonthIdx,
      year: nextYearIdx,
      isCurrentMonth: false
    });
  }

  // Match tasks based on filter/search status
  const processedTasks = getProcessedTasks();

  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Render cells in DOM
  dayCells.forEach(cell => {
    const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    const dayOfWeek = new Date(cell.year, cell.month, cell.day).getDay();

    const cellDiv = document.createElement('div');
    cellDiv.className = 'calendar-day';
    if (!cell.isCurrentMonth) cellDiv.classList.add('other-month');
    if (cellDateStr === todayDateString) cellDiv.classList.add('today');
    if (dayOfWeek === 0) cellDiv.classList.add('sunday');
    if (dayOfWeek === 6) cellDiv.classList.add('saturday');

    cellDiv.innerHTML = `
      <span class="day-number">${cell.day}</span>
      <div class="calendar-day-tasks" id="cal-tasks-${cellDateStr}"></div>
    `;

    // Filter tasks that match this date
    const dateTasks = processedTasks.filter(t => t.dueDate === cellDateStr);
    const taskContainer = cellDiv.querySelector('.calendar-day-tasks');

    dateTasks.forEach(task => {
      const taskBadge = document.createElement('span');
      taskBadge.className = `cal-task-badge ${task.priority}`;
      if (task.completed) taskBadge.classList.add('completed');
      
      const priorityLabel = task.priority === 'high' ? '상' : task.priority === 'medium' ? '중' : '하';
      taskBadge.textContent = `[${task.subject}] ${task.title}`;
      taskBadge.title = `[${task.subject}] ${task.title} (우선순위: ${priorityLabel})`;

      taskBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetailModal(task.id);
      });

      taskContainer.appendChild(taskBadge);
    });

    // Clicks on general cell block opens modal with this date selected
    cellDiv.addEventListener('click', () => {
      // Find if we have tasks on this date, show selection helper or simply add new task on this date
      openNewTaskForDate(cellDateStr);
    });

    calendarDaysContainer.appendChild(cellDiv);
  });
}

// Calendar Month Navigators
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendarView();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendarView();
}

// Open modal with pre-selected date (called on empty calendar day click)
function openNewTaskForDate(dateStr) {
  openTaskModal();
  document.getElementById('task-due-date').value = dateStr;
}
