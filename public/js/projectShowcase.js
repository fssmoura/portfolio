import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

export async function initShowcaseDisplay() {
    const projectsContainer = document.querySelector('.showcase');

    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projects = [];

        querySnapshot.forEach((doc) => {
            const projectData = doc.data();
            if (projectData.visible !== false) {
                projects.push({
                    id: doc.id,
                    data: projectData
                });
            }
        });

        projects
            .sort((a, b) => {
                const yearDiff = parseInt(b.data.year) - parseInt(a.data.year);
                if (yearDiff === 0) {
                    return a.data.name.localeCompare(b.data.name);
                }
                return yearDiff;
            })
            .slice(0, 8)
            .forEach((project, index, array) => {
                const sequentialId = String(array.length - index).padStart(2, '0');
                const projectElement = createProjectItem(project, sequentialId);
                projectsContainer.appendChild(projectElement);
            });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

function createProjectItem(project, sequentialId) {
    const projectItem = document.createElement('div');
    projectItem.className = 'showcase-project-item';
    projectItem.style.cursor = 'pointer';

    projectItem.innerHTML = `
        <div class="showcase-project-info">
            <div class="showcase-project-info-line left">
                <span class="showcase-project-title">${project.data.name}</span>
                <span class="showcase-project-subtitle">${formatSubtitle(project.data.owner, project.data.year)}</span>
            </div>
            <div class="showcase-project-info-line right">
                <span class="showcase-project-id">${sequentialId}</span>
                <span class="showcase-project-type">${project.data.type}</span>
            </div>
        </div>
        <div class="showcase-project-thumbnail">
            <img src="${project.data.thumbnail}" alt="${project.data.name}">
        </div>
    `;

    projectItem.addEventListener('click', () => {
        window.location.href = `/project?id=${project.id}`;
    });

    return projectItem;
}

function formatSubtitle(owner, year) {
    if (owner && year) {
        return `${owner} — ${year}`;
    } else if (owner) {
        return owner;
    } else if (year) {
        return year;
    }
    return '';
}