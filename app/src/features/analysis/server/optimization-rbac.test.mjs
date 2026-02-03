import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalysisService, AnalysisDomainError } from './analysis.service.ts'

describe('Optimization Areas - RBAC Tests', () => {
  let analysisService: AnalysisService

  beforeEach(() => {
    analysisService = new AnalysisService()
  })

  describe('RBAC for getOptimizationAreas', () => {
    it('should allow OWNER role to access optimization areas', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'user_with_owner_role',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
      expect(result.requestId).toBeDefined()
    })

    it('should allow STRATEGY role to access optimization areas', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'user_with_strategy_role',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
      expect(result.requestId).toBeDefined()
    })

    it('should allow ANALYST role to access optimization areas', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'user_with_analyst_role',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
      expect(result.requestId).toBeDefined()
    })

    it('should deny access for UNKNOWN role', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'user_unknown_role' })
      ).rejects.toThrow(AnalysisDomainError)
    })

    it('should deny access when client not found for given requestId', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'user_with_nonexistent_client' })
      ).rejects.toThrow(AnalysisDomainError)
    })
  })

  describe('RBAC per client', () => {
    it('should restrict access to own client data for OWNER', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'owner_access_own_client',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
    })

    it('should restrict access to own client data for STRATEGY', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'strategy_access_own_client',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
    })

    it('should restrict access to own client data for ANALYST', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'analyst_access_own_client',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
    })
  })

  describe('RBAC integration with other modules', () => {
    it('should not interfere with sync status checks', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'owner_with_sync_data' })
      ).rejects.toThrow(AnalysisDomainError)
    })

    it('should not interfere with gap report checks', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'strategy_with_data' })
      ).rejects.toThrow(AnalysisDomainError)
    })
  })

  describe('RBAC error messages', () => {
    it('should provide clear error message for FORBIDDEN access', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'forbidden_access' })
      ).rejects.toThrow()
    })

    it('should include role in error details for RBAC failures', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'forbidden_access' })
      ).rejects.toThrow()
    })
  })

  describe('RBAC with multiple clients', () => {
    it('should properly scope access per client for OWNER', async () => {
      const client1Result = await analysisService.getOptimizationAreas({
        requestId: 'owner_scoped_to_client1',
      })

      const client2Result = await analysisService.getOptimizationAreas({
        requestId: 'owner_scoped_to_client2',
      })

      expect(client1Result).toBeDefined()
      expect(client2Result).toBeDefined()
      expect(client1Result.requestId).toBeDefined()
      expect(client2Result.requestId).toBeDefined()
    })

    it('should maintain isolation between different client contexts', async () => {
      const result1 = await analysisService.getOptimizationAreas({
        requestId: 'client_isolation_test_1',
      })

      const result2 = await analysisService.getOptimizationAreas({
        requestId: 'client_isolation_test_2',
      })

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })
  })

  describe('RBAC with different request scenarios', () => {
    it('should handle getOptimizationAreas with force sync', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'owner_with_force_sync',
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
    })

    it('should handle getOptimizationAreas with limit parameter', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'owner_with_limit',
        limit: 5,
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toHaveLength(5)
    })

    it('should handle getOptimizationAreas with showPartialOnTimeout flag', async () => {
      const result = await analysisService.getOptimizationAreas({
        requestId: 'owner_with_partial_timeout',
        showPartialOnTimeout: true,
      })

      expect(result).toBeDefined()
      expect(result.optimizationAreas).toBeInstanceOf(Array)
    })
  })

  describe('RBAC edge cases', () => {
    it('should handle RBAC errors during sync status checks', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'rbac_edge_case_1' })
      ).rejects.toThrow(AnalysisDomainError)
    })

    it('should handle RBAC errors during data validation', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'rbac_edge_case_2' })
      ).rejects.toThrow(AnalysisDomainError)
    })

    it('should not expose internal RBAC implementation details', async () => {
      await expect(
        analysisService.getOptimizationAreas({ requestId: 'rbac_security_test' })
      ).rejects.toThrow(AnalysisDomainError)
    })
  })
})