import { auth, db, storage } from '/js/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, setDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Constants
const ADMIN_EMAIL = 'fssmoura.fm@gmail.com';
let selectedTools = [];
let toolsPool = new Set();
let selectedTags = [];
let tagsPool = new Set();
let sectionCounter = 1;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const adminDashboard = document.getElementById('adminDashboard');
const projectForm = document.getElementById('projectForm');
const projectsList = document.getElementById('projectsList');
const loadingOverlay = document.querySelector('.loading-overlay');
const toastContainer = document.querySelector('.toast-container');

// Utility Functions
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Slug generator function
function createSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Generate unique slug
async function generateUniqueSlug(baseName) {
    let slug = createSlug(baseName);
    let counter = 1;
    let uniqueSlug = slug;

    while (true) {
        const docSnap = await getDoc(doc(db, "projects", uniqueSlug));
        if (!docSnap.exists()) {
            return uniqueSlug;
        }
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }
}

// Authentication
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email !== ADMIN_EMAIL) {
            throw new Error('Unauthorized access. Only admin can access this page.');
        }
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful!');
    } catch (error) {
        showToast(error.message, 'danger');
    } finally {
        hideLoading();
    }
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        loginForm.classList.add('d-none');
        adminDashboard.classList.remove('d-none');
        loadProjects();
        loadToolsPool();
        loadTagsPool();
    } else {
        if (user && user.email !== ADMIN_EMAIL) {
            showToast('Unauthorized access. Only admin can access this page.', 'danger');
            signOut(auth);
        }
        loginForm.classList.remove('d-none');
        adminDashboard.classList.add('d-none');
    }
});

// Load projects
async function loadProjects() {
    showLoading();
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
        showToast('Error loading projects: ' + error.message, 'danger');
    } finally {
        hideLoading();
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

async function loadTagsPool() {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach((doc) => {
        const project = doc.data();
        if (project.tags) {
            project.tags.forEach(tag => tagsPool.add(tag));
        }
    });
    updateTagsList();
}

function updateTagsList() {
    const datalist = document.getElementById('tagsList');
    datalist.innerHTML = Array.from(tagsPool)
        .sort((a, b) => a.localeCompare(b))
        .map(tag => `<option value="${tag}">`)
        .join('');
}

function updateTagsDisplay() {
    const tagsContainer = document.getElementById('projectTags');
    tagsContainer.innerHTML = selectedTags
        .map(tag => `
            <span class="tool-tag">
                ${tag}
                <button type="button" class="remove-tag" data-tag="${tag}">&times;</button>
            </span>
        `).join('');
}

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
            document.getElementById('projectDescription').value = project.description || '';
            document.getElementById('toolInput').value = '';
            selectedTools = project.tools || [];
            updateToolTags();
            document.getElementById('tagInput').value = '';
            selectedTags = project.tags || [];
            updateTagsDisplay();

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

            const sectionsContainer = document.getElementById('projectSections');
            sectionsContainer.innerHTML = '';
            sectionCounter = 1;

            if (project.sections) {
                project.sections.forEach(section => {
                    sectionsContainer.insertAdjacentHTML('beforeend', createSectionHTML(section.id));
                    const sectionElement = sectionsContainer.lastElementChild;
                    sectionElement.querySelector('.section-title').value = section.title;
                    sectionElement.querySelector('.section-description').value = section.description;
                    if (section.id !== 'i') {
                        sectionCounter = Math.max(sectionCounter, parseInt(section.id) + 1);
                    }
                });
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

document.getElementById('projectTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-tag')) {
        const tag = e.target.dataset.tag;
        selectedTags = selectedTags.filter(t => t !== tag);
        updateTagsDisplay();
    }
});

document.getElementById('tagInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = this.value.trim();
        if (tag && !selectedTags.includes(tag)) {
            selectedTags.push(tag);
            tagsPool.add(tag);
            updateTagsList();
            updateTagsDisplay();
            this.value = '';
        }
    }
});

document.getElementById('tagInput').addEventListener('change', function () {
    const tag = this.value.trim();
    if (tag && !selectedTags.includes(tag)) {
        selectedTags.push(tag);
        updateTagsDisplay();
        this.value = '';
    }
});

