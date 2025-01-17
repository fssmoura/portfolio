import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from './firebase.js';

async function loadProject() {
    // Get project ID from URL parameters
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
            // Update the project name in the navbar
            const projectNameElement = document.querySelector('.navbar-project');
            projectNameElement.textContent = project.name;
        }
    } catch (error) {
        console.error("Error loading project:", error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadProject);