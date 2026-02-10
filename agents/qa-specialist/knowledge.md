# Qa Specialist - Internal Knowledge Base

**Source**: Notion Workspace
**Last Updated**: 2025-02-09
**Total Pages**: 9

---

## Overview

This knowledge base contains internal documentation, processes, templates, and best practices specific to the qa specialist domain.

---

## Knowledge Sections


### 1. Untitled Page

1. Wprowadzenie 

Dlaczego email marketing w 2024/2025 jest kluczowy 
Porównanie: email marketing vs płatne reklamy (paid ads) 
Efekt  Top-of-Mind  – jak być stale obecnym w świadomości klienta 
Rola contentu i regularnych wysyłek 
2. Podstawy skutecznego email marketingu 

Zasada: konwertowanie i utrzymywanie uwagi 
Zalety: przewidywalność, skalowalność, niskie koszty 
Różnica między zimnym a ciepłym ruchem 
Jak email wpływa na budowanie marki i goodwill 
3. Budowanie listy mailingowej 

Metody zbierania adresów: 
Jakie oferty działają najlepiej (zniżki, quizy, gamifikacja, mikro-commitmenty) 
4. Pop-upy i formularze 

Typy popupów (klasyczne, quizy, gamifikowane) 
Projektowanie skutecznych popupów 
Testowanie różnych form (Klaviyo vs Amped) 
Segmentacja desktop vs mobile 
5. Flows – automatyczne sekwencje 

Definicja i rola flow w e-commerce 
Najważniejsze flow, które musi mieć każdy sklep: 
Struktura poszczególnych flow i przykłady maili 
6. Kampanie (campaigns) 

Różnica między kampanią a flow 
Kampanie zniżkowe vs non-discount (dlaczego warto ograniczać zniżki) 
Kalendarz kampanii (planowanie treści i akcji) 
Uzupełnianie kampanii mikro-tematami (microtopics) 
7. Tworzenie treści do maili 

Typy treści: edukacyjne, rozrywkowe, sprzedażowe 
Pomysły na nieograniczone tematy w 60 sekund (AI, ChatGPT) 
Jak łączyć produkty i kategorie w mailach 
Copywriting – struktura i CTA 
8. Projektowanie emaili 

Branded text vs plain text 
Grafika vs treść pisana 
Testowanie układów, przycisków CTA, długości maila 
A/B testy w praktyce (6 kluczowych testów) 
9. Deliverability (dostarczalność maili) 

Czym jest deliverability (score domeny i IP) 
Jak uniknąć spamu i folderu promocji 
Budowanie reputacji nadawcy 
Segmentacja engaged users (14, 30, 60, 90 dni) 
Protokół wyciągania z folderu spam 
10. Segmentacja 

Różnica: listy vs segmenty 
Kluczowe segmenty do stosowania (aktywni, nieaktywni, lojalni klienci, potencjalni) 
Personalizacja komunikacji dzięki segmentom 
13. Optyma


*(... 192 more characters)*

---


### 2. Untitled Page

Architektura systemu - kafelek 
Średnia liczba kampanii / profil w 30 dni 
Engagment system (osobna sekcja) 
Snapshot systemu segmentów - kafelki 
Overlap  
Czy kampanie wysyłane są do segmentów czy do całej bazy? 
Tabela główna segmentów (rdzeń audytu) 
| Segment | Rozmiar | % Bazy | Subscribed % | Nieaktywni % | Revenue / profil | 
Stabilność i struktura 
Jakość reputacyjna 
Skuteczność behawioralna

---


### 3. Untitled Page

Co musi brać pod uwagę 
 
Silnik powinien łączyć dane z: 
1. Formularze 
jakość pozyskania 
udział importów 
skuteczność form 
stabilność zapisów 
2. Segmenty 
% nieaktywnych 
overlap 
engaged system 
revenue per segment 
3. Flow 
czy istnieją podstawowe 
które zarabiają 
które psują reputację 
które nie startują 
4. Kampanie 
wolumen 
reputacja 
segmentacja 
revenue concentration 
5. Design 
UX 
mobile 
alt 
linki 
6. Branża / model biznesowy 
powtarzalność zakupów 
średni cykl zakupowy 
cena produktu 
sezonowość 
Jak to powinno działać logicznie 
Nie może to być: 
„Spam > 0.1% → popraw deliverability” 
Przykład, jeśli: 
wysoki % nieaktywnych 
kampanie wysyłane do całej bazy 
wysoki unsub 
brak winback 

