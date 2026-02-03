import { useState, useCallback } from 'react'
import type { OptimizationArea, OptimizationSummary } from './optimization-priorities-list'
import { api } from '~/trpc/react'

type GetOptimizationAreasRequest = {
  requestId?: string;
  limit?: number;
  showPartialOnTimeout?: boolean;
}

type GetOptimizationAreasResponse = {
  optimizationAreas: OptimizationArea[];
  requestId: string;
  lastSyncRequestId?: string;
  summary: OptimizationSummary;
}

type UseOptimizationAreasOptions = {
  requestId?: string;
  limit?: number;
  showPartialOnTimeout?: boolean;
  enabled?: boolean;
}

type UseOptimizationAreasResult = {
  data: GetOptimizationAreasResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOptimizationAreas(options: UseOptimizationAreasOptions = {}) {
  const {
    requestId,
    limit = 10,
    showPartialOnTimeout = true,
    enabled = true,
  } = options

  const [lastRequestId, setLastRequestId] = useState<string | undefined>(undefined)
  const [requestTime, setRequestTime] = useState<number | undefined>(undefined)

  const {
    data,
    isLoading,
    error,
    refetch: trpcRefetch,
  } = api.analysis.getOptimizationAreas.useQuery(
    {
      requestId: requestId || lastRequestId || `user_${Date.now()}`,
      limit,
      showPartialOnTimeout,
    },
    {
      enabled,
      onSuccess: (result) => {
        setLastRequestId(result.requestId)
        setRequestTime(Date.now())
      },
    }
  )

  const refetch = useCallback(async () => {
    await trpcRefetch()
  }, [trpcRefetch])

  return {
    data,
    isLoading,
    error,
    refetch,
    requestId: data?.requestId,
    lastSyncRequestId: data?.lastSyncRequestId,
    requestTime,
  }
}