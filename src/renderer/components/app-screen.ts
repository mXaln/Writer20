import {LitElement, css, html, TemplateResult} from 'lit';
import {state} from 'lit/decorators.js';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {controlStyles} from "../styles/control";

/**
 * Base Screen class for all screens in the application
 * Provides common styles, animations, and utilities
 * 
 * Usage:
 * ```typescript
 * export class Dashboard extends AppScreen {
 *   static styles = [baseStyles, AppScreen.styles, css`...`];
 *   
 *   // Override to define animation direction
 *   get screenAnimation() { return 'slide-left'; }
 *   
 *   render() {
 *     return html`...`;
 *   }
 * }
 * ```
 */
export abstract class AppScreen extends LitElement {
    static styles = [
        baseStyles,
        controlStyles,
        fontStyles,
        css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(30px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideInLeft {
            from {
                transform: translateX(-30px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideDown {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        :host(.animate-slide-right) {
            animation: slideInRight 250ms ease-out forwards;
        }

        :host(.animate-slide-left) {
            animation: slideInLeft 250ms ease-out forwards;
        }

        :host(.animate-fade-in) {
            animation: fadeIn 200ms ease-out forwards;
        }

        :host(.animate-slide-up) {
            animation: slideUp 250ms ease-out forwards;
        }

        :host(.animate-slide-down) {
            animation: slideDown 250ms ease-out forwards;
        }

        /* ===============================
        Common Screen Elements
        =============================== */

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            position: relative;
            min-height: 40px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        /* Title */
        .title {
            font-size: 24px;
            font-weight: 600;
            color: var(--text-primary);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 48px;
            color: var(--text-secondary);
        }

        /* Loading State */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px;
            color: var(--text-secondary);
        }

        /* Error Toast */
        .error-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background-color: var(--error);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: var(--shadow-elevated);
            z-index: 1001;
            animation: slideIn 200ms ease-out;
        }
    `
    ];

    /** Internal counter to force animation replay */
    @state() private _animationKey = 0;

    /** Loading state */
    protected loading = false;

    /** Error message */
    protected error: string | null | '' = null;

    /**
     * Override in subclass to define animation direction
     * 'slide-right': entering from right (forward navigation)
     * 'slide-left': entering from left (back navigation)  
     * 'fade': default fade in
     * 'none': no animation
     * 'slide-up': slide up entry
     * 'slide-down': slide down entry
     */
    protected get screenAnimation(): 'slide-right' | 'slide-left' | 'fade' | 'slide-up' | 'slide-down' | 'none' {
        return 'fade';
    }

    connectedCallback() {
        super.connectedCallback();
        // Apply animation class to host element when screen connects
        this._applyAnimationClass();
    }

    updated(changedProperties: Map<string, unknown>) {
        super.updated(changedProperties);
        // Re-apply animation when component updates (e.g., navigation)
        if (changedProperties.has('_animationKey')) {
            this._applyAnimationClass();
        }
    }

    private _applyAnimationClass() {
        // Remove all animation classes first
        this.classList.remove(
            'animate-slide-right',
            'animate-slide-left', 
            'animate-fade-in',
            'animate-slide-up',
            'animate-slide-down'
        );
        
        // Add the appropriate animation class based on screenAnimation
        if (this.screenAnimation && this.screenAnimation !== 'none') {
            const className = `animate-${this.screenAnimation}`;
            // Force reflow to restart animation
            void this.offsetWidth;
            this.classList.add(className);
        }
    }

    /**
     * Manually trigger animation replay (useful after significant state changes)
     */
    protected replayAnimation() {
        this._animationKey++;
    }

    /**
     * Render loading state
     */
    protected renderLoading(message: string = 'Loading...'): TemplateResult {
        return html`
            <div class="loading-container">
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Render error state
     */
    protected renderError(message?: string): TemplateResult {
        return html`
            <div class="error-container">
                <p>${message || this.error || 'An error occurred'}</p>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    protected renderEmpty(message: string): TemplateResult {
        return html`
            <div class="empty-container">
                <p>${message}</p>
            </div>
        `;
    }
}
