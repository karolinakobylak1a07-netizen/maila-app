# QUALITY_COMPLIANCE Content

**Agent Domain:** quality_compliance
**Total Pages:** 8
**Last Updated:** 2026-02-10T00:14:19.921Z

---

## Suppress List

**URL:** https://www.notion.so/Suppress-List-26e5d43e072d809092d2c468cfa62ce7
**Last Edited:** 2025-09-15T08:04:00.000Z
**Blocks:** 27

### Content

---
Segment przeznaczony do wykluczania odbiorców, którzy nie angażują się w Twoje maile lub są ryzykowni (np. oznaczają wiadomości jako spam).
Dzięki regularnemu czyszczeniu tej listy (np. raz w miesiącu) oszczędzasz koszty w Klaviyo, poprawiasz deliverability i dbasz o dobrą reputację nadawcy.
---
### Jak to działa?
- Do segmentu trafiają osoby, które:
- Takie kontakty nie powinny dostawać żadnych wysyłek, bo obniżają Twoje wskaźniki otwarć i kliknięć oraz zwiększają ryzyko wpadania do spamu.
---
### Przykład definicji: Suppress List
Aby ktoś znalazł się w tym segmencie, musi spełniać jeden z warunków:
1. ❌ Opened Email zero times in the last 180 days.
1. ❌ Bounced Email at least once over all time.
1. ❌ Marked Email as Spam at least once over all time.
---
### Instrukcja tworzenia segmentu w Klaviyo (Suppress List):
1. Wejdź w Segment Builder.
1. Dodaj warunek: Opened Email zero times in the last 180 days.
1. Dodaj warunek (OR): Bounced Email at least once over all time.
1. Dodaj warunek (OR): Marked Email as Spam at least once over all time.
1. Zapisz segment jako Suppress List.
---
### Efekt:
- Oszczędzasz pieniądze na subskrypcji Klaviyo (nie płacisz za martwe kontakty).
- Zwiększasz skuteczność swoich kampanii – trafiają tylko do zainteresowanych odbiorców.
- Utrzymujesz wysoką reputację domeny i lepszą dostarczalność.
---
👉 Suppress List to fundament higieny bazy mailingowej – bez niej trudno zbudować zdrowy i skalowalny email marketing.

---

## Untitled

**URL:** https://www.notion.so/Monitoring-2f75d43e072d80fea3abcd21df3adfc5
**Last Edited:** 2026-01-29T08:46:00.000Z
**Blocks:** 18

### Content

[ ] Sprawdzić open rate dla ostatnich wysyłek (kampanie + flow)
[ ] Sprawdzić click rate i reakcje na CTA
[ ] Sprawdzić bounce rate (szczególnie hard bounce)
[ ] Sprawdzić liczbę spam complaints (0 = cel)
[ ] Sprawdzić zakładkę Deliverability w Klaviyo
[ ] Sprawdzić status domeny wysyłkowej (healthy / warning)
[ ] Sprawdzić, czy nie pojawiły się blokady lub throttling
[ ] Sprawdzić Google Postmaster (jeśli dostępny)
[ ] Sprawdzić reputację domeny (spam rate, IP reputation)
[ ] Sprawdzić wolumen wysyłek (czy nie wzrósł zbyt gwałtownie)
[ ] Sprawdzić, do jakich segmentów faktycznie poszły maile
[ ] Upewnić się, że >60 dni nie są objęci wysyłką
[ ] Sprawdzić, czy welcome flow faktycznie wysyła maile
[ ] Sprawdzić, czy abandoned cart i checkout działają poprawnie
[ ] Sprawdzić, czy nie ma konfliktów między flow
[ ] Sprawdzić unsubscribe rate
[ ] Sprawdzić feedback od użytkowników (odpowiedzi na maile)
[ ] Zanotować obserwacje (co działa / co nie)

---

## Sprawdzona historia wysyłek (bounce / spam / unsubscribe)

**URL:** https://www.notion.so/Sprawdzona-historia-wysy-ek-bounce-spam-unsubscribe-2f75d43e072d80b3ad13c4b1c92dc198
**Last Edited:** 2026-01-29T13:42:00.000Z
**Blocks:** 0

