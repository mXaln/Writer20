import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {ImportConflictResult} from '../types';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";

@customElement('import-conflict-dialog')
export class ImportConflictDialog extends LitElement {
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

            .conflict-info {
                background-color: var(--bg-secondary);
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 16px;
            }

            .conflict-count {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 8px;
            }

            .conflict-files {
                font-size: 13px;
                color: var(--text-secondary);
                max-height: 100px;
                overflow-y: auto;
            }

            .conflict-files span {
                display: block;
                padding: 2px 0;
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

            .btn-ff {
                background-color: var(--primary);
                color: white;
            }

            .btn-ff:hover {
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

            .merge-failed-note {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 8px;
                font-style: italic;
            }
        `
    ];

    @property({type: Object}) conflictResult!: ImportConflictResult;

    private handleOverwrite() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'overwrite' },
            bubbles: true,
            composed: true
        }));
    }

    private handleFastForward() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'ff' },
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
        const conflictCount = this.conflictResult?.conflicts?.length || 0;
        
        return html`
            <div class="overlay">
                <div class="dialog">
                    <div class="dialog-header">
                        <span class="material-icons dialog-icon">warning</span>
                        <span class="dialog-title">${msg('Merge Conflict Detected')}</span>
                    </div>
                    
                    <div class="dialog-content">
                        <div class="conflict-info">
                            <div class="conflict-count">
                                ${conflictCount} file(s) with conflicts
                            </div>
                            <div class="conflict-files">
                                ${this.conflictResult?.conflicts?.map((c: any) => html`
                                    <span>${c.fileName}</span>
                                `)}
                            </div>
                        </div>
                        
                        <div class="merge-failed-note">
                            ${this.conflictResult?.mergeFailed 
                                ? msg('Git merge could not be completed automatically. Please choose an option below.') 
                                : msg('Some files have different content between local and imported versions.')}
                        </div>
                    </div>

                    <div class="dialog-actions">
                        <button class="btn btn-overwrite" @click=${this.handleOverwrite}>
                            <span class="material-icons">file_download</span>
                            ${msg('Overwrite Local with Import')}
                        </button>
                        
                        <button class="btn btn-ff" @click=${this.handleFastForward}>
                            <span class="material-icons">merge</span>
                            ${msg('Try Fast-Forward Merge')}
                        </button>
                        
                        <button class="btn btn-cancel" @click=${this.handleCancel}>
                            <span class="material-icons">close</span>
                            ${msg('Cancel Import')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'import-conflict-dialog': ImportConflictDialog;
    }
}
