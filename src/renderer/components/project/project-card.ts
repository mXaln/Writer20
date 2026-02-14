import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Project} from '../../types';
import {baseStyles} from "../../styles/base";
import {fontStyles} from "../../styles/fonts";

@customElement('project-card')
export class ProjectCard extends LitElement {
    static styles = [
        baseStyles,
        fontStyles,
        css`
            :host {
                display: block;
                width: 100%;
            }

            .card {
                background-color: var(--surface);
                border-radius: 8px;
                box-shadow: var(--shadow-card);
                padding: 16px;
                cursor: pointer;
                transition: all 200ms ease-in-out;
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
                margin-bottom: 20px;
            }

            .card:hover {
                box-shadow: var(--shadow-elevated);
                transform: translateY(-2px);
            }

            .name {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .info-btn {
                position: absolute;
                top: 12px;
                right: 12px;
                background: none;
                border: none;
                padding: 8px;
                border-radius: 50%;
                cursor: pointer;
                color: var(--text-secondary);
                transition: all 200ms ease-in-out;
            }

            .info-btn:hover {
                background-color: rgba(0, 0, 0, 0.1);
                color: var(--primary);
            }
        `
    ];

    @property({type: Object}) project!: Project;

    private handleClick() {
        this.dispatchEvent(new CustomEvent('project-select', {
            detail: {project: this.project},
            bubbles: true,
            composed: true
        }));
    }

    private handleInfoClick(e: Event) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('project-info', {
            detail: {project: this.project},
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="card" @click=${this.handleClick}>
                <div class="name">${this.project.language} - ${this.project.book} - ${this.project.type}</div>
                <button class="info-btn" @click=${this.handleInfoClick}>
                    <span class="material-icons">info</span>
                </button>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'project-card': ProjectCard;
    }
}
