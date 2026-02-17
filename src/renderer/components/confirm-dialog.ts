import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {msg, str} from '@lit/localize';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {DialogMixin, dialogStyles} from '../mixins/dialog-mixin';

@customElement('confirm-dialog')
export class ConfirmDialog extends DialogMixin(LitElement) {
    static styles = [
        baseStyles,
        fontStyles,
        dialogStyles,
        css`
            .dialog {
                min-width: 350px;
                max-width: 400px;
            }

            .confirm-icon {
                color: #ff9800;
            }

            .confirm-message {
                font-size: 14px;
                color: var(--text-secondary);
                line-height: 1.5;
            }
        `
    ];

    @property({type: String}) title = msg('Confirm');
    @property({type: String}) message = '';
    @property({type: String}) confirmText = msg('Confirm');
    @property({type: String}) cancelText = msg('Cancel');
    @property({type: String}) variant: 'primary' | 'danger' = 'primary';

    dialogMinWidth = '350px';
    dialogMaxWidth = '400px';

    private handleConfirm() {
        this.dispatchEvent(new CustomEvent('confirm', {
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    private handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel', {
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    render() {
        const icon = this.variant === 'danger' ? 'warning' : 'help';
        const btnClass = this.variant === 'danger' ? 'btn-danger' : 'btn-primary';

        return this.renderOverlay(html`
            <div class="dialog-header">
                <span class="material-icons dialog-icon confirm-icon">${icon}</span>
                <span class="dialog-title">${this.title}</span>
            </div>
            
            <div class="dialog-content">
                <div class="confirm-message">${this.message}</div>
            </div>

            <div class="dialog-actions">
                <button class="btn btn-secondary" @click=${this.handleCancel}>
                    ${this.cancelText}
                </button>
                
                <button class="btn ${btnClass}" @click=${this.handleConfirm}>
                    ${this.confirmText}
                </button>
            </div>
        `);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'confirm-dialog': ConfirmDialog;
    }
}
