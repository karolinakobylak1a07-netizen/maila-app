---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: ['{planning_artifacts}/prd.md', '{planning_artifacts}/architecture.md']
---

# fisrt project - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for fisrt project, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Owner może tworzyć, edytować i archiwizować profile klientów (AC: można utworzyć/edytować/archiwizować profil z nazwą i statusem).
FR2: System może utrzymuje odseparowany kontekst danych per klient/projekt (AC: dane i rekomendacje klienta A nie są widoczne w kontekście klienta B).
FR3: Użytkownik może przełączać się między klientami bez utraty kontekstu pracy (AC: przełączenie klienta zachowuje kontekst pracy (ostatni widok)).
FR4: System może przechowuje historię decyzji strategicznych per klient (AC: każda decyzja ma wpis z datą i autorem).
FR5: Owner może prowadzić ustrukturyzowany discovery call z zapisem odpowiedzi (AC: zapis obejmuje odpowiedzi na min. 10 kluczowych pytań).
FR6: System może identyfikuje braki informacji i prosi o uzupełnienia (AC: system wskazuje brakujące pola i blokuje przejście dalej).
FR7: System może zbiera kluczowe dane biznesowe klienta (cele, segmenty, sezonowość, oferta) (AC: wymagane pola: cele, segmenty, sezonowość, oferta).
FR8: System może importuje/analizuje dane z Klaviyo na poziomie: konto → flow → email → formularze (AC: analiza obejmuje konto, flow, email, formularze; wynik zawiera listę elementów i status (OK/Gap)).
FR9: System może identyfikuje luki w konfiguracji (np. brak flow/segmentów/logiki) (AC: wykrywa brakujące flow/segmenty/logikę i wskazuje je w raporcie z nazwą i powodem).
FR10: System może wykrywa słabe ogniwa i obszary do optymalizacji (AC: wskazuje min. 3 priorytetowe obszary optymalizacji z uzasadnieniem).
FR11: System może generuje wnioski analityczne z danych, powiązane z kontekstem klienta (AC: wnioski zawierają źródło danych i rekomendację działania).
FR12: System może generuje ustrukturyzowaną strategię email marketingu per klient (AC: strategia zawiera cele, segmenty, ton, priorytety, KPI).
FR13: System może tworzy plan flow i automatyzacji zgodny ze strategią (AC: plan flow zawiera listę flow, wyzwalacze, cele i priorytety).
FR14: System może planuje kalendarz kampanii na podstawie celów i sezonowości (AC: kalendarz zawiera min. 4 tygodnie, typ kampanii, cel i segment).
FR15: System może proponuje segmentację odbiorców zgodną z celami (AC: segmentacja zawiera kryteria wejścia i cel segmentu).
FR16: Content Lead może generować drafty maili na podstawie strategii i segmentu (AC: draft zawiera temat, preheader, body i CTA).
FR17: System może generuje briefy komunikacyjne (cel, segment, ton, priorytet) (AC: brief zawiera cel, segment, ton, priorytet i KPI).
FR18: Owner może zatwierdzać/odrzucać treści przed wdrożeniem (AC: status treści = zatwierdzona/odrzucona z komentarzem).
FR19: Operations Lead może prowadzić wdrożenie z checklistą kroków (AC: checklisty mają status i datę wykonania).
FR20: System może pokazuje zależności między flow/segmentami/kampaniami (AC: zależności pokazują poprzedniki/następniki).
FR21: System może wykrywa potencjalne konflikty wdrożeniowe (AC: konflikt oznacza elementy i powód).
FR22: System może wspiera przygotowanie materiałów do wdrożenia w Klaviyo (AC: lista materiałów do wdrożenia jest eksportowalna).
FR23: System może generuje raporty wyników dla klienta (AC: raport zawiera KPI, trend, wnioski i rekomendacje).
FR24: System może proponuje rekomendacje optymalizacyjne z uzasadnieniem (AC: rekomendacja zawiera powód, oczekiwany efekt i priorytet).
FR25: System może sugeruje testy A/B i kolejne działania (AC: test A/B zawiera hipotezę, warianty i metrykę sukcesu).
FR26: System może zapewnia wersjonowanie strategii, planów i treści (AC: wersje mają numer, autora i datę).
FR27: System może rejestruje logi decyzji i zmian (audytowalność) (AC: log zawiera: kto, co, kiedy).
FR28: System może umożliwia ręczne zatwierdzanie kluczowych rekomendacji (AC: rekomendacje wymagają akceptacji przed użyciem).
FR29: System może egzekwuje dostęp per rola (Owner, Strategy, Content, Operations) (AC: rola determinuje listę widocznych modułów).
FR30: System może ogranicza widoczność/edycję do zakresu odpowiedzialności roli (AC: brak uprawnień blokuje edycję).
FR31: System może generuje dokumentację dla klienta (strategie/raporty) (AC: dokumentacja zawiera strategię, plan działań i raport w formacie do udostępnienia).
FR32: System może umożliwia eksport materiałów do narzędzi pracy (np. Notion/Docs) (AC: eksport do formatu pliku lub linku udostępnienia).

### NonFunctional Requirements

