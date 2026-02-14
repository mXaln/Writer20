import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { baseStyles, getThemeCSS, getEffectiveTheme } from '../styles/theme';
import { getTranslations, Translations } from '../i18n/en';
import { Theme, Language, Settings } from '../types';

type Screen = 'dashboard' | 'workflow' | 'settings';

@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        min-height: 100vh;
      }

      .nav-panel {
        width: 200px;
        background-color: var(--bg-secondary);
        border-right: 1px solid var(--border);
        padding: 16px 0;
        display: flex;
        flex-direction: column;
      }

      .nav-logo {
        padding: 16px;
        font-size: 20px;
        font-weight: 600;
        color: var(--primary);
        border-bottom: 1px solid var(--border);
        margin-bottom: 8px;
      }

      .nav-items {
        flex: 1;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 200ms ease-in-out;
        border-left: 3px solid transparent;
        background: none;
        border-right: none;
        width: 100%;
        text-align: left;
        font-size: 14px;
      }

      .nav-item:hover {
        background-color: var(--surface);
        color: var(--text-primary);
      }

      .nav-item.active {
        background-color: var(--surface);
        color: var(--primary);
        border-left-color: var(--primary);
      }

      .nav-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .content {
        flex: 1;
        padding: 24px;
        overflow: auto;
      }

      @media (max-width: 768px) {
        .nav-panel {
          width: 60px;
        }
        
        .nav-logo {
          font-size: 16px;
          padding: 12px 8px;
          text-align: center;
        }
        
        .nav-item span {
          display: none;
        }
        
        .nav-item {
          justify-content: center;
          padding: 12px;
        }
      }
    `
  ];

  @state() private currentScreen: Screen = 'dashboard';
  @state() private theme: Theme = 'system';
  @state() private language: Language = 'en';
  @state() private translations: Translations = getTranslations('en');
  @state() private currentProjectId: number | null = null;

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
    if (screen === 'workflow' && projectId) {
      this.currentProjectId = projectId;
    }
  }

  render() {
    return html`
      <nav class="nav-panel">
        <div class="nav-logo">${this.translations.app.name}</div>
        <div class="nav-items">
          <button 
            class="nav-item ${this.currentScreen === 'dashboard' ? 'active' : ''}"
            @click=${() => this.navigateTo('dashboard')}
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span>${this.translations.nav.dashboard}</span>
          </button>
          
          <button 
            class="nav-item ${this.currentScreen === 'settings' ? 'active' : ''}"
            @click=${() => this.navigateTo('settings')}
          >
            <span class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            <span>${this.translations.nav.settings}</span>
          </button>
        </div>
      </nav>

      <main class="content">
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