7. Główne problemy systemowe 
Nie 20 punktów. 
Tylko te, które blokują wzrost. 
Np: 
Nadmierne wysyłki do nieaktywnych (reputacja ryzyko) 
Brak systemu winback 
Revenue skoncentrowany w 2 kampaniach 
Welcome zbyt krótki 
Formularze generują niski intent 
8. Priorytety na 30 dni 
Podzielone na: 
🔴 Krytyczne (tydzień 1–2) 
Wdrożenie wykluczenia 180+ 
Poprawa filtra w Cart flow 
Zmniejszenie wolumenu kampanii masowych 
🟡 Wzrostowe (tydzień 2–3) 
Rozbudowa Welcome do 3 maili 
Test segmentu engaged 30 vs 90 
🟢 Optymalizacyjne (tydzień 3–4) 
Test subject line 
Poprawa alt tagów 
Dark mode fixes 
Wpływ vs Wysiłek 
Tabela: 

Spersonalizowany komentarz strategiczny 

GLOBAL KPI & BUSINESS IMPACT 
Wizualnie (górna część podsumowania) 
🔹 Donut – Revenue Split (Flow vs Kampanie) 
🔹 Bar – Revenue per recipient (Flow vs Kampanie) 
🔹 Bar – Unsub comparison 

Krótki, syntetyczny blok tekstu: 
KLASYFIKACJA SYSTEMU 
 
Tutaj agent przypisuje typ: 
🟧 System promocyjny z ryzykiem reputacyjnym
albo
🟩 System stabilny, ale niedoautomatyzowany 
Krótki opis:
 TOP 5 PROBLEMÓW SYSTEMOWYCH 
 
Jak liczyć Deliverability Score (przykład logiki) 
Start: 100 pkt 
Spam >0.1% → -20 
Hard bounce >0.5% → -20 
Delivery rate <98% → -15 
Wysyłki do suppressed → -25 
Jeśli wszystko 0% i 100% delivery → 100


*(... 125 more characters)*

---


### 4. Untitled Page

SCORING DLA KAŻDEJ SEKCJI 
Każda sekcja = 0–100 
Każda sekcja ma 3 poziomy: 
🔴 0–49 = Krytyczny 
🟡 50–74 = Średni 
🟢 75–100 = Zdrowy 

Formularze (Lead Quality Score) 
Segmenty (Segmentation Health Score) 
Flow 
Kampanie 
Design / UX (Email Usability Score) 
10 najważniejszych zależności 
REGUŁY PRIORYTETYZACJI 
OSTATECZNA LOGIKA 
Business Impact Multiplier 
Na podstawie KPI Layer: 
Stabilny system → ×1.0 
Średnio stabilny → ×0.9 
Niestabilny → ×0.8 
Wysokie ryzyko reputacji → ×0.7 
Czyli możesz mieć: 
Flow: 80 
Segmenty: 75 
Kampanie: 70 
Ale jeśli: 
Revenue niestabilne + wysoka koncentracja + rosnący 180+ 
Global Score spada. 
POZIOM 1: Wykrywanie stanu systemu 
System analizuje: 
Reputacja (spam/unsub/bounce) 
Stabilność revenue 
Udział flow vs kampanii 
% nieaktywnych 
Koncentrację revenue 
Automation coverage 
Na tej podstawie przypisuje konto do jednego z typów: 

🟥 Typ A: System niestabilny (reputacja zagrożona) 
Warunki przykładowe: 
Wysoki spam 
Wysoki unsub 
Duże wolumeny 
Rosnący 180+ 

🟧 Typ B: System promocyjny (uzależniony od kampanii) 
Warunki: 
65% revenue z kampanii 
Niski udział flow 
Revenue skoncentrowany w top 3 kampaniach 

🟨 Typ C: System niedoautomatyzowany 
Warunki: 
Flow istnieją, ale generują niski revenue 
Kampanie mają lepszy revenue per recipient 
Brak winback 

🟩 Typ D: System stabilny, ale z niską efektywnością 
Warunki: 
Niska reputacja risk 
Revenue per recipient niski 
Click wysoki, conversion niski 
POZIOM 2: Wybór dominującego problemu 
Jeśli występują 2–3 typy naraz, 
silnik ustala hierarchię: 
Reputacja > wszystko 
Stabilność revenue > automatyzacja 
Automatyzacja > optymalizacja UX 
UX > testy 
Czyli jeśli: 
system promocyjny 
i wysoki spam 
Najpierw reputacja, potem struktura. 

🔷 POZIOM 3: Dynamiczne priorytety 
Tu dzieje się magia. 
Priorytety nie są stałe. 
Zależą od typu systemu. 

Przykład 1 
Typ: System promocyjny 
Priorytety 30 dni: 
1️⃣ Rozbudowa Welcome 
2️⃣ Wdrożenie Winback 
3️⃣ Test segmentu engaged 30 
4️⃣ Ograni


*(... 288 more characters)*

