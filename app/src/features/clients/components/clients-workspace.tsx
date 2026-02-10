"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  DEFAULT_CLIENTS_PATH,
  type UserRole,
  type RbacModule,
  type DiscoveryQuestionKey,
} from "~/features/clients/contracts/clients.schema";
import {
  buildCreateDecisionPayload,
  buildVisibleModules,
  canEditModule,
  buildDiscoveryDraftPayload,
  buildDiscoveryIncompleteMessage,
  createEmptyDiscoveryAnswers,
  evaluateDiscoveryCompleteness,
  mergeDiscoveryAnswers,
  resolveDiscoveryAnswersFromServer,
  resolveRestoredClientsPath,
  scheduleLastViewPersistence,
  resolveModulePolicy,
  withRequestId,
} from "~/features/clients/components/clients-workspace.logic";
import { ClientsWorkspaceView } from "~/features/clients/components/clients-workspace.view";
import { SyncStatusCard } from "~/features/analysis/components/sync-status";
import { GapListCard } from "~/features/analysis/components/gap-list";
import { OptimizationPrioritiesList } from "~/features/analysis/components/optimization-priorities-list";
import { ContextInsightsList } from "~/features/analysis/components/context-insights-list";
import { FlowPlanCard } from "~/features/analysis/components/flow-plan-card";
import { CampaignCalendarCard } from "~/features/analysis/components/campaign-calendar-card";
import { SegmentProposalCard } from "~/features/analysis/components/segment-proposal-card";
import { CommunicationBriefCard } from "~/features/analysis/components/communication-brief-card";
import { EmailDraftCard } from "~/features/analysis/components/email-draft-card";
import { SmsCampaignDraftCard } from "~/features/analysis/components/sms-campaign-draft-card";
import { PersonalizedEmailDraftCard } from "~/features/analysis/components/personalized-email-draft-card";
import { ImplementationChecklistCard } from "~/features/analysis/components/implementation-checklist-card";
import { ImplementationAlertsCard } from "~/features/analysis/components/implementation-alerts-card";
import { AuditProductContextCard } from "~/features/analysis/components/audit-product-context-card";
import { ProductCoverageAnalysisCard } from "~/features/analysis/components/product-coverage-analysis-card";
import { CommunicationImprovementRecommendationsCard } from "~/features/analysis/components/communication-improvement-recommendations-card";
import { CampaignEffectivenessAnalysisCard } from "~/features/analysis/components/campaign-effectiveness-analysis-card";
import { StrategyKPIAnalysisCard } from "~/features/analysis/components/strategy-kpi-analysis-card";
import { AIAchievementsReportCard } from "~/features/analysis/components/ai-achievements-report-card";
import { api } from "~/trpc/react";

const extractErrorDetails = (error: unknown) => {
  if (typeof error !== "object" || !error) {
    return null;
  }

  const maybeData = error as {
    data?: { cause?: { details?: Record<string, unknown> } };
    shape?: { data?: { cause?: { details?: Record<string, unknown> } } };
  };

  return maybeData.data?.cause?.details ?? maybeData.shape?.data?.cause?.details ?? null;
};

const extractRequestId = (error: unknown) => {
  if (typeof error !== "object" || !error) {
    return null;
  }

  const maybeData = error as {
    data?: { requestId?: unknown };
    shape?: { data?: { requestId?: unknown } };
  };
  const requestId = maybeData.data?.requestId ?? maybeData.shape?.data?.requestId;

  return typeof requestId === "string" ? requestId : null;
};

type SyncHealth = "ok" | "warning" | "fail" | "unknown";

type ClientSyncSummary = {
  status: SyncHealth;
  statusLabel: string;
  checkedAt: string | null;
};

