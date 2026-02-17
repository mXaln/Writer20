import {LitElement, html, css} from 'lit';
import {property} from 'lit/decorators.js';
import {baseStyles} from "../styles/base";
import {controlStyles} from "../styles/control";
import {fontStyles} from "../styles/fonts";

/**
 * Type helper for class constructors
 */
type Constructor<T> = new (...args: any[]) => T;

export declare class DialogInterface {
    open: boolean;
    backdropOpacity: number;
    dialogMinWidth: string;
    dialogMaxWidth: string;
    dialogPadding: string;
    closeOnOverlayClick: boolean;
    renderOverlay(content: unknown): unknown;
    close(): void;
    openDialog(): void;
}

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

export const Dialog =
    <T extends Constructor<LitElement>>(superClass: T) => {
        class DialogElement extends superClass {
            static styles = [
                (superClass as unknown as typeof LitElement).styles ?? [],
                baseStyles,
                controlStyles,
                fontStyles,
                css`
                    @keyframes dialogZoomIn {
                        from {
                            transform: scale(0.7);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
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
                        padding: 24px;
                        animation: dialogZoomIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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
                `
            ];

            /** Whether the dialog is visible */
            @property({type: Boolean, reflect: true})
            open = false;

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

            /**
             * Render the dialog overlay with content
             * Call this in your render() method
             */
            renderOverlay(content: unknown) {
                if (!this.open) return null;

                return html`
                <div 
                    class="overlay"
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
                    // Dispatch event so parent can reset its state
                    this.dispatchEvent(new CustomEvent('dialog-close', {
                        bubbles: true,
                        composed: true
                    }));
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
        return DialogElement as Constructor<DialogInterface> & T;
    };

export const DialogElement = Dialog(LitElement);
