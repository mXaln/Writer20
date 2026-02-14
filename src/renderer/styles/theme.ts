import { css } from 'lit';

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
