export const SECTIONS = {
    overview: {
        id: 'overview',
        label: 'Overview',
        requiredFields: ['name', 'type', 'year', 'description'],
        template: (content) => `
            <div class="project-block project-overview" id="projectOverview">
                <div class="project-overview-section">
                    <div class="project-overview-subtitle">
                        ${content.owner ? `${content.owner} — ` : ''}${content.year}
                    </div>
                    <span class="project-overview-title">${content.name}</span>
                    ${content.tags && content.tags.length > 0 ? `
                            <div class="project-overview-tags">
                                <span class="project-overview-tag">${content.type}</span>
                                ${content.tags.map(tag => `<span class="project-overview-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                </div>

                <div class="project-description">
                    <p>${content.description}</p>
                </div>
                ${content.tools && content.tools.length > 0 ? `
                    <div class="project-tools">
                        <h3>Tools</h3>
                        <div class="tools-list">
                            ${content.tools.map(tool => `<span class="tool">${tool}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `
    }
};

export function hasRequiredFields(section, projectData) {
    return SECTIONS[section].requiredFields.every(field =>
        projectData.hasOwnProperty(field) && projectData[field] !== null && projectData[field] !== undefined
    );
}