NFR1: Przełączanie klienta/widoków: ≤ 2 s (95. percentyl), mierzone monitoringiem aplikacji.
NFR2: Odświeżenie danych (sync/refresh): ≤ 5–10 s (95. percentyl), mierzone logami sync.
NFR3: Generowanie strategii/raportu: ≤ 30–60 s (95. percentyl), mierzone czasem wykonania zadań.
NFR4: Szyfrowanie danych w tranzycie (HTTPS/TLS) i w spoczynku (AES-256); weryfikacja przez testy bezpieczeństwa.
NFR5: Retencja danych: czas współpracy + 12 miesięcy po zakończeniu; polityka retencji egzekwowana automatycznie.
NFR6: Usunięcie danych na żądanie w ciągu 30 dni kalendarzowych; potwierdzenie w logach audytu.
NFR7: Dostępność: ≥ 99% miesięcznie, mierzona przez monitoring uptime.
NFR8: Przestoje w godzinach pracy nie dłuższe niż 30 min jednorazowo; monitorowane w logach dostępności.
NFR9: Obsługa min. 15 klientów/projektów równolegle przy zachowaniu czasów odpowiedzi z sekcji Performance; potwierdzone testem obciążeniowym.
NFR10: Dostępność zgodna z dobrymi praktykami: kontrast ≥ 4.5:1, logiczna hierarchia nagłówków; weryfikacja checklistą UX.
NFR11: Brak formalnego wymogu WCAG AA (wewnętrzne narzędzie) — weryfikacja: checklisty dostępności.
NFR12: Manualny sync na żądanie + automatyczny sync 1x dziennie; logowana data ostatniej synchronizacji i wynik sync.
NFR13: Brak wymogu real‑time streamingu; dane aktualizowane wyłącznie przez sync (manualny lub dzienny), potwierdzone logami sync.
NFR14: Logi decyzji i wersje strategii przechowywane przez cały okres współpracy + 12 miesięcy; weryfikacja przez audyt logów.

### Additional Requirements

- Starter template (MVP): preferowany **Create-T3-App** (Next.js + tRPC + Prisma + NextAuth) dla szybkiego startu full-stack.
- Alternatywa startera: **create-next-app** (Next.js App Router + Tailwind + Prisma/Auth) przy mniejszym narzucie.
- Opcja rozwojowa: **Next.js + NestJS** w monorepo, gdy logika backendu i integracje znacząco rosną.
- Stack bazowy: TypeScript, Next.js/React, PostgreSQL 17, Prisma, Zod.
- API strategy: tRPC dla komunikacji aplikacji + REST dla webhooków/integracji (Klaviyo/e-commerce).
- Auth i autoryzacja: NextAuth/Auth.js v4 + RBAC (Owner, Strategy, Content, Operations) + sesje DB.
- Auditability: `audit_log` append-only + obowiązkowy `requestId` dla błędów i logów operacyjnych.
- Sync model: manual trigger + cron daily; brak real-time streamingu w MVP.
- Error contract: wspólny format błędów `code/message/details/requestId` w całym systemie.
- Security: szyfrowanie sekretów integracyjnych na poziomie aplikacji + rate limiting per endpoint i globalny baseline.
- Infrastructure: Vercel (app), Railway (PostgreSQL), środowiska dev/preview/prod, CI/CD przez GitHub Actions.
- Monitoring MVP: app logs, healthchecks i error tracking (np. Sentry).

### FR Coverage Map

FR1: Epic 1 - Zarzadzanie profilem klienta i cyklem zycia.
FR2: Epic 1 - Izolacja kontekstu danych per klient/projekt.
FR3: Epic 1 - Przelaczanie klientow bez utraty kontekstu pracy.
FR4: Epic 1 - Historia decyzji strategicznych per klient.
FR5: Epic 1 - Ustrukturyzowany discovery call i zapis odpowiedzi.
FR6: Epic 1 - Detekcja brakow informacji i blokada przejscia dalej.
FR7: Epic 1 - Zbieranie kluczowych danych biznesowych klienta.
FR8: Epic 2 - Import i analiza danych Klaviyo (konto -> flow -> email -> formularze).
FR9: Epic 2 - Wykrywanie luk konfiguracji i raportowanie powodow.
FR10: Epic 2 - Wykrywanie slabych ogniw i priorytety optymalizacji.
FR11: Epic 2 - Wnioski analityczne powiazane z kontekstem klienta.
FR12: Epic 3 - Generowanie ustrukturyzowanej strategii email.
FR13: Epic 3 - Tworzenie planu flow i automatyzacji.
FR14: Epic 3 - Planowanie kalendarza kampanii.
FR15: Epic 3 - Propozycja segmentacji odbiorcow.
FR16: Epic 4 - Generowanie draftow maili.
FR17: Epic 4 - Generowanie briefow komunikacyjnych.
FR18: Epic 4 - Personalizacja draftow na bazie segmentow.
FR19: Epic 5 - Wdrozenie prowadzone checklista krokow.
FR20: Epic 5 - Widocznosc zaleznosci flow/segmenty/kampanie.
FR21: Epic 5 - Wykrywanie konfliktow wdrozeniowych.
FR22: Epic 5 - Przygotowanie i eksport materialow wdrozeniowych.
FR23: Epic 6 - Raporty wynikow dla klienta.
FR24: Epic 6 - Rekomendacje optymalizacyjne z uzasadnieniem.
FR25: Epic 6 - Sugestie testow A/B i kolejnych dzialan.
FR26: Epic 6 - Wersjonowanie strategii, planow i tresci.
FR27: Epic 6 - Rejestrowanie logow decyzji i zmian.
FR28: Epic 6 - Manualne zatwierdzanie kluczowych rekomendacji.
FR29: Epic 1 - Egzekwowanie dostepu per rola.
FR30: Epic 1 - Ograniczenia widocznosci i edycji wg roli.
FR31: Epic 6 - Generowanie dokumentacji dla klienta.
FR32: Epic 6 - Eksport materialow do narzedzi pracy.

