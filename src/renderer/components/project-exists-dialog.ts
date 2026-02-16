import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {ProjectExistsResult, ImportOption} from '../types';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";

@customElement('project-exists-dialog')
export class ProjectExistsDialog extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: block;
            }

            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .dialog {
                background-color: var(--surface);
                border-radius: 8px;
                box-shadow: var(--shadow-elevated);
                min-width: 400px;
                max-width: 500px;
                padding: 24px;
            }

            .dialog-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .dialog-icon {
                color: #ff9800;
                font-size: 32px;
            }

            .dialog-title {
                font-size: 20px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .dialog-content {
                margin-bottom: 24px;
            }

            .project-info {
                background-color: var(--bg-secondary);
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 16px;
            }

            .project-name {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 8px;
            }

            .project-note {
                font-size: 13px;
                color: var(--text-secondary);
            }

            .dialog-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .btn {
                padding: 12px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 200ms ease-in-out;
            }

            .btn-overwrite {
                background-color: #f44336;
                color: white;
            }

            .btn-overwrite:hover {
                background-color: #d32f2f;
            }

            .btn-merge {
                background-color: var(--primary);
                color: white;
            }

            .btn-merge:hover {
                background-color: var(--primary-hover);
            }

            .btn-cancel {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border);
            }

            .btn-cancel:hover {
                background-color: var(--border);
            }
        `
    ];

    @property({type: Object}) existsResult!: ProjectExistsResult;

    private handleOverwrite() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'overwrite' },
            bubbles: true,
            composed: true
        }));
    }

    private handleMerge() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'merge' },
            bubbles: true,
            composed: true
        }));
    }

    private handleCancel() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'cancel' },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="overlay">
                <div class="dialog">
                    <div class="dialog-header">
                        <span class="material-icons dialog-icon">folder_open</span>
                        <span class="dialog-title">${msg('Project Already Exists')}</span>
                    </div>
                    
                    <div class="dialog-content">
                        <div class="project-info">
                            <div class="project-name">
                                ${this.existsResult?.projectName || 'Unknown project'}
                            </div>
                            <div class="project-note">
                                ${msg('A project with this identifier already exists. What would you like to do?')}
                            </div>
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <button class="btn btn-overwrite" @click=${this.handleOverwrite}>
                            <span class="material-icons">file_download</span>
                            ${msg('Overwrite')}
                        </button>
                        
                        <button class="btn btn-merge" @click=${this.handleMerge}>
                            <span class="material-icons">merge</span>
                            ${msg('Merge')}
                        </button>
                        
                        <button class="btn btn-cancel" @click=${this.handleCancel}>
                            <span class="material-icons">close</span>
                            ${msg('Cancel')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'project-exists-dialog': ProjectExistsDialog;
    }
}
