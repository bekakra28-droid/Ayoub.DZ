// Theme management
const themeToggle = document.getElementById('themeToggle');

function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = themeToggle?.querySelector('i');
    if(icon) {
        if(theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Apply theme on load
if(themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    setTheme(getCurrentTheme());
}

// Add loading animation utility
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if(element) {
        element.innerHTML = '<div class="spinner"></div>';
        element.style.display = 'block';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if(element) {
        element.style.display = 'none';
    }
}

function showMessage(message, type, elementId = 'messageContainer') {
    const container = document.getElementById(elementId);
    if(container) {
        container.innerHTML = `<div class="alert-${type} fade-in">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}