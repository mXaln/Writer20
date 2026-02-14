# Writer20 - Electron + Lit 3 Application Specification

## 1. Project Overview

### Project Name
**Writer20** - Desktop File Management Application

### Project Type
Cross-platform desktop application built with Electron and Lit 3 web components

### Core Feature Summary
A desktop application for organizing and managing project-based file collections with SQLite persistence, theme customization, and multi-language support.

### Target Users
- Professionals managing multiple project files
- Developers organizing project resources
- Anyone needing structured file organization with metadata

---

## 2. Technical Architecture

### Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Desktop Framework | Electron | ^28.0.0 |
| UI Framework | Lit | ^3.1.0 |
| Build Tool | Vite | ^5.0.0 |
| Database | better-sqlite3 | ^9.0.0 |
| Language | TypeScript | ^5.3.0 |
| Packaging | electron-builder | ^24.0.0 |

### Project Structure
```
electron-lit/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main entry point
│   │   ├── database.ts          # SQLite operations
│   │   ├── ipc-handlers.ts      # IPC communication
│   │   └── file-operations.ts   # File system operations
│   ├── renderer/                # Renderer process (Lit app)
│   │   ├── index.html           # HTML entry
│   │   ├── main.ts              # Renderer entry
│   │   ├── components/          # Lit components
│   │   │   ├── app-shell.ts     # Main app container
│   │   │   ├── dashboard.ts     # Dashboard screen
│   │   │   ├── project-card.ts  # Project list item
│   │   │   ├── project-info.ts  # Project info popup
│   │   │   ├── workflow.ts      # Workflow screen
│   │   │   ├── file-list.ts     # File list component
│   │   │   ├── settings.ts       # Settings screen
│   │   │   └── navigation.ts    # Navigation component
│   │   ├── services/            # Business logic
│   │   │   ├── project-service.ts
│   │   │   ├── file-service.ts
│   │   │   └── settings-service.ts
│   │   ├── i18n/                # Localization
│   │   │   ├── index.ts
│   │   │   ├── locales.ts
│   │   │   └── ru.ts
│   │   ├── styles/              # Global styles
│   │   │   ├── theme.ts         # Theme definitions
│   │   │   └── global.css
│   │   └── types/               # TypeScript types
│   │       └── index.ts
│   └── preload/
│       └── index.ts             # Preload script
├── resources/                   # App resources
│   └── icon.png
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
└── SPEC.md
```

### Database Schema (SQLite)

#### Table: `projects`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| name | TEXT | NOT NULL UNIQUE | Project name |
| description | TEXT | DEFAULT '' | Project description |
| created_at | TEXT | NOT NULL | ISO timestamp |
| updated_at | TEXT | NOT NULL | ISO timestamp |

#### Table: `files`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| project_id | INTEGER | FOREIGN KEY → projects(id) | Parent project |
| name | TEXT | NOT NULL | File name |
| path | TEXT | NOT NULL | Absolute path to file |
| created_at | TEXT | NOT NULL | ISO timestamp |

#### Table: `settings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | TEXT | PRIMARY KEY | Setting key |
| value | TEXT | NOT NULL | Setting value |

---

## 3. UI/UX Specification

### 3.1 Layout Structure

#### Window Configuration
- **Main Window**: 1200x800 pixels (default), minimum 800x600
- **Frameless**: No (use native frame for OS consistency)
- **Resizable**: Yes

#### Screen Navigation
- Single-page application with router-based navigation
- Three main screens: Dashboard, Workflow, Settings
- Navigation via side navigation panel

#### Layout Regions
```
┌─────────────────────────────────────────────────┐
│                  Title Bar                       │
├────────┬────────────────────────────────────────┤
│        │                                         │
│  Nav   │              Content Area              │
│  Panel │                                         │
│        │                                         │
│ [Dash] │                                         │
│ [Work] │                                         │
│ [Set]  │                                         │
│        │                                         │
└────────┴────────────────────────────────────────┘
```

### 3.2 Visual Design

#### Color Palette

**Light Theme**
| Role | Color | Hex |
|------|-------|-----|
| Background Primary | White | #FFFFFF |
| Background Secondary | Light Gray | #F5F5F5 |
| Surface | White | #FFFFFF |
| Primary | Blue | #2196F3 |
| Primary Hover | Dark Blue | #1976D2 |
| Secondary | Gray | #757575 |
| Text Primary | Dark Gray | #212121 |
| Text Secondary | Medium Gray | #757575 |
| Border | Light Gray | #E0E0E0 |
| Error | Red | #F44336 |
| Success | Green | #4CAF50 |

**Dark Theme**
| Role | Color | Hex |
|------|-------|-----|
| Background Primary | Dark Gray | #121212 |
| Background Secondary | Darker Gray | #1E1E1E |
| Surface | Medium Dark | #2D2D2D |
| Primary | Light Blue | #64B5F6 |
| Primary Hover | Lighter Blue | #90CAF9 |
| Secondary | Light Gray | #B0B0B0 |
| Text Primary | White | #FFFFFF |
| Text Secondary | Light Gray | #B0B0B0 |
| Border | Dark Gray | #424242 |
| Error | Light Red | #EF5350 |
| Success | Light Green | #81C784 |

