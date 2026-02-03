import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const logicModulePath = pathToFileURL(
  path.resolve("src/features/clients/components/clients-workspace.logic.ts"),
).href;
const workspaceViewSource = fs.readFileSync(
  path.resolve("src/features/clients/components/clients-workspace.view.tsx"),
  "utf8",
);

const {
  buildCreateDecisionPayload,
  buildVisibleModules,
  canEditModule,
  buildDiscoveryDraftPayload,
  buildDiscoveryIncompleteMessage,
  buildProfileActionButtons,
  createEmptyDiscoveryAnswers,
  evaluateDiscoveryCompleteness,
  mergeDiscoveryAnswers,
  resolveDiscoveryAnswersFromServer,
  resolveRestoredClientsPath,
  scheduleLastViewPersistence,
  resolveModulePolicy,
  withRequestId,
} = await import(logicModulePath);

test("UI action model renderuje przyciski i obsluguje klik", async () => {
  const events = [];
  const actions = buildProfileActionButtons({
    clientId: "client-1",
    canEdit: true,
    isArchived: false,
    onSwitchClient: (id) => events.push(["switch", id]),
    onStartEdit: (id) => events.push(["edit", id]),
    onArchiveProfile: (id) => events.push(["archive", id]),
  });

  assert.deepEqual(
    actions.map((action) => action.label),
    ["Przelacz", "Edytuj", "Archiwizuj"],
  );
  assert.equal(actions[0].disabled, false);
  await actions[0].onClick();
  assert.deepEqual(events, [["switch", "client-1"]]);
});

test("restore path przyjmuje tylko lokalne /clients* i fallbackuje do /clients", () => {
  assert.equal(resolveRestoredClientsPath("/clients/projekty", "/clients"), "/clients/projekty");
  assert.equal(resolveRestoredClientsPath("https://evil.example", "/clients/workspace"), "/clients");
  assert.equal(resolveRestoredClientsPath(null, "/clients"), null);
  assert.equal(resolveRestoredClientsPath("/clients", "/clients"), null);
});

test("last view zapisuje sie debounced i flushuje przy cleanup", async () => {
  const persisted = [];
  const timers = [];
  const fakeSetTimeout = (fn, _ms) => {
    timers.push(fn);
    return timers.length;
  };
  const fakeClearTimeout = () => undefined;

  const cleanup = scheduleLastViewPersistence({
    activeClientId: "client-1",
    pathname: "/outside",
    persistLastView: async (payload) => {
      persisted.push(payload);
    },
    setTimer: fakeSetTimeout,
    clearTimer: fakeClearTimeout,
    debounceMs: 10,
  });

  assert.equal(timers.length, 1);
  await timers[0]();
  assert.deepEqual(persisted[0], {
    clientId: "client-1",
    lastViewPath: "/clients",
  });

  cleanup();
  await Promise.resolve();
  assert.deepEqual(persisted[1], {
    clientId: "client-1",
    lastViewPath: "/clients",
  });
});

test("decision payload wymaga aktywnego klienta i trimuje tresc", () => {
  assert.equal(
    buildCreateDecisionPayload({
      activeClientId: null,
      content: "decyzja",
    }),
    null,
  );

  assert.deepEqual(
    buildCreateDecisionPayload({
      activeClientId: "client-1",
      content: "  Priorytet Q2  ",
    }),
    {
      clientId: "client-1",
      content: "Priorytet Q2",
    },
  );
});

test("discovery progress wykrywa braki i minimum 10 odpowiedzi", () => {
  const answers = createEmptyDiscoveryAnswers();
  answers.goals = "Wzrost MRR";
  answers.segments = "VIP";
  answers.seasonality = "Q4";
  answers.offer = "Pakiet premium";
  answers.targetAudience = "B2C";
  answers.brandTone = "Ekspercki";
  answers.mainProducts = "Subskrypcja";
  answers.currentChallenges = "Niska retencja";
  answers.currentFlows = "Porzucony koszyk";

  const progress = evaluateDiscoveryCompleteness(answers);

  assert.equal(progress.answerCount, 9);
  assert.equal(progress.canComplete, false);
  assert.equal(progress.missingFields.length, 0);
  assert.equal(progress.missingAnswersCount, 1);
});

