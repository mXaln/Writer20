import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {msg} from '@lit/localize';
import {DialogElement} from "../../mixins/dialog-mixin";

@customElement('create-project-dialog')
export class CreateProjectDialog extends DialogElement {
    static styles = [
        DialogElement.styles,
        css`
            .dialog {
                min-width: 400px;
                max-width: 400px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--text-primary);
            }

            .form-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid var(--border);
                border-radius: 4px;
                background-color: var(--bg-primary);
                color: var(--text-primary);
                font-size: 14px;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--primary);
            }

            .error-text {
                color: var(--error);
                font-size: 12px;
                margin-top: 4px;
            }

            .dialog-close {
                margin-left: auto;
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 200ms ease-in-out;
            }

            .dialog-close:hover {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
            }
        `
    ] as any;

    // Internal form state
    @state() private language = '';
    @state() private book = '';
    @state() private resourceType = 'ulb';
    @state() private error = '';

    dialogMinWidth = '400px';
    dialogMaxWidth = '400px';

    // Reset form when dialog closes
    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('open') && !this.open) {
            // Dialog just closed - reset form
            this.language = '';
            this.book = '';
            this.resourceType = 'ulb';
            this.error = '';
        }
    }

    private handleLanguageInput(e: Event) {
        this.language = (e.target as HTMLInputElement).value.toLowerCase();
        this.error = ''; // Clear error on input
    }

    private handleBookInput(e: Event) {
        this.book = (e.target as HTMLInputElement).value.toLowerCase();
        this.error = ''; // Clear error on input
    }

    private handleTypeChange(e: Event) {
        this.resourceType = (e.target as HTMLSelectElement).value;
        this.error = ''; // Clear error on change
    }

    private validate(): boolean {
        // Validate language: lowercase, a-z0-9-, no spaces
        const languageRegex = /^[a-z0-9-]+$/;
        if (!this.language.trim() || !languageRegex.test(this.language)) {
            this.error = msg('Language must be lowercase letters, numbers, or hyphens only');
            return false;
        }

        // Validate book: lowercase, a-z0-9, exactly 3 characters
        const bookRegex = /^[a-z0-9]{3}$/;
        if (!this.book.trim() || !bookRegex.test(this.book)) {
            this.error = msg('Book must be exactly 3 lowercase letters or numbers');
            return false;
        }

        // Validate type: lowercase, a-z0-9, max 3 characters
        const typeRegex = /^[a-z0-9]{1,3}$/;
        if (!this.resourceType.trim() || !typeRegex.test(this.resourceType)) {
            this.error = msg('Resource must be 1-3 lowercase letters or numbers');
            return false;
        }

        return true;
    }

    private handleCreate() {
        if (!this.validate()) {
            return;
        }

        this.dispatchEvent(new CustomEvent('create-project', {
            detail: {
                language: this.language.trim(),
                book: this.book.trim(),
                type: this.resourceType.trim()
            },
            bubbles: true,
            composed: true
        }));
    }

    private handleCancel() {
        this.dispatchEvent(new CustomEvent('create-cancel', {
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    render() {
        return this.renderOverlay(html`
            <div class="dialog-header">
                <span class="material-icons dialog-icon">create_new_folder</span>
                <span class="dialog-title">${msg('Create Project')}</span>
                <button class="dialog-close" @click=${this.handleCancel}>
                    <span class="material-icons">close</span>
                </button>
            </div>
            
            <div class="dialog-content">
                <div class="form-group">
                    <label class="form-label">${msg('Language')}</label>
                    <input
                        type="text"
                        class="form-input"
                        .value=${this.language}
                        @input=${this.handleLanguageInput}
                        @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleCreate()}
                    />
                </div>
                <div class="form-group">
                    <label class="form-label">${msg('Book')}</label>
                    <input
                        type="text"
                        class="form-input"
                        maxlength="3"
                        .value=${this.book}
                        @input=${this.handleBookInput}
                        @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleCreate()}
                    />
                </div>
                <div class="form-group">
                    <label class="form-label">${msg('Resource')}</label>
                    <select
                        class="form-input"
                        .value=${this.resourceType}
                        @change=${this.handleTypeChange}
                    >
                        <option value="ulb">ULB</option>
                        <option value="udb">UDB</option>
                        <option value="reg">REG</option>
                    </select>
                </div>
                ${this.error ? html`
                    <div class="error-text">${this.error}</div>
                ` : ''}
            </div>

            <div class="dialog-actions">
                <button class="btn btn-secondary" @click=${this.handleCancel}>
                    ${msg('Cancel')}
                </button>
                
                <button class="btn btn-primary" @click=${this.handleCreate}>
                    <span class="material-icons">add</span>
                    ${msg('Create')}
                </button>
            </div>
        `);
    }
}
