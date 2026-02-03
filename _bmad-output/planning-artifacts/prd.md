---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments: []
workflowType: 'prd'
documentCounts: { brief: 0, research: 0, brainstorming: 0, projectDocs: 0 }
classification:
  projectType: web_app
  domain: ecommerce_marketing_ops
  complexity: medium
  projectContext: greenfield
date: '2026-02-01T19:19:51Z'
---

# Product Requirements Document - fisrt project

**Author:** Karolcia  
**Date:** 2026-02-01T16:04:18Z

## Executive Summary

**Product:** AI‑powered Agency OS dla operacyjnego prowadzenia agencji email marketingu (wewnętrzne narzędzie).  
**Primary user:** właścicielka agencji + role wspierające (Strategy, Content, Operations) z AI jako współpracownikiem.  
**Problem:** chaos procesów, ręczna praca, trudność w skalowaniu i spójności decyzji.  
**Differentiator:** AI jako analityk/planner/ops, łączący dane z Klaviyo, kontekst klienta i workflowy — przy zachowaniu butikowej, ludzkiej decyzyjności.  
**MVP goal:** ustrukturyzowany proces discovery → audyt → strategia → plan flow/kampanii + podstawowe wykrywanie luk i plan działań.

## Success Criteria

### User Success
- Projekty klientów prowadzone konsekwentnie według ustrukturyzowanego procesu (discovery → audyt → strategia → flow → kampanie → raporty), bez improwizacji.
- Wysoki poziom automatyzacji procesów operacyjnych poza “core” pracy właścicielki (szczególnie powtarzalnych i czasochłonnych).
- AI wspiera kluczowe zadania: copy, raporty, kontrola wyników, rekomendacje optymalizacji, tworzenie struktur i planów działań.
- System sam analizuje dane z Klaviyo (konto → flow → pojedynczy email → formularze) i wskazuje luki, problemy oraz następne kroki.
- Realna oszczędność czasu przekładająca się na większy fokus na strategię i relacje z klientami.
- Jasność “co dalej” na każdym etapie współpracy z klientem.

### Business Success
**3 miesiące:**
- Skrócenie czasu przygotowania strategii i planu działań o min. 40–50%.
- Możliwość obsługi >1 klienta jednocześnie bez poczucia chaosu.

**12 miesięcy:**
- Obsługa kilku klientów równolegle bez proporcjonalnego wzrostu pracy ręcznej.
- Wyższa marża dzięki automatyzacji procesów.
- Powtarzalny model działania niezależny od pamięci/energii właścicielki.
- Klienci szybciej widzą pierwsze rezultaty dzięki spersonalizowanej strategii.

### Technical Success
- Spójne rekomendacje (flow, kampanie, segmenty) zgodne ze strategią.
- Utrzymanie kontekstu klienta bez gubienia ustaleń.
- System działa jako spójny workflow, a nie pojedyncze, oderwane odpowiedzi.
- Generowanie gotowych do użycia materiałów (strategie, plany, raporty).
- Analiza danych Klaviyo na poziomach: konto → flow → email → formularze.
- Wykrywanie braków/słabych ogniw i proponowanie testów A/B oraz kolejnych działań.

### Measurable Outcomes
- Czas przygotowania strategii i planu działań skrócony o 40–50% w ciągu 3 miesięcy.
- Możliwość obsługi >1 klienta bez chaosu w pierwszym kwartale.
- Obsługa kilku klientów równolegle bez proporcjonalnego wzrostu pracy ręcznej w 12 miesięcy.
- Wzrost marży dzięki automatyzacji (do doprecyzowania % lub celu finansowego).
- Skrócenie czasu do “pierwszego efektu” u klientów (do doprecyzowania w dniach/tygodniach).

## Product Scope

### MVP - Minimum Viable Product
- System discovery.
- Audyt + strategia email marketingu.
- Plan flow i kampanii.
- Podstawowe raportowanie.
- Podstawowa analiza wyników i wykrywanie luk.

### Growth Features (Post-MVP)
- Rekomendacje optymalizacyjne oparte na danych.
- System przypomnień i zarządzania zadaniami.
- Lepsze generowanie copy i planów kampanii.
- Głębsza analiza email‑by‑email i formularzy.

### Vision (Future)
- Pełny „AI Agency OS”.
- AI jako wirtualny zespół (strateg, analityk, planner).
- Skalowalny system pracy dla wielu klientów.
- Ciągły monitoring wyników i automatyczne sugerowanie działań.

## User Journeys

