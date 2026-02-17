import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {Project} from '../../types';
import {getLocalizedError} from '../../i18n/error-messages';
import {ProjectController} from '../../controllers/project-controller';
import {AppScreen} from '../app-screen';
import '@lit-labs/virtualizer';
import './project-card';
import '../dialogs/project-info-dialog';
import '../dialogs/create-project-dialog';
import '../dialogs/confirm-dialog';

@customElement('dashboard-screen')
export class DashboardScreen extends AppScreen {
    static override styles = [
        AppScreen.styles,
        css`
            :host {
                display: flex;
                flex-direction: column;
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
        `
    ] as any;

    // Initialize the ProjectController
    private projectsCtrl = new ProjectController(this);

    // Dashboard is typically the destination when going back, so slide from left
    protected override get screenAnimation(): 'slide-right' | 'slide-left' | 'fade' | 'slide-up' | 'slide-down' | 'none' {
        return 'slide-left';
    }

    @state() private showCreateModal = false;
    @state() private showInfoModal = false;
    @state() private showConfirmDialog = false;
    @state() private confirmAction: (() => void) | null = null;
    @state() private confirmTitle = '';
    @state() private confirmMessage = '';
    @state() private confirmVariant: 'primary' | 'danger' = 'primary';
    @state() private selectedProject: Project | null = null;
    @state() protected error: string | null | '' = '';

    async connectedCallback() {
        super.connectedCallback();
        // Projects are automatically loaded by the controller
        await this.projectsCtrl.loadProjects();
    }

    // Use controller's loading and projects
    private get isLoading() {
        return this.projectsCtrl.loading;
    }

    private get projects() {
        return this.projectsCtrl.projects;
    }

    private openCreateModal() {
        this.showCreateModal = true;
    }

    private closeCreateModal() {
        this.showCreateModal = false;
        this.error = '';
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

    private async handleCreateProject(e: CustomEvent) {
        const { language, book, type } = e.detail;

        // Dialog already validates, just call controller
        const project = await this.projectsCtrl.createProject(language, book, type);

        if (project) {
            this.closeCreateModal();
        } else if (this.projectsCtrl.error) {
            // Show error - we could reopen dialog or show toast
            // For now, just log it
            console.error('Failed to create project:', this.projectsCtrl.error);
        }
    }

    private async handleProjectDelete(e: CustomEvent) {
        const project = e.detail.project as Project;
        if (!project) return;

        // Show confirm dialog instead of native confirm
        this.confirmTitle = msg('Delete Project');
        this.confirmMessage = msg(str`Are you sure you want to delete "${project.name}"?`);
        this.confirmVariant = 'danger';
        this.confirmAction = async () => {
            const success = await this.projectsCtrl.deleteProject(project.id);
            if (success) {
                this.closeInfoModal();
            } else if (this.projectsCtrl.error) {
                this.error = getLocalizedError(this.projectsCtrl.error);
            }
        };
        this.showConfirmDialog = true;
    }

    private async handleProjectExport(e: CustomEvent) {
        const project = e.detail.project as Project;
        if (!project) return;

        const zipPath = await this.projectsCtrl.exportProject(project.id);
        if (!zipPath && this.projectsCtrl.error) {
            this.error = getLocalizedError(this.projectsCtrl.error);
        }
    }

    private handleConfirmDialogConfirm() {
        if (this.confirmAction) {
            this.confirmAction();
        }
        this.showConfirmDialog = false;
        this.confirmAction = null;
    }

    private handleConfirmDialogCancel() {
        this.showConfirmDialog = false;
        this.confirmAction = null;
    }

    render() {
        return html`
            <div class="header">
                <h1 class="title">${msg('Projects')}</h1>
                <button class="fab" @click=${this.openCreateModal}>
                    +
                </button>
            </div>

            ${this.isLoading ? html`
                <div class="empty-state">
                    ${msg('Loading projects...')}
                </div>
            ` : this.projects.length === 0 ? html`
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

            <create-project-dialog
                .open=${this.showCreateModal}
                @create-project=${this.handleCreateProject}
                @create-cancel=${this.closeCreateModal}
                @dialog-close=${this.closeCreateModal}
            ></create-project-dialog>

            <project-info-dialog
                .open=${this.showInfoModal && this.selectedProject}
                .project=${this.selectedProject}
                @project-delete=${this.handleProjectDelete}
                @project-export=${this.handleProjectExport}
                @dialog-close=${() => this.closeInfoModal()}
            ></project-info-dialog>

            <confirm-dialog
                .open=${this.showConfirmDialog}
                .title=${this.confirmTitle}
                .message=${this.confirmMessage}
                .variant=${this.confirmVariant}
                .confirmText=${msg('Delete')}
                .cancelText=${msg('Cancel')}
                @confirm=${this.handleConfirmDialogConfirm}
                @cancel=${this.handleConfirmDialogCancel}
                @dialog-close=${this.handleConfirmDialogCancel}
            ></confirm-dialog>
        `;
    }
}
