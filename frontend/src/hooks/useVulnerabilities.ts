import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vulnerabilityService } from '../services/scanService'
import toast from 'react-hot-toast'

export function useVulnerabilities(params?: {
  repository_id?: string; severity?: string; status?: string; search?: string
}) {
  return useQuery({
    queryKey: ['vulnerabilities', params],
    queryFn: async () => {
      try { return await vulnerabilityService.list(params) } catch { return [] }
    },
    staleTime: 15_000,
    retry: 1,
  })
}

export function useVulnerabilityStats(repository_id?: string) {
  return useQuery({
    queryKey: ['vuln-stats', repository_id],
    queryFn: async () => {
      try { return await vulnerabilityService.getStats(repository_id) } catch { return { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, security_score: 100 } }
    },
    staleTime: 30_000,
    retry: 1,
  })
}

export function useUpdateVulnerabilityStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      vulnerabilityService.updateStatus(id, status, reason),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['vulnerabilities'] })
      qc.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
    onError: () => toast.error('Failed to update status'),
  })
}
