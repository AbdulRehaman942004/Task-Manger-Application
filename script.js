/**
 * ========================================
 * SWIFT TASK - PROFESSIONAL TASK MANAGEMENT
 * ========================================
 * 
 * This JavaScript file contains all the functionality for the Swift Task application
 * including user management, task management, boards, folders, and local storage.
 * 
 * Features:
 * - User authentication (simple username-based)
 * - Board and folder management
 * - Task creation, editing, and deletion
 * - Task status management (Pending, Active, Completed)
 * - Priority levels (Low, Medium, High, Urgent)
 * - Due date and time countdown timers
 * - Edit limits (3 times per task)
 * - Local storage for data persistence
 * - Professional notifications
 * - Responsive design support
 */

// ========================================
// GLOBAL VARIABLES AND CONFIGURATION
// ========================================

// Static user data - predefined users for the application
const STATIC_USERS = [
    {
        username: 'Ali Mehroz',
        id: 'user_1',
        joinDate: '2024-01-15'
    },
    {
        username: 'Saboor Malik',
        id: 'user_2',
        joinDate: '2024-02-20'
    },
    {
        username: 'John Doe',
        id: 'user_3',
        joinDate: '2024-03-10'
    }
];

// Application state
let currentUser = null;
let currentData = {
    boards: []
};

// Track open/closed state of boards and folders
let openBoards = new Set();
let openFolders = new Set();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');

// Board elements
const boardNameInput = document.getElementById('boardNameInput');
const addBoardBtn = document.getElementById('addBoardBtn');
const boardsContainer = document.getElementById('boardsContainer');

// Modal elements
const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
const addFolderModal = new bootstrap.Modal(document.getElementById('addFolderModal'));
const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

/**
 * Generates a unique ID for new items
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formats a date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formats a date and time for display
 * @param {string} dateString - Date string
 * @param {string} timeString - Time string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateString, timeString) {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculates the countdown for a task
 * @param {string} dueDate - Due date string
 * @param {string} dueTime - Due time string
 * @returns {object} Countdown object with days, hours, minutes, seconds
 */
function calculateCountdown(dueDate, dueTime) {
    const now = new Date();
    const due = new Date(`${dueDate}T${dueTime}`);
    const diff = due - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, overdue: false };
}

/**
 * Saves data to localStorage
 * @param {string} userId - User ID
 * @param {object} data - Data to save
 */
function saveData(userId, data) {
    try {
        localStorage.setItem(`swift_task_${userId}`, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saving data', 'error');
    }
}

/**
 * Loads data from localStorage
 * @param {string} userId - User ID
 * @returns {object} Loaded data
 */
function loadData(userId) {
    try {
        const data = localStorage.getItem(`swift_task_${userId}`);
        return data ? JSON.parse(data) : { boards: [] };
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
        return { boards: [] };
    }
}

// ========================================
// USER MANAGEMENT
// ========================================

/**
 * Handles user login
 * @param {string} username - Username to login
 */
function loginUser(username) {
    // Find user in static users
    const user = STATIC_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
        showNotification('User not found. Please use one of the demo users.', 'error');
        return false;
    }

    // Set current user
    currentUser = user;
    currentUserSpan.textContent = user.username;

    // Load user data
    currentData = loadData(user.id);

    // Show dashboard
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';

    // Render dashboard
    renderDashboard();

    // Show welcome message
    showNotification(`Welcome back, ${user.username}!`, 'success');

    return true;
}

/**
 * Handles user logout
 */
function logoutUser() {
    // Save current data before logout
    if (currentUser) {
        saveData(currentUser.id, currentData);
    }

    // Reset state
    currentUser = null;
    currentData = { boards: [] };

    // Show login screen
    dashboardScreen.style.display = 'none';
    loginScreen.style.display = 'block';

    // Clear form
    loginForm.reset();

    // Show logout message
    showNotification('Logged out successfully', 'info');
}

// ========================================
// BOARD MANAGEMENT
// ========================================

/**
 * Toggles the visibility of a board's content
 * @param {string} boardId - Board ID to toggle
 */
function toggleBoard(boardId) {
    const boardContent = document.getElementById(`board-content-${boardId}`);
    const toggleIcon = document.getElementById(`toggle-icon-${boardId}`);
    
    if (boardContent.style.display === 'none') {
        boardContent.style.display = 'block';
        toggleIcon.className = 'fas fa-chevron-up me-3 board-toggle-icon';
        boardContent.style.animation = 'slideDown 0.3s ease-out';
        openBoards.add(boardId);
    } else {
        boardContent.style.display = 'none';
        toggleIcon.className = 'fas fa-chevron-down me-3 board-toggle-icon';
        openBoards.delete(boardId);
    }
}