// Handle project form submission
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    try {
        const projectId = document.getElementById('projectId').value;
        const projectName = document.getElementById('projectName').value;
        const sections = Array.from(document.querySelectorAll('.section-item')).map(item => ({
            id: item.dataset.sectionId,
            title: item.querySelector('.section-title').value,
            description: item.querySelector('.section-description').value
        }));

        const projectData = {
            name: projectName,
            type: document.getElementById('projectType').value,
            year: document.getElementById('projectYear').value,
            owner: document.getElementById('projectOwner').value,
            description: document.getElementById('projectDescription').value,
            tools: selectedTools,
            tags: selectedTags,
            sections: sections
        };

        const thumbnailFile = document.getElementById('projectThumbnail').files[0];

        if (!projectId) {
            // New project
            const slug = await generateUniqueSlug(projectName);

            if (thumbnailFile) {
                const imageData = await uploadImage(thumbnailFile, 'thumbnails');
                projectData.thumbnail = imageData.url;
                projectData.thumbnailPath = imageData.path;
            }

            await setDoc(doc(db, "projects", slug), projectData);
            showToast('Project created successfully!');
        } else {
            // Update existing project
            if (thumbnailFile) {
                const imageData = await uploadImage(thumbnailFile, 'thumbnails');
                projectData.thumbnail = imageData.url;
                projectData.thumbnailPath = imageData.path;
            }

            await updateDoc(doc(db, "projects", projectId), projectData);
            showToast('Project updated successfully!');
        }

        bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
        projectForm.reset();
        selectedTools = [];
        selectedTags = [];
        updateToolTags();
        updateTagsDisplay();
        await loadProjects();

    } catch (error) {
        console.error('Error in form submission:', error);
        showToast(error.message, 'danger');
    } finally {
        hideLoading();
    }
});

// Handle project actions (edit/delete)
projectsList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-project')) {
        if (confirm('Are you sure you want to delete this project?')) {
            showLoading();
            try {
                const id = e.target.dataset.id;
                const docSnap = await getDoc(doc(db, "projects", id));
                const project = docSnap.data();

                if (project.thumbnailPath) {
                    await deleteImage(project.thumbnailPath);
                }

                await deleteDoc(doc(db, "projects", id));
                showToast('Project deleted successfully!');
                loadProjects();
            } catch (error) {
                showToast('Error deleting project: ' + error.message, 'danger');
            } finally {
                hideLoading();
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
    selectedTags = [];
    updateToolTags();
    updateTagsDisplay();
    const preview = document.querySelector('.thumbnail-preview');
    if (preview) preview.remove();
    const sectionsContainer = document.getElementById('projectSections');
    sectionsContainer.innerHTML = '';
    sectionCounter = 1;
});

// Sign out
document.getElementById('signOutBtn').addEventListener('click', () => {
    showLoading();
    signOut(auth)
        .then(() => {
            showToast('Signed out successfully!');
            window.location.reload();
        })
        .catch(error => showToast('Error signing out: ' + error.message, 'danger'))
        .finally(() => hideLoading());
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

function createSectionHTML(id) {
    return `
        <div class="section-item mb-4 p-3 border border-secondary rounded" data-section-id="${id}">
            <div class="row mb-2">
                <div class="col-10">
                    <small class="text-muted">ID: ${id}</small>
                </div>
                <div class="col-2 text-end">
                    <button type="button" class="btn btn-outline-secondary btn-sm move-section-up me-1">↑</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm move-section-down">↓</button>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <input type="text" class="form-control section-title" placeholder="Section Title" required>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <textarea class="form-control section-description" rows="4" placeholder="Section Description" required></textarea>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <button type="button" class="btn btn-outline-danger remove-section">Remove Section</button>
                </div>
            </div>
        </div>
    `;
}

document.getElementById('addSectionBtn').addEventListener('click', () => {
    const sectionsContainer = document.getElementById('projectSections');
    const id = sectionsContainer.children.length === 0 ? 'i' : sectionCounter++;
    sectionsContainer.insertAdjacentHTML('beforeend', createSectionHTML(id));
});

document.getElementById('projectSections').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-section')) {
        e.target.closest('.section-item').remove();
    }
});

document.getElementById('projectSections').addEventListener('click', (e) => {
    if (e.target.classList.contains('move-section-up')) {
        const currentSection = e.target.closest('.section-item');
        const previousSection = currentSection.previousElementSibling;
        if (previousSection) {
            currentSection.parentNode.insertBefore(currentSection, previousSection);
        }
    } else if (e.target.classList.contains('move-section-down')) {
        const currentSection = e.target.closest('.section-item');
        const nextSection = currentSection.nextElementSibling;
        if (nextSection) {
            currentSection.parentNode.insertBefore(nextSection, currentSection);
        }
    }
});