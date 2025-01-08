import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

export async function initWork() {
    const projectsContainer = document.querySelector('.projects');

    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projects = [];

        querySnapshot.forEach((doc) => {
            projects.push({
                data: doc.data()
            });
        });

        projects
            .sort((a, b) => {
                // Sort by year (descending - most recent first)
                const yearDiff = parseInt(b.data.year) - parseInt(a.data.year);
                // If years are the same, sort by name (alphabetically)
                if (yearDiff === 0) {
                    return a.data.name.localeCompare(b.data.name);
                }
                return yearDiff;
            })
            .slice(0, 8)
            .forEach((project, index, array) => {
                // Calculate ID starting from the end
                // If array.length is 8, then for index 0 we get ID "08", for the last index we get "01"
                const sequentialId = String(array.length - index).padStart(2, '0');
                const projectElement = createProject(project.data, sequentialId);
                projectsContainer.appendChild(projectElement);
            });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}
function createProject(project, sequentialId) {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';

    projectItem.innerHTML = `
        <div class="project-info">
            <div class="project-info-line left">
                <span class="project-title">${project.name}</span>
                <span class="project-subtitle">${project.owner} — ${project.year}</span>
            </div>
            <div class="project-info-line right">
                <span class="project-id">${sequentialId}</span>
                <span class="project-type">${project.type}</span>
            </div>
        </div>
         <div class="project-thumbnail">
            <img src="${project.thumbnail}" alt="${project.name}">
        </div>
    `;

    return projectItem;
}