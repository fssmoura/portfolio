import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';

async function loadProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        console.error('No project ID provided');
        return;
    }

    try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const project = docSnap.data();
            const projectNameElement = document.querySelector('.navbar-project');
            projectNameElement.textContent = project.name;
        }
    } catch (error) {
        console.error("Error loading project:", error);
    }
}

let isScrollingProgrammatically = false;

function updateActiveBookmark(targetId) {
    // Remove all active states
    document.querySelectorAll('.bookmark-label').forEach(bookmark => {
        bookmark.classList.remove('active');
    });
    document.querySelectorAll('.bookmark-active-icon').forEach(icon => {
        icon.remove();
    });

    // Set new active state
    const activeBookmark = document.querySelector(`[href="#${targetId}"]`);
    if (activeBookmark) {
        activeBookmark.querySelector('.bookmark-label').classList.add('active');
        const newActiveIcon = document.createElement('span');
        newActiveIcon.className = 'bookmark-active-icon';
        activeBookmark.insertBefore(newActiveIcon, activeBookmark.firstChild);
    }
}

function handleScroll() {
    if (isScrollingProgrammatically) return;

    const blocks = document.querySelectorAll('.project-block');
    let mostVisible = null;
    let maxVisibility = 0;

    blocks.forEach(block => {
        const rect = block.getBoundingClientRect();
        const visibility = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);

        if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisible = block;
        }
    });

    if (mostVisible) {
        updateActiveBookmark(mostVisible.id);
    }
}

function handleBookmarkClick(e) {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
        isScrollingProgrammatically = true;

        // Remove active states before scrolling
        document.querySelectorAll('.bookmark-label').forEach(bookmark => {
            bookmark.classList.remove('active');
        });
        document.querySelectorAll('.bookmark-active-icon').forEach(icon => {
            icon.remove();
        });

        targetElement.scrollIntoView({ behavior: 'smooth' });

        // Update active state after scroll animation completes
        setTimeout(() => {
            updateActiveBookmark(targetId);
            isScrollingProgrammatically = false;
        }, 1000); // Duration of smooth scroll
    }
}

function initBookmarks() {
    const bookmarks = document.querySelectorAll('.project-bookmark');
    bookmarks.forEach(bookmark => {
        bookmark.addEventListener('click', handleBookmarkClick);
    });

    const projectContent = document.querySelector('.project-content');
    projectContent.addEventListener('scroll', handleScroll);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProject();
    initBookmarks();
});