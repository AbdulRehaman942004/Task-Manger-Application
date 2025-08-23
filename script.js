/**
 * ========================================
 * SWIFT TASK - PROFESSIONAL TASK MANAGEMENT
 * ========================================
 * 
 * This JavaScript file contains all the functionality for the Swift Task application
 * including user management, task management, boards, folders, and local storage.
 * 
 * APPLICATION OVERVIEW:
 * This is a professional task management system that allows users to:
 * - Create and manage boards (like project categories)
 * - Add folders within boards (like sub-categories)
 * - Create tasks within folders with priorities and deadlines
 * - Track task status and edit limits
 * - Search through all content
 * - View user statistics
 * 
 * DATA STRUCTURE:
 * - Boards contain folders
 * - Folders contain tasks
 * - Tasks have priorities, status, dates, and edit limits
 * 
 * TECHNICAL FEATURES:
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
 * - Search functionality with highlighting
 * - Collapsible UI with state persistence
 */

// ========================================
// GLOBAL VARIABLES AND CONFIGURATION
// ========================================

/**
 * STATIC USER DATA
 * These are the predefined users that can log into the application.
 * In a real application, this would come from a database.
 * Each user has:
 * - username: Display name for the user
 * - id: Unique identifier for the user
 * - joinDate: When the user was created (for demo purposes)
 */

const STATIC_USERS = [
    {
        username: 'Ali Mehroz',    // First demo user
        id: 'user_1',              // Unique user ID
        joinDate: '2024-01-15'     // Demo join date
    },
    {
        username: 'Abdul Rehman',  // Second demo user
        id: 'user_2',              // Unique user ID
        joinDate: '2024-02-20'     // Demo join date
    },
    {
        username: 'Elon Musk',      // Third demo user
        id: 'user_3',              // Unique user ID
        joinDate: '2024-03-10'     // Demo join date
    }
];

/**
 * APPLICATION STATE VARIABLES
 * These variables track the current state of the application
 */

// Currently logged-in user (null when no user is logged in)
let currentUser = null;

// Current user's data structure - contains all boards, folders, and tasks
// This is what gets saved to localStorage
let currentData = {
    boards: []  // Array of board objects, each containing folders and tasks
};

/**
 * UI STATE TRACKING
 * These Sets track which boards and folders are currently expanded/collapsed
 * This ensures the UI state persists when the dashboard is re-rendered
 */


//Unlike arrays, duplicate values are automatically ignored in sets. Thats why we use it here.

// Set of board IDs that are currently expanded (open)
let openBoards = new Set();

// Set of folder IDs that are currently expanded (open)
let openFolders = new Set();

/**
 * DOM ELEMENT REFERENCES
 * These constants store references to HTML elements that we need to interact with
 * We get these references once when the script loads for better performance
 */

// ========================================
// SCREEN ELEMENTS
// ========================================

// Main screen containers
const loginScreen = document.getElementById('loginScreen');        // Login page container
const dashboardScreen = document.getElementById('dashboardScreen'); // Dashboard page container

// ========================================
// LOGIN FORM ELEMENTS
// ========================================

const loginForm = document.getElementById('loginForm');     // Login form element
const usernameInput = document.getElementById('username');  // Username input field

// ========================================
// NAVIGATION ELEMENTS
// ========================================

const currentUserSpan = document.getElementById('currentUser'); // User name in navbar
const logoutBtn = document.getElementById('logoutBtn');         // Logout button
const profileBtn = document.getElementById('profileBtn');       // Profile button

// ========================================
// BOARD MANAGEMENT ELEMENTS
// ========================================

const boardNameInput = document.getElementById('boardNameInput'); // Board name input field
const addBoardBtn = document.getElementById('addBoardBtn');       // Add board button
const boardsContainer = document.getElementById('boardsContainer'); // Container where boards are displayed

// ========================================
// SEARCH FUNCTIONALITY ELEMENTS
// ========================================

const searchInput = document.getElementById('searchInput');       // Search text input
const searchType = document.getElementById('searchType');         // Search type dropdown (All, Boards, etc.)
const clearSearchBtn = document.getElementById('clearSearchBtn'); // Clear search button

// ========================================
// MODAL DIALOG REFERENCES
// ========================================

