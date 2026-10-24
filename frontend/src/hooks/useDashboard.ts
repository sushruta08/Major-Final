import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/scanService'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      try {
        return await dashboardService.getMetrics()
      } catch {
        return null   // never throw — return null so UI shows empty state
      }
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 1,
  })
}
