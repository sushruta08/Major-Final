import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService, repositoryService } from '../services/projectService'
import toast from 'react-hot-toast'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try { return await projectService.list() } catch { return [] }
    },
    retry: 1,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
    retry: 1,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: { name: string; description?: string }) => projectService.create(p),
    onSuccess: () => { toast.success('Project created'); qc.invalidateQueries({ queryKey: ['projects'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create project'),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => { toast.success('Project deleted'); qc.invalidateQueries({ queryKey: ['projects'] }) },
    onError: () => toast.error('Failed to delete project'),
  })
}

export function useRepositories(projectId?: string) {
  return useQuery({
    queryKey: ['repositories', projectId],
    queryFn: async () => {
      try { return await repositoryService.list(projectId) } catch { return [] }
    },
    retry: 1,
  })
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repository', id],
    queryFn: () => repositoryService.get(id),
    enabled: !!id,
    retry: 1,
  })
}

export function useCreateRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: { project_id: string; name: string; url: string; provider?: string; default_branch?: string; is_private?: boolean }) =>
      repositoryService.create(p),
    onSuccess: () => { toast.success('Repository connected'); qc.invalidateQueries({ queryKey: ['repositories'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to connect repository'),
  })
}

export function useDeleteRepository() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repositoryService.delete(id),
    onSuccess: () => { toast.success('Repository removed'); qc.invalidateQueries({ queryKey: ['repositories'] }) },
    onError: () => toast.error('Failed to remove repository'),
  })
}
