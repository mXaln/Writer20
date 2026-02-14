import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {FileItem} from '../types';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";

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
                background-color: rgba(0, 0, 0, 0.1);
                color: var(--text-primary);
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
    ];

    @property({type: String}) fileId = '';
    @property({type: Object}) file!: FileItem;
    @property({type: Boolean}) isEditing = false;
    @property({type: String}) content = '';

    private handleToggleEdit() {
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

    render() {
        return html`
            <div class="file-item">
                <div class="file-header">
                    <span class="file-name">${this.file.name}</span>
                    <div class="file-actions">
                        <button
                                class="icon-btn ${this.isEditing ? 'active' : ''}"
                                @click=${this.handleToggleEdit}
                                title="${this.isEditing ? 'Save' : 'Edit'}"
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
