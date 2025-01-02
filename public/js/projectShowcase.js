import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from '../js/firebase.js';

export async function initWork() {
    const projectsContainer = document.querySelector('.projects');

    try {
        const querySnapshot = await getDocs(collection(db, "projects"));

        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectElement = createProject(project);
            projectsContainer.appendChild(projectElement);
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

function createProject(project) {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';

    projectItem.innerHTML = `
        <div class="project-item-content">
            <div class="project-header">
                <span class="project-title">${project.name}</span>
            </div>
        </div>
    `;

    return projectItem;
}