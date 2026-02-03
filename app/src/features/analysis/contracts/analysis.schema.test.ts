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
  versionedArtifactTypeSchema,
  artifactVersionMetaSchema,
  generateEmailStrategySchema,
  flowPlanSchema,
  flowPlanStatusSchema,
  generateFlowPlanSchema,
  campaignCalendarSchema,
  campaignCalendarStatusSchema,
  generateCampaignCalendarSchema,
  segmentProposalSchema,
  segmentProposalStatusSchema,
  generateSegmentProposalSchema,
  communicationBriefSchema,
  communicationBriefStatusSchema,
  generateCommunicationBriefSchema,
  emailDraftSchema,
  emailDraftStatusSchema,
  generateEmailDraftSchema,
  smsCommunicationStyleSchema,
  smsCampaignDraftStatusSchema,
  smsCampaignDraftSchema,
  generateSmsCampaignDraftSchema,
  getSmsCampaignDraftHistorySchema,
  personalizedEmailDraftSchema,
  personalizedDraftStatusSchema,
  generatePersonalizedEmailDraftSchema,
  implementationChecklistStepStatusSchema,
  implementationChecklistStatusSchema,
  implementationChecklistSchema,
  generateImplementationChecklistSchema,
  updateImplementationChecklistStepSchema,
  implementationAlertsSchema,
  implementationAlertsStatusSchema,
  implementationAlertProgressStateSchema,
  getImplementationAlertsSchema,
  implementationReportSchema,
  implementationReportStatusSchema,
  getImplementationReportSchema,
  implementationDocumentationSchema,
  getImplementationDocumentationSchema,
  implementationDocumentationExportTargetSchema,
  implementationDocumentationExportSchema,
  exportImplementationDocumentationSchema,
  auditProductContextSchema,
  auditProductContextStatusSchema,
  getAuditProductContextSchema,
  productCoverageItemStatusSchema,
  productCoverageAnalysisStatusSchema,
  productCoverageAnalysisSchema,
  getProductCoverageAnalysisSchema,
  communicationImprovementRecommendationStatusSchema,
  communicationImprovementRecommendationItemSchema,
  communicationImprovementRecommendationsSchema,
  getCommunicationImprovementRecommendationsSchema,
  campaignEffectivenessStatusSchema,
  campaignEffectivenessAnalysisSchema,
  getCampaignEffectivenessAnalysisSchema,
  strategyKPIAnalysisStatusSchema,
  strategyKPIAnalysisSchema,
  getStrategyKPIAnalysisSchema,
  updateStrategyRecommendationsSchema,
  updateStrategyRecommendationsResultSchema,
  updateStrategyRecommendationsResultStatusSchema,
  aiAchievementsReportStatusSchema,
  aiAchievementsReportDataSchema,
  getAIAchievementsReportResponseSchema,
  getAIAchievementsReportSchema,
  artifactFeedbackTargetTypeSchema,
  artifactFeedbackSchema,
  submitArtifactFeedbackSchema,
} from './analysis.schema';