## NFR to Epic/Story Mapping

### Performance
- NFR1 (switch <= 2s): Epic 1 / Story 1.2
- NFR2 (sync refresh <= 5-10s): Epic 2 / Story 2.1
- NFR3 (strategy/report generation <= 30-60s): Epic 3 / Story 3.1, Epic 6 / Story 6.1

### Security & Privacy
- NFR4 (TLS + AES-256): Epic 1 / Story 1.1, Epic 2 / Story 2.1
- NFR5 (retention + 12 months): Epic 6 / Story 6.4, Story 6.5
- NFR6 (deletion on request <= 30 days): Epic 1 / Story 1.2, Epic 6 / Story 6.5

### Reliability
- NFR7 (>= 99% availability): Epic 2 / Story 2.1, Epic 6 / Story 6.1
- NFR8 (downtime <= 30 min): Epic 2 / Story 2.1, Epic 5 / Story 5.3

### Scalability
- NFR9 (>= 15 clients/projects): Epic 1 / Story 1.2, Epic 2 / Story 2.1

### Accessibility
- NFR10 (contrast and heading hierarchy): Epic 1 / Story 1.2, Epic 4 / Story 4.3
- NFR11 (internal accessibility checklist): Epic 1 / Story 1.2, Epic 4 / Story 4.1

### Integration
- NFR12 (manual + daily sync with logs): Epic 2 / Story 2.1
- NFR13 (no realtime, sync-only updates): Epic 2 / Story 2.1, Epic 6 / Story 6.1

### Auditability
- NFR14 (decision/version logs retention): Epic 1 / Story 1.3, Epic 6 / Story 6.4, Story 6.5


## Epic List

### Epic 1: Client Workspace, Context & Access Foundation
Uzytkowniczka moze zarzadzac klientami, prowadzic discovery i pracowac w odseparowanych kontekstach danych z kontrola dostepu per rola.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR29, FR30

### Epic 2: Klaviyo Audit & Insight Engine
Uzytkowniczka moze zsynchronizowac i przeanalizowac dane Klaviyo, wykryc luki i otrzymac priorytety optymalizacji.
**FRs covered:** FR8, FR9, FR10, FR11

### Epic 3: Strategy & Campaign Planning
Uzytkowniczka moze wygenerowac strategie email marketingu, plan flow, kalendarz kampanii i segmentacje.
**FRs covered:** FR12, FR13, FR14, FR15

### Epic 4: Content Briefing, Drafting & Personalization
Uzytkowniczka moze tworzyc briefy i drafty tresci oraz personalizowac komunikacje na bazie segmentow.
**FRs covered:** FR16, FR17, FR18

### Epic 5: Implementation Orchestration
Uzytkowniczka moze prowadzic wdrozenie przez checklisty, zaleznosci i detekcje konfliktow oraz przygotowac paczki wdrozeniowe.
**FRs covered:** FR19, FR20, FR21, FR22

### Epic 6: Reporting, Optimization & Governance
Uzytkowniczka moze tworzyc raporty i rekomendacje, prowadzic governance (wersje, logi, akceptacje) oraz eksportowac dokumentacje.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR31, FR32

## Epic 1: Client Workspace, Context & Access Foundation

Wlacicielka agencji otrzymuje stabilne srodowisko pracy klientowej: profile klientow, izolacje kontekstu, discovery i RBAC, aby bezpiecznie prowadzic wiele projektow.

### Story 1.1: Setup projektu ze starter template (Create-T3-App)

As a Developer,
I want utworzyc bazowy projekt ze wskazanego starter template,
So that zespol ma gotowe i spojne srodowisko do implementacji kolejnych historii.

**Acceptance Criteria:**

**Given** zatwierdzona decyzja architektoniczna o starterze Create-T3-App
**When** inicjalizuje repozytorium projektu i instaluje zaleznosci
**Then** aplikacja uruchamia sie lokalnie z podstawowa konfiguracja TypeScript, Tailwind, auth i Prisma
**And** dokumentacja uruchomienia oraz zmienne srodowiskowe sa opisane w README.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** inicjalizacja projektu wymaga dostepu do zewnetrznych paczek
**When** instalacja zaleznosci nie powiedzie sie (network lock/version conflict)
**Then** proces setup zatrzymuje sie z czytelnym komunikatem bledu
**And** README zawiera kroki recovery i ponowienia.

**Given** uruchamianie migracji inicjalnej wymaga dostepu do bazy
**When** polaczenie z baza jest bledne lub niedostepne
**Then** aplikacja nie przechodzi do stanu "ready"
**And** blad zawiera requestId i wskazowke konfiguracji `.env`.

### Story 1.2: Zarzadzanie profilami klientow i bezpieczne przelaczanie kontekstu

As a Owner,
I want tworzyc, edytowac i archiwizowac profile oraz przelaczac klientow bez mieszania danych,
So that moge prowadzic wiele projektow jednoczesnie w uporzadkowany i bezpieczny sposob.

