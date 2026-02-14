import { css, unsafeCSS } from 'lit';
import { Theme } from '../types';

export const lightTheme = css`
  :host {
    --surface: #FFFFFF;
    --primary: #0250D3;
    --primary-dark: #003389;
    --primary-hover: #0247B8;
    --bg-primary: #EFEFEF;
    --secondary: #6C757D;
    --bg-secondary: #F5F5F5;
    --text-primary: #212529;
    --text-secondary: #6C757D;
    --border: #DEE2E6;
    --error: #DC3545;
    --success: #28A745;
    --shadow-card: 0 2px 4px rgba(0,0,0,0.08);
    --shadow-elevated: 0 4px 8px rgba(0,0,0,0.12);
    --overlay: rgba(0,0,0,0.5);
  }
`;

export const darkTheme = css`
  :host {
    --surface: #2D2D2D;
    --primary: #64B5F6;
    --primary-dark: #445E89;
    --primary-hover: #90CAF9;
    --bg-primary: #121212;
    --secondary: #B0B0B0;
    --bg-secondary: #1E1E1E;
    --text-primary: #FFFFFF;
    --text-secondary: #B0B0B0;
    --border: #424242;
    --error: #EF5350;
    --success: #81C784;
    --shadow-card: 0 2px 4px rgba(0,0,0,0.3);
    --shadow-elevated: 0 4px 8px rgba(0,0,0,0.4);
    --overlay: rgba(0,0,0,0.7);
  }
`;

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
    min-height: 100vh;
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

  .card {
    background-color: var(--surface);
    border-radius: 8px;
    box-shadow: var(--shadow-card);
    padding: 16px;
    transition: box-shadow 200ms ease-in-out;
  }

  .card:hover {
    box-shadow: var(--shadow-elevated);
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

  .btn-icon {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 200ms ease-in-out;
  }

  .btn-icon:hover {
    background-color: var(--bg-secondary);
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

export function getThemeCSS(theme: Theme): typeof lightTheme {
  if (theme === 'dark') {
    return darkTheme;
  }
  return lightTheme;
}

// Helper to get effective theme considering 'system' preference
export function getEffectiveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}