#### Typography
- **Font Family**: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Heading 1**: 24px, font-weight: 600
- **Heading 2**: 20px, font-weight: 600
- **Heading 3**: 16px, font-weight: 600
- **Body**: 14px, font-weight: 400
- **Caption**: 12px, font-weight: 400

#### Spacing System
- Base unit: 4px
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

#### Visual Effects
- **Border Radius**: 8px (cards), 4px (buttons), 50% (avatars)
- **Shadows (Light)**:
  - Card: 0 2px 4px rgba(0,0,0,0.1)
  - Elevated: 0 4px 8px rgba(0,0,0,0.15)
- **Shadows (Dark)**:
  - Card: 0 2px 4px rgba(0,0,0,0.3)
  - Elevated: 0 4px 8px rgba(0,0,0,0.4)
- **Transitions**: 200ms ease-in-out for all interactive elements

### 3.3 Components

#### Navigation Panel
- Width: 200px (collapsible to 60px on smaller screens)
- Position: Fixed left
- Items: Icon + Label
- Active state: Background highlight + left border accent
- Hover state: Subtle background change

#### Dashboard Screen
- **Header**: "Projects" title + "New Project" button
- **Project List**: Grid layout, 3 columns (responsive)
- **Project Card**:
  - Size: 280px × 160px
  - Content: Project name (bold), description preview (2 lines max)
  - Actions: Info button (icon) in top-right corner
  - Click: Navigate to workflow
  - Hover: Subtle elevation increase

#### Project Info Popup (Modal)
- **Trigger**: Click info button on project card
- **Overlay**: Semi-transparent backdrop (rgba(0,0,0,0.5))
- **Modal Size**: 400px × 300px
- **Content**:
  - Project name (heading)
  - Description text
  - File count badge
  - Close button
- **Animation**: Fade in + scale up (200ms)

#### Create Project Form
- **Fields**:
  - Name (required, text input)
  - Description (optional, textarea)
- **Buttons**: Cancel, Create
- **Validation**: Name required, unique

#### Workflow Screen
- **Header**: Project name (as page title) + Back button
- **File List**:
  - Table or list view
  - Columns: File icon, Name, Path (truncated), Actions
- **Actions**:
  - Add Files button (opens file dialog)
  - Remove file (icon button)
  - Open file (click on row)
- **Empty State**: "No files yet. Click 'Add Files' to get started."

#### Settings Screen
- **Sections**:
  1. Appearance
     - Theme: Radio buttons (Dark, Light, System)
  2. Language
     - Language: Dropdown (English, Russian)
- **Persistence**: Auto-save on change

---

## 4. Functional Specification

### 4.1 Core Features

#### Project Management (Dashboard)
1. **Create Project**
   - Input: Name (required), Description (optional)
   - Validation: Name must be unique
   - Action: Create database record, create project folder in ~/Writer20
   - Folder structure: ~/Writer20/{project-name}/

2. **List Projects**
   - Sort: Alphabetical by name (ascending)
   - Display: Name, description preview, info button
   - Click action: Navigate to workflow

3. **View Project Info**
   - Trigger: Click info button (i) on project card
   - Display: Name, description, file count
   - Modal overlay with close button

#### File Management (Workflow)
1. **Add Files**
   - Trigger: Click "Add Files" button
   - Action: Open native file dialog (multi-select enabled)
   - Process: Copy selected files to ~/Writer20/{project-name}/
   - Database: Create file records with name and path
   - UI: Update file list

2. **View Files**
   - Display: List of all files in project
   - Information: File name, full path
   - Sort: By name (alphabetical)

3. **Open File**
   - Trigger: Click on file row
   - Action: Open file with system default application
   - Implementation: Electron shell.openPath()

4. **Remove File**
   - Trigger: Click remove button on file row
   - Action: Remove from database, optionally delete file
   - Confirmation: Show confirmation dialog

#### Settings
1. **Theme Selection**
   - Options: Dark, Light, System
   - System: Follow OS preference
   - Persistence: Save to SQLite
   - Apply: Immediate UI update

2. **Language Selection**
   - Options: English (locales), Russian (ru)
   - Persistence: Save to SQLite
   - Apply: Immediate UI text update

### 4.2 User Interactions and Flows

#### Flow: Create New Project
```
1. User clicks "New Project" button
2. Modal/form appears with name and description fields
3. User enters project name (required)
4. User enters description (optional)
5. User clicks "Create"
6. System validates:
   - Name not empty
   - Name unique
7. If valid:
   - Create database record
   - Create folder ~/Writer20/{name}/
   - Add project to list
   - Close modal
8. If invalid:
   - Show error message
   - Keep modal open
```

