# System scoringowy – audyt email (wersja operacyjna)

## 1. Scoring sekcji (0–100)

Każda sekcja ma wynik 0–100 i trzy poziomy:
- 0–49 = Krytyczny
- 50–74 = Średni
- 75–100 = Zdrowy

Wagi sekcji w Global Score:
- Formularze – 15%
- Segmenty – 20%
- Flow – 25%
- Kampanie – 25%
- Design / UX – 15%

Global Score:
(Deliverability + Segment + Flow + Campaign + Form) × Business Impact Multiplier

Uwaga:
Automation Coverage nie obniża jednocześnie sekcji Flow. Wpływa tylko na Multiplier.

---

## 2. Szczegółowa logika sekcji

### Formularze (Lead Quality Score) – 15%
Składniki:
- % zgód poprawnych – 25%
- Udział importów – 20%
- CR formularzy – 15%
- Stabilność zapisów – 15%
- Udział formularzy w budowie bazy – 15%
- Aktywność profili z formularzy – 10%

Jeśli:
- wysoki udział importów + wysoki bounce → problem jakości źródeł
- wysoki CR, niska aktywność → problem jakości leadów
- niski udział form w bazie → uzależnienie od importów

### Segmenty (Segmentation Health Score) – 20%
Składniki:
- % nieaktywnych w bazie – 25%
- Obecność engaged 30/60/90 – 15%
- Overlap top 5 – 15%
- % segmentów nieużywanych – 10%
- Revenue per segment – 20%
- System wykluczeń – 15%

Jeśli:
- wysoki % nieaktywnych + brak 180+ exclusion → ryzyko reputacyjne
- duży overlap + niska konwersja → chaos targetowania
- brak engaged warstw → brak kontroli cyklu życia

### Flow – 25%
Składniki:
- Coverage (Welcome, Cart, Post, Winback) – 25%
- % flow bez startów – 10%
- Revenue per flow – 20%
- Reputacja flow – 15%
- Logika (exit, filtry, delay) – 20%
- Trigger health – 10%

Jeśli:
- eventy istnieją, a flow nie startują → błędne filtry
- brak Winback + rosnący 180+ → zagrożenie deliverability
- niski revenue flow + wysoki revenue kampanii → brak automatyzacji retencyjnej

### Kampanie – 25%
Składniki:
- Revenue per recipient – 20%
- Stabilność wolumenu – 15%
- Reputacja – 25%
- Segmentacja kampanii – 20%
- % revenue z top 3 – 10%
- A/B testy – 10%

Jeśli:
- wysoki spam + duże wolumeny → problem masowych wysyłek
- revenue skoncentrowany w 1–2 kampaniach → system niestabilny
- wysoki OR, niski Click → problem oferty / komunikacji

### Design / UX – 15%
Składniki:
- Struktura maila – 25%
- Mobile – 20%
- Alt & dostępność – 15%
- CTA & linki – 20%
- Subject & preview – 20%

Jeśli:
- wysoki Click, niski Conversion → problem UX / landing
- wysoki OR, niski Click → problem struktury i CTA

---

## 3. Business Impact Multiplier

Multiplier jest biznesowy, nie estetyczny.

Bazuje na:
- Stabilności revenue
- Koncentracji revenue
- % revenue z flow
- % nieaktywnych
- Reputacji (spam/unsub/bounce)
- Automation Coverage

Wartości:
- Stabilny system → ×1.0
- Średnio stabilny → ×0.9
- Niestabilny → ×0.8
- Wysokie ryzyko reputacji → ×0.7

Jeśli brak kampanii i brak flow:
Multiplier maksymalnie = 0.8 (Global Score ≤ 50).

---

## 4. Confidence Level (poziom pewności)

- High – pełne dane 90 dni
- Medium – 30 dni lub mała próba
- Low – mikro próba / brak metryk

Confidence wpływa na ton rekomendacji, nie na scoring.

---

## 5. Wykrywanie typu systemu

Oś: Reputacja, Stabilność revenue, Automatyzacja, Efektywność.

Dominujące typy:
- Typ A – Reputacyjnie zagrożony
- Typ B – System promocyjny (uzależniony od kampanii)
- Typ C – Niedoautomatyzowany
- Typ D – Stabilny, ale niskoefektywny

Hierarchia nadrzędna:
1. Reputacja
2. Stabilność revenue
3. Automatyzacja
4. UX / optymalizacja

---

## 6. Zależności systemowe (logika krzyżowa)

- Wysoki unsub + wysoki % nieaktywnych → problem segmentacji
- Niski revenue per recipient + dobre flow → problem kampanii / oferty
- Wysoki spam + duże wolumeny → masowe wysyłki bez segmentacji
- Wysoki udział importów + wysoki bounce → słaba jakość bazy
- Niski revenue flow + wysoki revenue kampanii → brak automatyzacji
- Wysoki RPR flow + niski RPR kampanii → kampanie zbyt szerokie
- Wysoki revenue per click + niski click → dobra oferta, słaba komunikacja
- Niski unsub + niski revenue → system bezpieczny, ale nieskalowany
- Flow bez startów + eventy istnieją → błędne filtry
- Duży overlap + niska konwersja → chaos segmentacyjny
- Revenue skoncentrowany w 1–2 kampaniach → brak stabilności

---

## 7. Priorytetyzacja

Każdy problem oceniany:
- Wpływ (1–5)
- Ryzyko (1–5)
- Wysiłek (1–5)

Priority Score = (Wpływ + Ryzyko) × 2 − Wysiłek

Jeśli Wpływ = 5 i Ryzyko = 5 → zawsze TOP 1.

Zasady nadrzędne:
- Reputacja > Revenue
- Segmentacja > Kampanie
- Flow > Kampanie
- Automatyzacja > jednorazowe poprawki

Maksymalnie 3 rekomendacje w planie 30 dni.

---

## 8. Sekwencja działania agenta

1) Liczy scoring sekcji
2) Określa Confidence Level
3) Wykrywa zależności
4) Identyfikuje dominujący typ systemu
5) Oblicza Multiplier
6) Wyznacza Global Score
7) Generuje maksymalnie 3 kluczowe rekomendacje
8) Buduje 30‑dniowy plan zgodny z typem systemu

---

## 9. Zasada kluczowa

System nie ma generować raportu. Ma generować diagnozę, np.:

„System promocyjny uzależniony od kampanii przy rosnącym udziale nieaktywnych. Priorytetem jest stabilizacja segmentacji i rozbudowa automatyzacji, nie optymalizacja CTA.”
