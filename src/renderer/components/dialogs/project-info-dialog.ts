import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {Project} from '../../types';
import {DialogElement} from '../../mixins/dialog-mixin';

@customElement('project-info-dialog')
export class ProjectInfoDialog extends DialogElement {
    static styles = [
        DialogElement.styles,
        css`
            .dialog {
                min-width: 500px;
                max-width: 400px;
            }

            .info-row {
                display: flex;
                margin-bottom: 12px;
            }

            .info-label {
                font-weight: 500;
                margin-right: 8px;
                color: var(--text-secondary);
                min-width: 80px;
            }

            .info-value {
                color: var(--text-primary);
            }

            .dialog-close {
                margin-left: auto;
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 200ms ease-in-out;
            }

            .dialog-close:hover {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
            }

            .modal-footer {
                display: flex;
                gap: 12px;
            }

            .delete-btn {
                background-color: transparent;
                border: 1px solid #f44336;
                color: #f44336;
                padding: 10px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 200ms ease-in-out;
            }

            .delete-btn:hover {
                background-color: #f44336;
                color: white;
            }
        `
    ] as any;

    @property({type: Object}) project!: Project;

    dialogMinWidth = '350px';
    dialogMaxWidth = '400px';

    private handleDelete() {
        this.dispatchEvent(new CustomEvent('project-delete', {
            detail: { project: this.project },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    private handleExport() {
        this.dispatchEvent(new CustomEvent('project-export', {
            detail: { project: this.project },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    private handleClose() {
        this.dispatchEvent(new CustomEvent('project-info-close', {
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    render() {
        return this.renderOverlay(html`
            <div class="dialog-header">
                <span class="material-icons dialog-icon">info</span>
                <span class="dialog-title">${msg('Project Info')}</span>
                <button class="dialog-close" @click=${this.handleClose}>
                    <span class="material-icons">close</span>
                </button>
            </div>
            
            <div class="dialog-content">
                <div class="info-row">
                    <span class="info-label">${msg('Language')}:</span>
                    <span class="info-value">${this.project?.language || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${msg('Book')}:</span>
                    <span class="info-value">${this.project?.book || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${msg('Resource')}:</span>
                    <span class="info-value">${this.project?.type?.toUpperCase() || '-'}</span>
                </div>
            </div>

            <div class="dialog-actions">
                <button class="btn delete-btn" @click=${this.handleDelete}>
                    <span class="material-icons">delete</span>
                    ${msg('Delete')}
                </button>
                
                <button class="btn btn-primary" @click=${this.handleExport}>
                    <span class="material-icons">file_download</span>
                    ${msg('Export Project')}
                </button>
            </div>
        `);
    }
}
