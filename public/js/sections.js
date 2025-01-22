export const SECTIONS = {
    overview: {
        id: 'overview',
        label: 'Overview',
        requiredFields: ['name', 'type', 'year', 'description', 'thumbnail'],
        template: (content) => `
            <div class="project-block project-overview" id="projectOverview">
                <div class="project-overview-section">
                    <h1 class="project-overview-title">${content.name}</h1>
                    <div class="project-overview-underline">
                        <div class="project-overview-underline-section subtitle">
                            ${content.owner ? `${content.owner}, ` : ''}${content.year}
                        </div>
                        ${content.tags && content.tags.length > 0 ? `
                            <div class="project-overview-underline-section tags">
                                <span class="project-overview-tag">${content.type}</span>${content.tags.length > 0 ? ' · ' : ''}
                                ${content.tags.sort().map((tag, index) =>
            `<span class="project-overview-tag">${tag}</span>${index < content.tags.length - 1 ? ' · ' : ''}`
        ).join('')}
                            </div>
                        ` : ''}
                        ${content.tools && content.tools.length > 0 ? `
                            <div class="project-overview-underline-section tools">
                                ${content.tools.sort().map((tool, index) =>
            `<span class="project-overview-tool">${tool}</span>${index < content.tools.length - 1 ? ' · ' : ''}`
        ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="project-overview-description">
                    <p>${content.description}</p>
                </div>
                <div class="project-overview-thumbnail">
                    <div class="project-overview-thumbnail-img">
                        <img id="parallaxImage" src="${content.thumbnail}" alt="${content.name} thumbnail">
                    </div>
                </div>
            </div>
        `
    }
};

export function hasRequiredFields(section, projectData) {
    return SECTIONS[section].requiredFields.every(field =>
        projectData.hasOwnProperty(field) && projectData[field] !== null && projectData[field] !== undefined
    );
}