// Bootstrap modal instances - these are JavaScript objects that control the modals
const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));     // Add task modal
const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));   // Edit task modal
const addFolderModal = new bootstrap.Modal(document.getElementById('addFolderModal')); // Add folder modal
const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));     // Profile modal

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * NOTIFICATION SYSTEM
 * This function creates and displays professional-looking notifications to the user
 * 
 * @param {string} message - The text message to display to the user
 * @param {string} type - The type of notification: 'success', 'error', or 'info'
 * @param {number} duration - How long to show the notification in milliseconds (default: 3000ms = 3 seconds)
 * 
 * USAGE EXAMPLES:
 * - showNotification('Task created successfully!', 'success')
 * - showNotification('Please enter a valid username', 'error')
 * - showNotification('Loading data...', 'info', 5000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // STEP 1: Clean up any existing notifications
    // This prevents multiple notifications from stacking up
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // STEP 2: Create the notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;  //${type} is called template literal. // CSS classes for styling

    // STEP 3: Set the notification content with appropriate icon
    // The icon changes based on the notification type
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ?'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;

    // Add to page
    document.body.appendChild(notification);    //adds notfication html code(child) to end of body html(parent)

    // Remove after duration
    setTimeout(() => {
        if (notification.parentNode) {         //check if notification exists in parent(body) DOM before we can safely remove it.
            notification.remove();
        }
    }, duration);
}



//generateId() creates unique IDs for new boards, folders, and tasks
//formatDate() converts dates like "2024-01-15" to "Jan 15, 2024" for display
//here:

