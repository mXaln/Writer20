import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {MergeResult} from '../types';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";

@customElement('merge-result-dialog')
export class MergeResultDialog extends LitElement {
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
                min-width: 350px;
                max-width: 450px;
                padding: 24px;
            }

            .dialog-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .dialog-icon {
                font-size: 32px;
            }

            .dialog-icon.success {
                color: #4caf50;
            }

            .dialog-icon.warning {
                color: #ff9800;
            }

            .dialog-title {
                font-size: 20px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .dialog-content {
                margin-bottom: 24px;
            }

            .message {
                font-size: 14px;
                color: var(--text-secondary);
                line-height: 1.5;
            }

            .conflict-count {
                font-weight: 600;
                color: var(--text-primary);
                margin-top: 12px;
            }

            .dialog-actions {
                display: flex;
                justify-content: flex-end;
            }

            .btn {
                padding: 10px 24px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 200ms ease-in-out;
            }

            .btn-primary {
                background-color: var(--primary);
                color: white;
            }

            .btn-primary:hover {
                background-color: var(--primary-hover);
            }
        `
    ];

    @property({type: Object}) mergeResult!: MergeResult;

    private handleClose() {
        this.dispatchEvent(new CustomEvent('merge-result-closed', {
            detail: { hasConflicts: this.mergeResult?.mergedWithConflicts || false },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const hasConflicts = this.mergeResult?.mergedWithConflicts || false;
        const filesCount = this.mergeResult?.conflicts?.length || 0;
        
        return html`
            <div class="overlay">
                <div class="dialog">
                    <div class="dialog-header">
                        <span class="material-icons dialog-icon ${hasConflicts ? 'warning' : 'success'}">
                            ${hasConflicts ? 'warning' : 'check_circle'}
                        </span>
                        <span class="dialog-title">
                            ${hasConflicts ? msg('Merged with Conflicts') : msg('Merge Successful')}
                        </span>
                    </div>
                    
                    <div class="dialog-content">
                        <div class="message">
                            ${hasConflicts 
                                ? msg('The project has been merged, but there are merge conflicts that need to be resolved.')
                                : msg('The project has been merged successfully.')}
                        </div>
                        ${hasConflicts && this.mergeResult?.conflicts ? html`
                            <div class="conflict-count">
                                ${msg(str`${filesCount} file(s) with conflicts`)}
                            </div>
                        ` : ''}
                    </div>

                    <div class="dialog-actions">
                        <button class="btn btn-primary" @click=${this.handleClose}>
                            ${hasConflicts ? msg('Resolve Conflicts') : msg('OK')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'merge-result-dialog': MergeResultDialog;
    }
}
