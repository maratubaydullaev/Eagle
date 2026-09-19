# ПОЧЕМУЧКИ

**Узнавай. Играй. Открывай мир!**

Детская образовательная игра/WebApp для школьной программы 1–3 классов.

## Текущая версия

**v1.1** — UX/product polish после стабильной контрольной версии v2.0.

Контрольная версия сохранена в ветке `release/v2.0`. Текущая разработка продолжается в `main`.

## Что вошло в v1.1

1. Убран социальный рейтинг и сравнение детей между собой.
2. Родительский раздел больше не использует фиктивную арифметическую «защиту».
3. Персонаж финализирован как **Котёнок-Почемучка**; докторские атрибуты удалены.
4. Перед заданиями появился короткий briefing: цель и план урока.
5. В curriculum подключены интерактивы `matching`, `drag_drop`, `sorting` вместе с quiz.
6. Добавлен единый accessibility/design layer: focus-visible, safe-area, reduced-motion, touch-friendly controls.
7. Добавлены Playwright E2E-сценарии для мобильных viewport 375/390/412 px.
8. CI запускает E2E после unit tests и production build.
9. Документация обновлена, включая ограничения реального device QA.

## Архитектура

- `src/app/App.tsx` — текущая оболочка и экранные маршруты.
- `src/services/core.ts` — локальное состояние, прогресс, XP, звёзды и интервалы повторения.
- `src/services/backend.ts` — Supabase/Telegram API.
- `supabase/functions/pochemuchka-api/index.ts` — серверная валидация активности и прогресса.
- `src/content/content.ts` — curriculum.
- `src/features/activities.tsx` — игровые типы заданий.
- `e2e/` — Playwright smoke/E2E tests.

## QA

CI проверяет:

- Vitest
- TypeScript/Vite build
- Supabase function type-check
- Playwright mobile E2E

Реальный iOS Safari, Telegram WebView, offline/update behavior и физические устройства требуют отдельного ручного device QA; эмуляция Chromium не заменяет его.

## Документы

- `docs/POCHEMUCHKA_SPEC_v2.md` — базовое ТЗ.
- `docs/POCHEMUCHKA_V1.1.md` — журнал изменений v1.1.
- `legacy/index.html` — исходный прототип.