### 1) Owner & Creative Director — „Chaos → decyzje strategiczne”
**Opening scene:** Wchodzi w dzień z wieloma wątkami naraz: klienci, strategia, design, decyzje. Dużo ręcznej pracy i „gaszenia pożarów”.  
**Rising action:** System prowadzi ją przez ustrukturyzowany proces projektu. W tle AI zbiera dane z Klaviyo, przygotowuje wnioski i proponuje priorytety.  
**Climax:** Zamiast analizować i układać wszystko od zera, dostaje klarowną rekomendację: co działa, gdzie są luki, jaki jest następny krok.  
**Resolution:** Skupia się na decyzjach kreatywnych i strategicznych, bo operacje dzieją się systemowo i przewidywalnie.

**Co może pójść źle / recovery:** rekomendacje AI nie trafiają w kontekst — potrzebny szybki „override” i korekta kierunku z zachowaniem historii zmian.

### 2) Strategy & Insight Lead — „Dane → decyzje”
**Opening scene:** Mnóstwo danych z Klaviyo, ale trudno je szybko przełożyć na jasne priorytety i logiczną strategię.  
**Rising action:** System łączy wyniki z kontekstem marki i sezonowością. Proponuje konkretne: które flow poprawić, co wykluczyć, gdzie są luki.  
**Climax:** Rekomendacje są precyzyjne, dopasowane do klienta, a nie ogólne — da się od razu przejść do planu działań.  
**Resolution:** Strategia opiera się na danych, ma sens biznesowy i jest gotowa do przekazania dalej.

**Co może pójść źle / recovery:** system widzi dane, ale nie rozumie intencji marki — potrzebna szybka warstwa „brand context” i priorytetów.

### 3) Content & Messaging Lead — „Strategia → komunikacja”
**Opening scene:** Wiele kampanii i flow do napisania, a treści muszą być spójne ze strategią i segmentami.  
**Rising action:** System daje jasny brief: cel kampanii, segment, ton, priorytet i kontekst marki.  
**Climax:** Copy powstaje szybciej i trafniej, bo nie trzeba domyślać się strategii.  
**Resolution:** Materiały są gotowe do wdrożenia i spójne z kierunkiem agencji.

**Co może pójść źle / recovery:** zmiana kierunku strategicznego w trakcie — potrzebne szybkie „re-briefing” i śledzenie wersji.

### 4) Operations & Implementation Lead — „Plan → działający system”
**Opening scene:** Jest strategia, są treści, ale trzeba ustawić wiele elementów w Klaviyo i łatwo coś pominąć.  
**Rising action:** System prowadzi krok po kroku: checklisty, kolejność wdrożeń, zależności flow/segmentów/kampaniami.  
**Climax:** Implementacja przestaje być improwizacją — staje się powtarzalnym procesem.  
**Resolution:** Wszystko wdrożone poprawnie i na czas, bez chaosu.

**Co może pójść źle / recovery:** konflikt zależności między flow — potrzebne automatyczne wykrywanie kolizji i rekomendowany plan naprawczy.

### 5) AI System Agent — „Wsparcie procesowe”
**Opening scene:** Dużo danych i powtarzalnych zadań, które bez systemu spowalniają pracę.  
**Rising action:** Agent działa w kontekście klienta, procesu i historii wyników. Generuje drafty, analizy, raporty i rekomendacje.  
**Climax:** Propozycje są trafne i oszczędzają realny czas ludzi.  
**Resolution:** Staje się niezawodnym „członkiem zespołu”, który przyspiesza decyzje i utrzymuje spójność procesu.

**Co może pójść źle / recovery:** brak pełnego kontekstu — potrzebny mechanizm walidacji i „context refresh”.

### Journey Requirements Summary
- Ustrukturyzowany workflow end‑to‑end (discovery → audyt → strategia → flow → kampanie → raporty).
- Centralny kontekst klienta + historia decyzji i zmian.
- Automatyczna analiza danych z Klaviyo (konto → flow → email → formularz).
- Rekomendacje z uzasadnieniem + możliwość „override”.
- Briefy dla treści z parametrami: cel, segment, ton, priorytet.
- Checklisty wdrożeniowe i kontrola zależności w implementacji.
- Wersjonowanie i śledzenie zmian (strategia/copy/plan).
- Mechanizmy detekcji luk i sugerowania kolejnych kroków.

## Domain‑Specific Requirements

### Compliance & Regulatory
- Zgodność z RODO/GDPR (dane subskrybentów i marketingowe).
- Respektowanie zgód marketingowych.
- Przetwarzanie danych wyłącznie w kontekście danego klienta i projektu (brak mieszania kontekstów).
- Audytowalność decyzji i zmian (możliwość wyjaśnienia podstaw decyzji).

