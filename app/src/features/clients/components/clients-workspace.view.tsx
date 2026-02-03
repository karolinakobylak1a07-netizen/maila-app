import type React from "react";
import {
  DISCOVERY_QUESTION_KEYS,
  type RbacModule,
  type UserRole,
  type DiscoveryQuestionKey,
} from "../contracts/clients.schema";
import { buildProfileActionButtons } from "./clients-workspace.logic";

type FormMode = "create" | "edit";

type ProfileViewModel = {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  canEdit: boolean;
  isActive: boolean;
};

type StrategicDecisionViewModel = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
};

type DiscoveryProgressViewModel = {
  answerCount: number;
  minAnswersRequired: number;
  missingFields: string[];
  canComplete: boolean;
  isComplete: boolean;
};

type ClientsWorkspaceViewProps = {
  name: string;
  formMode: FormMode;
  formError: string | null;
  isSubmitting: boolean;
  listLoading: boolean;
  profiles: ProfileViewModel[];
  activeClientName: string | null;
  decisions: StrategicDecisionViewModel[];
  decisionsLoading: boolean;
  decisionContent: string;
  decisionError: string | null;
  isDecisionSubmitting: boolean;
  discoveryAnswers: Record<DiscoveryQuestionKey, string>;
  discoveryProgress: DiscoveryProgressViewModel;
  discoveryStateLoading: boolean;
  isDiscoverySaving: boolean;
  isDiscoveryCompleting: boolean;
  discoveryError: string | null;
  discoverySuccess: string | null;
  rbacLoading: boolean;
  rbacSafeMode: boolean;
  visibleModules: string[];
  canViewClientsModule: boolean;
  canEditClientsModule: boolean;
  canEditDiscoveryModule: boolean;
  canEditStrategyModule: boolean;
  canManageRbac: boolean;
  actorRole: UserRole | null;
  policyRole: UserRole;
  editablePolicies: Array<{
    module: RbacModule;
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
  }>;
  isPolicyUpdating: boolean;
  rbacError: string | null;
  rbacSuccess: string | null;
  onPolicyRoleChange: (role: UserRole) => void;
  onPolicyFieldChange: (
    module: RbacModule,
    field: "canView" | "canEdit" | "canManage",
    value: boolean,
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onCancelEdit: () => void;
  onSwitchClient: (clientId: string) => void;
  onStartEdit: (profile: { id: string; name: string }) => void;
  onArchiveProfile: (clientId: string) => void;
  onDecisionContentChange: (value: string) => void;
  onDecisionSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDiscoveryAnswerChange: (key: DiscoveryQuestionKey, value: string) => void;
  onDiscoverySave: (event: React.FormEvent<HTMLFormElement>) => void;
  onDiscoveryComplete: () => void;
};

const DISCOVERY_QUESTION_LABELS: Record<DiscoveryQuestionKey, string> = {
  goals: "Cele biznesowe klienta",
  segments: "Segmenty odbiorcow",
  seasonality: "Sezonowosc i kluczowe okresy",
  offer: "Oferta i przewagi",
  targetAudience: "Opis grupy docelowej",
  brandTone: "Ton marki",
  mainProducts: "Glowne produkty/uslugi",
  currentChallenges: "Aktualne wyzwania marketingowe",
  currentFlows: "Istniejace flow i automatyzacje",
  primaryKpis: "KPI i metryki sukcesu",
};

export function ClientsWorkspaceView(props: ClientsWorkspaceViewProps) {
  const showClientsWorkspace = props.canViewClientsModule;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Modul klientow</h1>
        <p className="text-sm text-slate-600">
          Zarzadzanie profilami klientow, archiwizacja i bezpieczne przelaczanie
          kontekstu.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Dostepy RBAC</h2>
        {props.rbacLoading ? (
          <p className="text-sm text-slate-600">Ladowanie polityk uprawnien...</p>
        ) : (
          <>
            <p className="text-sm text-slate-700">
              Widoczne moduly:{" "}
              {props.visibleModules.length > 0
                ? props.visibleModules.join(", ")
                : "brak (safe mode)"}
            </p>
            {props.rbacSafeMode && (
              <p className="mt-2 text-sm text-amber-700">
                Safe mode aktywny: akcje edycyjne pozostaja ukryte do czasu
                poprawnego odczytu polityk.
              </p>
            )}
          </>
        )}
      </div>

      {props.canManageRbac && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-medium text-slate-900">
            Konfiguracja RBAC (Owner)
          </h2>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <label htmlFor="rbac-role">Rola:</label>
            <select
              id="rbac-role"
              value={props.policyRole}
              onChange={(event) =>
                props.onPolicyRoleChange(event.target.value as UserRole)
              }
              className="rounded-md border border-slate-300 px-2 py-1"
            >
              <option value="OWNER">OWNER</option>
              <option value="STRATEGY">STRATEGY</option>
              <option value="CONTENT">CONTENT</option>
              <option value="OPERATIONS">OPERATIONS</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-1 pr-2">Modul</th>
                  <th className="py-1 pr-2">View</th>
                  <th className="py-1 pr-2">Edit</th>
                  <th className="py-1 pr-2">Manage</th>
                </tr>
              </thead>
              <tbody>
                {props.editablePolicies.map((policy) => (
                  <tr key={policy.module} className="border-t border-slate-100">
                    <td className="py-2 pr-2 font-medium text-slate-800">{policy.module}</td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={policy.canView}
                        disabled={props.isPolicyUpdating}
                        onChange={(event) =>
                          props.onPolicyFieldChange(
                            policy.module,
                            "canView",
                            event.target.checked,
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={policy.canEdit}
                        disabled={props.isPolicyUpdating}
                        onChange={(event) =>
                          props.onPolicyFieldChange(
                            policy.module,
                            "canEdit",
                            event.target.checked,
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={policy.canManage}
                        disabled={props.isPolicyUpdating}
                        onChange={(event) =>
                          props.onPolicyFieldChange(
                            policy.module,
                            "canManage",
                            event.target.checked,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {props.rbacError && <p className="mt-3 text-sm text-red-600">{props.rbacError}</p>}
          {props.rbacSuccess && (
            <p className="mt-3 text-sm text-emerald-700">{props.rbacSuccess}</p>
          )}
        </div>
      )}

      {!showClientsWorkspace && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="mb-1 text-lg font-medium text-red-900">Brak dostepu</h2>
          <p className="text-sm text-red-700">
            Twoja rola nie ma uprawnien do modulu klientow. Wybierz dozwolony
            modul z nawigacji.
          </p>
        </div>
      )}

      {showClientsWorkspace && <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">
          {props.formMode === "edit" ? "Edytuj profil klienta" : "Nowy profil klienta"}
        </h2>

        <form className="flex flex-col gap-3" onSubmit={props.onSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nazwa klienta
            <input
              required
              minLength={2}
              disabled={!props.canEditClientsModule}
              value={props.name}
              onChange={(event) => props.onNameChange(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
              placeholder="np. FitStore"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={props.isSubmitting || !props.canEditClientsModule}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {props.formMode === "edit" ? "Zapisz" : "Utworz"}
            </button>

            {props.formMode === "edit" && (
              <button
                type="button"
                onClick={props.onCancelEdit}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
              >
                Anuluj
              </button>
            )}
          </div>
        </form>

        {props.formError && <p className="mt-3 text-sm text-red-600">{props.formError}</p>}
      </div>}

      {showClientsWorkspace && <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Lista klientow</h2>

        {props.listLoading && <p className="text-sm text-slate-600">Ladowanie...</p>}

        {!props.listLoading && props.profiles.length === 0 && (
          <p className="text-sm text-slate-600">Brak klientow. Dodaj pierwszy profil.</p>
        )}

        <ul className="flex flex-col gap-3">
          {props.profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-600">
                  Status: {profile.status} {profile.isActive ? "• aktywny kontekst" : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {buildProfileActionButtons({
                  clientId: profile.id,
                  canEdit: profile.canEdit,
                  canEditModule: props.canEditClientsModule,
                  isArchived: profile.status === "ARCHIVED",
                  onSwitchClient: props.onSwitchClient,
                  onStartEdit: (clientId) =>
                    props.onStartEdit({ id: clientId, name: profile.name }),
                  onArchiveProfile: props.onArchiveProfile,
                }).map((action) => (
                  <button
                    key={`${profile.id}-${action.label}`}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs disabled:opacity-40"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>}

      {showClientsWorkspace && <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Aktywny kontekst</h2>
        {props.activeClientName ? (
          <p className="text-sm text-slate-700">
            Aktualny klient: <strong>{props.activeClientName}</strong>
          </p>
        ) : (
          <p className="text-sm text-slate-600">Nie ustawiono aktywnego klienta.</p>
        )}
      </div>}

      {showClientsWorkspace && <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">Discovery onboarding</h2>
        <p className="mb-3 text-sm text-slate-600">
          Aby przejsc dalej, uzupelnij minimum 10 odpowiedzi oraz pola: goals,
          segments, seasonality, offer.
        </p>

        {props.discoveryStateLoading && (
          <p className="mb-3 text-sm text-slate-600">Ladowanie stanu discovery...</p>
        )}

        <form className="flex flex-col gap-4" onSubmit={props.onDiscoverySave}>
          {DISCOVERY_QUESTION_KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1 text-sm text-slate-700">
              {DISCOVERY_QUESTION_LABELS[key]}
              <textarea
                value={props.discoveryAnswers[key]}
                onChange={(event) =>
                  props.onDiscoveryAnswerChange(key, event.target.value)
                }
                minLength={0}
                maxLength={5000}
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
              />
            </label>
          ))}

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Odpowiedzi: {props.discoveryProgress.answerCount}/
              {props.discoveryProgress.minAnswersRequired}
            </p>
            <p>
              Wymagane pola brakujace: {props.discoveryProgress.missingFields.length}
            </p>
            {props.discoveryProgress.missingFields.length > 0 && (
              <p className="text-red-600">
                Braki: {props.discoveryProgress.missingFields.join(", ")}
              </p>
            )}
            {props.discoveryProgress.isComplete && (
              <p className="text-emerald-700">Etap discovery oznaczony jako kompletny.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={
                props.isDiscoverySaving ||
                !props.activeClientName ||
                !props.canEditDiscoveryModule
              }
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Zapisz discovery
            </button>
            <button
              type="button"
              onClick={props.onDiscoveryComplete}
              disabled={
                props.isDiscoveryCompleting ||
                !props.activeClientName ||
                !props.canEditDiscoveryModule
              }
              className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60"
            >
              Przejdz dalej
            </button>
          </div>
        </form>

        {props.discoveryError && (
          <p className="mt-3 text-sm text-red-600">{props.discoveryError}</p>
        )}
        {props.discoverySuccess && (
          <p className="mt-3 text-sm text-emerald-700">{props.discoverySuccess}</p>
        )}
      </div>}

      {showClientsWorkspace && <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-slate-900">
          Historia decyzji strategicznych
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Decyzje sa przypisane do aktywnego klienta i nie przenikaja miedzy kontekstami.
        </p>

        <form className="mb-4 flex flex-col gap-3" onSubmit={props.onDecisionSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nowa decyzja
            <textarea
              required
              minLength={3}
              value={props.decisionContent}
              onChange={(event) => props.onDecisionContentChange(event.target.value)}
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-300 focus:ring"
              placeholder="np. Priorytet Q2: kampania retencyjna dla segmentu VIP"
            />
          </label>

          <div>
            <button
              type="submit"
              disabled={
                props.isDecisionSubmitting ||
                !props.activeClientName ||
                !props.canEditStrategyModule
              }
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Zapisz decyzje
            </button>
          </div>
        </form>

        {props.decisionError && (
          <p className="mb-3 text-sm text-red-600">{props.decisionError}</p>
        )}

        {props.decisionsLoading && <p className="text-sm text-slate-600">Ladowanie historii...</p>}

        {!props.decisionsLoading && props.decisions.length === 0 && (
          <p className="text-sm text-slate-600">Brak decyzji dla aktywnego klienta.</p>
        )}

        <ul className="flex flex-col gap-3">
          {props.decisions.map((decision) => (
            <li key={decision.id} className="rounded-md border border-slate-200 p-3">
              <p className="whitespace-pre-wrap text-sm text-slate-900">{decision.content}</p>
              <p className="mt-2 text-xs text-slate-600">
                Autor: {decision.author.name} • Data: {" "}
                {new Date(decision.createdAt).toLocaleString("pl-PL")}
              </p>
            </li>
          ))}
        </ul>
      </div>}
    </section>
  );
}
