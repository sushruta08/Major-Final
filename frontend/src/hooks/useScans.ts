import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scanService, pipelineService } from '../services/scanService'
import toast from 'react-hot-toast'

export function useScans(repositoryId?: string) {
  return useQuery({
    queryKey: ['scans', repositoryId],
    queryFn: async () => {
      try { return await scanService.list(repositoryId) } catch { return [] }
    },
    staleTime: 15_000,
    retry: 1,
  })
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => scanService.get(scanId),
    enabled: !!scanId,
    retry: 1,
  })
}

export function useScanVulnerabilities(scanId: string, severity?: string) {
  return useQuery({
    queryKey: ['scan-vulns', scanId, severity],
    queryFn: async () => {
      try { return await scanService.getVulnerabilities(scanId, severity) } catch { return [] }
    },
    enabled: !!scanId,
    retry: 1,
  })
}

export function usePipelines(repositoryId?: string) {
  return useQuery({
    queryKey: ['pipelines', repositoryId],
    queryFn: async () => {
      try { return await pipelineService.list(repositoryId) } catch { return [] }
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 1,
  })
}

export function useTriggerScan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ repository_id, branch, trigger }: { repository_id: string; branch: string; trigger: string }) =>
      scanService.trigger(repository_id, branch, trigger),
    onSuccess: (data) => {
      toast.success(`Pipeline started: ${data.message}`)
      queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to trigger scan'),
  })
}

export function useCancelPipeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pipelineId: string) => pipelineService.cancel(pipelineId),
    onSuccess: () => {
      toast.success('Pipeline cancelled')
      queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
    onError: () => toast.error('Failed to cancel pipeline'),
  })
}
