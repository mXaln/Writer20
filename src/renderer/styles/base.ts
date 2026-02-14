import { css } from "lit";

export const baseStyles = css`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    :host {
        display: block;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: var(--text-primary);
        background-color: var(--bg-primary);
    }

    h1 {
        font-size: 24px;
        font-weight: 600;
    }

    h2 {
        font-size: 20px;
        font-weight: 600;
    }

    h3 {
        font-size: 16px;
        font-weight: 600;
    }

    button {
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        transition: all 200ms ease-in-out;
    }

    button.primary {
        background-color: var(--primary);
        color: white;
    }

    button.primary:hover {
        background-color: var(--primary-hover);
    }

    button.secondary {
        background-color: transparent;
        color: var(--text-primary);
        border: 1px solid var(--border);
    }

    button.secondary:hover {
        background-color: var(--bg-secondary);
    }

    input, textarea, select {
        font-family: inherit;
        font-size: 14px;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background-color: var(--surface);
        color: var(--text-primary);
        width: 100%;
        transition: border-color 200ms ease-in-out;
    }

    input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: var(--primary);
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background-color: var(--surface);
        border-radius: 8px;
        box-shadow: var(--shadow-elevated);
        padding: 24px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .modal-title {
        font-size: 18px;
        font-weight: 600;
    }

    .modal-close {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: var(--text-secondary);
    }

    .modal-close:hover {
        color: var(--text-primary);
    }

    .modal-body {
        margin-bottom: 24px;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }

    .icon-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: var(--primary);
    }

    .icon-btn.active {
        color: var(--primary);
    }

    .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        background-color: var(--primary);
        color: white;
    }
`;