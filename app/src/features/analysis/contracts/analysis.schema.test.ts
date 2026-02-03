import { describe, it, expect } from 'vitest';
import {
  optimizationAreaSchema,
  optimizationStatusSchema,
  expectedImpactSchema,
  priorityLevelSchema,
  confidenceLevelSchema,
  insightItemSchema,
  insightStatusSchema,
  insightActionabilitySchema,
  getContextInsightsSchema,
  emailStrategySchema,
  strategyGenerationStatusSchema,
  generateEmailStrategySchema,
  flowPlanSchema,
  flowPlanStatusSchema,
  generateFlowPlanSchema,
} from './analysis.schema';

describe('OptimizationArea Schema', () => {
  describe('optimizationStatusSchema', () => {
    it('should accept valid optimization statuses', () => {
      const statuses = ['OK', 'GAP', 'insufficient_data_for_priority', 'timed_out'];
      statuses.forEach((status) => {
        const result = optimizationStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(status);
        }
      });
    });

    it('should reject invalid optimization statuses', () => {
      const invalidStatuses = ['INVALID', 'UNKNOWN', ''];
      invalidStatuses.forEach((status) => {
        const result = optimizationStatusSchema.safeParse(status);
        expect(result.success).toBe(false);
      });
    });

    it('should have the correct enum values', () => {
      const enumValues = optimizationStatusSchema._def.values;
      expect(enumValues).toContain('OK');
      expect(enumValues).toContain('GAP');
      expect(enumValues).toContain('insufficient_data_for_priority');
      expect(enumValues).toContain('timed_out');
      expect(enumValues.length).toBe(4);
    });
  });

  describe('expectedImpactSchema', () => {
    it('should accept valid impact values (0-100)', () => {
      const validImpacts = [0, 25, 50, 75, 100];
      validImpacts.forEach((impact) => {
        const result = expectedImpactSchema.safeParse(impact);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(impact);
        }
      });
    });

    it('should reject negative impact values', () => {
      const result = expectedImpactSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject impact > 100', () => {
      const result = expectedImpactSchema.safeParse(101);
      expect(result.success).toBe(false);
    });

    it('should allow zero impact for minimal effects', () => {
      const result = expectedImpactSchema.safeParse(0);
      expect(result.success).toBe(true);
    });
  });

  describe('priorityLevelSchema', () => {
    it('should accept valid priority levels', () => {
      const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      priorities.forEach((priority) => {
        const result = priorityLevelSchema.safeParse(priority);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(priority);
        }
      });
    });

    it('should reject invalid priority levels', () => {
      const invalidPriorities = ['URGENT', 'IMPORTANT', ''];
      invalidPriorities.forEach((priority) => {
        const result = priorityLevelSchema.safeParse(priority);
        expect(result.success).toBe(false);
      });
    });

    it('should have the correct enum values', () => {
      const enumValues = priorityLevelSchema._def.values;
      expect(enumValues).toContain('CRITICAL');
      expect(enumValues).toContain('HIGH');
      expect(enumValues).toContain('MEDIUM');
      expect(enumValues).toContain('LOW');
      expect(enumValues.length).toBe(4);
    });
  });

  describe('confidenceLevelSchema', () => {
    it('should accept valid confidence values (0-100)', () => {
      const confidences = [0, 25, 50, 75, 100];
      confidences.forEach((confidence) => {
        const result = confidenceLevelSchema.safeParse(confidence);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(confidence);
        }
      });
    });

    it('should reject negative confidence values', () => {
      const result = confidenceLevelSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject confidence > 100', () => {
      const result = confidenceLevelSchema.safeParse(101);
      expect(result.success).toBe(false);
    });
  });

  describe('optimizationAreaSchema', () => {
    it('should accept a complete OptimizationArea object', () => {
      const optimizationArea = {
        name: 'Missing Email Sequence',
        category: 'FLOW',
        priority: 'CRITICAL',
        expectedImpact: 85,
        confidence: 90,
        source: 'klaviyo_flow_analysis',
        requestId: 'req_abc123',
        lastSyncRequestId: 'sync_xyz789',
        refreshWindow: 7, // days
        status: 'GAP',
      };

      const result = optimizationAreaSchema.safeParse(optimizationArea);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data;
        expect(data.name).toBe('Missing Email Sequence');
        expect(data.category).toBe('FLOW');
        expect(data.priority).toBe('CRITICAL');
        expect(data.expectedImpact).toBe(85);
        expect(data.confidence).toBe(90);
        expect(data.source).toBe('klaviyo_flow_analysis');
        expect(data.requestId).toBe('req_abc123');
        expect(data.lastSyncRequestId).toBe('sync_xyz789');
        expect(data.refreshWindow).toBe(7);
        expect(data.status).toBe('GAP');
      }
    });

    it('should reject missing required fields', () => {
      const invalidAreas = [
        { name: 'Test', category: 'FLOW' }, // missing priority
        { name: 'Test', priority: 'HIGH' }, // missing category
        { category: 'FLOW', priority: 'HIGH' }, // missing name
      ];

      invalidAreas.forEach((area) => {
        const result = optimizationAreaSchema.safeParse(area);
        expect(result.success).toBe(false);
      });
    });

    it('should allow optional refreshWindow field', () => {
      const areaWithWindow = {
        name: 'Test',
        category: 'FLOW',
        priority: 'HIGH',
        expectedImpact: 60,
        confidence: 75,
        source: 'test',
        requestId: 'req_test',
        lastSyncRequestId: 'sync_test',
        refreshWindow: 14, // optional but provided
        status: 'GAP',
      };

      const result = optimizationAreaSchema.safeParse(areaWithWindow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refreshWindow).toBe(14);
      }
    });

    it('should allow zero refreshWindow', () => {
      const areaWithZeroWindow = {
        name: 'Test',
        category: 'FLOW',
        priority: 'HIGH',
        expectedImpact: 60,
        confidence: 75,
        source: 'test',
        requestId: 'req_test',
        lastSyncRequestId: 'sync_test',
        refreshWindow: 0,
        status: 'GAP',
      };

      const result = optimizationAreaSchema.safeParse(areaWithZeroWindow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refreshWindow).toBe(0);
      }
    });

    it('should validate status against enum', () => {
      const areaWithInvalidStatus = {
        name: 'Test',
        category: 'FLOW',
        priority: 'HIGH',
        expectedImpact: 60,
        confidence: 75,
        source: 'test',
        requestId: 'req_test',
        lastSyncRequestId: 'sync_test',
        refreshWindow: 7,
        status: 'INVALID_STATUS', // invalid
      };

      const result = optimizationAreaSchema.safeParse(areaWithInvalidStatus);
      expect(result.success).toBe(false);
    });

    it('should validate priority against enum', () => {
      const areaWithInvalidPriority = {
        name: 'Test',
        category: 'FLOW',
        priority: 'INVALID_PRIORITY', // invalid
        expectedImpact: 60,
        confidence: 75,
        source: 'test',
        requestId: 'req_test',
        lastSyncRequestId: 'sync_test',
        refreshWindow: 7,
        status: 'GAP',
      };

      const result = optimizationAreaSchema.safeParse(areaWithInvalidPriority);
      expect(result.success).toBe(false);
    });

    it('should validate category against enum', () => {
      const areaWithInvalidCategory = {
        name: 'Test',
        category: 'INVALID_CATEGORY', // invalid
        priority: 'HIGH',
        expectedImpact: 60,
        confidence: 75,
        source: 'test',
        requestId: 'req_test',
        lastSyncRequestId: 'sync_test',
        refreshWindow: 7,
        status: 'GAP',
      };

      const result = optimizationAreaSchema.safeParse(areaWithInvalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('insight schemas', () => {
    it('should accept insight statuses and actionability values', () => {
      expect(insightStatusSchema.safeParse('ok').success).toBe(true);
      expect(insightStatusSchema.safeParse('draft_low_confidence').success).toBe(true);
      expect(insightStatusSchema.safeParse('source_conflict').success).toBe(true);
      expect(insightActionabilitySchema.safeParse('actionable').success).toBe(true);
      expect(insightActionabilitySchema.safeParse('needs_human_validation').success).toBe(true);
    });

    it('should parse valid InsightItem payload', () => {
      const result = insightItemSchema.safeParse({
        id: 'insight-1',
        title: 'Priorytet 1',
        rationale: 'Test rationale',
        dataSources: [
          {
            sourceType: 'optimization_ranking',
            observedAt: new Date('2026-02-01T12:00:00.000Z'),
          },
        ],
        recommendedAction: 'Wdroz automatyzacje',
        actionability: 'actionable',
        confidence: 80,
        status: 'ok',
        linkedClientGoals: ['Wzrost konwersji'],
        linkedClientPriorities: ['Priorytet Q1'],
        missingContext: [],
        requestId: 'req-1',
        lastSyncRequestId: 'sync-1',
      });

      expect(result.success).toBe(true);
    });

    it('should validate getContextInsights input contract', () => {
      const success = getContextInsightsSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        limit: 5,
      });
      const fail = getContextInsightsSchema.safeParse({
        clientId: 'not-a-cuid',
      });

      expect(success.success).toBe(true);
      expect(fail.success).toBe(false);
    });
  });

  describe('strategy and flow plan schemas', () => {
    it('should parse strategy generation statuses', () => {
      expect(strategyGenerationStatusSchema.safeParse('ok').success).toBe(true);
      expect(strategyGenerationStatusSchema.safeParse('in_progress_or_timeout').success).toBe(true);
      expect(strategyGenerationStatusSchema.safeParse('blocked_preconditions').success).toBe(true);
    });

    it('should parse valid email strategy payload', () => {
      const result = emailStrategySchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        goals: ['Wzrost konwersji'],
        segments: ['VIP'],
        tone: 'konkretny',
        priorities: ['Welcome'],
        kpis: ['conversion_rate'],
        requestId: 'req-strategy',
        lastSyncRequestId: 'sync-1',
        generatedAt: new Date('2026-02-04T12:00:00.000Z'),
        missingPreconditions: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateEmailStrategy input', () => {
      expect(generateEmailStrategySchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateEmailStrategySchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse flow plan statuses and payload', () => {
      expect(flowPlanStatusSchema.safeParse('ok').success).toBe(true);
      expect(flowPlanStatusSchema.safeParse('precondition_not_approved').success).toBe(true);
      expect(flowPlanStatusSchema.safeParse('failed_persist').success).toBe(true);

      const result = flowPlanSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        items: [
          {
            name: 'Flow 1',
            trigger: 'signup',
            objective: 'Wzrost konwersji',
            priority: 'CRITICAL',
            businessReason: 'Welcome sequence',
          },
        ],
        requestId: 'req-flow',
        strategyRequestId: 'req-strategy',
        generatedAt: new Date('2026-02-04T12:00:00.000Z'),
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateFlowPlan input', () => {
      expect(generateFlowPlanSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateFlowPlanSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });
  });
});