/**
 * Toggles the visibility of a folder's tasks
 * @param {string} boardId - Board ID
 * @param {string} folderId - Folder ID to toggle
 */
function toggleFolder(boardId, folderId) {
    const folderTasks = document.getElementById(`folder-tasks-${folderId}`);
    const toggleIcon = document.getElementById(`folder-toggle-icon-${folderId}`);
    
    if (folderTasks.style.display === 'none') {
        folderTasks.style.display = 'block';
        toggleIcon.className = 'fas fa-chevron-down me-3 folder-toggle-icon';
        folderTasks.style.animation = 'slideDown 0.3s ease-out';
        openFolders.add(folderId);
    } else {
        folderTasks.style.display = 'none';
        toggleIcon.className = 'fas fa-chevron-right me-3 folder-toggle-icon';
        openFolders.delete(folderId);
    }
}

/**
 * Adds a new board
 * @param {string} name - Board name
 */
function addBoard(name) {
    if (!name.trim()) {
        showNotification('Please enter a board name', 'error');
        return;
    }

    // Check if board already exists
    if (currentData.boards.some(board => board.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Board already exists', 'error');
        return;
    }

    const newBoard = {
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        folders: []
    };

    currentData.boards.push(newBoard);
    saveData(currentUser.id, currentData);
    
    // Use setTimeout to prevent immediate re-render conflicts
    setTimeout(() => {
        renderDashboard();
        showNotification(`Board "${name}" created successfully`, 'success');
    }, 10);
}

/**
 * Deletes a board
 * @param {string} boardId - Board ID to delete
 */
function deleteBoard(boardId) {
    const board = currentData.boards.find(b => b.id === boardId);
    if (!board) return;

    // Remove board and all its folders and tasks
    currentData.boards = currentData.boards.filter(b => b.id !== boardId);
    
    saveData(currentUser.id, currentData);
    setTimeout(() => {
        renderDashboard();
        showNotification(`Board "${board.name}" deleted successfully`, 'success');
    }, 10);
}

// ========================================
// FOLDER MANAGEMENT
// ========================================

/**
 * Adds a folder to a specific board
 * @param {string} boardId - Board ID
 */
function addFolderToBoard(boardId) {
    // Store current board ID for folder creation
    window.currentBoardId = boardId;
    
    // Clear the form
    document.getElementById('addFolderForm').reset();
    
    // Show add folder modal
    addFolderModal.show();
}

/**
 * Creates a new folder in the current board
 */
function createFolder() {
    const folderName = document.getElementById('folderNameInput').value.trim();
    
    if (!folderName) {
        showNotification('Please enter a folder name', 'error');
        return;
    }

    if (!window.currentBoardId) {
        showNotification('Please select a board to add folder', 'error');
        return;
    }

    const board = currentData.boards.find(b => b.id === window.currentBoardId);
    if (!board) return;

    // Check if folder already exists in this board
    if (board.folders && board.folders.some(folder => folder.name.toLowerCase() === folderName.toLowerCase())) {
        showNotification('Folder already exists in this board', 'error');
        return;
    }

    const newFolder = {
        id: generateId(),
        name: folderName.trim(),
        createdAt: new Date().toISOString(),
        tasks: []
    };

    if (!board.folders) board.folders = [];
    board.folders.push(newFolder);
    
    saveData(currentUser.id, currentData);
    setTimeout(() => {
        renderDashboard();
        addFolderModal.hide();
        
        // Clear form
        document.getElementById('addFolderForm').reset();
        
        showNotification(`Folder "${folderName}" added to board "${board.name}"`, 'success');
    }, 10);
}

/**
 * Deletes a folder from a board
 * @param {string} boardId - Board ID
 * @param {string} folderId - Folder ID
 */
function deleteFolderFromBoard(boardId, folderId) {
    const board = currentData.boards.find(b => b.id === boardId);
    if (!board || !board.folders) return;

    const folder = board.folders.find(f => f.id === folderId);
    if (!folder) return;

    board.folders = board.folders.filter(f => f.id !== folderId);
    
    saveData(currentUser.id, currentData);
    setTimeout(() => {
        renderDashboard();
        showNotification(`Folder "${folder.name}" deleted from board "${board.name}"`, 'success');
    }, 10);
}

// ========================================
// TASK MANAGEMENT
// ========================================

/**
 * Adds a task to a specific folder
 * @param {string} boardId - Board ID
 * @param {string} folderId - Folder ID
 */
function addTaskToFolder(boardId, folderId) {
    const board = currentData.boards.find(b => b.id === boardId);
    if (!board || !board.folders) return;

    const folder = board.folders.find(f => f.id === folderId);
    if (!folder) return;

    // Store current board and folder for task creation
    window.currentBoardId = boardId;
    window.currentFolderId = folderId;
    
    // Set default times
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    document.getElementById('startTime').value = currentTime;
    document.getElementById('dueTime').value = currentTime;
    
    // Show add task modal
    addTaskModal.show();
}

/**
 * Adds a new task to the current folder
 */
function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const dueDate = document.getElementById('dueDate').value;
    const dueTime = document.getElementById('dueTime').value;
    const description = document.getElementById('taskDescription').value.trim();

    // Validation
    if (!title || !startDate || !startTime || !dueDate || !dueTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const dueDateTime = new Date(`${dueDate}T${dueTime}`);

    if (startDateTime > dueDateTime) {
        showNotification('Start date/time cannot be after due date/time', 'error');
        return;
    }

    if (!window.currentBoardId || !window.currentFolderId) {
        showNotification('Please select a folder to add task', 'error');
        return;
    }

    const board = currentData.boards.find(b => b.id === window.currentBoardId);
    const folder = board.folders.find(f => f.id === window.currentFolderId);

    const newTask = {
        id: generateId(),
        title,
        priority,
        startDate,
        startTime,
        dueDate,
        dueTime,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        editCount: 0,
        lastEdited: null
    };

    if (!folder.tasks) folder.tasks = [];
    folder.tasks.push(newTask);
    
    saveData(currentUser.id, currentData);
    setTimeout(() => {
        renderDashboard();
        addTaskModal.hide();
        
        // Clear form
        document.getElementById('addTaskForm').reset();
        
        showNotification('Task created successfully', 'success');
    }, 10);
}

/**
 * Edits an existing task
 * @param {string} taskId - Task ID to edit
 */
function editTask(taskId) {
    // Find task in the hierarchy
    let task = null;
    let board = null;
    let folder = null;

    for (const b of currentData.boards) {
        for (const f of b.folders || []) {
            const foundTask = f.tasks?.find(t => t.id === taskId);
            if (foundTask) {
                task = foundTask;
                board = b;
                folder = f;
                break;
            }
        }
        if (task) break;
    }

    if (!task) return;

    // Check edit limit
    if (task.editCount >= 3) {
        showNotification('This task has reached its edit limit (3 times)', 'error');
        return;
    }

    // Store current task info for updating
    window.currentEditTask = { taskId, boardId: board.id, folderId: folder.id };

    // Populate edit form
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editStartDate').value = task.startDate;
    document.getElementById('editStartTime').value = task.startTime;
    document.getElementById('editDueDate').value = task.dueDate;
    document.getElementById('editDueTime').value = task.dueTime;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editCountDisplay').textContent = 3 - task.editCount;

    editTaskModal.show();
}

/**
 * Updates a task after editing
 */
function updateTask() {
    const taskId = document.getElementById('editTaskId').value;
    
    if (!window.currentEditTask || window.currentEditTask.taskId !== taskId) {
        showNotification('Task not found', 'error');
        return;
    }

    const board = currentData.boards.find(b => b.id === window.currentEditTask.boardId);
    const folder = board.folders.find(f => f.id === window.currentEditTask.folderId);
    const task = folder.tasks.find(t => t.id === taskId);
    
    if (!task) return;

    // Check edit limit again
    if (task.editCount >= 3) {
        showNotification('This task has reached its edit limit', 'error');
        editTaskModal.hide();
        return;
    }

    // Update task data
    task.title = document.getElementById('editTaskTitle').value.trim();
    task.priority = document.getElementById('editTaskPriority').value;
    task.startDate = document.getElementById('editStartDate').value;
    task.startTime = document.getElementById('editStartTime').value;
    task.dueDate = document.getElementById('editDueDate').value;
    task.dueTime = document.getElementById('editDueTime').value;
    task.description = document.getElementById('editTaskDescription').value.trim();
    task.editCount++;
    task.lastEdited = new Date().toISOString();

    // Validation
    if (!task.title || !task.startDate || !task.startTime || !task.dueDate || !task.dueTime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const startDateTime = new Date(`${task.startDate}T${task.startTime}`);
    const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);

    if (startDateTime > dueDateTime) {
        showNotification('Start date/time cannot be after due date/time', 'error');
        return;
    }

    saveData(currentUser.id, currentData);
    setTimeout(() => {
        renderDashboard();
        editTaskModal.hide();
        
        showNotification('Task updated successfully', 'success');
    }, 10);
}

/**
 * Deletes a task
 * @param {string} taskId - Task ID to delete
 */
function deleteTask(taskId) {
    // Find task in the hierarchy
    for (const board of currentData.boards) {
        for (const folder of board.folders || []) {
            const taskIndex = folder.tasks?.findIndex(t => t.id === taskId);
            if (taskIndex !== -1 && taskIndex !== undefined) {
                folder.tasks.splice(taskIndex, 1);
                saveData(currentUser.id, currentData);
                setTimeout(() => {
                    renderDashboard();
                    showNotification('Task deleted successfully', 'success');
                }, 10);
                return;
            }
        }
    }
}

/**
 * Changes task status
 * @param {string} taskId - Task ID
 * @param {string} status - New status
 */
function changeTaskStatus(taskId, status) {
    // Find task in the hierarchy
    for (const board of currentData.boards) {
        for (const folder of board.folders || []) {
            const task = folder.tasks?.find(t => t.id === taskId);
            if (task) {
                task.status = status;
                saveData(currentUser.id, currentData);
                setTimeout(() => {
                    renderDashboard();
                    showNotification(`Task status changed to ${status}`, 'success');
                }, 10);
                return;
            }
        }
    }
}

// ========================================
// DASHBOARD RENDERING
// ========================================

/**
 * Renders the entire dashboard
 */
function renderDashboard() {
    // Prevent multiple simultaneous renders
    if (window.isRendering) return;
    window.isRendering = true;

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        boardsContainer.innerHTML = '';

        if (currentData.boards.length === 0) {
            boardsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-columns fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No boards created yet</h4>
                    <p class="text-muted">Create your first board to get started!</p>
                </div>
            `;
            window.isRendering = false;
            return;
        }

        currentData.boards.forEach(board => {
            const boardElement = document.createElement('div');
            boardElement.className = 'board-container fade-in';
            
            boardElement.innerHTML = `
                <div class="card">
                    <div class="board-header" onclick="toggleBoard('${board.id}')" style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-chevron-${openBoards.has(board.id) ? 'up' : 'down'} me-3 board-toggle-icon" id="toggle-icon-${board.id}"></i>
                                <div>
                                    <h3 class="mb-0">
                                        <i class="fas fa-columns me-2"></i>
                                        ${board.name}
                                    </h3>
                                    <small class="opacity-75">
                                        ${board.folders ? board.folders.length : 0} folders, 
                                        ${board.folders ? board.folders.reduce((sum, folder) => sum + (folder.tasks ? folder.tasks.length : 0), 0) : 0} tasks
                                    </small>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-light btn-sm me-2" onclick="event.stopPropagation(); addFolderToBoard('${board.id}')">
                                    <i class="fas fa-folder-plus me-1"></i>Add Folder
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteBoard('${board.id}')">
                                    <i class="fas fa-trash me-1"></i>Delete Board
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="board-content" id="board-content-${board.id}" style="display: ${openBoards.has(board.id) ? 'block' : 'none'};">
                        ${renderBoardFolders(board)}
                    </div>
                </div>
            `;
            
            boardsContainer.appendChild(boardElement);
        });

        window.isRendering = false;
    });
}

/**
 * Renders folders within a board
 * @param {object} board - Board object
 * @returns {string} HTML string for folders
 */
function renderBoardFolders(board) {
    const folders = board.folders || [];
    
    if (folders.length === 0) {
        return `
            <div class="text-center py-4">
                <i class="fas fa-folder fa-2x text-muted mb-2"></i>
                <p class="text-muted">No folders in this board</p>
                <button class="btn btn-primary btn-sm" onclick="addFolderToBoard('${board.id}')">
                    <i class="fas fa-folder-plus me-1"></i>Add First Folder
                </button>
            </div>
        `;
    }

    return folders.map(folder => `
        <div class="folder-section">
            <div class="folder-header" onclick="toggleFolder('${board.id}', '${folder.id}')" style="cursor: pointer;">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-chevron-${openFolders.has(folder.id) ? 'down' : 'right'} me-3 folder-toggle-icon" id="folder-toggle-icon-${folder.id}"></i>
                        <div>
                            <h5 class="mb-0">
                                <i class="fas fa-folder me-2"></i>
                                ${folder.name}
                            </h5>
                            <small class="text-muted">
                                ${folder.tasks ? folder.tasks.length : 0} tasks
                            </small>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-primary btn-sm me-2" onclick="event.stopPropagation(); addTaskToFolder('${board.id}', '${folder.id}')">
                            <i class="fas fa-plus me-1"></i>Add Task
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteFolderFromBoard('${board.id}', '${folder.id}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="folder-tasks" id="folder-tasks-${folder.id}" style="display: ${openFolders.has(folder.id) ? 'block' : 'none'};">
                ${renderFolderTasks(folder)}
            </div>
        </div>
    `).join('');
}

/**
 * Renders tasks within a folder
 * @param {object} folder - Folder object
 * @returns {string} HTML string for tasks
 */
function renderFolderTasks(folder) {
    const tasks = folder.tasks || [];
    
    if (tasks.length === 0) {
        return `
            <div class="text-center py-3">
                <i class="fas fa-tasks fa-lg text-muted mb-2"></i>
                <p class="text-muted small">No tasks in this folder</p>
            </div>
        `;
    }

    // Sort tasks by priority (highest priority first)
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return sortedTasks.map(task => {
        const countdown = calculateCountdown(task.dueDate, task.dueTime);
        
        // Enhanced countdown display with time
        let countdownText = '';
        if (countdown.overdue) {
            const overdueDays = Math.abs(countdown.days);
            const overdueHours = Math.abs(countdown.hours);
            const overdueMinutes = Math.abs(countdown.minutes);
            countdownText = `<div class="task-countdown urgent">
                <i class="fas fa-exclamation-triangle me-1"></i>
                Overdue by ${overdueDays > 0 ? overdueDays + ' days ' : ''}${overdueHours > 0 ? overdueHours + ' hours ' : ''}${overdueMinutes} minutes
            </div>`;
        } else if (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0) {
            countdownText = `<div class="task-countdown urgent">
                <i class="fas fa-clock me-1"></i>
                Due in ${countdown.seconds} seconds
            </div>`;
        } else if (countdown.days === 0 && countdown.hours === 0) {
            countdownText = `<div class="task-countdown urgent">
                <i class="fas fa-clock me-1"></i>
                Due in ${countdown.minutes} minutes ${countdown.seconds} seconds
            </div>`;
        } else if (countdown.days === 0) {
            countdownText = `<div class="task-countdown urgent">
                <i class="fas fa-clock me-1"></i>
                Due in ${countdown.hours} hours ${countdown.minutes} minutes
            </div>`;
        } else {
            countdownText = `<div class="task-countdown">
                <i class="fas fa-calendar me-1"></i>
                Due in ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} minutes
            </div>`;
        }

        return `
            <div class="task-item priority-${task.priority} fade-in" data-task-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div class="text-end">
                        <small class="text-muted">Created: ${formatDate(task.createdAt)}</small>
                        ${task.lastEdited ? `<br><small class="text-muted">Edited: ${formatDate(task.lastEdited)}</small>` : ''}
                    </div>
                </div>
                
                <div class="task-dates">
                    <span><i class="fas fa-play me-1"></i> Start: ${formatDateTime(task.startDate, task.startTime)}</span>
                    <span><i class="fas fa-flag-checkered me-1"></i> Due: ${formatDateTime(task.dueDate, task.dueTime)}</span>
                </div>
                
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                
                ${countdownText}
                
                <div class="task-actions">
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'pending')">
                        ${task.status === 'pending' ? '<i class="fas fa-check me-1"></i>' : ''}Pending
                    </button>
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'active')">
                        ${task.status === 'active' ? '<i class="fas fa-check me-1"></i>' : ''}Active
                    </button>
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'completed')">
                        ${task.status === 'completed' ? '<i class="fas fa-check me-1"></i>' : ''}Completed
                    </button>
                    <button class="btn btn-info btn-sm" onclick="editTask('${task.id}')" ${task.editCount >= 3 ? 'disabled' : ''}>
                        <i class="fas fa-edit me-1"></i>Update Task
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
                        <i class="fas fa-trash me-1"></i>Delete Task
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// COUNTDOWN UPDATES
// ========================================