### Content

*No content*

---

## Potwierdzony monitoring deliverability

**URL:** https://www.notion.so/Potwierdzony-monitoring-deliverability-2f75d43e072d80be99a8de9c0e8ec621
**Last Edited:** 2026-01-29T13:43:00.000Z
**Blocks:** 0

### Content

*No content*

---

## Sprawdzone wskaźniki deliverability (bounce / spam / unsubscribe)

**URL:** https://www.notion.so/Sprawdzone-wska-niki-deliverability-bounce-spam-unsubscribe-2f75d43e072d80419e7af43b9c50c3b3
**Last Edited:** 2026-01-29T15:42:00.000Z
**Blocks:** 0

### Content

*No content*

---

## Sprawdzone wskaźniki deliverability (bounce / spam / unsubscribe)

**URL:** https://www.notion.so/Sprawdzone-wska-niki-deliverability-bounce-spam-unsubscribe-2f75d43e072d80e38449e08e76dc40c2
**Last Edited:** 2026-01-29T15:42:00.000Z
**Blocks:** 0

### Content

*No content*

---

## Sprawdzone wskaźniki deliverability (bounce / spam / unsubscribe)

**URL:** https://www.notion.so/Sprawdzone-wska-niki-deliverability-bounce-spam-unsubscribe-2f75d43e072d806ab12ee8ba23c4dd55
**Last Edited:** 2026-01-29T15:46:00.000Z
**Blocks:** 0

### Content

*No content*

---

## Podsumowanie

**URL:** https://www.notion.so/Podsumowanie-2f75d43e072d804fa511d41978008449
**Last Edited:** 2026-02-06T18:53:00.000Z
**Blocks:** 85

### Content

Co musi brać pod uwagę

Silnik powinien łączyć dane z:
1. Formularze
- jakość pozyskania
- udział importów
- skuteczność form
- stabilność zapisów
2. Segmenty
- % nieaktywnych
- overlap
- engaged system
- revenue per segment
3. Flow
- czy istnieją podstawowe
- które zarabiają
- które psują reputację
- które nie startują
4. Kampanie
- wolumen
- reputacja
- segmentacja
- revenue concentration
5. Design
- UX
- mobile
- alt
- linki
6. Branża / model biznesowy
- powtarzalność zakupów
- średni cykl zakupowy
- cena produktu
- sezonowość
Jak to powinno działać logicznie
Nie może to być:
„Spam > 0.1% → popraw deliverability”
Przykład, jeśli:
- wysoki % nieaktywnych
- kampanie wysyłane do całej bazy
- wysoki unsub
- brak winback

7. Główne problemy systemowe
Nie 20 punktów.
Tylko te, które blokują wzrost.
Np:
- Nadmierne wysyłki do nieaktywnych (reputacja ryzyko)
- Brak systemu winback
- Revenue skoncentrowany w 2 kampaniach
- Welcome zbyt krótki
- Formularze generują niski intent
8. Priorytety na 30 dni
Podzielone na:
🔴 Krytyczne (tydzień 1–2)
- Wdrożenie wykluczenia 180+
- Poprawa filtra w Cart flow
- Zmniejszenie wolumenu kampanii masowych
🟡 Wzrostowe (tydzień 2–3)
- Rozbudowa Welcome do 3 maili
- Test segmentu engaged 30 vs 90
🟢 Optymalizacyjne (tydzień 3–4)
- Test subject line
- Poprawa alt tagów
- Dark mode fixes
1. Wpływ vs Wysiłek
Tabela:
1. Spersonalizowany komentarz strategiczny

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

# Jak liczyć Deliverability Score (przykład logiki)
Start: 100 pkt
- Spam >0.1% → -20
- Hard bounce >0.5% → -20
- Delivery rate <98% → -15
- Wysyłki do suppressed → -25
Jeśli wszystko 0% i 100% delivery → 100 pkt.
Ale…
⚠️ Jeśli baza < 50 kontaktów → pokaż:
> Próba zbyt mała do pełnej oceny reputacji
I półkole może być wyszarzone.

---

