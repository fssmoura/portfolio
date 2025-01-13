import { auth, db, storage } from '/js/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Constants
const ADMIN_EMAIL = 'fssmoura.fm@gmail.com';
let selectedTools = [];
let toolsPool = new Set();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const adminDashboard = document.getElementById('adminDashboard');
const projectForm = document.getElementById('projectForm');
const projectsList = document.getElementById('projectsList');

// Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (email !== ADMIN_EMAIL) {
            throw new Error('Unauthorized access. Only admin can access this page.');
        }
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(error.message);
    }
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        loginForm.classList.add('d-none');
        adminDashboard.classList.remove('d-none');
        loadProjects();
        loadToolsPool();
    } else {
        if (user && user.email !== ADMIN_EMAIL) {
            alert('Unauthorized access. Only admin can access this page.');
            signOut(auth);
        }
        loginForm.classList.remove('d-none');
        adminDashboard.classList.add('d-none');
    }
});

// Load projects
async function loadProjects() {
    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        projectsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const row = `
                <tr>
                    <td>${project.name}</td>
                    <td>${project.type}</td>
                    <td>${project.year}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-project" data-id="${doc.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-project" data-id="${doc.id}">Delete</button>
                    </td>
                </tr>
            `;
            projectsList.innerHTML += row;
        });
    } catch (error) {
        alert('Error loading projects: ' + error.message);
    }
}

async function loadToolsPool() {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach((doc) => {
        const project = doc.data();
        if (project.tools) {
            project.tools.forEach(tool => toolsPool.add(tool));
        }
    });
    updateToolsList();
}

function updateToolsList() {
    const datalist = document.getElementById('toolsList');
    datalist.innerHTML = Array.from(toolsPool)
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
        .map(tool => `<option value="${tool}">`)
        .join('');
}

function updateToolTags() {
    const tagsContainer = document.getElementById('toolTags');
    tagsContainer.innerHTML = selectedTools
        .map(tool => `
            <span class="tool-tag">
                ${tool}
                <button type="button" class="remove-tool" data-tool="${tool}">&times;</button>
            </span>
        `).join('');
}

document.getElementById('toolTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-tool')) {
        const tool = e.target.dataset.tool;
        selectedTools = selectedTools.filter(t => t !== tool);
        updateToolTags();
    }
});

async function loadProjectData(id) {
    try {
        const docSnap = await getDoc(doc(db, "projects", id));
        if (docSnap.exists()) {
            const project = docSnap.data();
            document.getElementById('projectId').value = id;
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectType').value = project.type;
            document.getElementById('projectYear').value = project.year;
            document.getElementById('projectOwner').value = project.owner || '';
            document.getElementById('toolInput').value = '';
            selectedTools = project.tools || [];
            updateToolTags();

            // Show current thumbnail if exists
            if (project.thumbnail) {
                const preview = document.createElement('img');
                preview.src = project.thumbnail;
                preview.classList.add('thumbnail-preview');
                preview.style.border = '1px solid #eff0f2';
                preview.style.borderRadius = '0.5rem';
                preview.style.maxWidth = '100%';
                preview.style.marginTop = '1.5rem';
                preview.style.marginBottom = '1rem';
                document.getElementById('projectThumbnail').parentElement.appendChild(preview);
            }

            const modal = new bootstrap.Modal(document.getElementById('projectModal'));
            modal.show();
        }
    } catch (error) {
        alert('Error loading project: ' + error.message);
    }
}

document.getElementById('toolInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tool = this.value.trim();
        if (tool && !selectedTools.includes(tool)) {
            selectedTools.push(tool);
            toolsPool.add(tool);
            updateToolsList();
            updateToolTags();
            this.value = '';
        }
    }
});

document.getElementById('toolInput').addEventListener('change', function () {
    const tool = this.value.trim();
    if (tool && !selectedTools.includes(tool)) {
        selectedTools.push(tool);
        updateToolTags();
        this.value = '';
    }
});

// Handle project form submission
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const projectId = document.getElementById('projectId').value;

    try {
        const projectData = {
            name: document.getElementById('projectName').value,
            type: document.getElementById('projectType').value,
            year: document.getElementById('projectYear').value,
            owner: document.getElementById('projectOwner').value,
            tools: selectedTools,
        };

        const thumbnailFile = document.getElementById('projectThumbnail').files[0];

        if (projectId) {
            // Editing existing project
            const docSnap = await getDoc(doc(db, "projects", projectId));
            const currentProject = docSnap.data();

            if (thumbnailFile) {
                // Delete old image if exists
                if (currentProject.thumbnailPath) {
                    await deleteImage(currentProject.thumbnailPath);
                }
                // Upload new image
                const imageData = await uploadImage(thumbnailFile, 'thumbnails');
                projectData.thumbnail = imageData.url;
                projectData.thumbnailPath = imageData.path;
            } else {
                // Keep existing image
                projectData.thumbnail = currentProject.thumbnail;
                projectData.thumbnailPath = currentProject.thumbnailPath;
            }

            await updateDoc(doc(db, "projects", projectId), projectData);
        } else {
            // Creating new project
            if (thumbnailFile) {
                const imageData = await uploadImage(thumbnailFile, 'thumbnails');
                projectData.thumbnail = imageData.url;
                projectData.thumbnailPath = imageData.path;
            }
            await addDoc(collection(db, "projects"), projectData);
        }

        bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
        loadProjects();
        projectForm.reset();
    } catch (error) {
        alert('Error saving project: ' + error.message);
    }
});

// Handle project actions (edit/delete)
projectsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-project')) {
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                const id = e.target.dataset.id;
                const docSnap = await getDoc(doc(db, "projects", id));
                const project = docSnap.data();

                // Delete image if exists
                if (project.thumbnailPath) {
                    await deleteImage(project.thumbnailPath);
                }

                await deleteDoc(doc(db, "projects", id));
                loadProjects();
            } catch (error) {
                alert('Error deleting project: ' + error.message);
            }
        }
    } else if (e.target.classList.contains('edit-project')) {
        const id = e.target.dataset.id;
        await loadProjectData(id);
    }
});

// Add after DOM Elements
document.getElementById('projectThumbnail').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Remove existing preview
            const existingPreview = document.querySelector('.thumbnail-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            // Create new preview
            const preview = document.createElement('img');
            preview.src = e.target.result;
            preview.classList.add('thumbnail-preview');
            preview.style.maxWidth = '100%';
            preview.style.marginTop = '1.5rem';
            preview.style.marginBottom = '1rem';
            this.parentElement.appendChild(preview);
        }.bind(this);
        reader.readAsDataURL(file);
    }
});

// Update modal reset handler
document.getElementById('projectModal').addEventListener('hidden.bs.modal', function () {
    projectForm.reset();
    document.getElementById('projectId').value = '';
    selectedTools = [];
    updateToolTags();
    const preview = document.querySelector('.thumbnail-preview');
    if (preview) preview.remove();
});
// Sign out
document.getElementById('signOutBtn').addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            window.location.reload();
        })
        .catch(error => alert('Error signing out: ' + error.message));
});

async function uploadImage(file, path) {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return {
        url: await getDownloadURL(snapshot.ref),
        path: snapshot.ref.fullPath
    };
}

async function deleteImage(path) {
    if (path) {
        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
    }
}