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
`;