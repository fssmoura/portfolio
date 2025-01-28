// Get stored theme or default to false (light theme)
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

function applyTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    const root = document.documentElement;

    // Update theme colors
    root.style.setProperty('--accent', `var(--${theme}-accent)`);
    root.style.setProperty('--border', `var(--${theme}-border)`);
    root.style.setProperty('--background', `var(--${theme}-background)`);
    root.style.setProperty('--highlight', `var(--${theme}-highlight)`);
    root.style.setProperty('--shadow', `var(--${theme}-shadow)`);

    // Update toggle states
    const lightToggle = document.getElementById('lightThemeToggle');
    const darkToggle = document.getElementById('darkThemeToggle');

    lightToggle.querySelector('.navbar-theme-label').classList.toggle('on', !isDark);
    darkToggle.querySelector('.navbar-theme-label').classList.toggle('on', isDark);
}

// Apply stored theme on load
applyTheme(isDarkTheme);

// Add click handlers to both toggles
document.getElementById('lightThemeToggle').addEventListener('click', () => {
    isDarkTheme = false;
    updateTheme();
});

document.getElementById('darkThemeToggle').addEventListener('click', () => {
    isDarkTheme = true;
    updateTheme();
});

function updateTheme() {
    localStorage.setItem('darkTheme', isDarkTheme);
    applyTheme(isDarkTheme);
    console.log('Theme switched to:', isDarkTheme ? 'dark' : 'light');
}