### Technical Constraints
- Kontrola dostępu per rola (Owner, Strategy, Content, Operations).
- Audytowalność: logi decyzji, zmian i rekomendacji.
- Wersjonowanie strategii, planów działań i treści.
- Mechanizm zatwierdzania przez człowieka przed wykonaniem krytycznych działań.

### Integration Requirements
- Klaviyo jako integracja kluczowa.
- Integracje z platformą e‑commerce klienta (Shopify/inna/custom) w celu danych o produktach, zamówieniach i zachowaniach.
- Narzędzia pracy: Notion / Google Docs (dokumentacja).
- Narzędzia kreatywne: Figma + zasoby graficzne.
- Komunikacja: email, opcjonalnie Slack przy dłuższej współpracy.

### Risk Mitigations
- Ryzyko błędnych rekomendacji przy niepełnym kontekście → wymagany pełny kontekst klienta i mechanizm walidacji.
- Ryzyko niespójnych treści → mocny kontekst marki + review.
- Ryzyko pominięć wdrożeniowych → checklisty i kontrola zależności.
- Ryzyko nadmiernego polegania na automatyce → etap human‑review i historia decyzji.

## Innovation & Novel Patterns

### Detected Innovation Areas
- **AI‑powered Agency OS**: AI działa jako analityk, planner i wsparcie operacyjne (nie tylko generator treści).
- **Połączenie danych + kontekstu + workflowów**: automatyczna analiza Klaviyo + kontekst biznesowy + procesy agencyjne → wykrywanie luk, proponowanie kolejnych kroków, budowa planów działań.
- **Butikowa personalizacja z AI‑support**: decyzje pozostają ludzkie i dopasowane do etapu marki, a AI przyspiesza procesy.

### Market Context & Competitive Landscape
- Typowe agencje używają AI głównie do copy; rzadko łączą analitykę, planowanie i operacje w jednym spójnym systemie workflow.
- To podejście przesuwa AI z „narzędzia” do „operacyjnego współpracownika”.

### Validation Approach
- **Case testowy**: stworzenie strategii, planu flow i kampanii dla przykładowej marki; porównanie czasu i jakości vs manual.
- **Audyt realnego konta Klaviyo**: sprawdzenie wykrywania luk i użyteczności rekomendacji.

### Risk Mitigation
- **Human‑in‑the‑loop**: każda rekomendacja przechodzi review właścicielki.
- **Fallback**: workflowy są zaprojektowane tak, aby działały również bez AI (AI = wsparcie, nie single point of failure).

## Web App Specific Requirements

### Project-Type Overview
- Wewnętrzny system operacyjny jako **SPA** dla płynnej pracy między klientami, strategiami i raportami.
- Brak wymagań SEO (produkt wewnętrzny).

### Technical Architecture Considerations
- Desktop‑first UX (narzędzie operacyjne, praca na wielu elementach).
- Aktualizacja danych „na żądanie” (sync/refresh), bez stałego real‑time streamingu.

### Browser Support Matrix
- Wsparcie dla aktualnych wersji: **Chrome, Safari, Firefox, Edge**.
- **Arc** wspierany pośrednio (Chromium).

### Responsive Design
- Priorytet: desktop.
- Mobilne wsparcie: minimalne (podgląd), do potwierdzenia.

### Performance Targets
- Szybka nawigacja między widokami w obrębie SPA.
- Odświeżanie danych po sync/refresh bez długich przestojów.

### SEO Strategy
- Brak wymagań SEO.

### Accessibility Level
- Dostępność zgodna z dobrymi praktykami: kontrast ≥ 4.5:1, logiczna hierarchia nagłówków; weryfikacja checklistą UX.
- Brak formalnego wymogu WCAG AA (wewnętrzne narzędzie) — weryfikacja: checklisty dostępności.

### Implementation Considerations
- Mechanizm odświeżania danych i synchronizacji źródeł.
- Stabilna obsługa wielu kontekstów (klient/projekt) bez mieszania danych.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** problem‑solving MVP (operacyjny „mózg” wspierający proces, nie pełna platforma).  
**Resource Requirements:** Owner + AI‑support (single‑user).

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
- Owner/Creative Director (end‑to‑end prowadzenie procesu).
- Strategy/Insight (analiza danych i rekomendacje).
- Content/Operations jako wsparcie operacyjne (z perspektywy właścicielki).