/**
 * Updates only the countdown displays without full re-render
 */
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.task-countdown');
    
    countdownElements.forEach(element => {
        const taskId = element.closest('.task-item').getAttribute('data-task-id');
        if (!taskId) return;
        
        // Find the task data
        let task = null;
        for (const board of currentData.boards) {
            for (const folder of board.folders || []) {
                const foundTask = folder.tasks?.find(t => t.id === taskId);
                if (foundTask) {
                    task = foundTask;
                    break;
                }
            }
            if (task) break;
        }
        
        if (!task) return;
        
        const countdown = calculateCountdown(task.dueDate, task.dueTime);
        
        // Update countdown text
        let countdownText = '';
        if (countdown.overdue) {
            const overdueDays = Math.abs(countdown.days);
            const overdueHours = Math.abs(countdown.hours);
            const overdueMinutes = Math.abs(countdown.minutes);
            countdownText = `<i class="fas fa-exclamation-triangle me-1"></i>
                Overdue by ${overdueDays > 0 ? overdueDays + ' days ' : ''}${overdueHours > 0 ? overdueHours + ' hours ' : ''}${overdueMinutes} minutes`;
        } else if (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0) {
            countdownText = `<i class="fas fa-clock me-1"></i>
                Due in ${countdown.seconds} seconds`;
        } else if (countdown.days === 0 && countdown.hours === 0) {
            countdownText = `<i class="fas fa-clock me-1"></i>
                Due in ${countdown.minutes} minutes ${countdown.seconds} seconds`;
        } else if (countdown.days === 0) {
            countdownText = `<i class="fas fa-clock me-1"></i>
                Due in ${countdown.hours} hours ${countdown.minutes} minutes`;
        } else {
            countdownText = `<i class="fas fa-calendar me-1"></i>
                Due in ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} minutes`;
        }
        
        element.innerHTML = countdownText;
        
        // Update urgency class
        if (countdown.overdue || (countdown.days === 0 && countdown.hours < 24)) {
            element.classList.add('urgent');
        } else {
            element.classList.remove('urgent');
        }
    });
}