**Acceptance Criteria:**

**Given** zalogowana Owner znajduje sie w module klientow
**When** tworzy lub edytuje profil klienta (nazwa, status)
**Then** profil zostaje zapisany i jest widoczny na liscie klientow
**And** archiwizacja profilu jest mozliwa bez utraty historii decyzji.

**Given** system zawiera co najmniej dwa profile klientow
**When** uzytkowniczka przelacza sie z klienta A na klienta B
**Then** widzi wylacznie dane, rekomendacje i artefakty klienta B
**And** po powrocie do klienta A system odtwarza ostatni widok pracy.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** uzytkownik bez uprawnien edycji probuje zmienic profil klienta
**When** wysyla zadanie zapisu
**Then** system odrzuca operacje kodem "forbidden"
**And** nie zapisuje zadnych zmian w bazie.

**Given** zapis profilu klienta konczy sie bledem bazy danych
**When** Owner zatwierdza formularz
**Then** system pokazuje blad zapisu i zachowuje dane formularza bez utraty
**And** historia decyzji i inne dane klienta pozostaja nieskazone.

### Story 1.3: Historia decyzji strategicznych per klient

As a Owner,
I want rejestrowac i przegladac decyzje strategiczne,
So that zachowuje ciaglosc ustalen i latwo wracam do uzasadnien.

**Acceptance Criteria:**

**Given** istnieje profil klienta
**When** uzytkowniczka zapisuje decyzje strategiczna
**Then** system tworzy wpis z data, autorem i trescia decyzji
**And** wpis jest widoczny w historii tylko tego klienta.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** uzytkownik probuje zapisac decyzje dla klienta spoza aktywnego kontekstu
**When** wysyla formularz decyzji
**Then** system odrzuca zapis jako naruszenie izolacji kontekstu
**And** wpis nie pojawia sie w historii zadnego klienta.

**Given** zapis wpisu do historii konczy sie bledem transakcji
**When** Owner potwierdza dodanie decyzji
**Then** system zwraca jednoznaczny blad operacyjny
**And** nie tworzy czesciowego wpisu w logach/audicie.

### Story 1.4: Discovery onboarding z walidacja brakow

As a Owner,
I want przeprowadzic ustrukturyzowany discovery call,
So that system posiada komplet danych potrzebnych do dalszej analizy i strategii.

**Acceptance Criteria:**

**Given** rozpoczety onboarding klienta
**When** uzytkowniczka uzupelnia formularz discovery
**Then** system wymaga co najmniej 10 kluczowych odpowiedzi
**And** blokuje przejscie dalej, dopoki pola cele, segmenty, sezonowosc i oferta nie sa kompletne.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** formularz discovery zawiera brakujace pola wymagane
**When** uzytkowniczka probuje przejsc do kolejnego etapu
**Then** system wskazuje konkretne brakujace pola i ich walidacje
**And** nie pozwala zamknac etapu discovery.

**Given** zapis odpowiedzi discovery nie powiedzie sie po stronie bazy
**When** uzytkowniczka klika "Zapisz"
**Then** system informuje o niepowodzeniu i nie oznacza etapu jako kompletnego
**And** niezapisane odpowiedzi pozostaja widoczne do ponownego zapisu.

### Story 1.5: Egzekwowanie dostepu per rola i ograniczenia edycji

As a Owner,
I want definiowac uprawnienia rol (Owner, Strategy, Content, Operations),
So that kazda rola widzi i edytuje tylko dozwolony zakres.

**Acceptance Criteria:**

**Given** uzytkownik ma przypisana role systemowa
**When** otwiera aplikacje i probuje wejsc do modulu poza zakresem roli
**Then** system ukrywa niedozwolone moduly lub blokuje dostep
**And** edycja jest niedostepna tam, gdzie rola ma tylko podglad.

## Epic 2: Klaviyo Audit & Insight Engine

Wlacicielka i strateg moga pobrac dane z Klaviyo, wykryc luki oraz otrzymac praktyczne insighty z jasnym priorytetem dzialan.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** uzytkownik bez roli Owner probuje zmienic konfiguracje RBAC
**When** wysyla zadanie aktualizacji uprawnien
**Then** system odrzuca operacje kodem "forbidden"
**And** zapisuje probe jako zdarzenie audytowe.

**Given** podczas ladowania modulow nie mozna pobrac polityk uprawnien
**When** uzytkownik otwiera aplikacje
**Then** system przechodzi w tryb bezpieczny (minimum uprawnien)
**And** ukrywa akcje edycyjne do czasu poprawnego odczytu RBAC.

### Story 2.1: Sync i inwentaryzacja danych Klaviyo

As a Strategy & Insight Lead,
I want uruchomic sync danych Klaviyo na poziomie konto, flow, email i formularze,
So that mam kompletny obraz obecnej konfiguracji klienta.

**Acceptance Criteria:**

**Given** klient ma skonfigurowana integracje Klaviyo
**When** uruchamiany jest sync manualny lub dzienny
**Then** system pobiera elementy konto/flow/email/formularze i zapisuje ich status
**And** data i wynik ostatniej synchronizacji sa logowane.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** token API Klaviyo jest wygasniety lub niepoprawny
**When** uruchamiany jest sync
**Then** system oznacza sync jako "failed_auth"
**And** nie nadpisuje poprzednio poprawnie zsynchronizowanych danych.

