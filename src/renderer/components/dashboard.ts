import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { Project, Translations } from '../types';

@customElement('dashboard-screen')
export class DashboardScreen extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .project-card {
      background-color: var(--surface);
      border-radius: 8px;
      box-shadow: var(--shadow-card);
      padding: 16px;
      cursor: pointer;
      transition: all 200ms ease-in-out;
      position: relative;
      min-height: 160px;
      display: flex;
      flex-direction: column;
    }

    .project-card:hover {
      box-shadow: var(--shadow-elevated);
      transform: translateY(-2px);
    }

    .project-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
      padding-right: 40px;
    }

    .project-description {
      font-size: 14px;
      color: var(--text-secondary);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .info-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 200ms ease-in-out;
    }

    .info-btn:hover {
      background-color: var(--bg-secondary);
      color: var(--primary);
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--text-secondary);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background-color: var(--surface);
      border-radius: 8px;
      box-shadow: var(--shadow-elevated);
      padding: 24px;
      width: 400px;
      max-width: 90%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
    }

    .modal-close {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text-secondary);
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-body {
      margin-bottom: 24px;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .file-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      background-color: var(--primary);
      color: white;
      margin-top: 8px;
    }

    .description-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .description-value {
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 12px;
    }
  `;

  @property({ type: Object }) translations!: Translations;
  @state() private projects: Project[] = [];
  @state() private showCreateModal = false;
  @state() private showInfoModal = false;
  @state() private selectedProject: Project | null = null;
  @state() private newProjectName = '';
  @state() private newProjectDescription = '';
  @state() private error = '';

  async connectedCallback() {
    super.connectedCallback();
    await this.loadProjects();
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
    this.newProjectName = '';
    this.newProjectDescription = '';
    this.error = '';
  }

  private closeCreateModal() {
    this.showCreateModal = false;
    this.error = '';
  }

  private async createProject() {
    if (!this.newProjectName.trim()) {
      this.error = this.translations.errors.required;
      return;
    }

    try {
      const result = await window.electronAPI.createProject(
        this.newProjectName.trim(),
        this.newProjectDescription.trim()
      );

      if (result.success) {
        await this.loadProjects();
        this.closeCreateModal();
      } else {
        this.error = result.error || this.translations.errors.duplicateName;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      this.error = this.translations.errors.databaseError;
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
      detail: { projectId: project.id }
    }));
  }

  render() {
    return html`
      <div class="header">
        <h1 class="title">${this.translations.dashboard.title}</h1>
        <button class="primary" @click=${this.openCreateModal}>
          + ${this.translations.dashboard.newProject}
        </button>
      </div>

      ${this.projects.length === 0 ? html`
        <div class="empty-state">
          ${this.translations.dashboard.noProjects}
        </div>
      ` : html`
        <div class="projects-grid">
          ${this.projects.map(project => html`
            <div class="project-card" @click=${() => this.openWorkflow(project)}>
              <div class="project-name">${project.name}</div>
              ${project.description ? html`
                <div class="project-description">${project.description}</div>
              ` : ''}
              <button class="info-btn" @click=${(e: Event) => this.openInfoModal(project, e)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
          `)}
        </div>
      `}

      ${this.showCreateModal ? html`
        <div class="modal-overlay" @click=${this.closeCreateModal}>
          <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">${this.translations.dashboard.createProject}</h2>
              <button class="modal-close" @click=${this.closeCreateModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">${this.translations.dashboard.projectName}</label>
                <input 
                  type="text" 
                  class="form-input"
                  .placeholder=${this.translations.dashboard.namePlaceholder}
                  .value=${this.newProjectName}
                  @input=${(e: Event) => this.newProjectName = (e.target as HTMLInputElement).value}
                  @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.createProject()}
                />
                ${this.error ? html`<div class="error-text">${this.error}</div>` : ''}
              </div>
              <div class="form-group">
                <label class="form-label">${this.translations.dashboard.projectDescription}</label>
                <textarea 
                  class="form-input form-textarea"
                  .placeholder=${this.translations.dashboard.descriptionPlaceholder}
                  .value=${this.newProjectDescription}
                  @input=${(e: Event) => this.newProjectDescription = (e.target as HTMLTextAreaElement).value}
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="secondary" @click=${this.closeCreateModal}>
                ${this.translations.dashboard.cancel}
              </button>
              <button class="primary" @click=${this.createProject}>
                ${this.translations.dashboard.create}
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this.showInfoModal && this.selectedProject ? html`
        <div class="modal-overlay" @click=${this.closeInfoModal}>
          <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">${this.translations.projectInfo.title}</h2>
              <button class="modal-close" @click=${this.closeInfoModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-label">${this.translations.dashboard.projectName}</div>
              <div class="description-value">${this.selectedProject.name}</div>
              
              ${this.selectedProject.description ? html`
                <div class="form-label">${this.translations.projectInfo.description}</div>
                <div class="description-value">${this.selectedProject.description}</div>
              ` : ''}
              
              <div class="form-label">${this.translations.projectInfo.files}</div>
              <div class="file-count-badge">
                ${this.selectedProject.fileCount || 0}
              </div>
            </div>
            <div class="modal-footer">
              <button class="primary" @click=${this.closeInfoModal}>
                ${this.translations.projectInfo.close}
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
