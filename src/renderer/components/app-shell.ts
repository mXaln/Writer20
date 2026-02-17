import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {getThemeCSS, getEffectiveTheme} from '../styles/theme';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {localized, msg} from '@lit/localize';
const {setLocale} = await import('../i18n/localization');
import {Theme, Language, ImportOption, ProjectExistsResult, MergeResult} from '../types';
import './project-exists-dialog';
import './merge-result-dialog';

type Screen = 'dashboard' | 'workflow' | 'settings';

@customElement('app-shell')
@localized()
export class AppShell extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
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

            @keyframes slideOutLeft {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-30px);
                    opacity: 0;
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

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(30px);
                    opacity: 0;
                }
            }

            .top-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background-color: var(--primary-dark);
                border-bottom: 1px solid var(--border);
            }

            .app-title {
                font-size: 20px;
                font-weight: 600;
                color: #FFFFFF;
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

            .content {
                flex: 1;
                padding: 24px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .content.slide-in-right {
                animation: slideInRight 250ms ease-out forwards;
            }

            .content.slide-in-left {
                animation: slideInLeft 250ms ease-out forwards;
            }

            @media (max-width: 768px) {
                .nav-panel {
                    width: 60px;
                }
            }
        `
    ];

    @state() private currentScreen: Screen = 'dashboard';
    @state() private previousScreen: Screen = 'dashboard';
    @state() private theme: Theme = 'system';
    @state() private language: Language = 'en';
    @state() private currentProjectId: number | null = null;
    @state() private showMenu = false;
    @state() private showProjectExistsDialog = false;
    @state() private projectExistsResult: ProjectExistsResult | null = null;
    @state() private showMergeResultDialog = false;
    @state() private mergeResult: MergeResult | null = null;

    async connectedCallback() {
        super.connectedCallback();
        await this.loadSettings();
        this.applyTheme();

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            });
        }
    }

    private async loadSettings() {
        try {
            const result = await window.electronAPI.getSettings();
            if (result.success && result.data) {
                this.theme = (result.data.theme as Theme) || 'system';
                this.language = (result.data.language as Language) || 'en';
                // Set the locale
                await setLocale(this.language);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    private applyTheme() {
        const effectiveTheme = getEffectiveTheme(this.theme);
        const themeCSS = getThemeCSS(effectiveTheme);

        // Apply theme CSS variables to document
        const style = document.documentElement.style;
        const cssText = themeCSS.cssText;

        // Parse CSS variables from the theme
        const varMatches = cssText.match(/--[\w-]+:[^;]+/g);
        if (varMatches) {
            varMatches.forEach((varDecl) => {
                const [name, value] = varDecl.split(':').map(s => s.trim());
                if (name.startsWith('--')) {
                    style.setProperty(name, value);
                }
            });
        }
    }

    private async handleThemeChange(newTheme: Theme) {
        this.theme = newTheme;
        this.applyTheme();
        await window.electronAPI.setSetting('theme', newTheme);
    }

    private async handleLanguageChange(newLanguage: Language) {
        this.language = newLanguage;
        await setLocale(newLanguage);
        await window.electronAPI.setSetting('language', newLanguage);
        this.requestUpdate();
    }

    private navigateTo(screen: Screen, projectId?: number) {
        this.previousScreen = this.currentScreen;
        this.currentScreen = screen;
        this.showMenu = false;
        if (screen === 'workflow' && projectId) {
            this.currentProjectId = projectId;
        }
    }

    private getScreenAnimationClass(): string {
        // Workflow comes from dashboard (slide right)
        if (this.currentScreen === 'workflow' && this.previousScreen === 'dashboard') {
            return 'slide-in-right';
        }
        // Going back to dashboard from workflow
        if (this.currentScreen === 'dashboard' && this.previousScreen === 'workflow') {
            return 'slide-in-left';
        }
        // Settings comes from dashboard (slide right)
        if (this.currentScreen === 'settings' && this.previousScreen === 'dashboard') {
            return 'slide-in-right';
        }
        // Going back to dashboard from settings
        if (this.currentScreen === 'dashboard' && this.previousScreen === 'settings') {
            return 'slide-in-left';
        }
        return '';
    }

    private async importProject() {
        this.showMenu = false;
        try {
            const result = await window.electronAPI.importProject();
            if (result.success && result.data) {
                // Check if result is ProjectExistsResult - project already exists
                const data = result.data as any;
                if (data.projectExists === true) {
                    // Show the project exists dialog
                    this.projectExistsResult = {
                        projectExists: data.projectExists,
                        projectId: data.projectId,
                        projectName: data.projectName,
                        zipPath: data.zipPath
                    };
                    this.showProjectExistsDialog = true;
                    return;
                }
                // New project imported successfully - dispatch event to refresh dashboard
                this.dispatchEvent(new CustomEvent('projects-updated', {bubbles: true, composed: true}));
            } else if (result.error) {
                console.error('Import failed:', result.error);
            }
        } catch (error) {
            console.error('Failed to import project:', error);
        }
    }

    private async handleImportOption(e: CustomEvent<{option: ImportOption}>) {
        const option = e.detail.option;
        this.showProjectExistsDialog = false;
        
        if (!this.projectExistsResult) {
            this.projectExistsResult = null;
            return;
        }
        
        const projectId = this.projectExistsResult.projectId;
        const zipPath = this.projectExistsResult.zipPath;
        
        try {
            const result = await window.electronAPI.importWithOption(projectId, zipPath, option);
            
            if (result.success) {
                if ((result as any).canceled) {
                    // User canceled
                    this.projectExistsResult = null;
                    return;
                }
                
                if (result.data) {
                    // Check if there are conflicts after merge
                    if (typeof result.data === 'object' && 'mergedWithConflicts' in result.data) {
                        const mergeResult = result.data as MergeResult;
                        this.mergeResult = mergeResult;
                        this.projectExistsResult = null;
                        
                        // Show merge result dialog
                        this.showMergeResultDialog = true;
                        return;
                    }
                    
                    // For overwrite or merge without conflicts - show success dialog
                    this.mergeResult = {
                        mergedWithConflicts: false,
                        projectId: projectId
                    };
                    this.projectExistsResult = null;
                    this.showMergeResultDialog = true;
                    return;
                }
            } else if (result.error) {
                console.error('Import option failed:', result.error);
            }
        } catch (error) {
            console.error('Failed to process import option:', error);
        }
        
        this.projectExistsResult = null;
    }

    private handleMergeResultClosed(e: CustomEvent<{hasConflicts: boolean}>) {
        this.showMergeResultDialog = false;
        const hasConflicts = e.detail.hasConflicts;
        
        if (hasConflicts && this.mergeResult) {
            // Navigate to workflow to resolve conflicts
            this.currentProjectId = this.mergeResult.projectId;
            this.currentScreen = 'workflow';
        } else {
            // Just refresh dashboard
            this.dispatchEvent(new CustomEvent('projects-updated', {bubbles: true, composed: true}));
        }
        
        this.mergeResult = null;
    }

    private toggleMenu() {
        this.showMenu = !this.showMenu;
    }

    private closeMenu() {
        this.showMenu = false;
    }

    render() {
        return html`
            <header class="top-header">
                <span class="app-title">${msg('Writer20')}</span>
            </header>
            <div style="display: flex; flex: 1;">
                ${this.currentScreen !== 'settings' ? html`
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
                                    <button class="menu-item" @click=${() => this.importProject()}>
                                        <span class="material-icons">file_upload</span>
                                        ${msg('Import Project')}
                                    </button>
                                    <button class="menu-item" @click=${() => this.navigateTo('settings')}>
                                        <span class="material-icons">settings</span>
                                        ${msg('Settings')}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </nav>
                ` : ''}

                <main class="content ${this.getScreenAnimationClass()}" @click=${this.closeMenu}>
                    ${this.currentScreen === 'dashboard' ? html`
                        <dashboard-screen
                                @navigate-to-workflow=${(e: CustomEvent) => this.navigateTo('workflow', e.detail.projectId)}
                        ></dashboard-screen>
                    ` : ''}

                    ${this.currentScreen === 'workflow' && this.currentProjectId ? html`
                        <workflow-screen
                                .projectId=${this.currentProjectId}
                                @navigate-back=${() => {
                                    this.navigateTo('dashboard');
                                }}
                        ></workflow-screen>
                    ` : ''}

                    ${this.currentScreen === 'settings' ? html`
                        <settings-screen
                                .theme=${this.theme}
                                .language=${this.language}
                                @theme-change=${(e: CustomEvent) => this.handleThemeChange(e.detail.theme)}
                                @language-change=${(e: CustomEvent) => this.handleLanguageChange(e.detail.language)}
                                @navigate-back=${() => this.navigateTo('dashboard')}
                        ></settings-screen>
                    ` : ''}
                </main>

                <project-exists-dialog
                        .open=${this.showProjectExistsDialog && this.projectExistsResult}
                        .existsResult=${this.projectExistsResult}
                        @import-option=${this.handleImportOption}
                ></project-exists-dialog>

                <merge-result-dialog
                        .open=${this.showMergeResultDialog && this.mergeResult}
                        .mergeResult=${this.mergeResult}
                        @merge-result-closed=${this.handleMergeResultClosed}
                ></merge-result-dialog>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'app-shell': AppShell;
    }
}
