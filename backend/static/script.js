// DOM Elements
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');
const sortByScoreBtn = document.getElementById('sortScore');
const sortByDeadlineBtn = document.getElementById('sortDeadline');

// Task storage
let tasks = [];
let currentSort = '-score'; // Default sort by score (descending)

// Initialize the app
function init() {
    // Load tasks from API
    saveAndRender();
    
    // Set up event listeners
    taskForm.addEventListener('submit', handleAddTask);
    sortByScoreBtn.addEventListener('click', () => setSort('-score'));
    sortByDeadlineBtn.addEventListener('click', () => setSort('deadline'));
}

// Calculate task score based on multiple factors
function calculateTaskScore(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const timeUntilDeadline = deadline - now;
    const hoursUntilDeadline = Math.max(timeUntilDeadline / (1000 * 60 * 60), 0);
    
    // Normalize values (0-1 range)
    const normalizedImportance = task.importance / 10; // Already 1-10
    const normalizedUrgency = Math.min(1, 1 / (hoursUntilDeadline / 24 + 1)); // More urgent as deadline approaches
    const normalizedEffort = 1 - Math.min(1, task.effort / 10); // Lower effort is better
    
    // Weighted score (adjust weights as needed)
    const score = (
        (normalizedImportance * 0.5) +
        (normalizedUrgency * 0.3) +
        (normalizedEffort * 0.2)
    ) * 100;
    
    return Math.min(Math.round(score), 100); // Cap at 100
}

// Add a new task
async function handleAddTask(e) {
    e.preventDefault();
    
    const taskName = document.getElementById('taskName').value;
    const deadline = document.getElementById('deadline').value;
    const importance = parseInt(document.getElementById('importance').value);
    const effort = parseFloat(document.getElementById('effort').value);
    
    if (!taskName || !deadline) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newTask = {
        name: taskName,
        deadline: deadline,
        importance: importance,
        effort: effort,
        completed: false
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) {
            throw new Error('Failed to add task');
        }

        const savedTask = await response.json();
        tasks.push(savedTask);
        await saveAndRender();
        taskForm.reset();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
    }
}

// Save tasks to API and re-render
async function saveAndRender() {
    try {
        const response = await fetch(`/api/tasks?ordering=${currentSort}`);
        if (response.ok) {
            tasks = await response.json();
            renderTasks();
        } else {
            throw new Error('Failed to fetch tasks');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Failed to load tasks. Please refresh the page.');
    }
}

// Render all tasks
function renderTasks() {
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p class="no-tasks">No tasks added yet. Add your first task above!</p>';
        return;
    }
    
    // Sort tasks based on current sort method
    const sortedTasks = [...tasks].sort((a, b) => {
        if (currentSort === 'score') {
            return b.score - a.score; // Higher score first
        } else {
            return new Date(a.deadline) - new Date(b.deadline); // Earlier deadline first
        }
    });
    
    // Filter out completed tasks
    const activeTasks = sortedTasks.filter(task => !task.completed);
    const completedTasks = sortedTasks.filter(task => task.completed);
    
    let html = '';
    
    // Active tasks
    if (activeTasks.length > 0) {
        html += '<h3 style="margin-bottom: 15px; color: var(--primary-color);">Active Tasks</h3>';
        html += activeTasks.map(taskToHTML).join('');
    }
    
    // Completed tasks
    if (completedTasks.length > 0) {
        html += '<h3 style="margin: 30px 0 15px; color: var(--secondary-color);">Completed</h3>';
        html += completedTasks.map(taskToHTML).join('');
    }
    
    tasksContainer.innerHTML = html || '<p class="no-tasks">No tasks to display.</p>';
    
    // Add event listeners to new elements
    document.querySelectorAll('.btn-complete').forEach(btn => {
        btn.addEventListener('click', handleCompleteTask);
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', handleDeleteTask);
    });
}

