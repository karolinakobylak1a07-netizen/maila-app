import {
  DEFAULT_CLIENTS_PATH,
  DISCOVERY_QUESTION_KEYS,
  REQUIRED_DISCOVERY_KEYS,
  normalizeClientViewPath,
  type RbacModule,
  type DiscoveryAnswersInput,
  type DiscoveryQuestionKey,
} from "../contracts/clients.schema.ts";

export const LAST_VIEW_PERSIST_DEBOUNCE_MS = 350;
export const MIN_DISCOVERY_ANSWERS = 10;

type PersistLastView = (payload: {
  clientId: string;
  lastViewPath: string;
}) => Promise<unknown>;

export type RbacPolicyViewModel = {
  module: RbacModule;
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
};

export const RBAC_MODULE_ORDER: RbacModule[] = [
  "CLIENTS",
  "DISCOVERY",
  "AUDIT",
  "STRATEGY",
  "CONTENT",
  "IMPLEMENTATION",
  "REPORTING",
  "SETTINGS",
  "GOVERNANCE",
];

export const buildProfileActionButtons = ({
  clientId,
  canEdit,
  canEditModule = true,
  isArchived,
  onSwitchClient,
  onStartEdit,
  onArchiveProfile,
}: {
  clientId: string;
  canEdit: boolean;
  canEditModule?: boolean;
  isArchived: boolean;
  onSwitchClient: (clientId: string) => void;
  onStartEdit: (clientId: string) => void;
  onArchiveProfile: (clientId: string) => void;
}) => [
  {
    label: "Przelacz",
    disabled: false,
    onClick: () => onSwitchClient(clientId),
  },
  {
    label: "Edytuj",
    disabled: !canEdit || !canEditModule || isArchived,
    onClick: () => onStartEdit(clientId),
  },
  {
    label: "Archiwizuj",
    disabled: !canEdit || !canEditModule || isArchived,
    onClick: () => onArchiveProfile(clientId),
  },
];

export const resolveModulePolicy = (
  policies: RbacPolicyViewModel[] | null | undefined,
  module: RbacModule,
) => {
  return (
    policies?.find((policy) => policy.module === module) ?? {
      module,
      canView: false,
      canEdit: false,
      canManage: false,
    }
  );
};

export const buildVisibleModules = (
  policies: RbacPolicyViewModel[] | null | undefined,
) => {
  return RBAC_MODULE_ORDER.filter(
    (module) => resolveModulePolicy(policies, module).canView,
  );
};

export const canEditModule = (
  policies: RbacPolicyViewModel[] | null | undefined,
  module: RbacModule,
) => resolveModulePolicy(policies, module).canEdit;

export const resolveRestoredClientsPath = (
  restoredViewPath: string | null | undefined,
  currentPath: string,
) => {
  const restored = coerceClientViewPath(restoredViewPath);

  if (!restored || restored === currentPath) {
    return null;
  }

  return restored;
};

export const scheduleLastViewPersistence = ({
  activeClientId,
  pathname,
  persistLastView,
  debounceMs = LAST_VIEW_PERSIST_DEBOUNCE_MS,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}: {
  activeClientId: string | null;
  pathname: string;
  persistLastView: PersistLastView;
  debounceMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}) => {
  if (!activeClientId) {
    return () => undefined;
  }

  const payload = {
    clientId: activeClientId,
    lastViewPath: normalizeClientViewPath(pathname || DEFAULT_CLIENTS_PATH),
  };

  const timerId = setTimer(() => {
    void persistLastView(payload).catch(() => undefined);
  }, debounceMs);

  return () => {
    clearTimer(timerId);
    void persistLastView(payload).catch(() => undefined);
  };
};

export const buildCreateDecisionPayload = ({
  activeClientId,
  content,
}: {
  activeClientId: string | null;
  content: string;
}) => {
  if (!activeClientId) {
    return null;
  }

  return {
    clientId: activeClientId,
    content: content.trim(),
  };
};

export const createEmptyDiscoveryAnswers = (): Record<DiscoveryQuestionKey, string> => ({
  goals: "",
  segments: "",
  seasonality: "",
  offer: "",
  targetAudience: "",
  brandTone: "",
  mainProducts: "",
  currentChallenges: "",
  currentFlows: "",
  primaryKpis: "",
});

export const mergeDiscoveryAnswers = (
  base: Record<DiscoveryQuestionKey, string>,
  updates: DiscoveryAnswersInput,
): Record<DiscoveryQuestionKey, string> => {
  const merged = { ...base };

  for (const key of DISCOVERY_QUESTION_KEYS) {
    const value = updates[key];
    merged[key] = typeof value === "string" ? value.trim() : "";
  }

  return merged;
};

export const resolveDiscoveryAnswersFromServer = ({
  currentAnswers,
  fetchedAnswers,
  isDirty,
}: {
  currentAnswers: Record<DiscoveryQuestionKey, string>;
  fetchedAnswers: DiscoveryAnswersInput | null | undefined;
  isDirty: boolean;
}) => {
  if (!fetchedAnswers || isDirty) {
    return currentAnswers;
  }

  return mergeDiscoveryAnswers(currentAnswers, fetchedAnswers);
};

export const buildDiscoveryDraftPayload = ({
  activeClientId,
  answers,
}: {
  activeClientId: string | null;
  answers: Record<DiscoveryQuestionKey, string>;
}) => {
  if (!activeClientId) {
    return null;
  }

  return {
    clientId: activeClientId,
    answers,
  };
};

export const evaluateDiscoveryCompleteness = (
  answers: Record<DiscoveryQuestionKey, string>,
) => {
  const answerCount = DISCOVERY_QUESTION_KEYS.reduce((count, key) => {
    return answers[key].trim().length > 0 ? count + 1 : count;
  }, 0);

  const missingFields = REQUIRED_DISCOVERY_KEYS.filter(
    (key) => answers[key].trim().length === 0,
  );

  return {
    answerCount,
    minAnswersRequired: MIN_DISCOVERY_ANSWERS,
    missingFields,
    canComplete:
      missingFields.length === 0 && answerCount >= MIN_DISCOVERY_ANSWERS,
    missingAnswersCount: Math.max(MIN_DISCOVERY_ANSWERS - answerCount, 0),
  };
};

export const buildDiscoveryIncompleteMessage = (
  missingFields: string[],
  missingAnswersCount: number,
) => {
  const missingFieldsPart =
    missingFields.length > 0
      ? `Brak wymaganych pol: ${missingFields.join(", ")}.`
      : "Wymagane pola sa uzupelnione.";

  const answersPart =
    missingAnswersCount > 0
      ? ` Brakuje jeszcze ${missingAnswersCount} odpowiedzi do minimum 10.`
      : "";

  return `${missingFieldsPart}${answersPart}`.trim();
};

export const withRequestId = (
  message: string,
  requestId: string | null | undefined,
) => {
  if (!requestId || requestId.trim().length === 0) {
    return message;
  }

  return `${message} [requestId: ${requestId}]`;
};

const coerceClientViewPath = (value: string | null | undefined) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return normalizeClientViewPath(value.trim());
};
