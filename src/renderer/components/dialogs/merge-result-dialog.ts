import {html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {MergeResult} from '../../types';
import {DialogElement} from '../../mixins/dialog-mixin';

@customElement('merge-result-dialog')
export class MergeResultDialog extends DialogElement {
    static styles = [
        DialogElement.styles,
        css`
            .dialog {
                min-width: 350px;
                max-width: 450px;
            }

            .dialog-icon.success {
                color: #4caf50;
            }

            .dialog-icon.warning {
                color: #ff9800;
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
        `
    ] as any;

    @property({type: Object}) mergeResult!: MergeResult;

    dialogMinWidth = '350px';
    dialogMaxWidth = '450px';

    private handleClose() {
        this.dispatchEvent(new CustomEvent('merge-result-closed', {
            detail: { hasConflicts: this.mergeResult?.mergedWithConflicts || false },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    render() {
        const hasConflicts = this.mergeResult?.mergedWithConflicts || false;
        const filesCount = this.mergeResult?.conflicts?.length || 0;
        
        return this.renderOverlay(html`
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
        `);
    }
}