---


### 5. Untitled Page

Snapshot systemu flow (1 ekran) 
Tabela główna flow (rdzeń audytu) 
| Flow | Istnieje | Status | Trigger | Started 30d | Conversion % | Revenue |  
Checlista Flow 
Architektura flow (logika) 
 Performance flow 
Ryzyko reputacyjne 

Kolorystycznie: 
Sekcja: Trigger & Activation Health 
Martwe flow: 
Głębokie flow - karty 
Uzupełniające notatki

---


### 6. Untitled Page

Forma: Dashboard z kafelkami + 2 wykresy 


2. Analiza szczegółowa (sekcje tematyczne)
Inwentaryzacja – tabela 
Forma: tabela sortable 
| ID | Nazwa | Status | Typ | Data modyfikacji | Zapisy 30 dni | CR | 

3. Skuteczność formularzy 
4. Consent Quality 
Forma: 
Jakość po zapisie 
Tabela porównawcza: 

Stabilność wzrostu 

7. Manualna ocena (osobny blok) 
Formularz = osobna karta (accordion / karta) 
Struktura: 
FORM: Homepage Popup 
Typ popupu (FORMA TECHNICZNA) 
Trigger 
Cooldown: 
Frequency control: 
Desktop/ kwadracik do zaznaczenia 
Mobile/ kwadracik do zaznaczenia 
A/B test/ kwadracik do zaznaczenia 
Multi-step:  
Oferta: 
Powiązany z flow:  
Zero-party data: 
Lista docelowa: 
Notatka:

---


### 7. Untitled Page

1. Snapshot kampanii - kafelki 
Tabela główna kampanii
| Kampania | Data | Segment | Wolumen | Delivered % | Revenue | Revenue/recip | Click % | Unsub % | Spam % | 
3. Stabilność i wolumen 
Reputacja kampanii
| Kampania | Unsub % | Spam % | Hard bounce % | Risk | 
Segmentacja kampanii 
Strategia i pokrycie -,Checklist: 
A/B testy 
Timing i częstotliwość 
Manualne notatki

---


### 8. Untitled Page

Budowanie listy mailingowej to fundament skutecznego email marketingu. To właśnie od jakości i wielkości bazy zależy, jak efektywne będą późniejsze kampanie. Sama lista nie powstaje jednak „sama z siebie” – trzeba aktywnie zachęcać użytkowników do zapisania się i zaoferować im realną wartość. 

Nowi subskrybeci są bardziej istotni niż starsi subskrybenci głównei z dwóch powodów: 
Honeymoon phase  – zaraz po zapisie są najbardziej zaangażowani, ciekawi, otwierają maile. 
Fresh interest  – właśnie wyrazili zainteresowanie Twoją marką/produktem, więc są bardziej skłonni coś kupić. 
4 Metody budowania listy mailiowej 
Pop-upy i formularze 
Strony zapisu (sign-up pages) 
Checkboxy przy zakupie (post-purchase opt-in) 
Embed w stopce strony lub na blogach 

Samo „zapisz się na newsletter” zwykle nie działa. Aby użytkownik zostawił maila, potrzebuje  motywacji  – czegoś, co uzna za wartościową wymianę. 
Zniżki i rabaty  – klasyka e-commerce. Najczęściej spotykana forma zapisu, np. -10% na pierwsze zakupy. 
Quizy i testy  – forma interaktywna, która zaciekawia i wciąga użytkownika. Na końcu quizu odbiorca podaje maila, aby poznać wynik. 
Gamifikacja  – np. koło fortuny, „odkryj nagrodę”, mini-gry. Działa, bo łączy zapis z emocją i zabawą. 
Mikro-commitmenty  – małe kroki, które budują zaangażowanie. Zapis w zamian za darmowy poradnik, checklistę, czy dostęp do krótkiego wideo. 
Ekskluzywne treści  – dostęp tylko dla subskrybentów, np. artykuły eksperckie, nagrania, raporty branżowe. 
Gratis przy zapisie  – prezent powitalny w formie e-booka, szablonu, checklisty czy próbki produktu. 
Limitowane oferty  – promocje i wyprzedaże dostępne wyłącznie dla osób zapisanych. 
Wcześniejszy dostęp  – subskrybenci dowiadują się o nowych produktach, kolekcjach czy wydarzeniach przed innymi. 
Społeczność VIP  – poczucie przynależności, np. klub lojalnościowy czy zamknięta grupa dla zapisanych. 
Personalizacja treści  – obietnica dopasowania newslettera do zainteresowań odbiorcy. 
Darmowe m


*(... 353 more characters)*

---


### 9. Untitled Page

Jeżeli chodzi o diagnoze, ma to być w formie audytu

---

