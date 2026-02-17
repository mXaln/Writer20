import {css, html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {controlStyles} from "../styles/control";

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

    @state() private showMenu = false;

    private toggleMenu() {
        this.showMenu = !this.showMenu;
    }

    private closeMenu() {
        this.showMenu = false;
    }

    private handleImportClick() {
        this.dispatchEvent(new CustomEvent('nav-import-click', {bubbles: true, composed: true}));
        this.showMenu = false;
    }

    private handleSettingsClick() {
        this.dispatchEvent(new CustomEvent('nav-settings-click', {bubbles: true, composed: true}));
        this.showMenu = false;
    }

    render() {
        return html`
            <nav class="nav-panel" @click=${this.closeMenu}>
                <div class="nav-items"></div>
                <div class="nav-bottom">
                    <button class="menu-btn" @click=${(e: Event) => {
                        e.stopPropagation();
                        this.toggleMenu();
                    }}>
                        <span class="material-icons">more_vert</span>
                    </button>
                    ${this.showMenu ? html`
                        <div class="dropdown-menu">
                            <button class="menu-item" @click=${this.handleImportClick}>
                                <span class="material-icons">file_upload</span>
                                ${msg('Import Project')}
                            </button>
                            <button class="menu-item" @click=${this.handleSettingsClick}>
                                <span class="material-icons">settings</span>
                                ${msg('Settings')}
                            </button>
                        </div>
                    ` : ''}
                </div>
            </nav>
        `;
    }
}
