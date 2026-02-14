import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {localized, msg} from '@lit/localize';
import {allLocales} from "../i18n/locale-codes";
import {Theme, Language} from '../types';
import {baseStyles} from "../styles/base";
import {fontStyles} from "../styles/fonts";


@customElement('settings-screen')
@localized()
export class SettingsScreen extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
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
                background-color: rgba(0, 0, 0, 0.1);
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
        `
    ];

    @property({type: String}) theme: Theme = 'system';
    @property({type: String}) language: Language = 'en';

    private getLocaleNames(locale: string) {
        const locales: Record<string, string> = {
            'en': msg('English'),
            'es-419': msg('Spanish'),
            'ru': msg('Russian'),
            'zh-Hans': msg('Chinese (Simplified)'),
        };
        return locales[locale];
    }

    private handleThemeChange(newTheme: Theme) {
        this.dispatchEvent(new CustomEvent('theme-change', {
            detail: {theme: newTheme}
        }));
    }

    private handleLanguageChange(e: Event) {
        const newLanguage = (e.target as HTMLSelectElement).value as Language;
        this.dispatchEvent(new CustomEvent('language-change', {
            detail: {language: newLanguage}
        }));
    }

    private goBack() {
        this.dispatchEvent(new CustomEvent('navigate-back'));
    }

    render() {
        return html`
            <div class="header">
                <button class="back-btn" @click=${this.goBack}>
                    <span class="material-icons">arrow_back</span>
                    ${msg('Back')}
                </button>
            </div>
            <h1 class="title">${msg('Settings')}</h1>

            <div class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">${msg('Appearance')}</h2>
                </div>
                <div class="section-content">
                    <div class="setting-item">
                        <span class="setting-label">${msg('Theme')}</span>
                        <div class="radio-group">
                            <button
                                    class="radio-option ${this.theme === 'light' ? 'active' : ''}"
                                    @click=${() => this.handleThemeChange('light')}
                            >
                                ${msg('Light')}
                            </button>
                            <button
                                    class="radio-option ${this.theme === 'dark' ? 'active' : ''}"
                                    @click=${() => this.handleThemeChange('dark')}
                            >
                                ${msg('Dark')}
                            </button>
                            <button
                                    class="radio-option ${this.theme === 'system' ? 'active' : ''}"
                                    @click=${() => this.handleThemeChange('system')}
                            >
                                ${msg('System')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">${msg('Language')}</h2>
                </div>
                <div class="section-content">
                    <div class="setting-item">
                        <span class="setting-label">${msg('Language')}</span>
                        <div class="select-wrapper">
                            <select .value=${this.language} @change=${this.handleLanguageChange}>
                                ${allLocales.map(locale => html`
                                    <option value=${locale}>${this.getLocaleNames(locale) || locale}</option>
                                `)}
                            </select>
                            <span class="select-arrow">
                                <span class="material-icons">arrow_drop_down</span>
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