const versionMeta = {
  timestamp: new Date('2026-02-04T12:00:00.000Z'),
  author: 'user-1',
  source: 'test.source',
  type: 'strategy' as const,
};

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

    it('should parse version metadata schema', () => {
      expect(versionedArtifactTypeSchema.safeParse('strategy').success).toBe(true);
      expect(versionedArtifactTypeSchema.safeParse('flow').success).toBe(true);
      expect(versionedArtifactTypeSchema.safeParse('plan').success).toBe(true);
      expect(artifactVersionMetaSchema.safeParse(versionMeta).success).toBe(true);
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
        versionMeta,
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
        versionMeta: { ...versionMeta, type: 'flow' },
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateFlowPlan input', () => {
      expect(generateFlowPlanSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateFlowPlanSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse campaign calendar statuses and payload', () => {
      expect(campaignCalendarStatusSchema.safeParse('ok').success).toBe(true);
      expect(campaignCalendarStatusSchema.safeParse('seasonality_missing').success).toBe(true);

      const result = campaignCalendarSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        items: [
          { weekNumber: 1, campaignType: 'NEWSLETTER', goal: 'Wzrost', segment: 'VIP', title: 'W1' },
          { weekNumber: 2, campaignType: 'PROMO', goal: 'Wzrost', segment: 'VIP', title: 'W2' },
          { weekNumber: 3, campaignType: 'LIFECYCLE', goal: 'Wzrost', segment: 'VIP', title: 'W3' },
          { weekNumber: 4, campaignType: 'EDUCATIONAL', goal: 'Wzrost', segment: 'VIP', title: 'W4' },
        ],
        requestId: 'req-calendar',
        strategyRequestId: 'req-strategy',
        generatedAt: new Date('2026-02-05T12:00:00.000Z'),
        versionMeta: { ...versionMeta, type: 'plan' },
        requiresManualValidation: false,
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateCampaignCalendar input', () => {
      expect(generateCampaignCalendarSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateCampaignCalendarSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse segment proposal statuses and payload', () => {
      expect(segmentProposalStatusSchema.safeParse('ok').success).toBe(true);
      expect(segmentProposalStatusSchema.safeParse('requires_data_refresh').success).toBe(true);
      expect(segmentProposalStatusSchema.safeParse('failed_persist').success).toBe(true);

      const result = segmentProposalSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        segments: [
          {
            name: 'VIP',
            entryCriteria: ['Zakup >= 2x', 'AOV >= 200'],
            objective: 'Zwieksszyc retencje',
            campaignUseCase: 'Kampanie premium',
            flowUseCase: 'Winback VIP',
          },
        ],
        requestId: 'req-segment',
        strategyRequestId: 'req-strategy',
        generatedAt: new Date('2026-02-06T12:00:00.000Z'),
        versionMeta: { ...versionMeta, type: 'plan' },
        missingData: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateSegmentProposal input', () => {
      expect(generateSegmentProposalSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateSegmentProposalSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse communication brief statuses and payload', () => {
      expect(communicationBriefStatusSchema.safeParse('ok').success).toBe(true);
      expect(communicationBriefStatusSchema.safeParse('missing_required_fields').success).toBe(true);

      const result = communicationBriefSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        campaignGoal: 'Zwieksszyc konwersje',
        segment: 'VIP',
        tone: 'konkretny',
        priority: 'Welcome',
        kpi: 'conversion_rate',
        requestId: 'req-brief',
        strategyRequestId: 'req-strategy',
        generatedAt: new Date('2026-02-07T12:00:00.000Z'),
        versionMeta: { ...versionMeta, type: 'plan' },
        missingFields: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateCommunicationBrief input', () => {
      expect(generateCommunicationBriefSchema.safeParse({ clientId: 'cm0000000000000000000000', campaignGoal: 'Goal', segment: 'VIP' }).success).toBe(true);
      expect(generateCommunicationBriefSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse email draft statuses and payload', () => {
      expect(emailDraftStatusSchema.safeParse('ok').success).toBe(true);
      expect(emailDraftStatusSchema.safeParse('timed_out').success).toBe(true);
      expect(emailDraftStatusSchema.safeParse('failed_generation').success).toBe(true);

      const result = emailDraftSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        campaignGoal: 'Zwieksszyc konwersje',
        segment: 'VIP',
        subject: 'Temat',
        preheader: 'Preheader',
        body: 'Body',
        cta: 'Kup teraz',
        requestId: 'req-draft',
        briefRequestId: 'req-brief',
        generatedAt: new Date('2026-02-08T12:00:00.000Z'),
        versionMeta: { ...versionMeta, type: 'plan' },
        retryable: false,
      });
      expect(result.success).toBe(true);
    });

    it('should validate generateEmailDraft input', () => {
      expect(generateEmailDraftSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generateEmailDraftSchema.safeParse({ clientId: 'cm0000000000000000000000', manualAccept: true }).success).toBe(true);
      expect(generateEmailDraftSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse sms campaign draft payload and validate length/status', () => {
      expect(smsCommunicationStyleSchema.safeParse('promotion').success).toBe(true);
      expect(smsCampaignDraftStatusSchema.safeParse('ok').success).toBe(true);
      expect(smsCampaignDraftStatusSchema.safeParse('too_long').success).toBe(true);

      const result = smsCampaignDraftSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        campaignId: 'campaign-1',
        userId: 'user-1',
        requestId: 'req-sms-1',
        createdAt: new Date('2026-02-14T09:00:00.000Z'),
        style: 'announcement',
        timing: '9:00',
        cta: 'Dowiedz sie wiecej',
        message: 'Nowosc! Sprawdz nasza nowa oferte.',
        length: 35,
        status: 'ok',
      });

      expect(result.success).toBe(true);
    });

    it('should validate generateSmsCampaignDraft input', () => {
      const success = generateSmsCampaignDraftSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        campaignId: 'campaign-1',
        campaignContext: 'Nowa kolekcja',
        goals: ['wzrost sprzedazy'],
        tone: 'dynamiczny',
        timingPreferences: '9:00',
        style: 'promotion',
      });
      const fail = generateSmsCampaignDraftSchema.safeParse({
        clientId: 'invalid',
        campaignId: '',
        campaignContext: '',
        goals: [],
        tone: '',
        timingPreferences: '',
        style: 'promotion',
      });

      expect(success.success).toBe(true);
      expect(fail.success).toBe(false);
    });

    it('should validate getSmsCampaignDraftHistory input', () => {
      expect(
        getSmsCampaignDraftHistorySchema.safeParse({
          clientId: 'cm0000000000000000000000',
          campaignId: 'campaign-1',
        }).success,
      ).toBe(true);

      expect(
        getSmsCampaignDraftHistorySchema.safeParse({
          clientId: 'invalid',
          campaignId: '',
        }).success,
      ).toBe(false);
    });

    it('should parse personalized draft statuses and payload', () => {
      expect(personalizedDraftStatusSchema.safeParse('ok').success).toBe(true);
      expect(personalizedDraftStatusSchema.safeParse('segment_data_missing').success).toBe(true);
      expect(personalizedDraftStatusSchema.safeParse('failed_generation').success).toBe(true);

      const result = personalizedEmailDraftSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 1,
        status: 'ok',
        campaignGoal: 'Zwieksszyc konwersje',
        baseDraftRequestId: 'req-base',
        requestId: 'req-personalized',
        generatedAt: new Date('2026-02-09T12:00:00.000Z'),
        versionMeta: { ...versionMeta, type: 'plan' },
        variants: [
          {
            segment: 'VIP',
            subject: 'Temat VIP',
            preheader: 'Preheader VIP',
            body: 'Body VIP',
            cta: 'Kup teraz VIP',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate generatePersonalizedEmailDraft input', () => {
      expect(generatePersonalizedEmailDraftSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(generatePersonalizedEmailDraftSchema.safeParse({ clientId: 'cm0000000000000000000000', manualAccept: true }).success).toBe(true);
      expect(generatePersonalizedEmailDraftSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse implementation checklist statuses and payload', () => {
      expect(implementationChecklistStepStatusSchema.safeParse('pending').success).toBe(true);
      expect(implementationChecklistStepStatusSchema.safeParse('in_progress').success).toBe(true);
      expect(implementationChecklistStepStatusSchema.safeParse('done').success).toBe(true);
      expect(implementationChecklistStatusSchema.safeParse('ok').success).toBe(true);
      expect(implementationChecklistStatusSchema.safeParse('conflict_requires_refresh').success).toBe(true);
      expect(implementationChecklistStatusSchema.safeParse('transaction_error').success).toBe(true);

      const result = implementationChecklistSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        version: 2,
        status: 'ok',
        requestId: 'req-checklist',
        generatedAt: new Date('2026-02-10T12:00:00.000Z'),
        updatedAt: new Date('2026-02-10T12:10:00.000Z'),
        totalSteps: 3,
        completedSteps: 1,
        progressPercent: 33,
        steps: [
          {
            id: 'step-1',
            title: 'Wdrozyc flow welcome',
            sourceType: 'flow',
            sourceRef: 'Welcome',
            status: 'done',
            completedAt: new Date('2026-02-10T12:10:00.000Z'),
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate implementation checklist mutations input', () => {
      expect(generateImplementationChecklistSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(updateImplementationChecklistStepSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        stepId: 'step-1',
        status: 'done',
        expectedVersion: 1,
      }).success).toBe(true);
      expect(updateImplementationChecklistStepSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        stepId: '',
        status: 'done',
        expectedVersion: 0,
      }).success).toBe(false);
    });

    it('should parse implementation alerts payload and statuses', () => {
      expect(implementationAlertsStatusSchema.safeParse('ok').success).toBe(true);
      expect(implementationAlertsStatusSchema.safeParse('blocked').success).toBe(true);
      expect(implementationAlertsStatusSchema.safeParse('needs_configuration').success).toBe(true);
      expect(implementationAlertsStatusSchema.safeParse('at_risk').success).toBe(true);
      expect(implementationAlertProgressStateSchema.safeParse('blocked').success).toBe(true);
      expect(implementationAlertProgressStateSchema.safeParse('at_risk').success).toBe(true);
      expect(implementationAlertProgressStateSchema.safeParse('on_track').success).toBe(true);

      const result = implementationAlertsSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        status: 'blocked',
        requestId: 'req-alerts',
        generatedAt: new Date('2026-02-11T12:00:00.000Z'),
        blockerCount: 1,
        configGapCount: 1,
        alerts: [
          {
            id: 'alert-1',
            type: 'blocker',
            severity: 'critical',
            priority: 'CRITICAL',
            impactScore: 95,
            progressState: 'blocked',
            progressPercent: 20,
            title: 'Brak sync',
            description: 'Uruchom sync',
            source: 'sync',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate getImplementationAlerts input', () => {
      expect(getImplementationAlertsSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getImplementationAlertsSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse implementation report markdown payload', () => {
      expect(implementationReportStatusSchema.safeParse('ok').success).toBe(true);
      expect(implementationReportStatusSchema.safeParse('blocked').success).toBe(true);
      expect(implementationReportStatusSchema.safeParse('needs_configuration').success).toBe(true);
      expect(implementationReportStatusSchema.safeParse('at_risk').success).toBe(true);

      const result = implementationReportSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'req-report',
        generatedAt: new Date('2026-02-12T12:00:00.000Z'),
        status: 'at_risk',
        markdown: '# Raport wdrozeniowy\n\n## meta\n- status: at_risk',
      });
      expect(result.success).toBe(true);
    });

    it('should validate getImplementationReport input', () => {
      expect(getImplementationReportSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getImplementationReportSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse implementation documentation payload', () => {
      const result = implementationDocumentationSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'req-doc',
        generatedAt: new Date('2026-02-20T12:00:00.000Z'),
        markdown: '# Dokumentacja wdrozeniowa',
      });
      expect(result.success).toBe(true);
    });

    it('should validate getImplementationDocumentation input', () => {
      expect(getImplementationDocumentationSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getImplementationDocumentationSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse implementation documentation export payload', () => {
      expect(implementationDocumentationExportTargetSchema.safeParse('notion').success).toBe(true);
      expect(implementationDocumentationExportTargetSchema.safeParse('google_docs').success).toBe(true);

      const result = implementationDocumentationExportSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'req-export',
        target: 'notion',
        documentUrl: 'https://www.notion.so/doc-123',
        fallbackUsed: false,
      });
      expect(result.success).toBe(true);
    });

    it('should validate exportImplementationDocumentation input', () => {
      expect(exportImplementationDocumentationSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        target: 'notion',
      }).success).toBe(true);
      expect(exportImplementationDocumentationSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        target: 'google_docs',
      }).success).toBe(true);
      expect(exportImplementationDocumentationSchema.safeParse({
        clientId: 'invalid',
        target: 'notion',
      }).success).toBe(false);
    });

    it('should parse audit product context payload', () => {
      expect(auditProductContextStatusSchema.safeParse('ok').success).toBe(true);
      expect(auditProductContextStatusSchema.safeParse('missing_context').success).toBe(true);

      const result = auditProductContextSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        status: 'ok',
        requestId: 'req-audit-context',
        generatedAt: new Date('2026-02-14T12:00:00.000Z'),
        offer: 'Subskrypcja premium',
        targetAudience: 'SMB ecommerce',
        mainProducts: ['Pakiet Pro'],
        currentFlows: ['Welcome'],
        goals: ['Wzrost konwersji'],
        segments: ['VIP'],
        missingFields: [],
      });
      expect(result.success).toBe(true);
    });

    it('should validate getAuditProductContext input', () => {
      expect(getAuditProductContextSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getAuditProductContextSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse product coverage analysis payload', () => {
      expect(productCoverageItemStatusSchema.safeParse('covered').success).toBe(true);
      expect(productCoverageItemStatusSchema.safeParse('partial').success).toBe(true);
      expect(productCoverageItemStatusSchema.safeParse('missing').success).toBe(true);
      expect(productCoverageAnalysisStatusSchema.safeParse('ok').success).toBe(true);
      expect(productCoverageAnalysisStatusSchema.safeParse('partial').success).toBe(true);
      expect(productCoverageAnalysisStatusSchema.safeParse('missing_context').success).toBe(true);

      const result = productCoverageAnalysisSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        status: 'partial',
        requestId: 'req-coverage',
        generatedAt: new Date('2026-02-15T12:00:00.000Z'),
        items: [
          {
            productName: 'Pakiet Pro',
            flowMatches: ['Flow 1'],
            campaignMatches: [],
            coverageScore: 60,
            status: 'partial',
          },
        ],
        missingFlows: ['Pakiet Lite'],
        missingCampaigns: ['Pakiet Pro'],
      });
      expect(result.success).toBe(true);
    });

    it('should validate getProductCoverageAnalysis input', () => {
      expect(getProductCoverageAnalysisSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getProductCoverageAnalysisSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse communication improvement recommendations payload', () => {
      expect(communicationImprovementRecommendationStatusSchema.safeParse('ok').success).toBe(true);
      expect(communicationImprovementRecommendationStatusSchema.safeParse('missing_context').success).toBe(true);

      const item = communicationImprovementRecommendationItemSchema.safeParse({
        id: 'recommendation-1',
        productName: 'Pakiet Pro',
        title: 'Uzupelnij flow lifecycle',
        description: 'Produkt ma braki pokrycia w flow i kampaniach.',
        priority: 'CRITICAL',
        impactScore: 95,
        status: 'missing',
        action: 'Dodaj flow welcome i kampanie edukacyjna.',
      });
      expect(item.success).toBe(true);

      const result = communicationImprovementRecommendationsSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        status: 'ok',
        requestId: 'req-recommendations',
        generatedAt: new Date('2026-02-16T13:00:00.000Z'),
        items: [
          {
            id: 'recommendation-1',
            productName: 'Pakiet Pro',
            title: 'Uzupelnij flow lifecycle',
            description: 'Produkt ma braki pokrycia w flow i kampaniach.',
            priority: 'CRITICAL',
            impactScore: 95,
            status: 'missing',
            action: 'Dodaj flow welcome i kampanie edukacyjna.',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate getCommunicationImprovementRecommendations input', () => {
      expect(getCommunicationImprovementRecommendationsSchema.safeParse({ clientId: 'cm0000000000000000000000' }).success).toBe(true);
      expect(getCommunicationImprovementRecommendationsSchema.safeParse({ clientId: 'cm0000000000000000000000', manualAccept: true }).success).toBe(true);
      expect(getCommunicationImprovementRecommendationsSchema.safeParse({ clientId: 'invalid' }).success).toBe(false);
    });

    it('should parse artifact feedback payload and input', () => {
      expect(artifactFeedbackTargetTypeSchema.safeParse('recommendation').success).toBe(true);
      expect(artifactFeedbackTargetTypeSchema.safeParse('draft').success).toBe(true);

      const payloadResult = artifactFeedbackSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        targetType: 'recommendation',
        artifactId: 'recommendation-1',
        sourceRequestId: 'req-recommendations',
        userId: 'u1',
        rating: 5,
        comment: 'Bardzo trafna rekomendacja',
        timestamp: new Date('2026-02-20T10:00:00.000Z'),
        requestId: 'feedback-1',
        status: 'saved',
      });
      expect(payloadResult.success).toBe(true);

      const inputResult = submitArtifactFeedbackSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        targetType: 'draft',
        artifactId: 'draft-1',
        sourceRequestId: 'draft-1',
        rating: 4,
        comment: 'Przydatny, ale wymaga drobnych zmian',
      });
      expect(inputResult.success).toBe(true);

      expect(
        submitArtifactFeedbackSchema.safeParse({
          clientId: 'cm0000000000000000000000',
          targetType: 'draft',
          artifactId: 'draft-1',
          rating: 0,
          comment: 'invalid',
        }).success,
      ).toBe(false);
    });

    it('should parse campaign effectiveness analysis payload and input', () => {
      expect(campaignEffectivenessStatusSchema.safeParse('successful').success).toBe(true);
      expect(campaignEffectivenessStatusSchema.safeParse('needs_improvement').success).toBe(true);
      expect(campaignEffectivenessStatusSchema.safeParse('insufficient_data').success).toBe(true);

      const payloadResult = campaignEffectivenessAnalysisSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'campaign-effectiveness-1',
        generatedAt: new Date('2026-02-21T10:00:00.000Z'),
        rangeStart: new Date('2026-02-01T00:00:00.000Z'),
        rangeEnd: new Date('2026-02-21T23:59:59.000Z'),
        status: 'successful',
        performance: {
          campaignCount: 4,
          openRate: 46.2,
          clickRate: 12.1,
          revenue: 1200,
          conversions: 32,
        },
        feedback: {
          feedbackCount: 6,
          recommendationFeedbackCount: 3,
          draftFeedbackCount: 3,
          averageRating: 4.3,
        },
        scores: {
          performanceScore: 74.2,
          feedbackScore: 86,
          blendedScore: 77.74,
        },
        insights: ['Topline blended score: 77.74.'],
      });
      expect(payloadResult.success).toBe(true);

      expect(
        getCampaignEffectivenessAnalysisSchema.safeParse({
          clientId: 'cm0000000000000000000000',
          rangeStart: '2026-02-01T00:00:00.000Z',
          rangeEnd: '2026-02-21T23:59:59.000Z',
        }).success,
      ).toBe(true);
    });

    it('should parse strategy KPI analysis payload and input', () => {
      expect(strategyKPIAnalysisStatusSchema.safeParse('ok').success).toBe(true);
      expect(strategyKPIAnalysisStatusSchema.safeParse('low_engagement').success).toBe(true);
      expect(strategyKPIAnalysisStatusSchema.safeParse('missing_data').success).toBe(true);

      const payloadResult = strategyKPIAnalysisSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'strategy-kpi-1',
        generatedAt: new Date('2026-02-22T10:00:00.000Z'),
        rangeStart: new Date('2026-02-01T00:00:00.000Z'),
        rangeEnd: new Date('2026-02-22T23:59:59.000Z'),
        status: 'ok',
        overall: {
          campaignCount: 5,
          openRate: 52.3,
          clickRate: 15.2,
          cvr: 4.1,
          revenuePerRecipient: 2.4,
          avgTimeToOpen: 41,
        },
        segmentSummaries: [
          {
            segmentId: 'vip',
            segmentName: 'VIP',
            metrics: {
              openRate: 58,
              clickRate: 19,
              cvr: 5.2,
              revenuePerRecipient: 3.1,
              avgTimeToOpen: 34,
            },
            campaignCount: 2,
          },
        ],
        recommendationSummaries: [
          {
            recommendationId: 'rec-1',
            recommendationTitle: 'Wzmocnij onboarding VIP',
            metrics: {
              openRate: 55,
              clickRate: 16,
              cvr: 4.5,
              revenuePerRecipient: 2.8,
              avgTimeToOpen: 38,
            },
            campaignCount: 2,
          },
        ],
        topPerformers: {
          segmentId: 'vip',
          recommendationId: 'rec-1',
        },
      });
      expect(payloadResult.success).toBe(true);

      expect(
        getStrategyKPIAnalysisSchema.safeParse({
          clientId: 'cm0000000000000000000000',
          rangeStart: '2026-02-01T00:00:00.000Z',
          rangeEnd: '2026-02-22T23:59:59.000Z',
        }).success,
      ).toBe(true);
    });

    it('should parse strategy recommendation update payload and input', () => {
      expect(updateStrategyRecommendationsResultStatusSchema.safeParse('updated').success).toBe(true);
      expect(updateStrategyRecommendationsResultStatusSchema.safeParse('no_change').success).toBe(true);

      const payloadResult = updateStrategyRecommendationsResultSchema.safeParse({
        clientId: 'cm0000000000000000000000',
        requestId: 'strategy-recommendation-update-1',
        generatedAt: new Date('2026-02-24T10:00:00.000Z'),
        status: 'updated',
        blendedScore: 88,
        performanceScore: 44,
        feedbackScore: 44,
        previousVersion: 2,
        currentVersion: 3,
        deprecatedRecommendationIds: ['rec-1', 'rec-2'],
        activeRecommendations: [
          {
            id: 'rec-1-v3',
            previousId: 'rec-1',
            version: 3,
            title: 'Nowa rekomendacja',
            description: 'Ulepszona wersja',
            priority: 'HIGH',
            impactScore: 82,
            action: 'Zmien CTA i headline',
            status: 'active',
            manualAccept: false,
          },
        ],
      });
      expect(payloadResult.success).toBe(true);

      expect(
        updateStrategyRecommendationsSchema.safeParse({
          clientId: 'cm0000000000000000000000',
          threshold: 120,
        }).success,
      ).toBe(true);
    });

    it('should parse AI achievements report payload and input', () => {
      expect(aiAchievementsReportStatusSchema.safeParse('ok').success).toBe(true);
      expect(aiAchievementsReportStatusSchema.safeParse('insufficient_data').success).toBe(true);

      const dataResult = aiAchievementsReportDataSchema.safeParse({
        campaignsAnalyzed: 12,
        recommendationsUpdated: 4,
        avgPerformanceScore: 71.2,
        avgFeedbackScore: 78.5,
        insights: ['Najlepiej dzialaly rekomendacje z CTA o wysokiej jasnosci przekazu.'],
      });
      expect(dataResult.success).toBe(true);

      const responseResult = getAIAchievementsReportResponseSchema.safeParse({
        reportData: {
          campaignsAnalyzed: 12,
          recommendationsUpdated: 4,
          avgPerformanceScore: 71.2,
          avgFeedbackScore: 78.5,
          insights: ['Najlepiej dzialaly rekomendacje z CTA o wysokiej jasnosci przekazu.'],
        },
        status: 'ok',
        exportLinks: {
          pdf: 'https://reports.ai/test.pdf',
          notion: 'https://www.notion.so/test',
        },
      });
      expect(responseResult.success).toBe(true);

      expect(
        getAIAchievementsReportSchema.safeParse({
          clientId: 'cm0000000000000000000000',
          rangeStart: '2026-02-01T00:00:00.000Z',
          rangeEnd: '2026-02-28T23:59:59.000Z',
        }).success,
      ).toBe(true);
    });
  });
});