**Given** sync trwa dluzej niz dozwolony czas operacji
**When** przekroczony zostanie timeout zadania
**Then** system oznacza sync jako "partial_or_timeout" z requestId
**And** pozwala na bezpieczny retry bez duplikowania rekordow.

### Story 2.2: Raport luk konfiguracji

As a Strategy & Insight Lead,
I want otrzymac raport brakow w flow, segmentach i logice,
So that moge szybko wskazac krytyczne obszary do uzupelnienia.

**Acceptance Criteria:**

**Given** zakonczony sync danych Klaviyo
**When** uruchamiam audyt konfiguracji
**Then** system wskazuje brakujace elementy z nazwa i powodem
**And** kazda luka otrzymuje status i priorytet do naprawy.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** audyt konfiguracji uruchomiono bez aktualnych danych sync
**When** dane sa starsze niz ustalony prog swiezosci
**Then** system blokuje publikacje raportu luk
**And** wymaga wykonania sync przed analiza.

**Given** API zewnetrzne zwraca niekompletne dane flow/segmentow
**When** system generuje raport luk
**Then** oznacza pozycje jako "insufficient_data"
**And** nie klasyfikuje ich falszywie jako "Gap" bez uzasadnienia.

### Story 2.3: Wykrywanie slabych ogniw i priorytetyzacja optymalizacji

As a Strategy & Insight Lead,
I want dostac liste najslabszych obszarow performance,
So that moge zaplanowac dzialania o najwyzszym potencjale efektu.

**Acceptance Criteria:**

**Given** system ma dane historyczne i wynik audytu
**When** generowana jest analiza optymalizacyjna
**Then** system wskazuje minimum 3 priorytetowe obszary z uzasadnieniem
**And** kazdy obszar ma sugerowany oczekiwany efekt biznesowy.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** zestaw metryk jest niewystarczajacy do wiarygodnej priorytetyzacji
**When** uruchamiana jest analiza optymalizacyjna
**Then** system zwraca wynik "insufficient_data_for_priority"
**And** wskazuje jakie dane nalezy uzupelnic.

**Given** analiza AI przekracza limit czasu przetwarzania
**When** operacja nie konczy sie w SLA
**Then** system zwraca status "timed_out" i zapisuje postep czesciowy
**And** umozliwia ponowienie bez utraty poprzednich wynikow.

### Story 2.4: Insighty powiazane z kontekstem klienta

As a Strategy & Insight Lead,
I want otrzymywac wnioski zrodlowe powiazane z kontekstem marki,
So that rekomendacje nie sa generyczne i daja sie od razu wdrozyc.

**Acceptance Criteria:**

**Given** istnieje kontekst klienta i wyniki analizy
**When** system generuje insighty
**Then** kazdy insight zawiera zrodlo danych i rekomendowane dzialanie
**And** insight odnosi sie do celow i priorytetow konkretnego klienta.

## Epic 3: Strategy & Campaign Planning

Wlacicielka i strateg moga przejsc od insightow do gotowego planu strategicznego i operacyjnego kampanii.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brakuje kluczowego kontekstu marki (cele/segmenty/priorytety)
**When** system generuje insighty
**Then** oznacza rekomendacje jako "draft_low_confidence"
**And** wymaga uzupelnienia kontekstu przed finalna publikacja.

**Given** zrodla danych sa sprzeczne lub niespojne czasowo
**When** system buduje insight
**Then** wskazuje konflikt zrodel w uzasadnieniu
**And** nie generuje jednoznacznej rekomendacji bez walidacji czlowieka.

### Story 3.1: Generowanie strategii email marketingu

As a Owner,
I want wygenerowac ustrukturyzowana strategie email,
So that zespol pracuje na jednym, spojnym kierunku.

**Acceptance Criteria:**

**Given** klient ma uzupelniony discovery i audyt
**When** uruchamiam generowanie strategii
**Then** dokument strategii zawiera cele, segmenty, ton, priorytety i KPI
**And** strategia jest przypisana do konkretnego klienta i wersji.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** discovery lub audyt nie sa kompletne
**When** Owner uruchamia generowanie strategii
**Then** system blokuje operacje i wskazuje brakujace warunki wejsciowe
**And** nie tworzy niepelnej wersji strategii.

**Given** generowanie strategii trwa dluzej niz SLA
**When** przekroczony zostaje limit czasu zadania
**Then** system zapisuje status "in_progress_or_timeout"
**And** umozliwia bezpieczne wznowienie bez duplikowania wersji.

### Story 3.2: Plan flow i automatyzacji

As a Owner,
I want otrzymac plan flow zgodny ze strategia,
So that wdrozenie automatyzacji przebiega wedlug jasnych priorytetow.

**Acceptance Criteria:**

**Given** istnieje zatwierdzona strategia klienta
**When** generowany jest plan flow
**Then** plan zawiera liste flow, wyzwalacze, cele i priorytety
**And** kazdy flow ma wskazany powod biznesowy zgodny ze strategia.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** strategia nie ma statusu "zatwierdzona"
**When** uruchamiane jest generowanie planu flow
**Then** system odrzuca operacje jako niespelnione precondition
**And** wskazuje wymagany krok zatwierdzenia strategii.

