import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';
import { SECTIONS, hasRequiredFields } from './sections.js';

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

            const contentContainer = document.querySelector('.project-content');
            const bookmarksContainer = document.querySelector('.project-bookmarks');
            contentContainer.innerHTML = '';
            bookmarksContainer.innerHTML = '';

            // Iterate through all sections
            Object.entries(SECTIONS).forEach(([sectionId, section]) => {
                if (hasRequiredFields(sectionId, project)) {
                    contentContainer.innerHTML += section.template(project);
                    bookmarksContainer.innerHTML += `
                    <a href="#project${section.id.charAt(0).toUpperCase() + section.id.slice(1)}" class="project-bookmark">
                        ${sectionId === 'overview' ? '<span class="bookmark-active-icon"></span>' : ''}
                        <span class="bookmark-label ${sectionId === 'overview' ? 'active' : ''}">${section.label}</span>
                    </a>
                `;
                }
            });

            initBookmarks();
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

    const parallaxImage = document.getElementById('parallaxImage');
    if (parallaxImage) {
        const projectContent = document.querySelector('.project-content');
        const scrollPosition = projectContent.scrollTop;
        const startTranslate = 50;
        const endTranslate = 1;
        const scrollFactor = 0.07;

        const translateY = Math.max(endTranslate, Math.min(startTranslate - (scrollPosition * scrollFactor), startTranslate));

        parallaxImage.style.transform = `translateY(${translateY}%)`;
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