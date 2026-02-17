import {css, html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Router} from '@lit-labs/router';
import {getEffectiveTheme, getThemeCSS} from '../styles/theme';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";
import {localized, msg} from '@lit/localize';
const {setLocale} = await import('../i18n/localization');
import {ImportOption, Language, MergeResult, ProjectExistsResult, Theme} from '../types';
import './dialogs/project-exists-dialog';
import './dialogs/merge-result-dialog';
import './app-nav-panel';

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

            .content {
                flex: 1;
                padding: 24px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

        `
    ];

    private router = new Router(this, [
        {
            path: '/',
            render: () => {
                return html`<dashboard-screen 
                        @navigate-to-workflow=${(e: CustomEvent) => this.navigateTo(`/workflow/${e.detail.projectId}`)}
                ></dashboard-screen>`
            }
        },
        {
            path: '/workflow/:projectId',
            render: ({projectId}) => {
                return html`<workflow-screen 
                        .projectId=${projectId}
                        @navigate-back=${this.navigateBack}
                ></workflow-screen>`;
            }
        },
        {
            path: '/settings',
            render: () => {
                return html`
                    <settings-screen
                            .theme=${this.theme}
                            .language=${this.language}
                            @theme-change=${(e: CustomEvent) => this.handleThemeChange(e.detail.theme)}
                            @language-change=${(e: CustomEvent) => this.handleLanguageChange(e.detail.language)}
                            @navigate-back=${this.navigateBack}
                    ></settings-screen>`
            }
        },
    ]);

    @state() private theme: Theme = 'system';
    @state() private language: Language = 'en';
    @state() private showProjectExistsDialog = false;
    @state() private projectExistsResult: ProjectExistsResult | null = null;
    @state() private showMergeResultDialog = false;
    @state() private mergeResult: MergeResult | null = null;
    @state() private navigationStack: string[] = [];

    async connectedCallback() {
        super.connectedCallback();
        await this.loadSettings();
        this.applyTheme();

        // Navigate to initial route after settings are loaded
        await this.router.goto('/');

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

    private async importProject() {
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

    private async navigateTo(pathname: string) {
        this.navigationStack.push(pathname);
        await this.router.goto(pathname);
    }

    private async navigateBack() {
        // Pop from stack to go back
        this.navigationStack.pop();
        if (this.navigationStack.length === 0) {
            return await this.router.goto("/")
        }

        const target = this.navigationStack[this.navigationStack.length - 1];
        if (!target) return await this.router.goto("/");

        await this.router.goto(target);
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
                        this.mergeResult = result.data as MergeResult;
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

    private async handleMergeResultClosed(e: CustomEvent<{hasConflicts: boolean}>) {
        this.showMergeResultDialog = false;
        const hasConflicts = e.detail.hasConflicts;
        
        if (hasConflicts && this.mergeResult) {
            // Navigate to workflow to resolve conflicts
            await this.navigateTo(`/workflow/${this.mergeResult.projectId}`);
        } else {
            // Just refresh dashboard
            this.dispatchEvent(new CustomEvent('projects-updated', {bubbles: true, composed: true}));
        }
        
        this.mergeResult = null;
    }

    private isSettingsPage(): boolean {
        return this.router.link() === '/settings';
    }

    private handleNavImportClick() {
        this.importProject();
    }

    private handleNavSettingsClick() {
        this.navigateTo('/settings');
    }

    render() {
        return html`
            <header class="top-header">
                <span class="app-title">${msg('Writer20')}</span>
            </header>
            <div style="display: flex; flex: 1;">
                ${!this.isSettingsPage() ? html`
                    <app-nav-panel
                        @nav-import-click=${this.handleNavImportClick}
                        @nav-settings-click=${this.handleNavSettingsClick}
                    ></app-nav-panel>
                ` : ''}

                <main class="content">
                    ${this.router.outlet()}
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