**Given** zapis planu flow do bazy nie powiedzie sie
**When** system finalizuje plan
**Then** zadanie oznaczane jest jako "failed_persist"
**And** uzytkownik nie widzi czesciowo zapisanego planu.

### Story 3.3: Kalendarz kampanii oparty o cele i sezonowosc

As a Owner,
I want zaplanowac kampanie na osi czasu,
So that zespol realizuje komunikacje regularnie i zgodnie z sezonowoscia.

**Acceptance Criteria:**

**Given** strategia i dane sezonowe sa dostepne
**When** tworze kalendarz kampanii
**Then** system proponuje minimum 4 tygodnie planu
**And** kazda kampania ma cel, segment i typ kampanii.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brak danych sezonowosci dla klienta
**When** system tworzy kalendarz kampanii
**Then** generuje plan bazowy z oznaczeniem "seasonality_missing"
**And** wymaga recznej walidacji przed publikacja.

**Given** uzytkownik bez uprawnien edycji kampanii probuje zapisac kalendarz
**When** wysyla zmiany
**Then** system odrzuca zapis kodem "forbidden"
**And** pozostawia ostatnia zatwierdzona wersje bez zmian.

### Story 3.4: Propozycja segmentacji odbiorcow

As a Strategy & Insight Lead,
I want otrzymac segmentacje zgodna z celami,
So that komunikacja jest trafna i dopasowana do etapu klienta.

**Acceptance Criteria:**

**Given** zdefiniowane cele i dane klienta
**When** system generuje segmenty
**Then** kazdy segment zawiera kryteria wejscia i cel segmentu
**And** segmenty mozna wykorzystac bezposrednio w planie kampanii i flow.

## Epic 4: Content Briefing, Drafting & Personalization

Content i Owner moga szybko przejsc od strategii do gotowych tresci i wariantow segmentowych, zachowujac spojny kontekst biznesowy.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brak segmentow lub brak danych segmentacyjnych
**When** system probuje personalizowac draft email
**Then** zwraca status "segment_data_missing"
**And** nie publikuje wariantow personalizacji.

**Given** finalizacja personalizacji draftu nie powiedzie sie
**When** system zapisuje wynik personalizacji
**Then** zwraca status "failed_generation" z requestId
**And** nie publikuje wariantow w statusie "ok".

### Story 4.1: Generowanie briefu komunikacyjnego

As a Content & Messaging Lead,
I want generowac briefy kampanii,
So that copywriting startuje z jasnym celem i kontekstem.

**Acceptance Criteria:**

**Given** istnieje strategia i wybrany segment
**When** tworze brief komunikacyjny
**Then** brief zawiera cel, segment, ton, priorytet i KPI
**And** brief jest zapisywany jako artefakt klienta.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** nie wybrano segmentu lub celu kampanii
**When** Content Lead probuje utworzyc brief
**Then** system blokuje generowanie briefu
**And** wskazuje brakujace pola wymagane.

**Given** uzytkownik bez roli Content/Owner probuje edytowac brief
**When** wysyla zmiany
**Then** system odrzuca operacje kodem "forbidden"
**And** zapisuje probe w audit log.

### Story 4.2: Generowanie draftow maili z briefu

As a Content & Messaging Lead,
I want tworzyc drafty emaili na podstawie briefu,
So that szybciej przygotowuje tresci gotowe do review.

**Acceptance Criteria:**

**Given** istnieje brief komunikacyjny
**When** uruchamiam generowanie draftu
**Then** draft zawiera temat, preheader, body i CTA
**And** draft jest przypisany do segmentu i celu kampanii.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** generowanie draftu AI przekracza limit czasu
**When** zadanie nie konczy sie w SLA
**Then** system zwraca status "timed_out"
**And** pozwala na ponowienie bez utraty briefu wejsciowego.

**Given** API modelu zwraca blad lub pusty wynik
**When** system finalizuje draft
**Then** nie tworzy artefaktu draftu w stanie "gotowy"
**And** oznacza zadanie jako "failed_generation" z requestId.

### Story 4.3: Personalizacja draftow na bazie segmentow

As a Content & Messaging Lead,
I want personalizowac drafty email na bazie segmentow,
So that tresc i komunikat sa dopasowane do konkretnej grupy odbiorcow.

**Acceptance Criteria:**

**Given** istnieje draft email i segmenty klienta
**When** uruchamiam personalizacje draftu
**Then** system tworzy warianty per segment z dopasowanym tematem, preheaderem, body i CTA
**And** wynik jest zapisywany jako artefakt klienta.

## Epic 5: Implementation Orchestration

Operations moze wdrazac plan w kontrolowany sposob, z widocznoscia zaleznosci i automatyczna detekcja konfliktow.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** uzytkownik inny niz Owner probuje zatwierdzic tresc
**When** wykonuje akcje akceptacji/odrzucenia
**Then** system odrzuca operacje jako brak uprawnien
**And** status tresci pozostaje bez zmian.

**Given** zapis decyzji review do bazy nie powiedzie sie
**When** Owner zatwierdza lub odrzuca draft
**Then** system pokazuje blad zapisu i nie zmienia statusu draftu
**And** komentarz review nie jest zapisywany czesciowo.

### Story 5.1: Checklisty wdrozeniowe z trackingiem realizacji

As a Operations & Implementation Lead,
I want prowadzic wdrozenia przez checklisty,
So that ograniczam pomylki i pomijanie krokow.

