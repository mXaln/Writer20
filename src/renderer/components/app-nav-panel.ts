import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {controlStyles} from "../styles/control";

export interface NavAction {
    label: string;
    icon: string;
    event: string;
}

@customElement('app-nav-panel')
export class AppNavPanel extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        controlStyles,
        css`
        :host {
            display: block;
        }

        .nav-panel {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 65px);
            width: 80px;
            background-color: var(--primary);
            border-right: 1px solid var(--border);
            padding: 0;
        }

        .nav-items {
            flex: 1;
        }

        .nav-bottom {
            display: flex;
            justify-content: center;
            padding: 16px 0;
            border-top: 1px solid var(--border);
            position: relative;
        }

        .menu-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: #FFFFFF;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 200ms ease-in-out;
        }

        .menu-btn:hover {
            background-color: rgba(255, 255, 255, 0.3);
            color: #FFFFFF;
        }

        .menu-btn.hidden {
            display: none;
        }

        .dropdown-menu {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-10%);
            margin-bottom: 8px;
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: var(--shadow-elevated);
            min-width: 200px;
            z-index: 100;
            overflow: hidden;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: var(--text-primary);
            cursor: pointer;
            transition: all 200ms ease-in-out;
            background: none;
            border: none;
            width: 100%;
            text-align: left;
            font-size: 14px;
        }

        .menu-item:hover {
            background-color: var(--bg-secondary);
        }

        @media (max-width: 768px) {
            .nav-panel {
                width: 60px;
            }
        }
    `
    ];

    @property({type: Array}) actions: NavAction[] = [];

    @state() private showMenu = false;

    connectedCallback() {
        super.connectedCallback();
        // Use capture phase to intercept before other handlers
        document.addEventListener('click', this.handleClick, true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClick, true);
    }

    private handleClick = (e: Event) => {
        const path = e.composedPath();
        
        // Check if clicked on menu button or dropdown menu
        const menuBtn = this.shadowRoot?.querySelector('.menu-btn');
        const dropdownMenu = this.shadowRoot?.querySelector('.dropdown-menu');
        
        const clickedMenuBtn = path.includes(menuBtn as Node);
        const clickedDropdown = path.includes(dropdownMenu as Node);
        
        if (clickedMenuBtn) {
            // Toggle menu when clicking the menu button
            this.showMenu = !this.showMenu;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        if (!this.showMenu) return;
        
        if (clickedDropdown) {
            // Let the dropdown item's handler fire - don't prevent default
            return;
        }
        
        // Clicked elsewhere - close the menu
        this.showMenu = false;
    };

    private handleActionClick(action: NavAction) {
        this.dispatchEvent(new CustomEvent(action.event, {bubbles: true, composed: true}));
        this.showMenu = false;
    }

    render() {
        const hasActions = this.actions && this.actions.length > 0;

        return html`
            <nav class="nav-panel">
                <div class="nav-items"></div>
                <div class="nav-bottom">
                    <button 
                        class="menu-btn ${hasActions ? '' : 'hidden'}" 
                    >
                        <span class="material-icons">more_vert</span>
                    </button>
                    ${this.showMenu && hasActions ? html`
                        <div class="dropdown-menu">
                            ${this.actions.map(action => html`
                                <button class="menu-item" @click=${() => this.handleActionClick(action)}>
                                    <span class="material-icons">${action.icon}</span>
                                    ${action.label}
                                </button>
                            `)}
                        </div>
                    ` : ''}
                </div>
            </nav>
        `;
    }
}