export function ClientsWorkspace() {
  const router = useRouter();
  const pathname = usePathname() ?? DEFAULT_CLIENTS_PATH;

  const [name, setName] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [decisionContent, setDecisionContent] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [discoveryAnswers, setDiscoveryAnswers] = useState(createEmptyDiscoveryAnswers());
  const [discoveryDirty, setDiscoveryDirty] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoverySuccess, setDiscoverySuccess] = useState<string | null>(null);
  const [policyRole, setPolicyRole] = useState<UserRole>("OWNER");
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [rbacSuccess, setRbacSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [clientSyncSummaries, setClientSyncSummaries] = useState<
    Record<string, ClientSyncSummary>
  >({});
  const [clientSyncSummariesLoading, setClientSyncSummariesLoading] = useState(true);
  const [gapError, setGapError] = useState<string | null>(null);
  const [gapForbidden, setGapForbidden] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [contextInsightsError, setContextInsightsError] = useState<string | null>(null);
  const [contextInsightsLoading, setContextInsightsLoading] = useState(false);
  const [flowPlanError, setFlowPlanError] = useState<string | null>(null);
  const [flowPlanLoading, setFlowPlanLoading] = useState(false);
  const [campaignCalendarError, setCampaignCalendarError] = useState<string | null>(null);
  const [campaignCalendarLoading, setCampaignCalendarLoading] = useState(false);
  const [segmentProposalError, setSegmentProposalError] = useState<string | null>(null);
  const [segmentProposalLoading, setSegmentProposalLoading] = useState(false);
  const [communicationBriefError, setCommunicationBriefError] = useState<string | null>(null);
  const [communicationBriefLoading, setCommunicationBriefLoading] = useState(false);
  const [emailDraftError, setEmailDraftError] = useState<string | null>(null);
  const [emailDraftLoading, setEmailDraftLoading] = useState(false);
  const [smsDraftError, setSmsDraftError] = useState<string | null>(null);
  const [smsDraftLoading, setSmsDraftLoading] = useState(false);
  const [smsDraftApproveLoading, setSmsDraftApproveLoading] = useState(false);
  const [smsHistoryCampaignId, setSmsHistoryCampaignId] = useState("campaign-main");
  const [personalizedDraftError, setPersonalizedDraftError] = useState<string | null>(null);
  const [personalizedDraftLoading, setPersonalizedDraftLoading] = useState(false);
  const [implementationChecklistError, setImplementationChecklistError] = useState<string | null>(null);
  const [implementationChecklistLoading, setImplementationChecklistLoading] = useState(false);
  const [implementationChecklistUpdatingStepId, setImplementationChecklistUpdatingStepId] =
    useState<string | null>(null);
  const [implementationAlertsError, setImplementationAlertsError] = useState<string | null>(null);
  const [implementationAlertsLoading, setImplementationAlertsLoading] = useState(false);
  const [implementationReportLoading, setImplementationReportLoading] = useState(false);
  const [implementationReportMarkdown, setImplementationReportMarkdown] = useState<string | null>(null);
  const [implementationDocumentationLoading, setImplementationDocumentationLoading] = useState(false);
  const [implementationDocumentationMarkdown, setImplementationDocumentationMarkdown] = useState<string | null>(null);
  const [implementationExportLoading, setImplementationExportLoading] = useState(false);
  const [implementationExportTarget, setImplementationExportTarget] = useState<"notion" | "google_docs">("notion");
  const [auditProductContextError, setAuditProductContextError] = useState<string | null>(null);
  const [auditProductContextLoading, setAuditProductContextLoading] = useState(false);
  const [auditProductContextRefreshing, setAuditProductContextRefreshing] = useState(false);
  const [productCoverageError, setProductCoverageError] = useState<string | null>(null);
  const [productCoverageLoading, setProductCoverageLoading] = useState(false);
  const [productCoverageRefreshing, setProductCoverageRefreshing] = useState(false);
  const [communicationRecommendationsError, setCommunicationRecommendationsError] = useState<string | null>(null);
  const [communicationRecommendationsLoading, setCommunicationRecommendationsLoading] = useState(false);
  const [communicationRecommendationsRefreshing, setCommunicationRecommendationsRefreshing] = useState(false);
  const [communicationRecommendationsUpdateMessage, setCommunicationRecommendationsUpdateMessage] = useState<string | null>(null);
  const [campaignEffectivenessError, setCampaignEffectivenessError] = useState<string | null>(null);
  const [campaignEffectivenessLoading, setCampaignEffectivenessLoading] = useState(false);
  const [campaignEffectivenessRefreshing, setCampaignEffectivenessRefreshing] = useState(false);
  const [strategyKpiError, setStrategyKpiError] = useState<string | null>(null);
  const [strategyKpiLoading, setStrategyKpiLoading] = useState(false);
  const [strategyKpiRefreshing, setStrategyKpiRefreshing] = useState(false);
  const [aiAchievementsError, setAiAchievementsError] = useState<string | null>(null);
  const [aiAchievementsLoading, setAiAchievementsLoading] = useState(false);
  const [aiAchievementsRefreshing, setAiAchievementsRefreshing] = useState(false);
  const [aiAchievementsExporting, setAiAchievementsExporting] = useState(false);
  const [aiAchievementsExportTarget, setAiAchievementsExportTarget] = useState<"pdf" | "notion">("pdf");

  const utils = api.useUtils();

  const listQuery = api.clients.list.useQuery();
  const activeContextQuery = api.clients.getActiveContext.useQuery();

  const createMutation = api.clients.create.useMutation();
  const updateMutation = api.clients.update.useMutation();
  const archiveMutation = api.clients.archive.useMutation();
  const switchMutation = api.clients.switchActive.useMutation();
  const { mutateAsync: persistLastView } = api.clients.rememberLastView.useMutation();

  const profiles = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);

  const activeClientId =
    activeContextQuery.data?.data?.clientId ?? listQuery.data?.meta.activeClientId ?? null;

  const activeClient = useMemo(() => {
    if (!activeClientId) {
      return null;
    }

    return profiles.find((profile) => profile.id === activeClientId) ?? null;
  }, [activeClientId, profiles]);

  const decisionsQuery = api.clients.listDecisions.useQuery(
    { clientId: activeClientId ?? "000000000000000000000000" },
    { enabled: Boolean(activeClientId) },
  );
  const createDecisionMutation = api.clients.createDecision.useMutation();

  const discoveryStateQuery = api.clients.getDiscoveryState.useQuery(
    { clientId: activeClientId ?? "000000000000000000000000" },
    { enabled: Boolean(activeClientId) },
  );
  const ownRbacPoliciesQuery = api.clients.getRbacPolicies.useQuery(undefined);
  const actorRole = ownRbacPoliciesQuery.data?.data?.role ?? null;
  const scopedRbacPoliciesQuery = api.clients.getRbacPolicies.useQuery(
    actorRole === "OWNER" ? { role: policyRole } : undefined,
    { enabled: Boolean(actorRole) },
  );
  const updateRbacPolicyMutation = api.clients.updateRbacPolicy.useMutation();
  const saveDiscoveryMutation = api.clients.saveDiscoveryDraft.useMutation();
  const completeDiscoveryMutation = api.clients.completeDiscovery.useMutation();
  const syncStatusQuery = api.analysis.getSyncStatus.useQuery(
    { clientId: activeClientId ?? "000000000000000000000000" },
    { enabled: Boolean(activeClientId) },
  );
  const gapReportQuery = api.analysis.getGapReport.useQuery(
    { clientId: activeClientId ?? "000000000000000000000000" },
    {
      enabled: Boolean(activeClientId),
      retry: false,
    },
  );
  const optimizationQuery = api.analysis.getOptimizationAreas.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      limit: 10,
      showPartialOnTimeout: true,
    },
    {
      enabled: Boolean(activeClientId) && !gapError && !gapForbidden,
      retry: false,
    },
  );
  const contextInsightsQuery = api.analysis.getContextInsights.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      limit: 5,
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const latestFlowPlanQuery = api.analysis.getLatestFlowPlan.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateFlowPlanMutation = api.analysis.generateFlowPlan.useMutation();
  const latestCampaignCalendarQuery = api.analysis.getLatestCampaignCalendar.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateCampaignCalendarMutation = api.analysis.generateCampaignCalendar.useMutation();
  const latestSegmentProposalQuery = api.analysis.getLatestSegmentProposal.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateSegmentProposalMutation = api.analysis.generateSegmentProposal.useMutation();
  const latestCommunicationBriefQuery = api.analysis.getLatestCommunicationBrief.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateCommunicationBriefMutation = api.analysis.generateCommunicationBrief.useMutation();
  const latestEmailDraftQuery = api.analysis.getLatestEmailDraft.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateEmailDraftMutation = api.analysis.generateEmailDraft.useMutation();
  const smsDraftHistoryQuery = api.analysis.getSmsCampaignDraftHistory.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      campaignId: smsHistoryCampaignId,
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generateSmsDraftMutation = api.analysis.generateSmsCampaignDraft.useMutation();
  const latestPersonalizedDraftQuery = api.analysis.getLatestPersonalizedEmailDraft.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const generatePersonalizedDraftMutation = api.analysis.generatePersonalizedEmailDraft.useMutation();
  const latestImplementationChecklistQuery = api.analysis.getLatestImplementationChecklist.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const implementationAlertsQuery = api.analysis.getImplementationAlerts.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const implementationReportQuery = api.analysis.getImplementationReport.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: false,
      retry: false,
    },
  );
  const implementationDocumentationQuery = api.analysis.getImplementationDocumentation.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: false,
      retry: false,
    },
  );
  const exportImplementationDocumentationMutation =
    api.analysis.exportImplementationDocumentation.useMutation();
  const auditProductContextQuery = api.analysis.getAuditProductContext.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const productCoverageQuery = api.analysis.getProductCoverageAnalysis.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const communicationRecommendationsQuery = api.analysis.getCommunicationImprovementRecommendations.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const campaignEffectivenessRange = useMemo(() => {
    const rangeEnd = new Date();
    const rangeStart = new Date(rangeEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { rangeStart, rangeEnd };
  }, []);
  const campaignEffectivenessQuery = api.analysis.getCampaignEffectivenessAnalysis.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      rangeStart: campaignEffectivenessRange.rangeStart,
      rangeEnd: campaignEffectivenessRange.rangeEnd,
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const strategyKpiQuery = api.analysis.getStrategyKPIAnalysis.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      rangeStart: campaignEffectivenessRange.rangeStart,
      rangeEnd: campaignEffectivenessRange.rangeEnd,
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const aiAchievementsReportQuery = api.analysis.getAIAchievementsReport.useQuery(
    {
      clientId: activeClientId ?? "000000000000000000000000",
      rangeStart: campaignEffectivenessRange.rangeStart,
      rangeEnd: campaignEffectivenessRange.rangeEnd,
    },
    {
      enabled: Boolean(activeClientId) && !gapForbidden,
      retry: false,
    },
  );
  const updateStrategyRecommendationsMutation = api.analysis.updateStrategyRecommendations.useMutation();
  const submitArtifactFeedbackMutation = api.analysis.submitArtifactFeedback.useMutation();
  const generateImplementationChecklistMutation = api.analysis.generateImplementationChecklist.useMutation();
  const updateImplementationChecklistStepMutation = api.analysis.updateImplementationChecklistStep.useMutation();
  const syncNowMutation = api.analysis.syncNow.useMutation();

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || archiveMutation.isPending;
  const isDecisionSubmitting = createDecisionMutation.isPending;

  const loadClientSyncSummaries = useCallback(async () => {
    setClientSyncSummariesLoading(true);
    try {
      const response = await fetch("/api/clients/sync", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: Array<{
              clientId?: string;
              statusCode?: string;
              status?: string;
              checkedAt?: string;
            }>;
          }
        | null;

      const next: Record<string, ClientSyncSummary> = {};
      for (const item of payload?.data ?? []) {
        const clientId = typeof item.clientId === "string" ? item.clientId : null;
        if (!clientId) {
          continue;
        }

        const statusCode = typeof item.statusCode === "string" ? item.statusCode : "unknown";
        const status: SyncHealth =
          statusCode === "success" || statusCode === "already_connected"
            ? "ok"
            : statusCode === "failed"
              ? "fail"
              : statusCode === "partial"
                ? "warning"
                : "unknown";

        next[clientId] = {
          status,
          statusLabel: typeof item.status === "string" ? item.status : "Brak statusu synchronizacji",
          checkedAt: typeof item.checkedAt === "string" ? item.checkedAt : null,
        };
      }

      setClientSyncSummaries(next);
    } catch {
      setClientSyncSummaries({});
    } finally {
      setClientSyncSummariesLoading(false);
    }
  }, []);

  useEffect(() => {
    return scheduleLastViewPersistence({
      activeClientId,
      pathname,
      persistLastView,
    });
  }, [activeClientId, pathname, persistLastView]);

  useEffect(() => {
    void loadClientSyncSummaries();
  }, [loadClientSyncSummaries]);

  useEffect(() => {
    if (!activeClientId) {
      setDiscoveryAnswers(createEmptyDiscoveryAnswers());
      setDiscoveryDirty(false);
      setDiscoveryError(null);
      setDiscoverySuccess(null);
      return;
    }

    const fetchedAnswers = discoveryStateQuery.data?.data?.answers;
    setDiscoveryAnswers((current) =>
      resolveDiscoveryAnswersFromServer({
        currentAnswers: current,
        fetchedAnswers,
        isDirty: discoveryDirty,
      }),
    );
  }, [activeClientId, discoveryStateQuery.data?.data?.answers, discoveryDirty]);

  useEffect(() => {
    if (!actorRole) {
      return;
    }

    if (actorRole !== "OWNER") {
      setPolicyRole(actorRole);
      return;
    }

    setPolicyRole((current) => current ?? "OWNER");
  }, [actorRole]);

  const resetForm = () => {
    setName("");
    setFormMode("create");
    setEditingClientId(null);
    setFormError(null);
  };

  const refresh = async () => {
    await Promise.all([
      utils.clients.list.invalidate(),
      utils.clients.getActiveContext.invalidate(),
      utils.clients.listDecisions.invalidate(),
      utils.clients.getDiscoveryState.invalidate(),
      utils.clients.getRbacPolicies.invalidate(),
      utils.analysis.getSyncStatus.invalidate(),
      utils.analysis.getGapReport.invalidate(),
      utils.analysis.getOptimizationAreas.invalidate(),
      utils.analysis.getContextInsights.invalidate(),
      utils.analysis.getLatestFlowPlan.invalidate(),
      utils.analysis.getLatestCampaignCalendar.invalidate(),
      utils.analysis.getLatestSegmentProposal.invalidate(),
      utils.analysis.getLatestCommunicationBrief.invalidate(),
      utils.analysis.getLatestEmailDraft.invalidate(),
      utils.analysis.getSmsCampaignDraftHistory.invalidate(),
      utils.analysis.getLatestPersonalizedEmailDraft.invalidate(),
      utils.analysis.getLatestImplementationChecklist.invalidate(),
      utils.analysis.getImplementationAlerts.invalidate(),
      utils.analysis.getImplementationReport.invalidate(),
      utils.analysis.getImplementationDocumentation.invalidate(),
      utils.analysis.getAuditProductContext.invalidate(),
      utils.analysis.getProductCoverageAnalysis.invalidate(),
      utils.analysis.getCommunicationImprovementRecommendations.invalidate(),
      utils.analysis.getCampaignEffectivenessAnalysis.invalidate(),
      utils.analysis.getStrategyKPIAnalysis.invalidate(),
      utils.analysis.getAIAchievementsReport.invalidate(),
    ]);
    await loadClientSyncSummaries();
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      if (formMode === "edit" && editingClientId) {
        await updateMutation.mutateAsync({
          clientId: editingClientId,
          name,
        });
      } else {
        await createMutation.mutateAsync({
          name,
        });
      }

      resetForm();
      await refresh();
    } catch (error) {
      setFormError(
        withRequestId(
          "Nie udalo sie zapisac profilu. Dane formularza zostaly zachowane.",
          extractRequestId(error),
        ),
      );
    }
  };

  const startEdit = (clientId: string, value: string) => {
    setFormError(null);
    setFormMode("edit");
    setEditingClientId(clientId);
    setName(value);
  };

  const archiveProfile = async (clientId: string) => {
    setFormError(null);

    try {
      await archiveMutation.mutateAsync({ clientId });
      await refresh();
    } catch (error) {
      setFormError(withRequestId("Archiwizacja nie powiodla sie.", extractRequestId(error)));
    }
  };

  const switchClient = async (clientId: string) => {
    setFormError(null);
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    try {
      const result = await switchMutation.mutateAsync({
        clientId,
        lastViewPath: pathname,
      });

      await refresh();

      const nextPath = resolveRestoredClientsPath(result?.data?.restoredViewPath, pathname);
      if (nextPath) {
        router.push(nextPath);
      }
    } catch (error) {
      setFormError(
        withRequestId("Zmiana klienta zostala zablokowana.", extractRequestId(error)),
      );
    }
  };

  const submitDecision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDecisionError(null);

    const payload = buildCreateDecisionPayload({
      activeClientId,
      content: decisionContent,
    });

    if (!payload) {
      setDecisionError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await createDecisionMutation.mutateAsync(payload);
      setDecisionContent("");
      await refresh();
    } catch (error) {
      setDecisionError(
        withRequestId(
          "Nie udalo sie zapisac decyzji strategicznej. Sprobuj ponownie.",
          extractRequestId(error),
        ),
      );
    }
  };

  const onDiscoveryAnswerChange = (key: DiscoveryQuestionKey, value: string) => {
    setDiscoveryError(null);
    setDiscoverySuccess(null);
    setDiscoveryDirty(true);
    setDiscoveryAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveDiscovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    const payload = buildDiscoveryDraftPayload({
      activeClientId,
      answers: discoveryAnswers,
    });

    if (!payload) {
      setDiscoveryError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      const result = await saveDiscoveryMutation.mutateAsync(payload);
      if (!result?.data) {
        throw new Error("DISCOVERY_SAVE_EMPTY_RESPONSE");
      }
      const savedAnswers = result.data.answers;
      setDiscoveryAnswers((current) => mergeDiscoveryAnswers(current, savedAnswers));
      setDiscoveryDirty(false);
      setDiscoverySuccess("Discovery zapisane. Mozesz kontynuowac onboarding.");
      await refresh();
    } catch (error) {
      setDiscoveryError(
        withRequestId(
          "Nie udalo sie zapisac discovery. Wpisane odpowiedzi pozostaly w formularzu.",
          extractRequestId(error),
        ),
      );
    }
  };

  const completeDiscovery = async () => {
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    if (!activeClientId) {
      setDiscoveryError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    const localProgress = evaluateDiscoveryCompleteness(discoveryAnswers);
    if (!localProgress.canComplete) {
      setDiscoveryError(
        buildDiscoveryIncompleteMessage(
          localProgress.missingFields,
          localProgress.missingAnswersCount,
        ),
      );
      return;
    }

    try {
      await completeDiscoveryMutation.mutateAsync({ clientId: activeClientId });
      setDiscoveryDirty(false);
      setDiscoverySuccess("Etap discovery oznaczony jako kompletny.");
      await refresh();
    } catch (error) {
      const details = extractErrorDetails(error);
      const missingFields = Array.isArray(details?.missingFields)
        ? details.missingFields.map(String)
        : [];
      const missingAnswersCount =
        typeof details?.missingAnswersCount === "number"
          ? details.missingAnswersCount
          : 0;

      if (missingFields.length > 0 || missingAnswersCount > 0) {
        setDiscoveryError(
          buildDiscoveryIncompleteMessage(missingFields, missingAnswersCount),
        );
        return;
      }

      setDiscoveryError(
        withRequestId(
          "Nie udalo sie zamknac etapu discovery. Sprobuj ponownie po zapisie danych.",
          extractRequestId(error),
        ),
      );
    }
  };

  const updatePolicyField = async (
    module: RbacModule,
    field: "canView" | "canEdit" | "canManage",
    value: boolean,
  ) => {
    setRbacError(null);
    setRbacSuccess(null);

    const policies = scopedRbacPoliciesQuery.data?.data?.policies ?? [];
    const currentPolicy = policies.find((policy) => policy.module === module);
    if (!currentPolicy) {
      setRbacError("Nie znaleziono polityki RBAC dla wybranego modulu.");
      return;
    }

    try {
      await updateRbacPolicyMutation.mutateAsync({
        role: policyRole,
        module,
        canView: field === "canView" ? value : currentPolicy.canView,
        canEdit: field === "canEdit" ? value : currentPolicy.canEdit,
        canManage: field === "canManage" ? value : currentPolicy.canManage,
      });
      setRbacSuccess("Polityka RBAC zostala zaktualizowana.");
      await refresh();
    } catch (error) {
      setRbacError(
        withRequestId(
          "Nie udalo sie zaktualizowac polityki RBAC.",
          extractRequestId(error),
        ),
      );
    }
  };

  const syncNow = async () => {
    setSyncError(null);
    setSyncSuccess(null);

    if (!activeClientId) {
      setSyncError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      const result = await syncNowMutation.mutateAsync({
        clientId: activeClientId,
      });
      const status = result?.data?.status ?? "OK";
      setGapError(null);

      if (status === "FAILED_AUTH") {
        setSyncError(
          withRequestId(
            "Sync nie powiodl sie: token Klaviyo jest niepoprawny lub wygasl.",
            result?.data?.requestId,
          ),
        );
      } else if (status === "PARTIAL_OR_TIMEOUT") {
        setSyncError(
          withRequestId(
            "Sync zakonczyl sie czesciowo (timeout). Mozesz bezpiecznie ponowic probe.",
            result?.data?.requestId,
          ),
        );
      } else {
        setSyncSuccess(
          withRequestId("Sync zakonczony pomyslnie.", result?.data?.requestId),
        );
      }

      await refresh();
    } catch (error) {
      setSyncError(
        withRequestId("Nie udalo sie uruchomic sync.", extractRequestId(error)),
      );
    }
  };

  const openSyncForClient = async (clientId: string) => {
    setFormError(null);
    try {
      await fetch("/api/clients/sync/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      router.push("/clients/connect");
    } catch {
      setFormError("Nie udalo sie otworzyc synchronizacji dla klienta.");
    }
  };

  const openListAuditForClient = async (clientId: string) => {
    setFormError(null);
    try {
      await fetch("/api/clients/sync/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      router.push("/clients/connect/klaviyo-list-audit");
    } catch {
      setFormError("Nie udalo sie otworzyc audytu listy dla klienta.");
    }
  };

  useEffect(() => {
    if (!gapReportQuery.error) {
      setGapError(null);
      setGapForbidden(false);
      return;
    }

    const details = extractErrorDetails(gapReportQuery.error);
    const requestId = extractRequestId(gapReportQuery.error);
    const maybeCode = (gapReportQuery.error as { data?: { code?: unknown } }).data?.code;
    const trpcCode = typeof maybeCode === "string" ? maybeCode : null;
    if (details?.reason === "stale_sync_data") {
      setGapForbidden(false);
      setGapError(
        withRequestId(
          "Raport luk wymaga swiezego sync. Uruchom synchronizacje przed analiza.",
          requestId,
        ),
      );
      return;
    }

    if (trpcCode === "FORBIDDEN") {
      setGapForbidden(true);
      setGapError(
        withRequestId(
          "Brak uprawnien do raportu luk dla aktywnego klienta.",
          requestId,
        ),
      );
      return;
    }

    setGapForbidden(false);
    setGapError(withRequestId("Nie udalo sie pobrac raportu luk.", requestId));
  }, [gapReportQuery.error]);

  useEffect(() => {
    if (optimizationQuery.isLoading) {
      setOptimizationLoading(true);
      setOptimizationError(null);
      return;
    }

    if (optimizationQuery.isError) {
      setOptimizationLoading(false);
      const requestId = extractRequestId(optimizationQuery.error);

      setOptimizationError(
        withRequestId(
          "Nie udalo sie pobrac priorytetow optymalizacji.",
          requestId,
        ),
      );
    } else {
      setOptimizationLoading(false);
      setOptimizationError(null);
    }
  }, [optimizationQuery.isLoading, optimizationQuery.isError, optimizationQuery.error]);

  useEffect(() => {
    if (contextInsightsQuery.isLoading) {
      setContextInsightsLoading(true);
      setContextInsightsError(null);
      return;
    }

    if (contextInsightsQuery.isError) {
      setContextInsightsLoading(false);
      const requestId = extractRequestId(contextInsightsQuery.error);
      setContextInsightsError(
        withRequestId(
          "Nie udalo sie pobrac insightow kontekstowych.",
          requestId,
        ),
      );
      return;
    }

    setContextInsightsLoading(false);
    setContextInsightsError(null);
  }, [contextInsightsQuery.isLoading, contextInsightsQuery.isError, contextInsightsQuery.error]);

  useEffect(() => {
    if (latestFlowPlanQuery.isLoading) {
      setFlowPlanLoading(true);
      setFlowPlanError(null);
      return;
    }

    if (latestFlowPlanQuery.isError) {
      setFlowPlanLoading(false);
      const requestId = extractRequestId(latestFlowPlanQuery.error);
      setFlowPlanError(withRequestId("Nie udalo sie pobrac planu flow.", requestId));
      return;
    }

    setFlowPlanLoading(false);
    setFlowPlanError(null);
  }, [latestFlowPlanQuery.isLoading, latestFlowPlanQuery.isError, latestFlowPlanQuery.error]);

  useEffect(() => {
    if (latestCampaignCalendarQuery.isLoading) {
      setCampaignCalendarLoading(true);
      setCampaignCalendarError(null);
      return;
    }

    if (latestCampaignCalendarQuery.isError) {
      setCampaignCalendarLoading(false);
      const requestId = extractRequestId(latestCampaignCalendarQuery.error);
      setCampaignCalendarError(
        withRequestId("Nie udalo sie pobrac kalendarza kampanii.", requestId),
      );
      return;
    }

    setCampaignCalendarLoading(false);
    setCampaignCalendarError(null);
  }, [
    latestCampaignCalendarQuery.isLoading,
    latestCampaignCalendarQuery.isError,
    latestCampaignCalendarQuery.error,
  ]);

  useEffect(() => {
    if (latestSegmentProposalQuery.isLoading) {
      setSegmentProposalLoading(true);
      setSegmentProposalError(null);
      return;
    }

    if (latestSegmentProposalQuery.isError) {
      setSegmentProposalLoading(false);
      const requestId = extractRequestId(latestSegmentProposalQuery.error);
      setSegmentProposalError(
        withRequestId("Nie udalo sie pobrac propozycji segmentacji.", requestId),
      );
      return;
    }

    setSegmentProposalLoading(false);
    setSegmentProposalError(null);
  }, [
    latestSegmentProposalQuery.isLoading,
    latestSegmentProposalQuery.isError,
    latestSegmentProposalQuery.error,
  ]);

  useEffect(() => {
    if (latestCommunicationBriefQuery.isLoading) {
      setCommunicationBriefLoading(true);
      setCommunicationBriefError(null);
      return;
    }

    if (latestCommunicationBriefQuery.isError) {
      setCommunicationBriefLoading(false);
      const requestId = extractRequestId(latestCommunicationBriefQuery.error);
      setCommunicationBriefError(
        withRequestId("Nie udalo sie pobrac briefu komunikacyjnego.", requestId),
      );
      return;
    }

    setCommunicationBriefLoading(false);
    setCommunicationBriefError(null);
  }, [
    latestCommunicationBriefQuery.isLoading,
    latestCommunicationBriefQuery.isError,
    latestCommunicationBriefQuery.error,
  ]);

  useEffect(() => {
    if (latestEmailDraftQuery.isLoading) {
      setEmailDraftLoading(true);
      setEmailDraftError(null);
      return;
    }

    if (latestEmailDraftQuery.isError) {
      setEmailDraftLoading(false);
      const requestId = extractRequestId(latestEmailDraftQuery.error);
      setEmailDraftError(withRequestId("Nie udalo sie pobrac draftu email.", requestId));
      return;
    }

    setEmailDraftLoading(false);
    setEmailDraftError(null);
  }, [latestEmailDraftQuery.isLoading, latestEmailDraftQuery.isError, latestEmailDraftQuery.error]);

  useEffect(() => {
    if (smsDraftHistoryQuery.isLoading) {
      setSmsDraftLoading(true);
      setSmsDraftError(null);
      return;
    }

    if (smsDraftHistoryQuery.isError) {
      setSmsDraftLoading(false);
      const requestId = extractRequestId(smsDraftHistoryQuery.error);
      setSmsDraftError(withRequestId("Nie udalo sie pobrac historii draftow SMS.", requestId));
      return;
    }

    setSmsDraftLoading(false);
    setSmsDraftError(null);
  }, [smsDraftHistoryQuery.isLoading, smsDraftHistoryQuery.isError, smsDraftHistoryQuery.error]);

  useEffect(() => {
    if (latestPersonalizedDraftQuery.isLoading) {
      setPersonalizedDraftLoading(true);
      setPersonalizedDraftError(null);
      return;
    }

    if (latestPersonalizedDraftQuery.isError) {
      setPersonalizedDraftLoading(false);
      const requestId = extractRequestId(latestPersonalizedDraftQuery.error);
      setPersonalizedDraftError(
        withRequestId("Nie udalo sie pobrac personalizacji draftu.", requestId),
      );
      return;
    }

    setPersonalizedDraftLoading(false);
    setPersonalizedDraftError(null);
  }, [
    latestPersonalizedDraftQuery.isLoading,
    latestPersonalizedDraftQuery.isError,
    latestPersonalizedDraftQuery.error,
  ]);

  useEffect(() => {
    if (latestImplementationChecklistQuery.isLoading) {
      setImplementationChecklistLoading(true);
      setImplementationChecklistError(null);
      return;
    }

    if (latestImplementationChecklistQuery.isError) {
      setImplementationChecklistLoading(false);
      const requestId = extractRequestId(latestImplementationChecklistQuery.error);
      setImplementationChecklistError(
        withRequestId("Nie udalo sie pobrac checklisty wdrozeniowej.", requestId),
      );
      return;
    }

    setImplementationChecklistLoading(false);
    setImplementationChecklistError(null);
  }, [
    latestImplementationChecklistQuery.isLoading,
    latestImplementationChecklistQuery.isError,
    latestImplementationChecklistQuery.error,
  ]);

  useEffect(() => {
    if (implementationAlertsQuery.isLoading) {
      setImplementationAlertsLoading(true);
      setImplementationAlertsError(null);
      return;
    }

    if (implementationAlertsQuery.isError) {
      setImplementationAlertsLoading(false);
      const requestId = extractRequestId(implementationAlertsQuery.error);
      setImplementationAlertsError(
        withRequestId("Nie udalo sie pobrac powiadomien wdrozeniowych.", requestId),
      );
      return;
    }

    setImplementationAlertsLoading(false);
    setImplementationAlertsError(null);
  }, [
    implementationAlertsQuery.isLoading,
    implementationAlertsQuery.isError,
    implementationAlertsQuery.error,
  ]);

  useEffect(() => {
    if (auditProductContextQuery.isLoading) {
      setAuditProductContextLoading(true);
      setAuditProductContextError(null);
      return;
    }

    if (auditProductContextQuery.isError) {
      setAuditProductContextLoading(false);
      const requestId = extractRequestId(auditProductContextQuery.error);
      setAuditProductContextError(
        withRequestId("Nie udalo sie pobrac kontekstu produktu.", requestId),
      );
      return;
    }

    setAuditProductContextLoading(false);
    setAuditProductContextError(null);
  }, [
    auditProductContextQuery.isLoading,
    auditProductContextQuery.isError,
    auditProductContextQuery.error,
  ]);

  useEffect(() => {
    if (productCoverageQuery.isLoading) {
      setProductCoverageLoading(true);
      setProductCoverageError(null);
      return;
    }

    if (productCoverageQuery.isError) {
      setProductCoverageLoading(false);
      const requestId = extractRequestId(productCoverageQuery.error);
      setProductCoverageError(
        withRequestId("Nie udalo sie pobrac analizy pokrycia produktu.", requestId),
      );
      return;
    }

    setProductCoverageLoading(false);
    setProductCoverageError(null);
  }, [
    productCoverageQuery.isLoading,
    productCoverageQuery.isError,
    productCoverageQuery.error,
  ]);

  useEffect(() => {
    if (communicationRecommendationsQuery.isLoading) {
      setCommunicationRecommendationsLoading(true);
      setCommunicationRecommendationsError(null);
      return;
    }

    if (communicationRecommendationsQuery.isError) {
      setCommunicationRecommendationsLoading(false);
      const requestId = extractRequestId(communicationRecommendationsQuery.error);
      setCommunicationRecommendationsError(
        withRequestId("Nie udalo sie pobrac rekomendacji komunikacyjnych.", requestId),
      );
      return;
    }

    setCommunicationRecommendationsLoading(false);
    setCommunicationRecommendationsError(null);
  }, [
    communicationRecommendationsQuery.isLoading,
    communicationRecommendationsQuery.isError,
    communicationRecommendationsQuery.error,
  ]);

  useEffect(() => {
    if (campaignEffectivenessQuery.isLoading) {
      setCampaignEffectivenessLoading(true);
      setCampaignEffectivenessError(null);
      return;
    }

    if (campaignEffectivenessQuery.isError) {
      setCampaignEffectivenessLoading(false);
      const requestId = extractRequestId(campaignEffectivenessQuery.error);
      setCampaignEffectivenessError(
        withRequestId("Nie udalo sie pobrac analizy skutecznosci kampanii.", requestId),
      );
      return;
    }

    setCampaignEffectivenessLoading(false);
    setCampaignEffectivenessError(null);
  }, [
    campaignEffectivenessQuery.isLoading,
    campaignEffectivenessQuery.isError,
    campaignEffectivenessQuery.error,
  ]);

  useEffect(() => {
    if (strategyKpiQuery.isLoading) {
      setStrategyKpiLoading(true);
      setStrategyKpiError(null);
      return;
    }

    if (strategyKpiQuery.isError) {
      setStrategyKpiLoading(false);
      const requestId = extractRequestId(strategyKpiQuery.error);
      setStrategyKpiError(withRequestId("Nie udalo sie pobrac KPI strategii.", requestId));
      return;
    }

    setStrategyKpiLoading(false);
    setStrategyKpiError(null);
  }, [strategyKpiQuery.isLoading, strategyKpiQuery.isError, strategyKpiQuery.error]);

  useEffect(() => {
    if (aiAchievementsReportQuery.isLoading) {
      setAiAchievementsLoading(true);
      setAiAchievementsError(null);
      return;
    }

    if (aiAchievementsReportQuery.isError) {
      setAiAchievementsLoading(false);
      const requestId = extractRequestId(aiAchievementsReportQuery.error);
      setAiAchievementsError(
        withRequestId("Nie udalo sie pobrac raportu postepu AI.", requestId),
      );
      return;
    }

    setAiAchievementsLoading(false);
    setAiAchievementsError(null);
  }, [
    aiAchievementsReportQuery.isLoading,
    aiAchievementsReportQuery.isError,
    aiAchievementsReportQuery.error,
  ]);

  const generateFlowPlan = async () => {
    if (!activeClientId) {
      setFlowPlanError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateFlowPlanMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setFlowPlanError(
        withRequestId("Nie udalo sie wygenerowac planu flow.", extractRequestId(error)),
      );
    }
  };

  const generateCampaignCalendar = async () => {
    if (!activeClientId) {
      setCampaignCalendarError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateCampaignCalendarMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setCampaignCalendarError(
        withRequestId(
          "Nie udalo sie wygenerowac kalendarza kampanii.",
          extractRequestId(error),
        ),
      );
    }
  };

  const generateSegmentProposal = async () => {
    if (!activeClientId) {
      setSegmentProposalError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateSegmentProposalMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setSegmentProposalError(
        withRequestId(
          "Nie udalo sie wygenerowac propozycji segmentacji.",
          extractRequestId(error),
        ),
      );
    }
  };

  const generateCommunicationBrief = async (payload: {
    campaignGoal: string;
    segment: string;
  }) => {
    if (!activeClientId) {
      setCommunicationBriefError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateCommunicationBriefMutation.mutateAsync({
        clientId: activeClientId,
        campaignGoal: payload.campaignGoal,
        segment: payload.segment,
      });
      await refresh();
    } catch (error) {
      setCommunicationBriefError(
        withRequestId(
          "Nie udalo sie wygenerowac briefu komunikacyjnego.",
          extractRequestId(error),
        ),
      );
    }
  };

  const generateEmailDraft = async () => {
    if (!activeClientId) {
      setEmailDraftError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateEmailDraftMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setEmailDraftError(
        withRequestId("Nie udalo sie wygenerowac draftu email.", extractRequestId(error)),
      );
    }
  };

  const generateSmsDraft = async (payload: {
    campaignId: string;
    campaignContext: string;
    goals: string[];
    tone: string;
    timingPreferences: string;
    style: "promotion" | "reminder" | "announcement";
  }) => {
    if (!activeClientId) {
      setSmsDraftError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      setSmsHistoryCampaignId(payload.campaignId);
      await generateSmsDraftMutation.mutateAsync({
        clientId: activeClientId,
        campaignId: payload.campaignId,
        campaignContext: payload.campaignContext,
        goals: payload.goals,
        tone: payload.tone,
        timingPreferences: payload.timingPreferences,
        style: payload.style,
      });
      await refresh();
    } catch (error) {
      setSmsDraftError(
        withRequestId("Nie udalo sie wygenerowac draftu SMS.", extractRequestId(error)),
      );
    }
  };

  const approveSmsDraft = async (artifactId: string) => {
    if (!activeClientId) {
      setSmsDraftError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setSmsDraftApproveLoading(true);
    try {
      await submitArtifactFeedbackMutation.mutateAsync({
        clientId: activeClientId,
        targetType: "draft",
        artifactId,
        sourceRequestId: artifactId,
        rating: 5,
        comment: "manual_accept_sms_draft",
      });
      setSmsDraftError(null);
      await refresh();
    } catch (error) {
      setSmsDraftError(
        withRequestId("Nie udalo sie zatwierdzic draftu SMS.", extractRequestId(error)),
      );
    } finally {
      setSmsDraftApproveLoading(false);
    }
  };

  const generatePersonalizedDraft = async () => {
    if (!activeClientId) {
      setPersonalizedDraftError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generatePersonalizedDraftMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setPersonalizedDraftError(
        withRequestId(
          "Nie udalo sie wygenerowac personalizacji draftu.",
          extractRequestId(error),
        ),
      );
    }
  };

  const generateImplementationChecklist = async () => {
    if (!activeClientId) {
      setImplementationChecklistError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    try {
      await generateImplementationChecklistMutation.mutateAsync({ clientId: activeClientId });
      await refresh();
    } catch (error) {
      setImplementationChecklistError(
        withRequestId(
          "Nie udalo sie wygenerowac checklisty wdrozeniowej.",
          extractRequestId(error),
        ),
      );
    }
  };

  const downloadImplementationReport = async () => {
    if (!activeClientId) {
      setImplementationAlertsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setImplementationReportLoading(true);
    try {
      const result = await implementationReportQuery.refetch();
      const markdown = result.data?.data.report.markdown;
      if (!markdown) {
        throw new Error("IMPLEMENTATION_REPORT_EMPTY");
      }
      setImplementationReportMarkdown(markdown);

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `implementation-report-${activeClientId}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImplementationAlertsError(null);
    } catch (error) {
      setImplementationAlertsError(
        withRequestId("Nie udalo sie pobrac raportu wdrozeniowego.", extractRequestId(error)),
      );
    } finally {
      setImplementationReportLoading(false);
    }
  };

  const downloadImplementationDocumentation = async () => {
    if (!activeClientId) {
      setImplementationAlertsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setImplementationDocumentationLoading(true);
    try {
      const result = await implementationDocumentationQuery.refetch();
      const markdown = result.data?.data.documentation.markdown;
      if (!markdown) {
        throw new Error("IMPLEMENTATION_DOCUMENTATION_EMPTY");
      }
      setImplementationDocumentationMarkdown(markdown);

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `implementation-documentation-${activeClientId}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImplementationAlertsError(null);
    } catch (error) {
      setImplementationAlertsError(
        withRequestId("Nie udalo sie pobrac dokumentacji wdrozeniowej.", extractRequestId(error)),
      );
    } finally {
      setImplementationDocumentationLoading(false);
    }
  };

  const exportImplementationDocumentation = async () => {
    if (!activeClientId) {
      setImplementationAlertsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setImplementationExportLoading(true);
    try {
      const result = await exportImplementationDocumentationMutation.mutateAsync({
        clientId: activeClientId,
        target: implementationExportTarget,
      });
      const url = result?.data.documentUrl;
      if (!url) {
        throw new Error("IMPLEMENTATION_DOCUMENTATION_EXPORT_EMPTY");
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setImplementationAlertsError(null);
    } catch (error) {
      setImplementationAlertsError(
        withRequestId("Nie udalo sie wyeksportowac dokumentacji.", extractRequestId(error)),
      );
    } finally {
      setImplementationExportLoading(false);
    }
  };

  const refreshAuditProductContext = async () => {
    if (!activeClientId) {
      setAuditProductContextError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setAuditProductContextRefreshing(true);
    try {
      await auditProductContextQuery.refetch();
      setAuditProductContextError(null);
    } catch (error) {
      setAuditProductContextError(
        withRequestId("Nie udalo sie odswiezyc kontekstu produktu.", extractRequestId(error)),
      );
    } finally {
      setAuditProductContextRefreshing(false);
    }
  };

  const refreshProductCoverage = async () => {
    if (!activeClientId) {
      setProductCoverageError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setProductCoverageRefreshing(true);
    try {
      await productCoverageQuery.refetch();
      setProductCoverageError(null);
    } catch (error) {
      setProductCoverageError(
        withRequestId("Nie udalo sie odswiezyc analizy pokrycia.", extractRequestId(error)),
      );
    } finally {
      setProductCoverageRefreshing(false);
    }
  };

  const refreshCommunicationRecommendations = async () => {
    if (!activeClientId) {
      setCommunicationRecommendationsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setCommunicationRecommendationsRefreshing(true);
    setCommunicationRecommendationsUpdateMessage(null);
    try {
      await communicationRecommendationsQuery.refetch();
      setCommunicationRecommendationsError(null);
    } catch (error) {
      setCommunicationRecommendationsError(
        withRequestId("Nie udalo sie odswiezyc rekomendacji.", extractRequestId(error)),
      );
    } finally {
      setCommunicationRecommendationsRefreshing(false);
    }
  };

  const updateStrategyRecommendations = async () => {
    if (!activeClientId) {
      setCommunicationRecommendationsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    const confirmed = window.confirm(
      "Czy na pewno chcesz zaktualizowac rekomendacje na podstawie KPI i feedbacku?",
    );
    if (!confirmed) {
      return;
    }

    setCommunicationRecommendationsUpdateMessage(null);
    try {
      const result = await updateStrategyRecommendationsMutation.mutateAsync({
        clientId: activeClientId,
      });
      const status = result?.data.result.status;
      if (status === "updated") {
        setCommunicationRecommendationsUpdateMessage(
          "Rekomendacje zostaly zaktualizowane na podstawie KPI i feedbacku.",
        );
      } else {
        setCommunicationRecommendationsUpdateMessage(
          "Brak potrzeby aktualizacji rekomendacji (wynik powyzej progu).",
        );
      }
      await refresh();
    } catch (error) {
      setCommunicationRecommendationsError(
        withRequestId(
          "Nie udalo sie zaktualizowac rekomendacji.",
          extractRequestId(error),
        ),
      );
    }
  };

  const refreshCampaignEffectivenessAnalysis = async () => {
    if (!activeClientId) {
      setCampaignEffectivenessError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setCampaignEffectivenessRefreshing(true);
    try {
      await campaignEffectivenessQuery.refetch();
      setCampaignEffectivenessError(null);
    } catch (error) {
      setCampaignEffectivenessError(
        withRequestId(
          "Nie udalo sie odswiezyc analizy skutecznosci kampanii.",
          extractRequestId(error),
        ),
      );
    } finally {
      setCampaignEffectivenessRefreshing(false);
    }
  };

  const refreshStrategyKpiAnalysis = async () => {
    if (!activeClientId) {
      setStrategyKpiError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setStrategyKpiRefreshing(true);
    try {
      await strategyKpiQuery.refetch();
      setStrategyKpiError(null);
    } catch (error) {
      setStrategyKpiError(
        withRequestId("Nie udalo sie odswiezyc KPI strategii.", extractRequestId(error)),
      );
    } finally {
      setStrategyKpiRefreshing(false);
    }
  };

  const refreshAIAchievementsReport = async () => {
    if (!activeClientId) {
      setAiAchievementsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setAiAchievementsRefreshing(true);
    try {
      await aiAchievementsReportQuery.refetch();
      setAiAchievementsError(null);
    } catch (error) {
      setAiAchievementsError(
        withRequestId("Nie udalo sie odswiezyc raportu postepu AI.", extractRequestId(error)),
      );
    } finally {
      setAiAchievementsRefreshing(false);
    }
  };

  const exportAIAchievementsReport = async () => {
    if (!activeClientId) {
      setAiAchievementsError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    setAiAchievementsExporting(true);
    try {
      const result = await aiAchievementsReportQuery.refetch();
      const links = result.data?.data.exportLinks;
      const url =
        aiAchievementsExportTarget === "pdf" ? links?.pdf : links?.notion;
      if (!url) {
        throw new Error("AI_ACHIEVEMENTS_EXPORT_URL_MISSING");
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setAiAchievementsError(null);
    } catch (error) {
      setAiAchievementsError(
        withRequestId("Nie udalo sie wyeksportowac raportu postepu AI.", extractRequestId(error)),
      );
    } finally {
      setAiAchievementsExporting(false);
    }
  };

  const submitDraftFeedback = async (artifactId: string, rating: number, comment: string) => {
    if (!activeClientId) {
      const message = "Najpierw ustaw aktywny kontekst klienta.";
      setEmailDraftError(message);
      throw new Error(message);
    }

    try {
      await submitArtifactFeedbackMutation.mutateAsync({
        clientId: activeClientId,
        targetType: "draft",
        artifactId,
        sourceRequestId: artifactId,
        rating,
        comment,
      });
      setEmailDraftError(null);
      setPersonalizedDraftError(null);
    } catch (error) {
      const message = withRequestId(
        "Nie udalo sie zapisac feedbacku dla draftu.",
        extractRequestId(error),
      );
      setEmailDraftError(message);
      throw new Error(message);
    }
  };

  const submitRecommendationFeedback = async (
    artifactId: string,
    rating: number,
    comment: string,
  ) => {
    if (!activeClientId) {
      const message = "Najpierw ustaw aktywny kontekst klienta.";
      setCommunicationRecommendationsError(message);
      throw new Error(message);
    }

    try {
      await submitArtifactFeedbackMutation.mutateAsync({
        clientId: activeClientId,
        targetType: "recommendation",
        artifactId,
        sourceRequestId:
          communicationRecommendationsQuery.data?.data.recommendations.requestId,
        rating,
        comment,
      });
      setCommunicationRecommendationsError(null);
    } catch (error) {
      const message = withRequestId(
        "Nie udalo sie zapisac feedbacku dla rekomendacji.",
        extractRequestId(error),
      );
      setCommunicationRecommendationsError(message);
      throw new Error(message);
    }
  };

  const updateImplementationChecklistStep = async (
    stepId: string,
    status: "pending" | "in_progress" | "done",
  ) => {
    if (!activeClientId) {
      setImplementationChecklistError("Najpierw ustaw aktywny kontekst klienta.");
      return;
    }

    const checklist = latestImplementationChecklistQuery.data?.data.checklist;
    if (!checklist) {
      setImplementationChecklistError("Najpierw wygeneruj checkliste wdrozeniowa.");
      return;
    }

    setImplementationChecklistUpdatingStepId(stepId);
    try {
      const result = await updateImplementationChecklistStepMutation.mutateAsync({
        clientId: activeClientId,
        stepId,
        status,
        expectedVersion: checklist.version,
      });
      if (!result) {
        throw new Error("IMPLEMENTATION_CHECKLIST_UPDATE_EMPTY_RESPONSE");
      }

      if (result.data.checklist.status === "conflict_requires_refresh") {
        setImplementationChecklistError(
          withRequestId(
            "Wykryto konflikt wersji checklisty. Odswiez dane i ponow akcje.",
            result.meta.requestId,
          ),
        );
      } else if (result.data.checklist.status === "transaction_error") {
        setImplementationChecklistError(
          withRequestId(
            "Zapis kroku nie powiodl sie. Poprzedni stan checklisty zostal zachowany.",
            result.meta.requestId,
          ),
        );
      } else {
        setImplementationChecklistError(null);
      }
      await refresh();
    } catch (error) {
      setImplementationChecklistError(
        withRequestId("Nie udalo sie zaktualizowac kroku checklisty.", extractRequestId(error)),
      );
    } finally {
      setImplementationChecklistUpdatingStepId(null);
    }
  };

  const discoveryProgress = useMemo(() => {
    const fromLocal = evaluateDiscoveryCompleteness(discoveryAnswers);
    const fromServer = discoveryStateQuery.data?.data;

    return {
      answerCount: fromLocal.answerCount,
      minAnswersRequired: fromServer?.minAnswersRequired ?? fromLocal.minAnswersRequired,
      missingFields: fromLocal.missingFields,
      canComplete: fromLocal.canComplete,
      isComplete: Boolean(fromServer?.isComplete),
    };
  }, [discoveryAnswers, discoveryStateQuery.data?.data]);

  const ownPolicies = ownRbacPoliciesQuery.data?.data?.policies ?? [];
  const isDev = process.env.NODE_ENV === "development";
  const rbacSafeMode = ownRbacPoliciesQuery.data?.data?.safeMode ?? true;
  const visibleModules = buildVisibleModules(ownPolicies);
  const canViewClientsModule = isDev
    ? true
    : resolveModulePolicy(ownPolicies, "CLIENTS").canView;
  const canEditClientsModule = isDev ? true : canEditModule(ownPolicies, "CLIENTS");
  const canEditDiscoveryModule = isDev ? true : canEditModule(ownPolicies, "DISCOVERY");
  const canEditStrategyModule = isDev ? true : canEditModule(ownPolicies, "STRATEGY");
  const canManageRbac = actorRole === "OWNER";
  const editablePolicies = scopedRbacPoliciesQuery.data?.data?.policies ?? [];

  return (
    <>
      <section id="sync-status" className="mx-auto w-full max-w-4xl px-4 pt-8">
        <SyncStatusCard
          loading={syncStatusQuery.isLoading}
          syncing={syncNowMutation.isPending}
          error={syncError}
          success={syncSuccess}
          canSync={isDev ? true : canEditModule(ownPolicies, "AUDIT")}
          activeClientId={activeClientId}
          lastSyncAt={syncStatusQuery.data?.data?.lastSyncAt ?? null}
          lastSyncStatus={syncStatusQuery.data?.data?.lastSyncStatus ?? null}
          stale={Boolean(syncStatusQuery.data?.data?.stale)}
          counts={
            syncStatusQuery.data?.data?.counts ?? {
              accountCount: 0,
              flowCount: 0,
              emailCount: 0,
              formCount: 0,
            }
          }
          onSyncNow={syncNow}
        />
        <div className="mt-4">
        <GapListCard
          loading={gapReportQuery.isLoading}
          error={gapError}
          forbidden={gapForbidden}
          staleWarning={Boolean(syncStatusQuery.data?.data?.stale)}
          activeClientId={activeClientId}
          items={(gapReportQuery.data?.data?.items ?? []) as Array<{
            id: string;
            category: "FLOW" | "SEGMENT" | "LOGIC";
            status: "OK" | "GAP" | "INSUFFICIENT_DATA";
            priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
            name: string;
            reason: string;
          }>}
          lastSyncRequestId={gapReportQuery.data?.meta?.lastSyncRequestId ?? null}
        />
        <div className="mt-4">
          <OptimizationPrioritiesList
            loading={optimizationLoading}
            error={optimizationError}
            insufficientData={Boolean(optimizationQuery.data?.meta.hasInsufficientData)}
            timedOut={Boolean(optimizationQuery.data?.meta.hasTimedOut)}
            requestTime={optimizationQuery.data?.meta.generatedAt.getTime()}
            requestId={optimizationQuery.data?.meta.requestId ?? null}
            lastSyncRequestId={optimizationQuery.data?.meta.lastSyncRequestId ?? gapReportQuery.data?.meta?.lastSyncRequestId ?? null}
            missingData={optimizationQuery.data?.meta.missingData ?? []}
            optimizationAreas={optimizationQuery.data?.data.areas ?? []}
            summary={optimizationQuery.data?.data.summary ?? null}
          />
        </div>
        <div className="mt-4">
          <ContextInsightsList
            loading={contextInsightsLoading}
            error={contextInsightsError}
            status={contextInsightsQuery.data?.meta.status ?? "empty"}
            requestId={
              contextInsightsQuery.data?.meta.requestId ??
              extractRequestId(contextInsightsQuery.error)
            }
            lastSyncRequestId={
              contextInsightsQuery.data?.meta.lastSyncRequestId ??
              gapReportQuery.data?.meta?.lastSyncRequestId ??
              null
            }
            insights={contextInsightsQuery.data?.data.insights ?? []}
          />
        </div>
        <div className="mt-4">
          <FlowPlanCard
            loading={flowPlanLoading}
            generating={generateFlowPlanMutation.isPending}
            error={flowPlanError}
            requestId={
              latestFlowPlanQuery.data?.meta.requestId ??
              extractRequestId(latestFlowPlanQuery.error)
            }
            flowPlan={latestFlowPlanQuery.data?.data.flowPlan ?? null}
            onGenerate={generateFlowPlan}
          />
        </div>
        <div className="mt-4">
          <CampaignCalendarCard
            loading={campaignCalendarLoading}
            generating={generateCampaignCalendarMutation.isPending}
            error={campaignCalendarError}
            requestId={
              latestCampaignCalendarQuery.data?.meta.requestId ??
              extractRequestId(latestCampaignCalendarQuery.error)
            }
            calendar={latestCampaignCalendarQuery.data?.data.calendar ?? null}
            onGenerate={generateCampaignCalendar}
          />
        </div>
        <div className="mt-4">
          <SegmentProposalCard
            loading={segmentProposalLoading}
            generating={generateSegmentProposalMutation.isPending}
            error={segmentProposalError}
            requestId={
              latestSegmentProposalQuery.data?.meta.requestId ??
              extractRequestId(latestSegmentProposalQuery.error)
            }
            segmentProposal={latestSegmentProposalQuery.data?.data.segmentProposal ?? null}
            onGenerate={generateSegmentProposal}
          />
        </div>
        <div className="mt-4">
          <CommunicationBriefCard
            loading={communicationBriefLoading}
            generating={generateCommunicationBriefMutation.isPending}
            error={communicationBriefError}
            requestId={
              latestCommunicationBriefQuery.data?.meta.requestId ??
              extractRequestId(latestCommunicationBriefQuery.error)
            }
            brief={latestCommunicationBriefQuery.data?.data.brief ?? null}
            onGenerate={generateCommunicationBrief}
          />
        </div>
        <div className="mt-4">
          <EmailDraftCard
            loading={emailDraftLoading}
            generating={generateEmailDraftMutation.isPending}
            error={emailDraftError}
            requestId={
              latestEmailDraftQuery.data?.meta.requestId ??
              extractRequestId(latestEmailDraftQuery.error)
            }
            draft={latestEmailDraftQuery.data?.data.draft ?? null}
            onGenerate={generateEmailDraft}
            feedbackSubmitting={submitArtifactFeedbackMutation.isPending}
            onSubmitFeedback={async ({ artifactId, rating, comment }) => {
              await submitDraftFeedback(artifactId, rating, comment);
            }}
          />
        </div>
        <div className="mt-4">
          <SmsCampaignDraftCard
            loading={smsDraftLoading}
            generating={generateSmsDraftMutation.isPending}
            approving={smsDraftApproveLoading}
            error={smsDraftError}
            requestId={
              generateSmsDraftMutation.data?.meta.requestId ??
              smsDraftHistoryQuery.data?.meta.requestId ??
              extractRequestId(smsDraftHistoryQuery.error)
            }
            draft={
              generateSmsDraftMutation.data?.data.draft ??
              smsDraftHistoryQuery.data?.data.history[0] ??
              null
            }
            history={
              generateSmsDraftMutation.data?.data.history ??
              smsDraftHistoryQuery.data?.data.history ??
              []
            }
            defaultCampaignId={smsHistoryCampaignId}
            onGenerate={generateSmsDraft}
            onApprove={async (draft) => {
              await approveSmsDraft(draft.requestId);
            }}
          />
        </div>
        <div className="mt-4">
          <PersonalizedEmailDraftCard
            loading={personalizedDraftLoading}
            generating={generatePersonalizedDraftMutation.isPending}
            error={personalizedDraftError}
            requestId={
              latestPersonalizedDraftQuery.data?.meta.requestId ??
              extractRequestId(latestPersonalizedDraftQuery.error)
            }
            personalizedDraft={latestPersonalizedDraftQuery.data?.data.personalizedDraft ?? null}
            onGenerate={generatePersonalizedDraft}
            feedbackSubmitting={submitArtifactFeedbackMutation.isPending}
            onSubmitFeedback={async ({ artifactId, rating, comment }) => {
              await submitDraftFeedback(artifactId, rating, comment);
            }}
          />
        </div>
        <div className="mt-4">
          <ImplementationChecklistCard
            loading={implementationChecklistLoading}
            generating={generateImplementationChecklistMutation.isPending}
            updatingStepId={implementationChecklistUpdatingStepId}
            error={implementationChecklistError}
            requestId={
              latestImplementationChecklistQuery.data?.meta.requestId ??
              extractRequestId(latestImplementationChecklistQuery.error)
            }
            checklist={latestImplementationChecklistQuery.data?.data.checklist ?? null}
            onGenerate={generateImplementationChecklist}
            onUpdateStep={updateImplementationChecklistStep}
          />
        </div>
        <div className="mt-4">
          <ImplementationAlertsCard
            loading={implementationAlertsLoading}
            reportLoading={implementationReportLoading}
            documentationLoading={implementationDocumentationLoading}
            exportLoading={implementationExportLoading || exportImplementationDocumentationMutation.isPending}
            exportTarget={implementationExportTarget}
            error={implementationAlertsError}
            requestId={
              implementationAlertsQuery.data?.meta.requestId ??
              extractRequestId(implementationAlertsQuery.error)
            }
            alerts={implementationAlertsQuery.data?.data.alerts ?? null}
            reportMarkdown={implementationReportMarkdown}
            documentationMarkdown={implementationDocumentationMarkdown}
            onDownloadReport={downloadImplementationReport}
            onDownloadDocumentation={downloadImplementationDocumentation}
            onExportTargetChange={setImplementationExportTarget}
            onExportDocumentation={exportImplementationDocumentation}
          />
        </div>
        <div className="mt-4">
          <AuditProductContextCard
            loading={auditProductContextLoading}
            refreshing={auditProductContextRefreshing}
            error={auditProductContextError}
            requestId={
              auditProductContextQuery.data?.meta.requestId ??
              extractRequestId(auditProductContextQuery.error)
            }
            context={auditProductContextQuery.data?.data.context ?? null}
            onRefresh={refreshAuditProductContext}
          />
        </div>
        <div className="mt-4">
          <ProductCoverageAnalysisCard
            loading={productCoverageLoading}
            refreshing={productCoverageRefreshing}
            error={productCoverageError}
            requestId={
              productCoverageQuery.data?.meta.requestId ??
              extractRequestId(productCoverageQuery.error)
            }
            coverage={productCoverageQuery.data?.data.coverage ?? null}
            onRefresh={refreshProductCoverage}
          />
        </div>
        <div className="mt-4">
          <CommunicationImprovementRecommendationsCard
            loading={communicationRecommendationsLoading}
            refreshing={communicationRecommendationsRefreshing}
            error={communicationRecommendationsError}
            updateMessage={communicationRecommendationsUpdateMessage}
            requestId={
              communicationRecommendationsQuery.data?.meta.requestId ??
              extractRequestId(communicationRecommendationsQuery.error)
            }
            recommendations={communicationRecommendationsQuery.data?.data.recommendations ?? null}
            onRefresh={refreshCommunicationRecommendations}
            onUpdateRecommendations={updateStrategyRecommendations}
            updatingRecommendations={updateStrategyRecommendationsMutation.isPending}
            feedbackSubmitting={submitArtifactFeedbackMutation.isPending}
            onSubmitFeedback={async ({ artifactId, rating, comment }) => {
              await submitRecommendationFeedback(artifactId, rating, comment);
            }}
          />
        </div>
        <div className="mt-4">
          <CampaignEffectivenessAnalysisCard
            loading={campaignEffectivenessLoading}
            refreshing={campaignEffectivenessRefreshing}
            error={campaignEffectivenessError}
            requestId={
              campaignEffectivenessQuery.data?.meta.requestId ??
              extractRequestId(campaignEffectivenessQuery.error)
            }
            analysis={campaignEffectivenessQuery.data?.data.analysis ?? null}
            onRefresh={refreshCampaignEffectivenessAnalysis}
          />
        </div>
        <div className="mt-4">
          <StrategyKPIAnalysisCard
            loading={strategyKpiLoading}
            refreshing={strategyKpiRefreshing}
            error={strategyKpiError}
            requestId={
              strategyKpiQuery.data?.meta.requestId ??
              extractRequestId(strategyKpiQuery.error)
            }
            analysis={strategyKpiQuery.data?.data.analysis ?? null}
            onRefresh={refreshStrategyKpiAnalysis}
          />
        </div>
        <div className="mt-4">
          <AIAchievementsReportCard
            loading={aiAchievementsLoading}
            refreshing={aiAchievementsRefreshing}
            exporting={aiAchievementsExporting}
            error={aiAchievementsError}
            requestId={
              aiAchievementsReportQuery.data?.meta.requestId ??
              extractRequestId(aiAchievementsReportQuery.error)
            }
            report={aiAchievementsReportQuery.data?.data ?? null}
            exportTarget={aiAchievementsExportTarget}
            onRefresh={refreshAIAchievementsReport}
            onExportTargetChange={setAiAchievementsExportTarget}
            onExport={exportAIAchievementsReport}
          />
        </div>
        </div>
      </section>
      <ClientsWorkspaceView
      name={name}
      formMode={formMode}
      formError={formError}
      isSubmitting={isSubmitting}
      listLoading={listQuery.isLoading}
      profiles={profiles}
      clientSyncSummaries={clientSyncSummaries}
      clientSyncSummariesLoading={clientSyncSummariesLoading}
      activeClientName={activeClient?.name ?? null}
      decisions={decisionsQuery.data?.data ?? []}
      decisionsLoading={decisionsQuery.isLoading}
      decisionContent={decisionContent}
      decisionError={decisionError}
      isDecisionSubmitting={isDecisionSubmitting}
      discoveryAnswers={discoveryAnswers}
      discoveryProgress={discoveryProgress}
      discoveryStateLoading={discoveryStateQuery.isLoading}
      isDiscoverySaving={saveDiscoveryMutation.isPending}
      isDiscoveryCompleting={completeDiscoveryMutation.isPending}
      discoveryError={discoveryError}
      discoverySuccess={discoverySuccess}
      rbacLoading={ownRbacPoliciesQuery.isLoading || scopedRbacPoliciesQuery.isLoading}
      rbacSafeMode={rbacSafeMode}
      visibleModules={visibleModules}
      canViewClientsModule={canViewClientsModule}
      canEditClientsModule={canEditClientsModule}
      canEditDiscoveryModule={canEditDiscoveryModule}
      canEditStrategyModule={canEditStrategyModule}
      canManageRbac={canManageRbac}
      actorRole={actorRole}
      policyRole={policyRole}
      editablePolicies={editablePolicies}
      isPolicyUpdating={updateRbacPolicyMutation.isPending}
      rbacError={rbacError}
      rbacSuccess={rbacSuccess}
      onPolicyRoleChange={setPolicyRole}
      onPolicyFieldChange={updatePolicyField}
      onSubmit={submitForm}
      onNameChange={setName}
      onCancelEdit={resetForm}
      onSwitchClient={switchClient}
      onStartEdit={(profile) => startEdit(profile.id, profile.name)}
      onArchiveProfile={archiveProfile}
      onOpenSyncForClient={openSyncForClient}
      onOpenListAuditForClient={openListAuditForClient}
      onDecisionContentChange={setDecisionContent}
      onDecisionSubmit={submitDecision}
      onDiscoveryAnswerChange={onDiscoveryAnswerChange}
      onDiscoverySave={saveDiscovery}
      onDiscoveryComplete={completeDiscovery}
      />
    </>
  );
}
