import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {Project} from '../../types';
import {baseStyles} from "../../styles/base";
import {fontStyles} from "../../styles/fonts";
import {getLocalizedError} from '../../i18n/error-messages';
import '@lit-labs/virtualizer';
import './project-card';

@customElement('dashboard-screen')
export class DashboardScreen extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                position: relative;
                min-height: 40px;
            }

            .title {
                font-size: 24px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .fab {
                position: absolute;
                right: 0;
                bottom: 0;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: var(--primary);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                transition: all 200ms ease-in-out;
            }

            .fab:hover {
                background-color: var(--primary-hover);
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }

            .projects-grid {
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
                overflow-y: auto;
                flex: 1;
            }

            .project-meta {
                font-size: 14px;
                color: var(--text-secondary);
                flex: 1;
            }

            .empty-state {
                text-align: center;
                padding: 48px;
                color: var(--text-secondary);
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--text-primary);
            }

            .form-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid var(--border);
                border-radius: 4px;
                background-color: var(--bg-primary);
                color: var(--text-primary);
                font-size: 14px;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary);
            }

            .form-textarea {
                min-height: 80px;
                resize: vertical;
            }

            .error-text {
                color: var(--error);
                font-size: 12px;
                margin-top: 4px;
            }

            .info-row {
                display: flex;
                margin-bottom: 8px;
            }

            .info-label {
                font-weight: 500;
                margin-right: 8px;
                color: var(--text-secondary);
            }

            .info-value {
                color: var(--text-primary);
            }

            .delete-btn {
                background-color: transparent;
                border: 1px solid var(--error);
                color: var(--error);
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 200ms ease-in-out;
            }

            .delete-btn:hover {
                background-color: var(--error);
                color: white;
            }
        `
    ];

    @state() private projects: Project[] = [];
    @state() private showCreateModal = false;
    @state() private showInfoModal = false;
    @state() private selectedProject: Project | null = null;
    @state() private newLanguage = '';
    @state() private newBook = '';
    @state() private newType = 'ulb';
    @state() private error = '';

    async connectedCallback() {
        super.connectedCallback();
        await this.loadProjects();

        // Listen for project updates (imports, etc.)
        window.addEventListener('projects-updated', () => this.loadProjects());
    }

    private async loadProjects() {
        try {
            const result = await window.electronAPI.listProjects();
            if (result.success && result.data) {
                this.projects = result.data;
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    }

    private openCreateModal() {
        this.showCreateModal = true;
        this.newLanguage = '';
        this.newBook = '';
        this.newType = 'ulb';
        this.error = '';
    }

    private closeCreateModal() {
        this.showCreateModal = false;
        this.error = '';
    }

    private async createProject() {
        // Validate language: lowercase, a-z0-9-, no spaces
        const languageRegex = /^[a-z0-9-]+$/;
        if (!this.newLanguage.trim() || !languageRegex.test(this.newLanguage)) {
            this.error = msg('Language must be lowercase letters, numbers, or hyphens only');
            return;
        }

        // Validate book: lowercase, a-z0-9, exactly 3 characters
        const bookRegex = /^[a-z0-9]{3}$/;
        if (!this.newBook.trim() || !bookRegex.test(this.newBook)) {
            this.error = msg('Book must be exactly 3 lowercase letters or numbers');
            return;
        }

        // Validate type: lowercase, a-z0-9, max 3 characters
        const typeRegex = /^[a-z0-9]{1,3}$/;
        if (!this.newType.trim() || !typeRegex.test(this.newType)) {
            this.error = msg('Resource must be 1-3 lowercase letters or numbers');
            return;
        }

        try {
            const result = await window.electronAPI.createProject(
                this.newLanguage.trim(),
                this.newBook.trim(),
                this.newType.trim()
            );

            if (result.success) {
                await this.loadProjects();
                this.closeCreateModal();
            } else {
                this.error = getLocalizedError(result.error) || msg('Database error occurred');
            }
        } catch (error) {
            console.error('Failed to create project:', error);
            this.error = msg('Database error occurred');
        }
    }

    private openInfoModal(project: Project, event: Event) {
        event.stopPropagation();
        this.selectedProject = project;
        this.showInfoModal = true;
    }

    private closeInfoModal() {
        this.showInfoModal = false;
        this.selectedProject = null;
    }

    private openWorkflow(project: Project) {
        this.dispatchEvent(new CustomEvent('navigate-to-workflow', {
            detail: {projectId: project.id}
        }));
    }

    private async exportProject() {
        if (!this.selectedProject) return;

        try {
            const result = await window.electronAPI.exportProject(this.selectedProject.id);
            if (result.success && result.data) {
                this.closeInfoModal();
            } else if (result.error) {
                this.error = getLocalizedError(result.error);
            }
        } catch (error) {
            console.error('Failed to export project:', error);
            this.error = msg('Failed to export project');
        }
    }

    private async deleteProject() {
        if (!this.selectedProject) return;

        const projectName = this.selectedProject.name;
        const confirmed = confirm(msg(str`Are you sure you want to delete "${projectName}"?`));
        if (!confirmed) return;

        try {
            const result = await window.electronAPI.deleteProject(this.selectedProject.id);
            if (result.success) {
                await this.loadProjects();
                this.closeInfoModal();
            } else if (result.error) {
                this.error = getLocalizedError(result.error);
            }
        } catch (error) {
            console.error('Failed to delete project:', error);
            this.error = msg('Failed to delete project');
        }
    }

    render() {
        return html`
            <div class="header">
                <h1 class="title">${msg('Projects')}</h1>
                <button class="fab" @click=${this.openCreateModal}>
                    +
                </button>
            </div>

            ${this.projects.length === 0 ? html`
                <div class="empty-state">
                    ${msg('No projects yet. Create your first project!')}
                </div>
            ` : html`
                <div class="projects-grid">
                    <lit-virtualizer
                            .items=${this.projects}
                            .renderItem=${(project: Project) => html`
                                <project-card
                                        .project=${project}
                                        @project-select=${() => this.openWorkflow(project)}
                                        @project-info=${(e: Event) => this.openInfoModal(project, e)}
                                ></project-card>
                            `}
                    ></lit-virtualizer>
                </div>
            `}

            ${this.showCreateModal ? html`
                <div class="modal-overlay" @click=${this.closeCreateModal}>
                    <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
                        <div class="modal-header">
                            <h2 class="modal-title">${msg('Create Project')}</h2>
                            <button class="modal-close" @click=${this.closeCreateModal}>
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">${msg('Language')}</label>
                                <input
                                        type="text"
                                        class="form-input"
                                        .value=${this.newLanguage}
                                        @input=${(e: Event) => this.newLanguage = (e.target as HTMLInputElement).value.toLowerCase()}
                                        @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.createProject()}
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label">${msg('Book')}</label>
                                <input
                                        type="text"
                                        class="form-input"
                                        maxlength="3"
                                        .value=${this.newBook}
                                        @input=${(e: Event) => this.newBook = (e.target as HTMLInputElement).value.toLowerCase()}
                                        @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.createProject()}
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label">${msg('Resource')}</label>
                                <select
                                        class="form-input"
                                        .value=${this.newType}
                                        @change=${(e: Event) => this.newType = (e.target as HTMLSelectElement).value}
                                >
                                    <option value="ulb">ULB</option>
                                    <option value="udb">UDB</option>
                                    <option value="reg">REG</option>
                                </select>
                            </div>
                            ${this.error ? html`
                                <div class="error-text">${this.error}</div>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button class="secondary" @click=${this.closeCreateModal}>
                                ${msg('Cancel')}
                            </button>
                            <button class="primary" @click=${this.createProject}>
                                ${msg('Create')}
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${this.showInfoModal && this.selectedProject ? html`
                <div class="modal-overlay" @click=${this.closeInfoModal}>
                    <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
                        <div class="modal-header">
                            <h2 class="modal-title">${msg('Project Info')}</h2>
                            <button class="modal-close" @click=${this.closeInfoModal}>
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="info-row">
                                <span class="info-label">${msg('Language')}:</span>
                                <span class="info-value">${this.selectedProject.language}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${msg('Book')}:</span>
                                <span class="info-value">${this.selectedProject.book}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${msg('Resource')}:</span>
                                <span class="info-value">${this.selectedProject.type.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="delete-btn" @click=${this.deleteProject}>
                                ${msg('Delete')}
                            </button>
                            <button class="secondary" @click=${this.exportProject}>
                                ${msg('Export Project')}
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'dashboard-screen': DashboardScreen;
    }
}