test("mergeDiscoveryAnswers i payload draftu zachowuja wszystkie pola", () => {
  const merged = mergeDiscoveryAnswers(createEmptyDiscoveryAnswers(), {
    goals: "  Zwiekszyc konwersje  ",
    segments: "VIP",
    seasonality: "Q4",
    offer: "Pakiet",
    primaryKpis: "CTR",
  });

  assert.equal(merged.goals, "Zwiekszyc konwersje");
  assert.equal(merged.primaryKpis, "CTR");
  assert.equal(merged.targetAudience, "");

  assert.equal(
    buildDiscoveryDraftPayload({
      activeClientId: null,
      answers: merged,
    }),
    null,
  );

  assert.deepEqual(
    buildDiscoveryDraftPayload({
      activeClientId: "client-1",
      answers: merged,
    }),
    {
      clientId: "client-1",
      answers: merged,
    },
  );
});

test("buildDiscoveryIncompleteMessage zwraca konkretna informacje o brakach", () => {
  const message = buildDiscoveryIncompleteMessage(["goals", "offer"], 2);
  assert.match(message, /goals, offer/);
  assert.match(message, /Brakuje jeszcze 2 odpowiedzi/);
});

test("resolveDiscoveryAnswersFromServer nie nadpisuje local state gdy formularz jest dirty", () => {
  const local = {
    ...createEmptyDiscoveryAnswers(),
    goals: "Lokalna wartosc",
  };
  const fetched = {
    ...createEmptyDiscoveryAnswers(),
    goals: "Wartosc z serwera",
  };

  const result = resolveDiscoveryAnswersFromServer({
    currentAnswers: local,
    fetchedAnswers: fetched,
    isDirty: true,
  });

  assert.equal(result.goals, "Lokalna wartosc");
});

test("resolveDiscoveryAnswersFromServer aktualizuje odpowiedzi gdy formularz nie jest dirty", () => {
  const local = createEmptyDiscoveryAnswers();
  const fetched = {
    ...createEmptyDiscoveryAnswers(),
    goals: "Wartosc z serwera",
  };

  const result = resolveDiscoveryAnswersFromServer({
    currentAnswers: local,
    fetchedAnswers: fetched,
    isDirty: false,
  });

  assert.equal(result.goals, "Wartosc z serwera");
});

test("withRequestId dolacza requestId do komunikatu bledu", () => {
  assert.equal(
    withRequestId("Nie udalo sie zapisac", "req-123"),
    "Nie udalo sie zapisac [requestId: req-123]",
  );
  assert.equal(withRequestId("Nie udalo sie zapisac", null), "Nie udalo sie zapisac");
});

test("RBAC helpers zwracaja widoczne moduly i blokuja edycje bez policy", () => {
  const policies = [
    { module: "CLIENTS", canView: true, canEdit: false, canManage: false },
    { module: "DISCOVERY", canView: true, canEdit: true, canManage: false },
    { module: "STRATEGY", canView: false, canEdit: false, canManage: false },
  ];

  const visible = buildVisibleModules(policies);
  assert.deepEqual(visible, ["CLIENTS", "DISCOVERY"]);
  assert.equal(canEditModule(policies, "CLIENTS"), false);
  assert.equal(canEditModule(policies, "DISCOVERY"), true);
  assert.equal(resolveModulePolicy(policies, "GOVERNANCE").canView, false);
});

test("widok clients blokuje akcje create/edit po RBAC w formularzu", () => {
  assert.match(workspaceViewSource, /disabled=\{!props\.canEditClientsModule\}/);
  assert.match(
    workspaceViewSource,
    /disabled=\{props\.isSubmitting \|\| !props\.canEditClientsModule\}/,
  );
});