// ========================================
// PROFILE MANAGEMENT
// ========================================

/**
 * Shows user profile with statistics
 */
function showProfile() {
    if (!currentUser) return;

    // Update profile data
    document.getElementById('profileUsername').textContent = currentUser.username;
    
    // Calculate statistics from the hierarchy
    let totalTasks = 0;
    let completedTasks = 0;
    
    currentData.boards.forEach(board => {
        (board.folders || []).forEach(folder => {
            (folder.tasks || []).forEach(task => {
                totalTasks++;
                if (task.status === 'completed') {
                    completedTasks++;
                }
            });
        });
    });
    
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;

    profileModal.show();
}

// ========================================
// EVENT LISTENERS
// ========================================

// Login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
        loginUser(username);
    }
});

// Logout button
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser();
});

// Profile button
profileBtn.addEventListener('click', function(e) {
    e.preventDefault();
    showProfile();
});

// Add board button
addBoardBtn.addEventListener('click', function() {
    addBoard(boardNameInput.value);
    boardNameInput.value = '';
});

// Save task button
document.getElementById('saveTaskBtn').addEventListener('click', addTask);

// Update task button
document.getElementById('updateTaskBtn').addEventListener('click', updateTask);

// Save folder button
document.getElementById('saveFolderBtn').addEventListener('click', createFolder);

// Enter key handlers for input fields
boardNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addBoard(this.value);
        this.value = '';
    }
});

// Enter key handler for folder name input
document.getElementById('folderNameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        createFolder();
    }
});

// Set default dates for task forms
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = today;
    document.getElementById('dueDate').value = tomorrow;
});

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initializes the application
 */
function initApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('swift_task_current_user');
    if (savedUser) {
        const user = STATIC_USERS.find(u => u.username === savedUser);
        if (user) {
            loginUser(user.username);
        }
    }

    // Set up countdown timers
    setInterval(() => {
        if (currentUser && !window.isRendering) {
            // Only update countdowns, not full re-render
            updateCountdowns();
        }
    }, 1000); // Update every second for more accurate countdown
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initApp);