**Must‑Have Capabilities:**
- Proces discovery → audyt → strategia → plan flow i kampanii.
- Generowanie ustrukturyzowanej strategii email.
- Wykrywanie podstawowych luk (brak flow/segmentów/logiki).
- Plan działań możliwy do wdrożenia.
- Kontekst klienta utrzymywany w całym procesie.

### Post‑MVP Features
**Phase 2 (Post‑MVP):**
- Rekomendacje optymalizacyjne oparte na danych.
- System przypomnień i zarządzania zadaniami.
- Lepsze generowanie copy i planów kampanii.
- Głębsza analiza email‑by‑email i formularzy.

**Phase 3 (Expansion):**
- Pełny AI Agency OS.
- Wirtualny zespół (strateg, analityk, planner).
- Skalowalny system pracy dla wielu klientów.
- Ciągły monitoring + automatyczne sugestie działań.

### Risk Mitigation Strategy
**Technical Risks:** utrata kontekstu klienta i zbyt powierzchowna analiza → silny kontekst klienta + mechanizmy walidacji.  
**Market Risks:** brak realnego skrócenia czasu pracy i przewagi operacyjnej → testy na case’ach i pomiar czasu/efektów.  
**Resource Risks:** mniej zasobów → wycięcie elementów platformowych, UI, integracji; zostaje core proces + analiza + strategia + plan działań.

## Functional Requirements

### 1) Zarządzanie klientami i kontekstem
- FR1: Owner może tworzyć, edytować i archiwizować profile klientów (AC: można utworzyć/edytować/archiwizować profil z nazwą i statusem).
- FR2: System może utrzymuje odseparowany kontekst danych per klient/projekt (AC: dane i rekomendacje klienta A nie są widoczne w kontekście klienta B).
- FR3: Użytkownik może przełączać się między klientami bez utraty kontekstu pracy (AC: przełączenie klienta zachowuje kontekst pracy (ostatni widok)).
- FR4: System może przechowuje historię decyzji strategicznych per klient (AC: każda decyzja ma wpis z datą i autorem).

### 2) Discovery i onboarding informacji
- FR5: Owner może prowadzić ustrukturyzowany discovery call z zapisem odpowiedzi (AC: zapis obejmuje odpowiedzi na min. 10 kluczowych pytań).
- FR6: System może identyfikuje braki informacji i prosi o uzupełnienia (AC: system wskazuje brakujące pola i blokuje przejście dalej).
- FR7: System może zbiera kluczowe dane biznesowe klienta (cele, segmenty, sezonowość, oferta) (AC: wymagane pola: cele, segmenty, sezonowość, oferta).

### 3) Audyt i analiza Klaviyo
- FR8: System może importuje/analizuje dane z Klaviyo na poziomie: konto → flow → email → formularze (AC: analiza obejmuje konto, flow, email, formularze; wynik zawiera listę elementów i status (OK/Gap)).
- FR9: System może identyfikuje luki w konfiguracji (np. brak flow/segmentów/logiki) (AC: wykrywa brakujące flow/segmenty/logikę i wskazuje je w raporcie z nazwą i powodem).
- FR10: System może wykrywa słabe ogniwa i obszary do optymalizacji (AC: wskazuje min. 3 priorytetowe obszary optymalizacji z uzasadnieniem).
- FR11: System może generuje wnioski analityczne z danych, powiązane z kontekstem klienta (AC: wnioski zawierają źródło danych i rekomendację działania).

### 4) Strategia i planowanie
- FR12: System może generuje ustrukturyzowaną strategię email marketingu per klient (AC: strategia zawiera cele, segmenty, ton, priorytety, KPI).
- FR13: System może tworzy plan flow i automatyzacji zgodny ze strategią (AC: plan flow zawiera listę flow, wyzwalacze, cele i priorytety).
- FR14: System może planuje kalendarz kampanii na podstawie celów i sezonowości (AC: kalendarz zawiera min. 4 tygodnie, typ kampanii, cel i segment).
- FR15: System może proponuje segmentację odbiorców zgodną z celami (AC: segmentacja zawiera kryteria wejścia i cel segmentu).

### 5) Copy i materiały komunikacyjne
- FR16: Content Lead może generować drafty maili na podstawie strategii i segmentu (AC: draft zawiera temat, preheader, body i CTA).
- FR17: System może generuje briefy komunikacyjne (cel, segment, ton, priorytet) (AC: brief zawiera cel, segment, ton, priorytet i KPI).
- FR18: Owner może zatwierdzać/odrzucać treści przed wdrożeniem (AC: status treści = zatwierdzona/odrzucona z komentarzem).