**Acceptance Criteria:**

**Given** istnieje plan flow i kampanii
**When** tworzona jest checklista wdrozeniowa
**Then** kazdy krok ma status oraz date wykonania
**And** postep checklisty jest widoczny dla zespolu.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** dwa uzytkowniki jednoczesnie aktualizuja ten sam krok checklisty
**When** dochodzi do konfliktu wersji
**Then** system wykrywa konflikt i wymaga odswiezenia danych
**And** nie nadpisuje zmian bez swiadomego potwierdzenia.

**Given** zapis statusu kroku nie powiedzie sie
**When** Operations aktualizuje checklist
**Then** system zwraca blad transakcji
**And** zachowuje poprzedni stan kroku bez niespojnosci dat wykonania.

### Story 5.2: Mapa zaleznosci miedzy flow, segmentami i kampaniami

As a Operations & Implementation Lead,
I want widziec zaleznosci implementacyjne,
So that prawidlowo ustalam kolejnosc wdrozen.

**Acceptance Criteria:**

**Given** istnieja elementy flow, segmentow i kampanii
**When** otwieram widok zaleznosci
**Then** system pokazuje poprzedniki i nastepniki dla kazdego elementu
**And** zmiana jednego elementu aktualizuje powiazania w widoku.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** mapa zaleznosci zawiera brakujace relacje zrodlowe
**When** uzytkownik otwiera widok zaleznosci
**Then** system oznacza elementy jako "incomplete_dependency_data"
**And** nie prezentuje niezweryfikowanych polaczen jako pewnych.

**Given** rola bez uprawnien do modułu implementacji otwiera widok zaleznosci
**When** probuje przegladac szczegoly techniczne
**Then** system ogranicza widocznosc zgodnie z RBAC
**And** blokuje akcje edycyjne.

### Story 5.3: Detekcja konfliktow wdrozeniowych

As a Operations & Implementation Lead,
I want automatycznie wykrywac kolizje,
So that moge naprawic plan przed publikacja zmian.

**Acceptance Criteria:**

**Given** plan wdrozenia zawiera zalezne elementy
**When** uruchamiam walidacje planu
**Then** system wskazuje konflikty wraz z elementami i powodem
**And** proponuje rekomendowany plan naprawczy.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** walidacja konfliktow dziala na niepelnym zbiorze danych
**When** uruchamiana jest detekcja kolizji
**Then** system zwraca status "validation_incomplete"
**And** wymaga uzupelnienia danych przed publikacja planu.

**Given** detekcja konfliktow trwa dluzej niz dopuszczalne SLA
**When** operacja przekracza timeout
**Then** system zapisuje wynik czesciowy i status "timed_out"
**And** umozliwia restart walidacji bez utraty danych planu.

### Story 5.4: Eksport paczki materialow do wdrozenia w Klaviyo

As a Operations & Implementation Lead,
I want eksportowac komplet materialow wdrozeniowych,
So that moge sprawnie przeniesc plan do wykonania w Klaviyo.

**Acceptance Criteria:**

**Given** plan wdrozeniowy jest gotowy
**When** wybieram eksport
**Then** system generuje liste materialow gotowa do wdrozenia
**And** eksport jest dostepny jako plik lub udostepnialny link.

## Epic 6: Reporting, Optimization & Governance

Owner i strateg moga monitorowac wyniki, rozwijac optymalizacje oraz utrzymywac audytowalnosc i wersjonowanie calego procesu.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** paczka wdrozeniowa zawiera brakujace artefakty
**When** Operations uruchamia eksport
**Then** system blokuje eksport finalny
**And** podaje liste brakujacych elementow do uzupelnienia.

**Given** export service lub storage jest niedostepny
**When** system probuje wygenerowac plik/link
**Then** operacja konczy sie statusem "export_failed"
**And** uzytkownik otrzymuje mozliwosc ponowienia bez utraty konfiguracji eksportu.

### Story 6.1: Raporty wynikow klienta

As a Owner,
I want generowac raporty wynikow,
So that widze trend KPI i moge podejmowac decyzje o kolejnych krokach.

**Acceptance Criteria:**

**Given** system ma aktualne dane po synchronizacji
**When** generuje raport klienta
**Then** raport zawiera KPI, trend, wnioski i rekomendacje
**And** raport jest zapisywany w historii artefaktow klienta.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brak aktualnych danych po sync
**When** Owner uruchamia generowanie raportu
**Then** system oznacza raport jako "stale_data_warning"
**And** rekomenduje odswiezenie danych przed finalna publikacja.

**Given** generowanie raportu przekracza limit czasu
**When** operacja nie konczy sie w SLA
**Then** system zwraca status "timed_out"
**And** zapisuje postep czesciowy bez publikacji niepelnego raportu.

### Story 6.2: Rekomendacje optymalizacyjne z priorytetem

As a Strategy & Insight Lead,
I want otrzymac rekomendacje z uzasadnieniem,
So that planuje backlog optymalizacji wedlug realnego wplywu.

**Acceptance Criteria:**

**Given** dostepny jest raport i analiza luk
**When** system tworzy rekomendacje
**Then** kazda rekomendacja zawiera powod, oczekiwany efekt i priorytet
**And** rekomendacje sa zgodne z kontekstem klienta oraz strategia.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** analiza luk nie jest dostepna lub jest niekompletna
**When** system generuje rekomendacje
**Then** oznacza wynik jako "insufficient_input"
**And** nie nadaje wysokiego priorytetu bez uzasadnionych danych.

