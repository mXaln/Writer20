import {LitElement, html, css, PropertyValues} from 'lit';
import {property, state} from 'lit/decorators.js';

/**
 * Type helper for class constructors
 */
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Shared dialog styles - import and use in your dialog's static styles
 * 
 * Usage:
 * ```typescript
 * import { dialogStyles } from '../mixins/dialog-mixin';
 * 
 * static styles = [dialogStyles, css`...custom styles...`];
 * ```
 */
export const dialogStyles = css`
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

    .dialog-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .dialog-content {
        margin-bottom: 24px;
        color: var(--text-secondary);
    }

    .dialog-actions {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        gap: 12px;
    }

    .btn {
        padding: 10px 16px;
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

    .btn-primary {
        background-color: var(--primary);
        color: white;
    }

    .btn-primary:hover {
        background-color: var(--primary-hover);
    }

    .btn-secondary {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);
    }

    .btn-secondary:hover {
        background-color: var(--border);
    }

    .btn-danger {
        background-color: #f44336;
        color: white;
    }

    .btn-danger:hover {
        background-color: #d32f2f;
    }
`;

/**
 * DialogMixin - Shared behavior for dialog components
 * 
 * Provides:
 * - Open/close state management
 * - Overlay rendering
 * - Close event dispatching
 * 
 * Usage:
 * ```typescript
 * import { dialogStyles } from '../mixins/dialog-mixin';
 * 
 * class MyDialog extends DialogMixin(LitElement) {
 *   static styles = [dialogStyles, css`...custom...`];
 *   
 *   render() {
 *     return this.renderOverlay(html`...`);
 *   }
 * }
 * ```
 */
export function DialogMixin<T extends Constructor<LitElement>>(superClass: T) {
    class DialogMixinClass extends superClass {
        constructor(...args: any[]) {
            super(...args);
        }
        
        /** Whether the dialog is visible */
        @property({type: Boolean, reflect: true}) 
        open = false;

        /** Internal state for animation */
        @state() 
        private _isVisible = false;

        /** Dialog backdrop opacity */
        @property({type: Number}) 
        backdropOpacity = 0.5;

        /** Dialog minimum width */
        @property({type: String}) 
        dialogMinWidth = '350px';

        /** Dialog maximum width */
        @property({type: String}) 
        dialogMaxWidth = '500px';

        /** Dialog padding */
        @property({type: String}) 
        dialogPadding = '24px';

        /** Whether clicking overlay closes dialog */
        @property({type: Boolean}) 
        closeOnOverlayClick = true;

        updated(changedProperties: PropertyValues) {
            super.updated(changedProperties);
            
            if (changedProperties.has('open')) {
                if (this.open) {
                    // Delay to allow CSS transition
                    requestAnimationFrame(() => {
                        this._isVisible = true;
                    });
                } else {
                    this._isVisible = false;
                }
            }
        }

        /** 
         * Render the dialog overlay with content
         * Call this in your render() method
         */
        renderOverlay(content: unknown) {
            if (!this.open) return null;
            
            return html`
                <div 
                    class="overlay ${this._isVisible ? 'visible' : ''}"
                    style="--dialog-backdrop-opacity: ${this.backdropOpacity}; --dialog-min-width: ${this.dialogMinWidth}; --dialog-max-width: ${this.dialogMaxWidth}; --dialog-padding: ${this.dialogPadding}"
                    @click=${this._handleOverlayClick}
                >
                    <div class="dialog" @click=${this._stopPropagation}>
                        ${content}
                    </div>
                </div>
            `;
        }

        private _handleOverlayClick() {
            if (this.closeOnOverlayClick) {
                this.close();
            }
        }

        private _stopPropagation(e: Event) {
            e.stopPropagation();
        }

        /** 
         * Close the dialog and dispatch close event
         */
        close() {
            this.open = false;
            this.dispatchEvent(new CustomEvent('dialog-close', {
                bubbles: true,
                composed: true
            }));
        }

        /** 
         * Open the dialog
         */
        openDialog() {
            this.open = true;
            this.dispatchEvent(new CustomEvent('dialog-open', {
                bubbles: true,
                composed: true
            }));
        }
    }

    return DialogMixinClass;
}

declare global {
    interface HTMLElementTagNameMap {
        'dialog-mixin': InstanceType<ReturnType<typeof DialogMixin>>;
    }
}
