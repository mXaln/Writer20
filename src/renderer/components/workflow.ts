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
      background-color: var(--bg-secondary);
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

    .files-table {
      width: 100%;
      border-collapse: collapse;
    }

    .files-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }

    .files-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }

    .files-table tr {
      cursor: pointer;
      transition: background-color 200ms ease-in-out;
    }

    .files-table tbody tr:hover {
      background-color: var(--bg-secondary);
    }

    .files-table tbody tr:last-child td {
      border-bottom: none;
    }

    .file-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .file-path {
      font-size: 12px;
      color: var(--text-secondary);
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 200ms ease-in-out;
    }

    .action-btn.remove {
      background-color: transparent;
      border: 1px solid var(--error);
      color: var(--error);
    }

    .action-btn.remove:hover {
      background-color: var(--error);
      color: white;
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

  private async openFile(file: FileItem) {
    try {
      const result = await window.electronAPI.openFile(file.path);
      if (!result.success) {
        this.showError(result.error || this.translations.workflow.fileNotFound);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showError(this.translations.workflow.fileNotFound);
    }
  }

  private async removeFile(file: FileItem) {
    try {
      const result = await window.electronAPI.removeFile(file.id, false);
      if (result.success) {
        await this.loadFiles();
      } else {
        this.showError(result.error || 'Failed to remove file');
      }
    } catch (error) {
      console.error('Failed to remove file:', error);
      this.showError('Failed to remove file');
    }
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
          <h1 class="project-title">${this.project?.name || ''}</h1>
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
          <table class="files-table">
            <thead>
              <tr>
                <th>${this.translations.workflow.fileName}</th>
                <th>${this.translations.workflow.filePath}</th>
                <th>${this.translations.workflow.actions}</th>
              </tr>
            </thead>
            <tbody>
              ${this.files.map(file => html`
                <tr @click=${() => this.openFile(file)}>
                  <td class="file-name">${file.name}</td>
                  <td class="file-path" title="${file.path}">${file.path}</td>
                  <td class="actions" @click=${(e: Event) => e.stopPropagation()}>
                    <button class="action-btn remove" @click=${() => this.removeFile(file)}>
                      ${this.translations.workflow.removeFile}
                    </button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
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
