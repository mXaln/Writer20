import { css } from "lit";

export const controlStyles = css`
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
    
    /* Basic button */
    .btn {
        padding: 10px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 200ms ease-in-out;
    }

    .btn-primary {
        background-color: var(--primary);
        color: white;
    }

    .btn-primary:hover {
        background-color: var(--primary-hover);
    }

    .btn-secondary {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);
    }

    .btn-secondary:hover {
        background-color: var(--border);
    }

    .btn-danger {
        background-color: #f44336;
        color: white;
    }

    .btn-danger:hover {
        background-color: #d32f2f;
    }
    
    /* Borderless Button */
    .borderless-btn {
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

    .borderless-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: var(--text-primary);
    }

    /* Icon Button */
    .icon-btn {
        background: none;
        border: none;
        padding: 6px;
        cursor: pointer;
        color: var(--text-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 200ms ease-in-out;
    }

    .icon-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: var(--text-primary);
    }

    .icon-btn.active {
        color: var(--primary);
    }
`