**Given** pipeline AI zwraca blad przetwarzania
**When** generowanie rekomendacji zostaje przerwane
**Then** system zapisuje status "failed_generation" z requestId
**And** utrzymuje ostatni zatwierdzony zestaw rekomendacji.

### Story 6.3: Planowanie testow A/B

As a Strategy & Insight Lead,
I want otrzymac gotowe propozycje testow A/B,
So that moge systematycznie poprawiac wyniki kampanii i flow.

**Acceptance Criteria:**

**Given** istnieja obszary do optymalizacji
**When** uruchamiam generator testow
**Then** system tworzy hipoteze, warianty i metryke sukcesu dla kazdego testu
**And** testy sa przypisane do konkretnych kampanii lub flow.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brak zdefiniowanej metryki sukcesu dla testu
**When** system buduje plan A/B
**Then** nie publikuje testu jako gotowego
**And** wymaga uzupelnienia hipotezy i metryki.

**Given** dane historyczne sa zbyt male do wiarygodnego testu
**When** system proponuje warianty
**Then** oznacza test jako "low_confidence"
**And** podaje minimalny prog danych wymagany do uruchomienia.

### Story 6.4: Wersjonowanie strategii, planow i tresci

As a Owner,
I want utrzymywac wersje kluczowych artefaktow,
So that moge sledzic ewolucje decyzji i bezpiecznie wracac do poprzednich ustalen.

**Acceptance Criteria:**

**Given** uzytkowniczka zapisuje zmiany w strategii, planie lub tresci
**When** publikowana jest nowa wersja
**Then** system nadaje numer wersji, autora i date
**And** poprzednie wersje pozostaja dostepne do podgladu.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** dwie osoby publikuja nowa wersje tego samego artefaktu jednoczesnie
**When** dochodzi do konfliktu wersjonowania
**Then** system stosuje optimistic locking i blokuje druga publikacje
**And** wymaga recznego merge/ponowienia.

**Given** zapis nowej wersji nie powiedzie sie w bazie
**When** uzytkowniczka publikuje zmiany
**Then** numer wersji nie jest inkrementowany
**And** poprzednia stabilna wersja pozostaje aktywna.

### Story 6.5: Audit log i manualne bramki akceptacji rekomendacji

As a Owner,
I want miec pelny audit trail i reczna akceptacje krytycznych rekomendacji,
So that utrzymuje kontrole nad ryzykiem i zgodnoscia decyzji.

**Acceptance Criteria:**

**Given** rekomendacja ma status krytyczna
**When** ma zostac zastosowana
**Then** system wymaga recznej akceptacji przed wykonaniem
**And** audit log zapisuje kto, co i kiedy zrobil wraz z requestId.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** rekomendacja krytyczna jest oznaczona do wykonania
**When** uzytkownik bez uprawnien akceptacji probuje ja zatwierdzic
**Then** system odrzuca akcje kodem "forbidden"
**And** zapisuje probe akceptacji w audit log.

**Given** zapis audytu nie powiedzie sie
**When** system probuje wykonac krytyczna akcje
**Then** operacja biznesowa zostaje zablokowana (fail-safe)
**And** rekomendacja pozostaje w stanie "pending_approval".

### Story 6.6: Generowanie dokumentacji dla klienta

As a Owner,
I want wygenerowac zestaw dokumentacji klientowej,
So that moge latwo udostepnic strategie, plan i raporty.

**Acceptance Criteria:**

**Given** istnieja aktualne artefakty projektu
**When** wybieram generowanie dokumentacji
**Then** system tworzy pakiet obejmujacy strategie, plan dzialan i raport
**And** pakiet jest gotowy do udostepnienia klientowi.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** brak jednego z wymaganych artefaktow (strategia/plan/raport)
**When** Owner uruchamia generowanie pakietu dokumentacji
**Then** system oznacza pakiet jako "incomplete"
**And** podaje konkretna liste brakujacych elementow.

**Given** generowanie pakietu trwa dluzej niz SLA
**When** zadanie przekroczy timeout
**Then** system zapisuje status "timed_out" i postep czesciowy
**And** pozwala wznowic generowanie od ostatniego etapu.

### Story 6.7: Eksport do narzedzi pracy (Notion/Docs)

As a Owner,
I want eksportowac materialy do narzedzi zespolu,
So that utrzymuje spojnosc operacyjna poza aplikacja.

**Acceptance Criteria:**

**Given** dokumentacja lub raport sa gotowe
**When** uruchamiam eksport
**Then** system udostepnia eksport jako plik i/lub link do udostepnienia
**And** eksport jest kompatybilny z przeplywem pracy Notion/Google Docs.

**Additional Acceptance Criteria (Error & Edge Cases):**

**Given** token integracji Notion/Docs jest niewazny
**When** Owner uruchamia eksport
**Then** system zwraca status "auth_failed"
**And** nie usuwa lokalnie przygotowanego pakietu eksportowego.

**Given** uzytkownik bez prawa eksportu probuje uruchomic synchronizacje do narzedzia
**When** wysyla zadanie eksportu
**Then** system odrzuca operacje kodem "forbidden"
**And** nie generuje linku udostepnienia.
