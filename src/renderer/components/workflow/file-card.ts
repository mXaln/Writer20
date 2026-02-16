import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {FileItem, FileConflict} from '../../types';
import {baseStyles} from "../../styles/base";
import {fontStyles} from "../../styles/fonts";

@customElement('file-card')
export class FileCard extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: block;
                width: 100%;
            }

            .file-item {
                width: 100%;
                border-bottom: 1px solid var(--border);
            }

            .file-item:last-child {
                border-bottom: none;
            }

            .file-item.conflict {
                background-color: rgba(255, 152, 0, 0.05);
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

            .conflict-badge {
                background-color: #ff9800;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-left: 8px;
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
                background-color: rgba(0, 0, 0, 0.1);
                color: var(--text-primary);
            }

            .icon-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .icon-btn.resolve-accept {
                background-color: #4caf50;
                color: white;
            }

            .icon-btn.resolve-accept:hover {
                background-color: #43a047;
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

            .conflict-container {
                display: flex;
                gap: 16px;
                margin-top: 12px;
            }

            .conflict-version {
                flex: 1;
                border: 1px solid var(--border);
                border-radius: 4px;
                overflow: hidden;
            }

            .conflict-version-header {
                padding: 8px 12px;
                background-color: var(--bg-secondary);
                border-bottom: 1px solid var(--border);
                font-weight: 500;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .conflict-version-header.current {
                background-color: #e3f2fd;
            }

            .conflict-version-header.imported {
                background-color: #e8f5e9;
            }

            .conflict-version-content {
                padding: 12px;
                font-family: monospace;
                font-size: 13px;
                white-space: pre-line;
                word-break: break-word;
                max-height: 200px;
                height: -webkit-fill-available;
                overflow-y: auto;
                background-color: var(--surface);
                color: var(--text-primary);
            }

            .accept-btn {
                background-color: #4caf50;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .accept-btn:hover {
                background-color: #43a047;
            }
        `
    ];

    @property({type: String}) fileId = '';
    @property({type: Object}) file!: FileItem;
    @property({type: Boolean}) isEditing = false;
    @property({type: String}) content = '';
    @property({type: Object}) conflict: FileConflict | null = null;
    @property({type: Boolean}) hasConflicts = false;

    private handleToggleEdit() {
        // Don't allow editing if there are unresolved conflicts
        if (this.hasConflicts && this.conflict) {
            return;
        }
        this.dispatchEvent(new CustomEvent('toggle-edit', {
            detail: {file: this.file},
            bubbles: true,
            composed: true
        }));
    }

    private handleContentChange(e: Event) {
        const newContent = (e.target as HTMLTextAreaElement).value;
        this.dispatchEvent(new CustomEvent('content-change', {
            detail: {file: this.file, content: newContent},
            bubbles: true,
            composed: true
        }));
    }

    private handleAcceptCurrent() {
        if (this.conflict) {
            this.dispatchEvent(new CustomEvent('resolve-conflict', {
                detail: { 
                    file: this.file, 
                    acceptedContent: this.conflict.currentContent 
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    private handleAcceptImported() {
        if (this.conflict) {
            this.dispatchEvent(new CustomEvent('resolve-conflict', {
                detail: { 
                    file: this.file, 
                    acceptedContent: this.conflict.importedContent 
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    private renderConflictView() {
        if (!this.conflict) return null;

        return html`
            <div class="conflict-container">
                <div class="conflict-version">
                    <div class="conflict-version-header current">
                        <span>Current Version</span>
                        <button class="accept-btn" @click=${this.handleAcceptCurrent}>
                            <span class="material-icons" style="font-size: 14px;">check</span>
                            Accept
                        </button>
                    </div>
                    <div class="conflict-version-content">
                        ${this.conflict.currentContent || '(empty)'}
                    </div>
                </div>
                <div class="conflict-version">
                    <div class="conflict-version-header imported">
                        <span>Imported Version</span>
                        <button class="accept-btn" @click=${this.handleAcceptImported}>
                            <span class="material-icons" style="font-size: 14px;">check</span>
                            Accept
                        </button>
                    </div>
                    <div class="conflict-version-content">
                        ${this.conflict.importedContent || '(empty)'}
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="file-item ${this.hasConflicts && this.conflict ? 'conflict' : ''}">
                <div class="file-header">
                    <span class="file-name">
                        ${this.file.name}
                        ${this.hasConflicts && this.conflict ? html`
                            <span class="conflict-badge">Conflict</span>
                        ` : ''}
                    </span>
                    <div class="file-actions">
                        <button
                                class="icon-btn ${this.isEditing ? 'active' : ''}"
                                @click=${this.handleToggleEdit}
                                title="${this.isEditing ? msg('Save') : msg('Edit')}"
                                ?disabled=${this.hasConflicts && this.conflict !== null}
                        >
                            ${this.isEditing ? html`
                                <span class="material-icons">check</span>
                            ` : html`
                                <span class="material-icons">edit</span>
                            `}
                        </button>
                    </div>
                </div>
                <div class="file-content">
                    ${this.hasConflicts && this.conflict ? html`
                        ${this.renderConflictView()}
                    ` : html`
                        ${this.isEditing ? html`
                            <textarea
                                    class="content-edit"
                                    data-file-id="${this.file.id}"
                                    .value=${this.content}
                                    @input=${this.handleContentChange}
                            ></textarea>
                        ` : html`
                            <div class="content-view">
                        ${this.content || ''}
                            </div>
                        `}
                    `}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'file-card': FileCard;
    }
}