### 6) Implementacja i operacje
- FR19: Operations Lead może prowadzić wdrożenie z checklistą kroków (AC: checklisty mają status i datę wykonania).
- FR20: System może pokazuje zależności między flow/segmentami/kampaniami (AC: zależności pokazują poprzedniki/następniki).
- FR21: System może wykrywa potencjalne konflikty wdrożeniowe (AC: konflikt oznacza elementy i powód).
- FR22: System może wspiera przygotowanie materiałów do wdrożenia w Klaviyo (AC: lista materiałów do wdrożenia jest eksportowalna).

### 7) Raportowanie i rekomendacje
- FR23: System może generuje raporty wyników dla klienta (AC: raport zawiera KPI, trend, wnioski i rekomendacje).
- FR24: System może proponuje rekomendacje optymalizacyjne z uzasadnieniem (AC: rekomendacja zawiera powód, oczekiwany efekt i priorytet).
- FR25: System może sugeruje testy A/B i kolejne działania (AC: test A/B zawiera hipotezę, warianty i metrykę sukcesu).

### 8) Workflow, wersjonowanie i audyt
- FR26: System może zapewnia wersjonowanie strategii, planów i treści (AC: wersje mają numer, autora i datę).
- FR27: System może rejestruje logi decyzji i zmian (audytowalność) (AC: log zawiera: kto, co, kiedy).
- FR28: System może umożliwia ręczne zatwierdzanie kluczowych rekomendacji (AC: rekomendacje wymagają akceptacji przed użyciem).

### 9) Role i dostęp
- FR29: System może egzekwuje dostęp per rola (Owner, Strategy, Content, Operations) (AC: rola determinuje listę widocznych modułów).
- FR30: System może ogranicza widoczność/edycję do zakresu odpowiedzialności roli (AC: brak uprawnień blokuje edycję).

### 10) Dokumentacja i komunikacja
- FR31: System może generuje dokumentację dla klienta (strategie/raporty) (AC: dokumentacja zawiera strategię, plan działań i raport w formacie do udostępnienia).
- FR32: System może umożliwia eksport materiałów do narzędzi pracy (np. Notion/Docs) (AC: eksport do formatu pliku lub linku udostępnienia).

## FR → Journey Mapping

| Journey | Key FRs |
|---|---|
| Owner & Creative Director | FR1–FR4, FR5–FR7, FR12–FR15, FR18, FR26–FR28 |
| Strategy & Insight Lead | FR8–FR15, FR24–FR25 |
| Content & Messaging Lead | FR16–FR18, FR31–FR32 |
| Operations & Implementation Lead | FR19–FR22, FR26–FR27 |
| AI System Agent | FR8–FR15, FR23–FR25 |

## Non-Functional Requirements

### Performance
- Przełączanie klienta/widoków: ≤ 2 s (95. percentyl), mierzone monitoringiem aplikacji.
- Odświeżenie danych (sync/refresh): ≤ 5–10 s (95. percentyl), mierzone logami sync.
- Generowanie strategii/raportu: ≤ 30–60 s (95. percentyl), mierzone czasem wykonania zadań.

### Security & Privacy
- Szyfrowanie danych w tranzycie (HTTPS/TLS) i w spoczynku (AES-256); weryfikacja przez testy bezpieczeństwa.
- Retencja danych: czas współpracy + 12 miesięcy po zakończeniu; polityka retencji egzekwowana automatycznie.
- Usunięcie danych na żądanie w ciągu 30 dni kalendarzowych; potwierdzenie w logach audytu.

### Reliability
- Dostępność: ≥ 99% miesięcznie, mierzona przez monitoring uptime.
- Przestoje w godzinach pracy nie dłuższe niż 30 min jednorazowo; monitorowane w logach dostępności.

### Scalability
- Obsługa min. 15 klientów/projektów równolegle przy zachowaniu czasów odpowiedzi z sekcji Performance; potwierdzone testem obciążeniowym.

### Accessibility
- Dostępność zgodna z dobrymi praktykami: kontrast ≥ 4.5:1, logiczna hierarchia nagłówków; weryfikacja checklistą UX.
- Brak formalnego wymogu WCAG AA (wewnętrzne narzędzie) — weryfikacja: checklisty dostępności.

### Integration
- Manualny sync na żądanie + automatyczny sync 1x dziennie; logowana data ostatniej synchronizacji i wynik sync.
- Brak wymogu real‑time streamingu; dane aktualizowane wyłącznie przez sync (manualny lub dzienny), potwierdzone logami sync.

### Auditability
- Logi decyzji i wersje strategii przechowywane przez cały okres współpracy + 12 miesięcy; weryfikacja przez audyt logów.