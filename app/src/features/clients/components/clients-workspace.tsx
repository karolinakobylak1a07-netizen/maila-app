"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [gapError, setGapError] = useState<string | null>(null);
  const [gapForbidden, setGapForbidden] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);

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
  const syncNowMutation = api.analysis.syncNow.useMutation();

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || archiveMutation.isPending;
  const isDecisionSubmitting = createDecisionMutation.isPending;

  useEffect(() => {
    return scheduleLastViewPersistence({
      activeClientId,
      pathname,
      persistLastView,
    });
  }, [activeClientId, pathname, persistLastView]);

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
    ]);
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
  const rbacSafeMode = ownRbacPoliciesQuery.data?.data?.safeMode ?? true;
  const visibleModules = buildVisibleModules(ownPolicies);
  const canViewClientsModule = resolveModulePolicy(ownPolicies, "CLIENTS").canView;
  const canEditClientsModule = canEditModule(ownPolicies, "CLIENTS");
  const canEditDiscoveryModule = canEditModule(ownPolicies, "DISCOVERY");
  const canEditStrategyModule = canEditModule(ownPolicies, "STRATEGY");
  const canManageRbac = actorRole === "OWNER";
  const editablePolicies = scopedRbacPoliciesQuery.data?.data?.policies ?? [];

  return (
    <>
      <section className="mx-auto w-full max-w-4xl px-4 pt-8">
        <SyncStatusCard
          loading={syncStatusQuery.isLoading}
          syncing={syncNowMutation.isPending}
          error={syncError}
          success={syncSuccess}
          canSync={canEditModule(ownPolicies, "AUDIT")}
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
        </div>
      </section>
      <ClientsWorkspaceView
      name={name}
      formMode={formMode}
      formError={formError}
      isSubmitting={isSubmitting}
      listLoading={listQuery.isLoading}
      profiles={profiles}
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
      onDecisionContentChange={setDecisionContent}
      onDecisionSubmit={submitDecision}
      onDiscoveryAnswerChange={onDiscoveryAnswerChange}
      onDiscoverySave={saveDiscovery}
      onDiscoveryComplete={completeDiscovery}
      />
    </>
  );
}
