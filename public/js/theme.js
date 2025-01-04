// Get stored theme or default to false (light theme)
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';

// Apply theme on page load
function applyTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    const root = document.documentElement;
    root.style.setProperty('--accent', `var(--${theme}-accent)`);
    root.style.setProperty('--border', `var(--${theme}-border)`);
    root.style.setProperty('--background', `var(--${theme}-background)`);
    root.style.setProperty('--highlight', `var(--${theme}-highlight)`);
}

// Apply stored theme on load
applyTheme(isDarkTheme);

document.getElementById('themeToggle').addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;

    // Store theme preference
    localStorage.setItem('darkTheme', isDarkTheme);

    // Apply theme
    applyTheme(isDarkTheme);
    console.log('Theme switched to:', isDarkTheme ? 'dark' : 'light');
});