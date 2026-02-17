import {html, css} from 'lit';
import {customElement, state, property} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {Project, FileItem, FileConflict} from '../../types';
import {getLocalizedError} from '../../i18n/error-messages';
import {AppScreen} from '../app-screen';
import './file-card';
import '@lit-labs/virtualizer';

@customElement('workflow-screen')
export class WorkflowScreen extends AppScreen {
    static override styles = [
        AppScreen.styles,
        css`
            :host {
                display: block;
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
        `
    ] as any;

    // Workflow enters from the right (forward navigation from dashboard)
    protected override get screenAnimation(): 'slide-right' | 'slide-left' | 'fade' | 'slide-up' | 'slide-down' | 'none' {
        return 'slide-right';
    }

    @property({type: Number}) projectId!: number;
    @state() private project: Project | null = null;
    @state() private files: FileItem[] = [];
    @state() protected loading = true;
    @state() protected error = '';
    @state() private editingFileId: string | null = null;
    @state() private fileContents: Map<string, string> = new Map();
    @state() private conflicts: Map<string, FileConflict> = new Map();
    @state() private hasConflicts = false;

    async connectedCallback() {
        super.connectedCallback();
        await this.loadProject();
        await this.loadFiles();
        await this.loadPersistedConflicts();
        
        // Notify parent that workflow is loaded (to pass any pending conflicts)
        this.dispatchEvent(new CustomEvent('workflow-loaded', {bubbles: true, composed: true}));
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
                        
                        // Check for conflict markers in content
                        if (file.content && this.hasConflictMarkers(file.content)) {
                            const conflict = this.parseConflictMarkers(file.content, file);
                            if (conflict) {
                                this.conflicts.set(file.id, conflict);
                                this.hasConflicts = true;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            this.loading = false;
        }
    }

    private hasConflictMarkers(content: string): boolean {
        return content.includes('<<<<<<<') && content.includes('=======') && content.includes('>>>>>>>');
    }

    private parseConflictMarkers(content: string, file: FileItem): FileConflict | null {
        const lines = content.split('\n');
        let currentLines: string[] = [];
        let importedLines: string[] = [];
        let inCurrent = false;
        let inImported = false;

        for (const line of lines) {
            if (line.startsWith('<<<<<<<')) {
                inCurrent = true;
                inImported = false;
            } else if (line.startsWith('=======')) {
                inCurrent = false;
                inImported = true;
            } else if (line.startsWith('>>>>>>>')) {
                inImported = false;
            } else if (inCurrent) {
                currentLines.push(line);
            } else if (inImported) {
                importedLines.push(line);
            }
        }

        if (currentLines.length > 0 || importedLines.length > 0) {
            return {
                fileId: file.id,
                fileName: file.name,
                filePath: file.path,
                currentContent: currentLines.join('\n'),
                importedContent: importedLines.join('\n')
            };
        }
        
        return null;
    }

    private async loadPersistedConflicts() {
        try {
            const result = await window.electronAPI.getConflictedFiles(this.projectId);
            if (result.success && result.data && result.data.length > 0) {
                const conflictedFileIds = result.data as string[];
                
                // Load content for each conflicted file and parse markers
                for (const fileId of conflictedFileIds) {
                    const file = this.files.find(f => f.id === fileId);
                    if (file) {
                        // Try to read the file content
                        const contentResult = await window.electronAPI.readFile(file.path);
                        if (contentResult.success && contentResult.data) {
                            const content = contentResult.data;
                            
                            // Check if content has conflict markers
                            if (this.hasConflictMarkers(content)) {
                                const conflict = this.parseConflictMarkers(content, file);
                                if (conflict) {
                                    this.conflicts.set(file.id, conflict);
                                    this.hasConflicts = true;
                                }
                            } else {
                                // No conflict markers - file was manually resolved, remove from persisted list
                                // This will be cleaned up by resolveConflict call
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load persisted conflicts:', error);
        }
    }

    // Public method to set conflicts from parent component
    public setConflicts(conflicts: FileConflict[]) {
        this.conflicts = new Map();
        for (const conflict of conflicts) {
            this.conflicts.set(conflict.fileId, conflict);
        }
        this.hasConflicts = conflicts.length > 0;
        
        // Also update fileContents with current content for conflicted files
        for (const conflict of conflicts) {
            this.fileContents = new Map(this.fileContents).set(conflict.fileId, conflict.currentContent);
        }
    }

    private async handleResolveConflict(e: CustomEvent<{file: FileItem; acceptedContent: string}>) {
        const {file, acceptedContent} = e.detail;
        
        try {
            const result = await window.electronAPI.resolveConflict(file.path, acceptedContent, this.projectId);
            if (result.success) {
                // Remove from conflicts
                this.conflicts = new Map(this.conflicts);
                this.conflicts.delete(file.id);
                this.hasConflicts = this.conflicts.size > 0;
                
                // Update content to the accepted version
                this.fileContents = new Map(this.fileContents).set(file.id, acceptedContent);
                
                // Reload files to reflect changes
                await this.loadFiles();
            } else {
                this.showError(getLocalizedError(result.error) || msg('Failed to resolve conflict'));
            }
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            this.showError(msg('Failed to resolve conflict'));
        }
    }

    private async saveFileContent(file: FileItem) {
        const content = this.fileContents.get(file.id);
        if (content === undefined) return;

        try {
            const result = await window.electronAPI.writeFile(file.path, content);
            if (!result.success) {
                this.showError(getLocalizedError(result.error) || msg('Failed to save file'));
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.showError(msg('Failed to save file'));
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
                    <button class="btn borderless-btn" @click=${this.goBack}>
                        <span class="material-icons">arrow_back</span>
                        ${msg('Back')}
                    </button>
                    <h1 class="project-title">${this.project?.language} - ${this.project?.book} -
                        ${this.project?.type}</h1>
                    ${this.hasConflicts ? html`
                        <span class="conflict-badge" style="background-color: #ff9800; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">
                            ${msg(str`${this.conflicts.size} file(s) with conflicts`)}
                        </span>
                    ` : ''}
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
                                            .conflict=${this.conflicts.get(file.id) || null}
                                            .hasConflicts=${this.conflicts.has(file.id)}
                                            @toggle-edit=${(e: CustomEvent) => this.handleToggleEdit(e)}
                                            @content-change=${(e: CustomEvent) => this.handleContentChange(e)}
                                            @resolve-conflict=${(e: CustomEvent) => this.handleResolveConflict(e)}
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
