import {LitElement, html, css} from 'lit';
import {customElement, state, property} from 'lit/decorators.js';
import {Project, FileItem} from '../../types';
import {Translations} from '../../i18n/en';
import { baseStyles } from "../../styles/base";
import { fontStyles } from "../../styles/fonts";
import './file-card';
import '@lit-labs/virtualizer';

@customElement('workflow-screen')
export class WorkflowScreen extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: block;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .back-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                color: var(--text-secondary);
                border-radius: 4px;
                transition: all 200ms ease-in-out;
            }

            .back-btn:hover {
                background-color: rgba(0, 0, 0, 0.1);
                color: var(--text-primary);
            }

            .project-title {
                font-size: 24px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .files-container {
                background-color: var(--surface);
                border-radius: 8px;
                box-shadow: var(--shadow-card);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                max-height: calc(100vh - 140px);
                width: 100%;
            }

            .files-list {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
                padding-bottom: 50px;
            }

            .file-item {
                width: 100%;
                border-bottom: 1px solid var(--border);
            }

            .files-list {
                flex: 1;
                overflow-y: auto;
            }

            .files-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid var(--border);
            }

            .files-title {
                font-size: 16px;
                font-weight: 600;
            }

            .file-item {
                border-bottom: 1px solid var(--border);
            }

            .file-item:last-child {
                border-bottom: none;
            }

            .file-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid var(--border);
            }

            .file-name {
                font-weight: 500;
                color: var(--text-primary);
            }

            .file-actions {
                display: flex;
                gap: 8px;
            }

            .icon-btn {
                background: none;
                border: none;
                padding: 6px;
                cursor: pointer;
                color: var(--text-secondary);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 200ms ease-in-out;
            }

            .file-content {
                padding: 0 16px 16px 16px;
            }

            .content-view {
                padding: 12px;
                background-color: var(--bg-secondary);
                border-radius: 4px;
                font-family: monospace;
                font-size: 13px;
                white-space: pre-line;
                word-break: break-word;
                color: var(--text-primary);
                max-height: 300px;
                overflow-y: auto;
                margin: 0;
            }

            .content-edit {
                width: 100%;
                box-sizing: border-box;
                min-height: 150px;
                padding: 12px;
                background-color: var(--bg-secondary);
                border: 1px solid var(--primary);
                border-radius: 4px;
                font-family: monospace;
                font-size: 13px;
                white-space: pre-line;
                word-break: break-word;
                color: var(--text-primary);
                resize: vertical;
                outline: none;
                margin: 0;
            }

            .content-edit:focus {
                border-color: var(--primary-hover);
            }

            .empty-state {
                text-align: center;
                padding: 48px;
                color: var(--text-secondary);
            }

            .error-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background-color: var(--error);
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                box-shadow: var(--shadow-elevated);
                z-index: 1001;
                animation: slideIn 200ms ease-out;
            }

            @keyframes slideIn {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 48px;
                color: var(--text-secondary);
            }
        `
    ];

    @property({type: Number}) projectId!: number;
    @property({type: Object}) translations!: Translations;
    @state() private project: Project | null = null;
    @state() private files: FileItem[] = [];
    @state() private loading = true;
    @state() private error = '';
    @state() private editingFileId: string | null = null;
    @state() private fileContents: Map<string, string> = new Map();

    async connectedCallback() {
        super.connectedCallback();
        await this.loadProject();
        await this.loadFiles();
    }

    private async loadProject() {
        try {
            const result = await window.electronAPI.getProject(this.projectId);
            if (result.success && result.data) {
                this.project = result.data;
            }
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    }

    private async loadFiles() {
        this.loading = true;
        try {
            const result = await window.electronAPI.listFilesWithContent(this.projectId);
            if (result.success && result.data) {
                this.files = result.data;
                // Initialize file contents from loaded data
                for (const file of this.files) {
                    if (file.content !== undefined && !this.fileContents.has(file.id)) {
                        this.fileContents.set(file.id, file.content);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            this.loading = false;
        }
    }

    private async saveFileContent(file: FileItem) {
        const content = this.fileContents.get(file.id);
        if (content === undefined) return;

        try {
            const result = await window.electronAPI.writeFile(file.path, content);
            if (!result.success) {
                this.showError(result.error || 'Failed to save file');
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.showError('Failed to save file');
        }
    }

    private loadFileContent(file: FileItem) {
        window.electronAPI.readFile(file.path).then(result => {
            if (result.success && result.data !== undefined) {
                this.fileContents = new Map(this.fileContents).set(file.id, result.data);
            }
        });
    }

    private handleToggleEdit(e: CustomEvent<{file: FileItem}>) {
        const {file} = e.detail;
        if (this.editingFileId === file.id) {
            // Save and exit edit mode
            this.saveFileContent(file).then(() => {
                this.editingFileId = null;
            });
        } else {
            // Enter edit mode
            if (!this.fileContents.has(file.id)) {
                this.loadFileContent(file);
            }
            this.editingFileId = file.id;

            // Focus the textarea after render
            requestAnimationFrame(() => {
                this.updateComplete.then(() => {
                    const fileCard = this.shadowRoot
                        ?.querySelector(`file-card[file-id="${file.id}"]`);
                    const textarea = fileCard?.shadowRoot
                        ?.querySelector(`textarea[data-file-id="${file.id}"]`) as HTMLTextAreaElement;
                    if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                    }
                });
            });
        }
    }

    private handleContentChange(e: CustomEvent<{file: FileItem; content: string}>) {
        const {file, content} = e.detail;
        this.fileContents = new Map(this.fileContents).set(file.id, content);
    }

    private showError(message: string) {
        this.error = message;
        setTimeout(() => {
            this.error = '';
        }, 3000);
    }

    private goBack() {
        this.dispatchEvent(new CustomEvent('navigate-back'));
    }

    render() {
        return html`
            <div class="header">
                <div class="header-left">
                    <button class="back-btn" @click=${this.goBack}>
                        <span class="material-icons">arrow_back</span>
                        ${this.translations.workflow.back}
                    </button>
                    <h1 class="project-title">${this.project?.language} - ${this.project?.book} -
                        ${this.project?.type}</h1>
                </div>
            </div>

            <div class="files-container">
                ${this.loading ? html`
                    <div class="loading">Loading...</div>
                ` : html`
                    <div class="files-list">
                        <lit-virtualizer
                                .items=${this.files}
                                .renderItem=${(file: FileItem) => html`
                                    <file-card
                                            file-id="${file.id}"
                                            .file=${file}
                                            .isEditing=${this.editingFileId === file.id}
                                            .content=${this.fileContents.get(file.id) || ''}
                                            @toggle-edit=${(e: CustomEvent) => this.handleToggleEdit(e)}
                                            @content-change=${(e: CustomEvent) => this.handleContentChange(e)}
                                    ></file-card>
                                `}
                        ></lit-virtualizer>
                    </div>
                `}
            </div>

            ${this.error ? html`
                <div class="error-toast">${this.error}</div>
            ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'workflow-screen': WorkflowScreen;
    }
}
