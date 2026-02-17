import {LitElement, css, html, TemplateResult} from 'lit';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";

/**
 * Base Screen class for all screens in the application
 * Provides common styles, animations, and utilities
 * 
 * Usage:
 * ```typescript
 * export class Dashboard extends AppScreen {
 *   static styles = [baseStyles, AppScreen.styles, css`...`];
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

        .screen-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .animate-slide-right {
            animation: slideInRight 250ms ease-out forwards;
        }

        .animate-slide-left {
            animation: slideInLeft 250ms ease-out forwards;
        }

        .animate-fade-in {
            animation: fadeIn 200ms ease-out forwards;
        }

        .animate-slide-up {
            animation: slideUp 250ms ease-out forwards;
        }

        .animate-slide-down {
            animation: slideDown 250ms ease-out forwards;
        }
    `
    ];

    /** Animation type for this screen */
    animation: 'slide-right' | 'slide-left' | 'fade' | 'slide-up' | 'slide-down' | 'none' = 'none';

    /** Whether screen is visible/active */
    active = false;

    /** Loading state */
    protected loading = false;

    /** Error message */
    error: string | null | '' = null;

    /** 
     * Get the animation class based on animation property
     */
    protected get animationClass(): string {
        switch (this.animation) {
            case 'slide-right':
                return 'animate-slide-right';
            case 'slide-left':
                return 'animate-slide-left';
            case 'fade':
                return 'animate-fade-in';
            case 'slide-up':
                return 'animate-slide-up';
            case 'slide-down':
                return 'animate-slide-down';
            default:
                return '';
        }
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