#### Flow: Add Files to Project
```
1. User on workflow screen
2. User clicks "Add Files" button
3. Native file dialog opens (multi-select)
4. User selects one or more files
5. For each file:
   - Copy to ~/Writer20/{project-name}/
   - Create database record
6. File list updates with new files
```

#### Flow: Open File
```
1. User on workflow screen
2. User clicks on file row
3. System checks if file exists at path
4. If exists:
   - Open with shell.openPath()
5. If not exists:
   - Show error: "File not found"
   - Option to remove from list
```

### 4.3 Data Flow & Processing

#### Key Modules

**Main Process (Electron)**
- `DatabaseService`: SQLite CRUD operations
- `FileService`: File system operations (copy, delete, open)
- `IPCHandlers`: Handle renderer requests

**Renderer Process (Lit)**
- `ProjectService`: Project business logic
- `FileService`: File management logic
- `SettingsService`: Settings management
- `I18nService`: Localization

#### IPC Communication
| Channel | Direction | Purpose |
|---------|-----------|---------|
| project:create | R → M | Create new project |
| project:list | R → M | Get all projects |
| project:get | R → M | Get single project |
| project:delete | R → M | Delete project |
| file:add | R → M | Add files to project |
| file:list | R → M | Get files for project |
| file:remove | R → M | Remove file |
| file:open | R → M | Open file with system |
| settings:get | R → M | Get settings |
| settings:set | R → M | Update settings |

### 4.4 Edge Cases

1. **Duplicate Project Name**: Show error, prevent creation
2. **File Already Exists**: Skip or overwrite (ask user)
3. **File Not Found**: Show error, offer to remove from list
4. **Database Error**: Show error message, log details
5. **Empty Project List**: Show "No projects yet" message
6. **Empty File List**: Show "Add files to get started" message
7. **Long Project Names**: Truncate with ellipsis (max 50 chars display)
8. **Long File Names**: Truncate with ellipsis in table
9. **Invalid Characters in Name**: Sanitize or reject with error
10. **Disk Full**: Handle gracefully with error message

---

## 5. Internationalization (i18n)

### Supported Languages
- English (locales) - Default
- Russian (ru)

### Translation Keys Structure
```typescript
{
  app: {
    name: string;
  };
  nav: {
    dashboard: string;
    workflow: string;
    settings: string;
  };
  dashboard: {
    title: string;
    newProject: string;
    noProjects: string;
    createProject: string;
    projectName: string;
    projectDescription: string;
    cancel: string;
    create: string;
  };
  projectInfo: {
    title: string;
    files: string;
    close: string;
  };
  workflow: {
    back: string;
    addFiles: string;
    noFiles: string;
    removeFile: string;
    openFile: string;
    fileNotFound: string;
  };
  settings: {
    title: string;
    appearance: string;
    theme: string;
    dark: string;
    light: string;
    system: string;
    language: string;
    english: string;
    russian: string;
  };
  errors: {
    required: string;
    duplicateName: string;
    fileNotFound: string;
    databaseError: string;
  };
}
```

---

## 6. Acceptance Criteria

### 6.1 Project Management
- [ ] User can create a new project with name and description
- [ ] Projects are listed in alphabetical order
- [ ] Clicking project card navigates to workflow
- [ ] Info button shows modal with project details
- [ ] Project name must be unique

### 6.2 File Management
- [ ] User can add files from file system
- [ ] Files are copied to ~/Writer20/{project-name}/
- [ ] Clicking file opens it with system default app
- [ ] User can remove files from project
- [ ] File list shows current files in project

### 6.3 Settings
- [ ] User can change theme (dark/light/system)
- [ ] Theme change applies immediately
- [ ] User can change language (English/Russian)
- [ ] Language change applies immediately
- [ ] Settings persist across app restarts

### 6.4 Visual Checkpoints
- [ ] Dashboard displays project cards in grid
- [ ] Project info modal appears centered with overlay
- [ ] Workflow shows project name as header
- [ ] File list displays in table format
- [ ] Settings page has clear section organization
- [ ] Theme colors match specification
- [ ] Responsive layout works on different window sizes

### 6.5 Technical Requirements
- [ ] App builds successfully with electron-builder
- [ ] SQLite database initializes on first run
- [ ] File operations work correctly
- [ ] IPC communication functions properly
- [ ] No console errors in production build

---

## 7. Implementation Notes

### Dependencies to Install
```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2",
    "electron-log": "^5.0.1"
  },
  "devDependencies": {
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "lit": "^3.1.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "@electron/rebuild": "^3.6.0"
  }
}
```

### Build Configuration
- Use Vite for both main and renderer bundling
- electron-builder for packaging
- Native module (better-sqlite3) requires rebuild for Electron

### File Storage Location
- User files: `~/Writer20/{project-name}/`
- Database: `~/.config/writer20/data.db`
- Logs: `~/.config/writer20/logs/`