/**
 * Generates a unique ID for new items
 * @returns {string} Unique ID
 */

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formats a date for display
 * @param {string} dateString - Date string     //this is just cool way of writing comments
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
    const due = new Date(`${dueDate}T${dueTime}`);   //T is the standard way in JavaScript to separate date and time (YYYY-MM-DDTHH:MM).
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
function saveData(userId, data) {      //In JavaScript, localStorage.setItem() is a method used to store data in the browser’s local storage
    try {
        localStorage.setItem(`swift_task_${userId}`, JSON.stringify(data));   //localStorage.setItem(key, value);      key is swift_task_${userId} and value is JSON.stringify(data)

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
function loadData(userId) {                                                            // localStorage can only store strings.

    // JSON.stringify converts the object/array into a string.
    try {
        const data = localStorage.getItem(`swift_task_${userId}`);
        return data ? JSON.parse(data) : { boards: [] };
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
        return { boards: [] };
    }
}

/**
 * Searches through boards, folders, and tasks based on search criteria
 * @param {string} searchTerm - Search term
 * @param {string} searchType - Type of search (all, boards, folders, tasks)
 * @returns {object} Filtered data and items to expand
 */
function searchData(searchTerm, searchType) {
    if (!searchTerm.trim()) {
        return { data: currentData, expandBoards: [], expandFolders: [] };
    }

    const term = searchTerm.toLowerCase().trim();  //term → will store the search text.
    const filteredData = { boards: [] };          //filteredData → will store the search results.
    const expandBoards = [];                      //expandBoards → will store the IDs of boards that need to be expanded.
    const expandFolders = [];                     //expandFolders → will store the IDs of folders that need to be expanded.

    currentData.boards.forEach(board => {
        let boardMatches = false;
        let filteredBoard = { ...board, folders: [] };    //... is the spread operator. It copies all properties from board and adds an empty folders array.

        // Search in board name
        if (searchType === 'all' || searchType === 'boards') {
            if (board.name.toLowerCase().includes(term)) {
                boardMatches = true;
                // Don't automatically expand board when searching for it
                // Only include folders if they have matching content
                if (board.folders && board.folders.length > 0) {
                    board.folders.forEach(folder => {
                        filteredBoard.folders.push({ ...folder, tasks: folder.tasks || [] });
                    });
                }
            }
        }

        // Search in folders
        if (board.folders && board.folders.length > 0) {
            board.folders.forEach(folder => {
                let folderMatches = false;
                let filteredFolder = { ...folder, tasks: [] };

                // Search in folder name
                if (searchType === 'all' || searchType === 'folders') {
                    if (folder.name.toLowerCase().includes(term)) {
                        folderMatches = true;
                        expandBoards.push(board.id);
                        expandFolders.push(folder.id);
                        // If folder matches, include ALL tasks in that folder
                        if (folder.tasks && folder.tasks.length > 0) {
                            folder.tasks.forEach(task => {
                                filteredFolder.tasks.push(task);
                            });
                        }
                    }
                }

                // Search in tasks (only if not already matched by folder name)
                if (!folderMatches && folder.tasks && folder.tasks.length > 0) {
                    folder.tasks.forEach(task => {
                        let taskMatches = false;

                        if (searchType === 'all' || searchType === 'tasks') {
                            // Search in task title, description, priority, status
                            if (task.title.toLowerCase().includes(term) ||
                                (task.description && task.description.toLowerCase().includes(term)) ||
                                task.priority.toLowerCase().includes(term) ||
                                task.status.toLowerCase().includes(term)) {
                                taskMatches = true;
                            }
                        }

                        if (taskMatches) {
                            filteredFolder.tasks.push(task);
                            folderMatches = true;
                            // If task matches, expand both board and folder
                            expandBoards.push(board.id);
                            expandFolders.push(folder.id);
                        }
                    });
                }

                if (folderMatches) {
                    filteredBoard.folders.push(filteredFolder);
                    boardMatches = true;
                }
            });
        }

        if (boardMatches) {
            filteredData.boards.push(filteredBoard);
        }
    });

    // Remove duplicates from expand arrays  
    // //Sometimes same board/folder is added multiple times.
    //Set ensures only unique IDs are stored.
    const uniqueExpandBoards = [...new Set(expandBoards)];
    const uniqueExpandFolders = [...new Set(expandFolders)];

    return {
        data: filteredData,
        expandBoards: uniqueExpandBoards,
        expandFolders: uniqueExpandFolders
    };
}

/**
 * Highlights search terms in text
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Search term to highlight
 * @returns {string} HTML with highlighted text
 */
function highlightSearchTerm(text, searchTerm) {     //text → The string where you want to highlight something.
    //searchTerm → The word or phrase that the user is searching for.
    if (!searchTerm.trim()) return text;  //If the search term is empty or only spaces, return the original text—nothing to highlight.

    const regex = new RegExp(`(${searchTerm})`, 'gi');   //RegExp is a built-in JavaScript object that represents a regular expression.

    // 'gi' → two options:
    //g → global → find all matches from the whole page, not just the first one.
    //i → ignore case → “Task” = “task” = “TASK”.

    return text.replace(regex, '<mark class="search-highlight">$1</mark>');   //replace() → replaces the matched text with the new text.
    //$1 the text that was matched (the thing inside () in regex).
    //<mark class="search-highlight">$1</mark> → the new text with added style(yellow highlight) that replaces the matched text.
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
    currentUser = user;                           //If user is found, store them in currentUser → so the app knows who is logged in.
    currentUserSpan.textContent = user.username;  // Update the username on the page (currentUserSpan).

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

    // Automatically open the board when a folder is added
    openBoards.add(window.currentBoardId);

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

    // Check if task with same name already exists in this folder
    if (folder.tasks && folder.tasks.some(task => task.title.toLowerCase() === title.toLowerCase())) {
        showNotification('A task with this name already exists in this folder', 'error');
        return;
    }

    //This is a comment out code that was used to limit the number of tasks in a folder to 3.
    // if(folder.tasks.length >= 3){
    //   showNotification('A folder can only have 3 tasks', 'error');
    // return;
    // }

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

    // Automatically open the folder when a task is added
    openFolders.add(window.currentFolderId);

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

    // Get search term and type
    const searchTerm = searchInput.value.trim();
    const searchType = document.getElementById('searchType').value;

    // Get data to render (original or filtered)
    let dataToRender;
    let expandBoards = [];
    let expandFolders = [];

    if (searchTerm) {
        const searchResult = searchData(searchTerm, searchType);
        dataToRender = searchResult.data;
        expandBoards = searchResult.expandBoards;
        expandFolders = searchResult.expandFolders;

        // Update open states for search results
        expandBoards.forEach(boardId => openBoards.add(boardId));
        expandFolders.forEach(folderId => openFolders.add(folderId));
    } else {
        dataToRender = currentData;
    }

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        boardsContainer.innerHTML = '';

        if (dataToRender.boards.length === 0) {
            if (searchTerm) {
                boardsContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">No results found</h4>
                        <p class="text-muted">No ${searchType === 'all' ? 'items' : searchType} match "${searchTerm}"</p>
                        <button class="btn btn-outline-primary" onclick="clearSearch()">
                            <i class="fas fa-times me-1"></i>Clear Search
                        </button>
                    </div>
                `;
            } else {
                boardsContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-columns fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">No boards created yet</h4>
                        <p class="text-muted">Create your first board to get started!</p>
                    </div>
                `;
            }
            window.isRendering = false;
            return;
        }

        dataToRender.boards.forEach(board => {
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
                                        ${highlightSearchTerm(board.name, searchTerm)}
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
                        ${renderBoardFolders(board, searchTerm)}
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
 * @param {string} searchTerm - Search term for highlighting
 * @returns {string} HTML string for folders
 */
function renderBoardFolders(board, searchTerm = '') {
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
                                ${highlightSearchTerm(folder.name, searchTerm)}
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
                ${renderFolderTasks(folder, searchTerm)}
            </div>
        </div>
    `).join('');
}

/**
 * Renders tasks within a folder
 * @param {object} folder - Folder object
 * @param {string} searchTerm - Search term for highlighting
 * @returns {string} HTML string for tasks
 */
function renderFolderTasks(folder, searchTerm = '') {
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
                        <div class="task-title">${highlightSearchTerm(task.title, searchTerm)}</div>
                        <span class="task-priority priority-${task.priority}">${highlightSearchTerm(task.priority, searchTerm)}</span>
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
                
                ${task.description ? `<div class="task-description">${highlightSearchTerm(task.description, searchTerm)}</div>` : ''}
                
                ${countdownText}
                
                <div class="task-actions">
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'pending')">
                        ${task.status === 'pending' ? '<i class="fas fa-check me-1"></i>' : ''}${highlightSearchTerm('Pending', searchTerm)}
                    </button>
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'active')">
                        ${task.status === 'active' ? '<i class="fas fa-check me-1"></i>' : ''}${highlightSearchTerm('Active', searchTerm)}
                    </button>
                    <button class="task-status status-${task.status}" onclick="changeTaskStatus('${task.id}', 'completed')">
                        ${task.status === 'completed' ? '<i class="fas fa-check me-1"></i>' : ''}${highlightSearchTerm('Completed', searchTerm)}
                    </button>
                    <button class="btn btn-info btn-sm" onclick="editTask('${task.id}')" ${task.editCount >= 3 ? 'disabled' : ''}>
                        <i class="fas fa-edit me-1"></i>Edit Task
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
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
        loginUser(username);
    }
});

// Logout button
logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    logoutUser();
});

// Profile button
profileBtn.addEventListener('click', function (e) {
    e.preventDefault();
    showProfile();
});

// Add board button
addBoardBtn.addEventListener('click', function () {
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
boardNameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addBoard(this.value);
        this.value = '';
    }
});

// Enter key handler for folder name input
document.getElementById('folderNameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        createFolder();
    }
});

// Search functionality with debouncing
let searchTimeout;
let previousSearchTerm = '';
searchInput.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const currentSearchTerm = searchInput.value.trim();

        // If search term was removed (cleared), close all accordions
        if (previousSearchTerm && !currentSearchTerm) {
            openBoards.clear();
            openFolders.clear();
        }

        previousSearchTerm = currentSearchTerm;
        renderDashboard();
        updateClearSearchButton();
    }, 300); // 300ms delay for better performance
});

searchType.addEventListener('change', function () {
    renderDashboard();
});

clearSearchBtn.addEventListener('click', clearSearch);

/**
 * Clears the search and resets the view
 */
function clearSearch() {
    searchInput.value = '';
    searchType.value = 'all';
    clearSearchBtn.style.display = 'none';

    // Reset open states when clearing search - close all accordions
    openBoards.clear();
    openFolders.clear();

    renderDashboard();
}

/**
 * Updates the clear search button visibility
 */
function updateClearSearchButton() {
    if (searchInput.value.trim()) {
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

// Set default dates for task forms
document.addEventListener('DOMContentLoaded', function () {
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