// Convert task object to HTML
function taskToHTML(task) {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const isOverdue = !task.completed && deadline < now;
    
    // Format date and time
    const deadlineStr = deadline.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calculate time remaining
    let timeRemaining = '';
    if (!task.completed) {
        const diffMs = deadline - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (isOverdue) {
            timeRemaining = `<span class="task-detail" style="color: var(--danger-color);">
                <i class="material-icons" style="font-size: 16px;">warning</i>
                Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}
            </span>`;
        } else if (diffDays > 1) {
            timeRemaining = `<span class="task-detail">
                <i class="material-icons" style="font-size: 16px;">schedule</i>
                ${diffDays} days left
            </span>`;
        } else if (diffDays === 1) {
            timeRemaining = `<span class="task-detail" style="color: #e67e22;">
                <i class="material-icons" style="font-size: 16px;">warning</i>
                Due tomorrow
            </span>`;
        } else {
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
            timeRemaining = `<span class="task-detail" style="color: #e67e22;">
                <i class="material-icons" style="font-size: 16px;">warning</i>
                Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}
            </span>`;
        }
    }
    
    return `
        <div class="task-item" data-id="${task.id}" ${task.completed ? 'style="opacity: 0.7;"' : ''}>
            <div class="task-header">
                <h3 class="task-title" ${task.completed ? 'style="text-decoration: line-through;"' : ''}>
                    ${task.name}
                </h3>
                <span class="task-score" style="background: ${getScoreColor(task.score)}">
                    ${task.completed ? '✓' : task.score}
                </span>
            </div>
            <div class="task-details">
                <span class="task-detail">
                    <i class="material-icons" style="font-size: 16px;">event</i>
                    ${deadlineStr}
                </span>
                ${timeRemaining}
                <span class="task-detail">
                    <i class="material-icons" style="font-size: 16px;">priority_high</i>
                    Priority: ${task.importance}/10
                </span>
                <span class="task-detail">
                    <i class="material-icons" style="font-size: 16px;">timer</i>
                    ${task.effort} hour${task.effort !== 1 ? 's' : ''}
                </span>
            </div>
            <div class="task-actions">
                ${!task.completed ? `
                    <button class="btn-complete" style="background-color: var(--success-color); color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class="material-icons" style="font-size: 16px; vertical-align: middle;">check</i> Complete
                    </button>
                ` : ''}
                <button class="btn-delete" style="background-color: var(--danger-color); color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer;">
                    <i class="material-icons" style="font-size: 16px; vertical-align: middle;">delete</i> Delete
                </button>
            </div>
        </div>
    `;
}

// Get color based on task score
function getScoreColor(score) {
    if (score >= 80) return '#e74c3c'; // Red for high priority
    if (score >= 60) return '#e67e22'; // Orange for medium-high
    if (score >= 40) return '#f1c40f'; // Yellow for medium
    if (score >= 20) return '#2ecc71'; // Green for low-medium
    return '#95a5a6'; // Gray for low
}

// Handle task completion
async function handleCompleteTask(e) {
    const taskId = e.target.dataset.id;
    const task = tasks.find(t => t.id == taskId);
    if (!task) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle_complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (response.ok) {
            task.completed = !task.completed;
            await saveAndRender();
        } else {
            throw new Error('Failed to update task');
        }
    } catch (error) {
        console.error('Error toggling task completion:', error);
        alert('Failed to update task status. Please try again.');
    }
}

// Handle task deletion
async function handleDeleteTask(e) {
    const taskId = e.target.dataset.id;
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (response.ok) {
            tasks = tasks.filter(task => task.id != taskId);
            await saveAndRender();
        } else {
            throw new Error('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

// Set sorting method
function setSort(method) {
    currentSort = method;
    
    // Update active button state
    sortByScoreBtn.classList.remove('active');
    sortByDeadlineBtn.classList.remove('active');
    
    if (method === '-score') {
        sortByScoreBtn.classList.add('active');
    } else {
        sortByDeadlineBtn.classList.add('active');
    }
    
    saveAndRender();
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Auto-update task scores every minute
setInterval(() => {
    const hasActiveTasks = tasks.some(task => !task.completed);
    if (hasActiveTasks) {
        saveAndRender();
    }
}, 60000); // Update every minute
