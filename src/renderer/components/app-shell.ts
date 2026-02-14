import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getThemeCSS, getEffectiveTheme } from '../styles/theme';
import { baseStyles } from "../styles/base";
import { getTranslations, Translations } from '../i18n/en';
import { Theme, Language } from '../types';

type Screen = 'dashboard' | 'workflow' | 'settings';

@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = [
    baseStyles,
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

      .nav-panel {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 65px);
        width: 80px;
        background-color: var(--primary);
        border-right: 1px solid var(--border);
        padding: 16px 0;
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
        background-color: rgba(255,255,255,0.3);
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

      @media (max-width: 768px) {
        .nav-panel {
          width: 60px;
        }
      }
    `
  ];

  @state() private currentScreen: Screen = 'dashboard';
  @state() private theme: Theme = 'system';
  @state() private language: Language = 'en';
  @state() private translations: Translations = getTranslations('en');
  @state() private currentProjectId: number | null = null;
  @state() private showMenu = false;

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
        this.translations = getTranslations(this.language);
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
    this.translations = getTranslations(newLanguage);
    await window.electronAPI.setSetting('language', newLanguage);
    this.requestUpdate();
  }

  private navigateTo(screen: Screen, projectId?: number) {
    this.currentScreen = screen;
    this.showMenu = false;
    if (screen === 'workflow' && projectId) {
      this.currentProjectId = projectId;
    }
  }

  private async importProject() {
    this.showMenu = false;
    try {
      const result = await window.electronAPI.importProject();
      if (result.success && result.data) {
        // Dispatch event to refresh dashboard
        this.dispatchEvent(new CustomEvent('projects-updated', { bubbles: true, composed: true }));
      } else if (result.error) {
        console.error('Import failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to import project:', error);
    }
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
        <span class="app-title">${this.translations.app.name}</span>
      </header>
      <div style="display: flex; flex: 1;">
        ${this.currentScreen !== 'settings' ? html`
          <nav class="nav-panel" @click=${this.closeMenu}>
            <div class="nav-items"></div>
            <div class="nav-bottom">
              <button class="menu-btn" @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu(); }}>
                <span class="material-icons">more_vert</span>
              </button>
              ${this.showMenu ? html`
                <div class="dropdown-menu">
                  <button class="menu-item" @click=${() => this.importProject()}>
                    <span class="material-icons">file_upload</span>
                    Import Project
                  </button>
                  <button class="menu-item" @click=${() => this.navigateTo('settings')}>
                    <span class="material-icons">settings</span>
                    ${this.translations.nav.settings}
                  </button>
              </div>
            ` : ''}
            </div>
          </nav>
        ` : ''}

        <main class="content" @click=${this.closeMenu}>
        ${this.currentScreen === 'dashboard' ? html`
          <dashboard-screen 
            .translations=${this.translations}
            @navigate-to-workflow=${(e: CustomEvent) => this.navigateTo('workflow', e.detail.projectId)}
          ></dashboard-screen>
        ` : ''}
        
        ${this.currentScreen === 'workflow' && this.currentProjectId ? html`
          <workflow-screen 
            .projectId=${this.currentProjectId}
            .translations=${this.translations}
            @navigate-back=${() => this.navigateTo('dashboard')}
          ></workflow-screen>
        ` : ''}
        
        ${this.currentScreen === 'settings' ? html`
          <settings-screen 
            .theme=${this.theme}
            .language=${this.language}
            .translations=${this.translations}
            @theme-change=${(e: CustomEvent) => this.handleThemeChange(e.detail.theme)}
            @language-change=${(e: CustomEvent) => this.handleLanguageChange(e.detail.language)}
            @navigate-back=${() => this.navigateTo('dashboard')}
          ></settings-screen>
        ` : ''}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
