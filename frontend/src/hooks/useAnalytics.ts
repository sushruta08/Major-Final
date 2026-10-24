import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/scanService'

export function useVulnerabilityTrends(months = 6) {
  return useQuery({
    queryKey: ['trends', months],
    queryFn: async () => { try { return await analyticsService.getTrends(months) } catch { return [] } },
    staleTime: 60_000, retry: 1,
  })
}

export function useScannerBreakdown() {
  return useQuery({
    queryKey: ['scanner-breakdown'],
    queryFn: async () => { try { return await analyticsService.getScannerBreakdown() } catch { return [] } },
    staleTime: 60_000, retry: 1,
  })
}

export function useTopVulnerableRepos(limit = 5) {
  return useQuery({
    queryKey: ['top-vuln-repos', limit],
    queryFn: async () => { try { return await analyticsService.getTopVulnerableRepos(limit) } catch { return [] } },
    staleTime: 60_000, retry: 1,
  })
}

export function usePipelineStats(days = 30) {
  return useQuery({
    queryKey: ['pipeline-stats', days],
    queryFn: async () => {
      try { return await analyticsService.getPipelineStats(days) }
      catch { return { total: 0, completed: 0, failed: 0, running: 0, success_rate: 100 } }
    },
    staleTime: 60_000, retry: 1,
  })
}

export function useScanActivity(days = 7) {
  return useQuery({
    queryKey: ['scan-activity', days],
    queryFn: async () => { try { return await analyticsService.getScanActivity(days) } catch { return [] } },
    staleTime: 30_000, retry: 1,
  })
}
