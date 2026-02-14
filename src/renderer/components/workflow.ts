import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { Project, FileItem, Translations } from '../types';

@customElement('workflow-screen')
export class WorkflowScreen extends LitElement {
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
      background-color: rgba(0,0,0,0.1);
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

    .icon-btn:hover {
      background-color: rgba(0,0,0,0.1);
      color: var(--primary);
    }

    .icon-btn.active {
      color: var(--primary);
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
  `;

  @property({ type: Number }) projectId!: number;
  @property({ type: Object }) translations!: Translations;
  @state() private project: Project | null = null;
  @state() private files: FileItem[] = [];
  @state() private loading = true;
  @state() private error = '';
  @state() private editingFileId: number | null = null;
  @state() private fileContents: Map<number, string> = new Map();

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
      const result = await window.electronAPI.listFiles(this.projectId);
      if (result.success && result.data) {
        this.files = result.data;
        // Load content for all files
        for (const file of this.files) {
          if (!this.fileContents.has(file.id)) {
            await this.loadFileContent(file);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      this.loading = false;
    }
  }

  private async createFile() {
    try {
      const result = await window.electronAPI.createFile(this.projectId);
      if (result.success) {
        await this.loadFiles();
      } else {
        this.showError(result.error || 'Failed to create file');
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      this.showError('Failed to create file');
    }
  }

  private async loadFileContent(file: FileItem) {
    try {
      const result = await window.electronAPI.readFile(file.path);
      if (result.success && result.data !== undefined) {
        this.fileContents = new Map(this.fileContents).set(file.id, result.data);
      }
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  }

  private async toggleEdit(file: FileItem) {
    if (this.editingFileId === file.id) {
      // Save and exit edit mode
      await this.saveFileContent(file);
      this.editingFileId = null;
    } else {
      // Enter edit mode
      if (!this.fileContents.has(file.id)) {
        await this.loadFileContent(file);
      }
      this.editingFileId = file.id;
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

  private handleContentChange(file: FileItem, e: Event) {
    const content = (e.target as HTMLTextAreaElement).value;
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            ${this.translations.workflow.back}
          </button>
          <h1 class="project-title">${this.project?.language} - ${this.project?.book} - ${this.project?.type}</h1>
        </div>
      </div>

      <div class="files-container">
        <div class="files-header">
          <span class="files-title">Files</span>
          <button class="primary" @click=${this.createFile}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create File
          </button>
        </div>

        ${this.loading ? html`
          <div class="loading">Loading...</div>
        ` : this.files.length === 0 ? html`
          <div class="empty-state">
            ${this.translations.workflow.noFiles}
          </div>
        ` : html`
          <div class="files-list">
            ${this.files.map(file => html`
              <div class="file-item">
                <div class="file-header">
                  <span class="file-name">${file.name}</span>
                  <div class="file-actions">
                    <button 
                      class="icon-btn ${this.editingFileId === file.id ? 'active' : ''}"
                      @click=${() => this.toggleEdit(file)}
                      title="${this.editingFileId === file.id ? 'Save' : 'Edit'}"
                    >
                      ${this.editingFileId === file.id ? html`
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ` : html`
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      `}
                    </button>
                  </div>
                </div>
                <div class="file-content">
                  ${this.editingFileId === file.id ? html`
                    <textarea
                      class="content-edit"
                      .value=${this.fileContents.get(file.id) || ''}
                      @input=${(e: Event) => this.handleContentChange(file, e)}
                    ></textarea>
                  ` : html`
                    <div class="content-view">
                      ${this.fileContents.get(file.id) || '(empty)'}
                    </div>
                  `}
                </div>
              </div>
            `)}
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
