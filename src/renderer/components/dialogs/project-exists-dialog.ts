import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {ProjectExistsResult} from '../../types';
import {DialogElement} from "../../mixins/dialog-mixin";

@customElement('project-exists-dialog')
export class ProjectExistsDialog extends DialogElement {
    static override styles = [
        DialogElement.styles,
        css`
            .dialog {
                min-width: 400px;
                max-width: 500px;
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
        `
    ] as any;

    @property({type: Object}) existsResult!: ProjectExistsResult;

    dialogMinWidth = '400px';
    dialogMaxWidth = '500px';

    private handleOverwrite() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'overwrite' },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    private handleMerge() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'merge' },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    private handleCancel() {
        this.dispatchEvent(new CustomEvent('import-option', {
            detail: { option: 'cancel' },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    render() {
        return this.renderOverlay(html`
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
                <button class="btn btn-danger" @click=${this.handleOverwrite}>
                    <span class="material-icons">file_download</span>
                    ${msg('Overwrite')}
                </button>
                
                <button class="btn btn-primary" @click=${this.handleMerge}>
                    <span class="material-icons">merge</span>
                    ${msg('Merge')}
                </button>
                
                <button class="btn btn-secondary" @click=${this.handleCancel}>
                    <span class="material-icons">close</span>
                    ${msg('Cancel')}
                </button>
            </div>
        `);
    }
}
