import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

export async function initWork() {
    const projectsContainer = document.querySelector('.projects');

    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projects = [];

        querySnapshot.forEach((doc) => {
            projects.push({
                data: doc.data(),
                id: doc.id
            });
        });

        projects
            .sort((a, b) => parseInt(b.id) - parseInt(a.id))
            .slice(0, 8) // Trim and show only the first 8 projects
            .forEach(project => {
                const projectElement = createProject(project.data, project.id);
                projectsContainer.appendChild(projectElement);
            });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}
function createProject(project, documentId) {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';

    projectItem.innerHTML = `
        <div class="project-info">
            <div class="project-info-line left">
                <span class="project-title">${project.name}</span>
                <span class="project-subtitle">${project.type} — ${project.year}</span>
            </div>
            <div class="project-info-line right">
                <span class="project-id">${documentId}</span>
            </div>
        </div>
         <div class="project-thumbnail">
            <img src="${project.thumbnail}" alt="${project.name}">
        </div>
    `;

    return projectItem;
}