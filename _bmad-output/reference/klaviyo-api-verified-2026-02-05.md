# Klaviyo API - weryfikacja raportu (2026-02-05)

## Cel
Ten dokument porzadkuje raport uzytkownika: co jest potwierdzone w oficjalnych docs, a co wymaga dalszej weryfikacji zanim bedziemy na tym polegac w aplikacji.

## Zweryfikowane fakty (na podstawie docs developers.klaviyo.com)
- API uzywa wersjonowania przez naglowek `revision` (daty w formacie ISO). Rewizje sa wspierane 2 lata: 1 rok stabilny + 1 rok zdeprecjonowany; po tym czasie sa wycofywane. Istnieje mechanizm fall-forward i opcja opt-out, ktora powoduje 410 po wycofaniu rewizji.
- /api (server-side) wymaga prywatnego klucza: `Authorization: Klaviyo-API-Key <private>`.
- /client (client-side) wymaga publicznego klucza (company_id / site ID, 6 znakow) przekazywanego w query.
- Legacy API v1/v2 i ich SDK zostaly wycofane 30 czerwca 2024.
- Changelog potwierdza wybrane nowe funkcje w rewizjach 2024-05-15, 2024-06-15, 2024-07-15, 2025-07-15 i 2025-10-15 (Segments API, Bulk Create Events, Forms API, Custom Objects API, Flow Actions API, itp.).
- Docs wskazuja, ze latest revision istnieje jako `v2026-01-15` (link w changelogu v2024-06-15).
- Custom Objects Definition APIs sa w becie i maja release `2026-01-15`.

## Rzeczy prawdopodobne, ale NIEZWERYFIKOWANE (trzeba potwierdzic per endpoint)
- Dokladne listy endpointow w kazdej kategorii (kampanie, listy, segmenty, profile, kupony, catalog, itd.) wymagaja sprawdzenia w API Reference, bo nazwy i sciezki moga sie roznic.
- Szczegoly dot. SMS/push w Campaigns API (pola, ROI, badge counters) - brak potwierdzenia w changelog.
- Form analytics (Query Form Values/Series) - brak potwierdzenia w changelog i w forms API overview.
- Events API jako pelny zamiennik starego Track API (i szczegoly mapowania) - brak potwierdzenia.
- Rate limiting: wartosci 75/s i 700/min - brak potwierdzenia.
- Geofencing API i brak autoryzacji - brak potwierdzenia w docs developers.
- Tag limits (np. 500 tagow) oraz limity paginacji - brak potwierdzenia.
- Szczegoly dot. webhook scope’ow i partner restrictions - brak potwierdzenia.

## Rekomendacja robocza dla projektu
- Do projektowania funkcji w appce uzywamy tylko pozycji z sekcji Zweryfikowane fakty.
- Wszystkie elementy z sekcji NIEZWERYFIKOWANE weryfikujemy bezposrednio w API Reference danego zasobu przed implementacja.

## Sprawdzone zrodla (oficjalne)
- https://developers.klaviyo.com/en/docs/authenticate_
- https://developers.klaviyo.com/en/reference/api_overview
- https://developers.klaviyo.com/en/docs/api_versioning_and_deprecation_policy
- https://developers.klaviyo.com/en/docs/install_a_library
- https://developers.klaviyo.com/en/v2025-07-15/docs/changelog_
- https://developers.klaviyo.com/en/v2024-06-15/docs/changelog_
- https://developers.klaviyo.com/en/v2024-07-15/docs/changelog_
- https://developers.klaviyo.com/en/reference/custom_objects_api_overview
