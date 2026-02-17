import {ReactiveController, ReactiveControllerHost} from 'lit';
import {Project} from '../types';

/**
 * API response wrapper
 */
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ProjectController - Reactive controller for project data management
 * 
 * Provides:
 * - Loading projects list
 * - Creating new projects
 * - Deleting projects
 * - Exporting projects
 * - Loading state and error handling
 * - Auto-update triggering on host component
 * 
 * Usage:
 * ```typescript
 * class MyComponent extends LitElement {
 *   private projectsCtrl = new ProjectController(this);
 *   
 *   render() {
 *     return html`
 *       ${this.projectsCtrl.loading ? html`Loading...` : ''}
 *       ${this.projectsCtrl.projects.map(p => html`${p.name}`)}
 *     `;
 *   }
 * }
 * ```
 */
export class ProjectController implements ReactiveController {
  private host: ReactiveControllerHost;
  
  /** List of all projects */
  projects: Project[] = [];
  
  /** Currently selected project */
  selectedProject: Project | null = null;
  
  /** Loading state */
  loading = false;
  
  /** Error message if any */
  error: string | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    // Register this controller with the host
    host.addController(this);
  }

  /**
   * Called when host connects to DOM
   */
  hostConnected() {
    // Can add event listeners here for global project updates
    window.addEventListener('projects-updated', this._handleProjectsUpdate);
  }

  /**
   * Called when host disconnects from DOM
   */
  hostDisconnected() {
    window.removeEventListener('projects-updated', this._handleProjectsUpdate);
  }

  private _handleProjectsUpdate = () => {
    this.loadProjects();
  };

  /**
   * Load all projects from the database
   */
  async loadProjects(): Promise<Project[]> {
    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const result = await window.electronAPI.listProjects() as ApiResult<Project[]>;
      
      if (result.success && result.data) {
        this.projects = result.data;
      } else {
        this.error = result.error || 'Failed to load projects';
        this.projects = [];
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.projects = [];
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }

    return this.projects;
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: number): Promise<Project | null> {
    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const result = await window.electronAPI.getProject(id) as ApiResult<Project>;
      
      if (result.success && result.data) {
        this.selectedProject = result.data;
      } else {
        this.error = result.error || 'Project not found';
        this.selectedProject = null;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.selectedProject = null;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }

    return this.selectedProject;
  }

  /**
   * Create a new project
   */
  async createProject(language: string, book: string, type: string): Promise<Project | null> {
    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const result = await window.electronAPI.createProject(language, book, type) as ApiResult<Project>;
      
      if (result.success && result.data) {
        // Refresh projects list after creation
        await this.loadProjects();
        return result.data;
      } else {
        this.error = result.error || 'Failed to create project';
        return null;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      return null;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<boolean> {
    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const result = await window.electronAPI.deleteProject(id) as ApiResult<void>;
      
      if (result.success) {
        // Refresh projects list after deletion
        await this.loadProjects();
        // Clear selected if it was deleted
        if (this.selectedProject?.id === id) {
          this.selectedProject = null;
        }
        return true;
      } else {
        this.error = result.error || 'Failed to delete project';
        return false;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      return false;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  /**
   * Export a project to a ZIP file
   */
  async exportProject(id: number): Promise<string | null> {
    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const result = await window.electronAPI.exportProject(id) as ApiResult<string>;
      
      if (result.success && result.data) {
        return result.data;
      } else {
        this.error = result.error || 'Failed to export project';
        return null;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      return null;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  /**
   * Clear any error state
   */
  clearError() {
    this.error = null;
    this.host.requestUpdate();
  }

  /**
   * Clear selected project
   */
  clearSelection() {
    this.selectedProject = null;
    this.host.requestUpdate();
  }
}

/**
 * Helper function to create a ProjectController
 * Useful for quick initialization
 */
export function createProjectController(host: ReactiveControllerHost): ProjectController {
  return new ProjectController(host);
}
