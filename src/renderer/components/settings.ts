import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Theme, Language, Translations } from '../types';

@customElement('settings-screen')
export class SettingsScreen extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 600px;
    }

    .header {
      margin-bottom: 24px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 8px 12px;
      cursor: pointer;
      color: var(--text-secondary);
      border-radius: 4px;
      transition: all 200ms ease-in-out;
    }

    .back-btn:hover {
      background-color: rgba(0,0,0,0.1);
      color: var(--text-primary);
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 24px;
    }

    .settings-section {
      background-color: var(--surface);
      border-radius: 8px;
      box-shadow: var(--shadow-card);
      margin-bottom: 24px;
    }

    .section-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-content {
      padding: 16px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .setting-item:not(:last-child) {
      border-bottom: 1px solid var(--border);
    }

    .setting-label {
      font-size: 14px;
      color: var(--text-primary);
    }

    .radio-group {
      display: flex;
      gap: 8px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background-color: transparent;
      color: var(--text-primary);
      transition: all 200ms ease-in-out;
    }

    .radio-option:hover {
      background-color: var(--bg-secondary);
    }

    .radio-option.active {
      border-color: var(--primary);
      background-color: var(--primary);
      color: white;
    }

    .radio-option input {
      display: none;
    }

    .select-wrapper {
      position: relative;
      min-width: 150px;
    }

    .select-wrapper select {
      appearance: none;
      padding: 8px 32px 8px 12px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      width: 100%;
    }

    .select-wrapper select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-secondary);
    }
  `;

  @property({ type: String }) theme: Theme = 'system';
  @property({ type: String }) language: Language = 'en';
  @property({ type: Object }) translations!: Translations;

  private handleThemeChange(newTheme: Theme) {
    this.dispatchEvent(new CustomEvent('theme-change', {
      detail: { theme: newTheme }
    }));
  }

  private handleLanguageChange(e: Event) {
    const newLanguage = (e.target as HTMLSelectElement).value as Language;
    this.dispatchEvent(new CustomEvent('language-change', {
      detail: { language: newLanguage }
    }));
  }

  private goBack() {
    this.dispatchEvent(new CustomEvent('navigate-back'));
  }

  render() {
    return html`
      <div class="header">
        <button class="back-btn" @click=${this.goBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          ${this.translations.workflow.back}
        </button>
      </div>
      <h1 class="title">${this.translations.settings.title}</h1>

      <div class="settings-section">
        <div class="section-header">
          <h2 class="section-title">${this.translations.settings.appearance}</h2>
        </div>
        <div class="section-content">
          <div class="setting-item">
            <span class="setting-label">${this.translations.settings.theme}</span>
            <div class="radio-group">
              <button 
                class="radio-option ${this.theme === 'light' ? 'active' : ''}"
                @click=${() => this.handleThemeChange('light')}
              >
                ${this.translations.settings.light}
              </button>
              <button 
                class="radio-option ${this.theme === 'dark' ? 'active' : ''}"
                @click=${() => this.handleThemeChange('dark')}
              >
                ${this.translations.settings.dark}
              </button>
              <button 
                class="radio-option ${this.theme === 'system' ? 'active' : ''}"
                @click=${() => this.handleThemeChange('system')}
              >
                ${this.translations.settings.system}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="section-header">
          <h2 class="section-title">${this.translations.settings.language}</h2>
        </div>
        <div class="section-content">
          <div class="setting-item">
            <span class="setting-label">${this.translations.settings.language}</span>
            <div class="select-wrapper">
              <select .value=${this.language} @change=${this.handleLanguageChange}>
                <option value="en">${this.translations.settings.english}</option>
                <option value="ru">${this.translations.settings.russian}</option>
              </select>
              <span class="select-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'settings-screen': SettingsScreen;
  }
}
