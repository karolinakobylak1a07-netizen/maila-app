import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService, AnalysisDomainError } from './analysis.logic';
import { AnalysisRepository } from './analysis.repository';
import { KlaviyoAdapter } from '../../integrations/klaviyo/klaviyo-adapter';

describe('Optimization Areas Service', () => {
  let analysisService: AnalysisService;
  let mockRepository: Partial<AnalysisRepository>;
  let mockAdapter: Partial<KlaviyoAdapter>;

  beforeEach(() => {
    mockRepository = {
      findLatestSyncRun: vi.fn(),
      listInventory: vi.fn(),
      findMembership: vi.fn(),
      listRbacPoliciesByRole: vi.fn(),
      createAuditLog: vi.fn(),
    };
    mockAdapter = {
      fetchSegments: vi.fn(),
      fetchInventory: vi.fn(),
    };

    analysisService = new AnalysisService(
      mockRepository as AnalysisRepository,
      mockAdapter as KlaviyoAdapter,
    );
  });

  describe('getOptimizationAreas', () => {
    it('should throw validation error when no sync runs exist', async () => {
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(null);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('SYNC_REQUIRED_BEFORE_OPTIMIZATION');
    });

    it('should throw validation error when sync status is FAILED_AUTH', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'FAILED_AUTH' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
        errorCode: 'auth_failed',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('INVALID_SYNC_STATUS');
    });

    it('should throw validation error when sync status is IN_PROGRESS (default)', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'IN_PROGRESS' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('INVALID_SYNC_STATUS');
    });

    it('should throw validation error when sync status is PARTIAL_OR_TIMEOUT (default)', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'PARTIAL_OR_TIMEOUT' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('INVALID_SYNC_STATUS');
    });

    it('should allow showPartialOnTimeout=true for PARTIAL_OR_TIMEOUT sync', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'PARTIAL_OR_TIMEOUT' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }, true),
      ).resolves.toBeDefined();
    });

    it('should return empty areas when incomplete data is detected', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'PARTIAL_OR_TIMEOUT' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' });

      expect(result).toBeDefined();
      expect(result.meta.hasInsufficientData).toBe(true);
      expect(result.meta.dataIssue).toContain('niekompletne');
      expect(result.data.areas).toHaveLength(0);
    });

    it('should return optimization areas when sync is OK', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [
          { entityType: 'FLOW', externalId: 'flow1', name: 'Welcome Flow', itemStatus: 'active', lastSyncAt: new Date() },
          { entityType: 'FLOW', externalId: 'flow2', name: 'Abandoned Cart', itemStatus: 'active', lastSyncAt: new Date() },
          { entityType: 'FLOW', externalId: 'flow3', name: 'Inactive Flow', itemStatus: 'disabled', lastSyncAt: new Date() },
        ],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue(syncRun.items);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' });

      expect(result).toBeDefined();
      expect(result.meta.hasInsufficientData).toBe(false);
      expect(result.data.areas).toHaveLengthGreaterThan(0);
      expect(result.data.areas[0].requestId).toBeDefined();
      expect(result.data.areas[0].lastSyncRequestId).toBeDefined();
    });

    it('should throw validation error when membership not found', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue(null);
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('forbidden');
    });

    it('should throw validation error when module cannot view', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const policy = { module: 'AUDIT', canView: false, canEdit: false };
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([policy]);

      await expect(
        analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' }),
      ).rejects.toThrow(AnalysisDomainError);
      await expect(analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' })).rejects.toThrow('rbac_module_view_forbidden');
    });
  });

  describe('Priority scoring', () => {
    it('should prioritize FLOW gaps over SEGMENT gaps', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [
          { entityType: 'SEGMENT', externalId: 'seg1', name: 'Segment A', itemStatus: 'active', lastSyncAt: new Date() },
        ],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue(syncRun.items);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' });

      expect(result).toBeDefined();
      expect(result.data.areas).toHaveLength(1);
      expect(result.data.areas[0].category).toBe('SEGMENT');
    });

    it('should set priority levels correctly based on score', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' });

      expect(result).toBeDefined();
      result.data.areas.forEach((area) => {
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(area.priority);
      });
    });

    it('should set expectedImpact between 0 and 100', async () => {
      const syncRun = {
        id: 'run1',
        clientId: 'client1',
        status: 'OK' as const,
        trigger: 'MANUAL',
        finishedAt: new Date(),
        items: [],
        requestId: 'req_123',
      };
      mockRepository.findLatestSyncRun = vi.fn().mockResolvedValue(syncRun);
      mockRepository.listInventory = vi.fn().mockResolvedValue([]);
      mockRepository.findMembership = vi.fn().mockResolvedValue({ role: 'OWNER' });
      mockRepository.listRbacPoliciesByRole = vi.fn().mockResolvedValue([]);

      const result = await analysisService.getOptimizationAreas('user1', 'OWNER', { clientId: 'client1' });

      expect(result).toBeDefined();
      result.data.areas.forEach((area) => {
        expect(area.expectedImpact).toBeGreaterThanOrEqual(0);
        expect(area.expectedImpact).toBeLessThanOrEqual(100);
      });
    });
  });
});
