import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ApiError,
} from '../types/api';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (data: CreateProjectRequest) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: CreateProjectRequest): Promise<Project | null> => {
    try {
      setError(null);
      const newProject = await projectService.create(data);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка создания проекта');
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest): Promise<Project | null> => {
    try {
      setError(null);
      const updatedProject = await projectService.update(id, data);
      setProjects(prev => 
        prev.map(project => project.id === id ? updatedProject : project)
      );
      return updatedProject;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка обновления проекта');
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await projectService.deleteById(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      return true;
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Ошибка удаления проекта');
      return false;
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}; 