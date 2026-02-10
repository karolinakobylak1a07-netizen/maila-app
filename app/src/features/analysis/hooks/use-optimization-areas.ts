import { useState, useCallback, useEffect } from 'react'
import { api } from '~/trpc/react'

type UseOptimizationAreasOptions = {
  clientId?: string;
  requestId?: string;
  limit?: number;
  showPartialOnTimeout?: boolean;
  enabled?: boolean;
}

export function useOptimizationAreas(options: UseOptimizationAreasOptions = {}) {
  const {
    clientId,
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
      clientId: clientId ?? requestId ?? lastRequestId ?? `user_${Date.now()}`,
      requestId: requestId ?? lastRequestId ?? `user_${Date.now()}`,
      limit,
      showPartialOnTimeout,
    },
    {
      enabled,
    }
  )

  useEffect(() => {
    if (data?.meta?.requestId && data.meta.requestId !== lastRequestId) {
      setLastRequestId(data.meta.requestId)
      setRequestTime(Date.now())
    }
  }, [data?.meta?.requestId, lastRequestId])

  const refetch = useCallback(async () => {
    await trpcRefetch()
  }, [trpcRefetch])

  return {
    data,
    isLoading,
    error,
    refetch,
    requestId: data?.meta.requestId,
    lastSyncRequestId: data?.meta.lastSyncRequestId,
    requestTime,
  }
}
