# ПОЧЕМУЧКА — Architecture Audit

**Дата аудита:** 2026-09-18  
**Репозиторий:** maratubaydullaev/Eagle  
**Ветка:** main  
**Фаза:** Phase 0 — Audit  
**Статус:** Audit completed; MVP implementation should start only after this document is accepted as the baseline.

## 1. Executive summary

Репозиторий сейчас содержит сохранённый legacy-прототип, документацию MVP и минимальный каркас будущего приложения.

Текущий production/MVP application пока не создан.

Основной рабочий прототип находится в legacy/index.html. Он представляет собой один HTML-файл с CSS и JavaScript внутри.

Главный вывод: не нужно переписывать прототип целиком.

Безопасная стратегия:
legacy → Foundation → React + TypeScript → Content layer → Activity Engine → Learning/Progress → Backend → Telegram/PWA.

Legacy-файл сохранить как reference/regression baseline до завершения миграции.

## 2. Current repository structure

Eagle/
- .gitignore
- README.md
- package.json
- docs/POCHEMUCHKA_SPEC_v2.md
- docs/ARCHITECTURE_AUDIT.md
- legacy/README.md
- legacy/index.html
- public/icons/.gitkeep
- public/images/.gitkeep
- public/sounds/.gitkeep
- src/.gitkeep

Это подготовительный каркас проекта, но ещё не рабочее React/Vite приложение.

## 3. Current stack

Legacy prototype:
- HTML
- CSS
- Vanilla JavaScript
- SVG
- Web Audio API
- localStorage
- Telegram WebApp SDK
- Google Fonts

Future target stack согласно спецификации:
- React
- TypeScript
- Vite
- Supabase / PostgreSQL
- Zod
- PWA
- Telegram WebApp

package.json сейчас содержит scripts dev/build/preview, но зависимости React/Vite/TypeScript и конфигурация приложения отсутствуют.

Следовательно, текущий репозиторий пока нельзя считать готовым к воспроизводимому npm build.

## 4. Current application entry point

Legacy entry point: legacy/index.html.

В корне отсутствуют:
- index.html
- vite.config.*
- tsconfig.json
- src/main.*
- src/App.*

Будущий application entry point предстоит создать.

## 5. What is already reusable

### UI
Сохраняем:
- mobile-first layout;
- max-width около 460px;
- rounded cards;
- friendly visual language;
- mascot;
- progress bar;
- answer buttons;
- feedback states;
- animations;
- confetti;
- dark-mode support;
- touch-first interaction.

### Gameplay
Сохраняем как основу QuizActivity:
- random question selection;
- 8 questions per round;
- 3 lives;
- 15-second timer;
- score;
- correct/wrong states;
- next-question flow;
- end screen.

### Audio
Есть синтезированные звуки через Web Audio API:
- correct;
- wrong;
- win;
- click.

Вынести в AudioService.

### Telegram
Есть:
- Telegram.WebApp;
- ready();
- expand();
- MainButton;
- theme/background integration;
- haptic feedback;
- Telegram first name.

Вынести в TelegramService.

## 6. Current content model

Legacy использует BANK с разделами math, reading и world.

Question model:
q — question text
a — answer array
c — correct answer index

После загрузки каждому вопросу назначается ID вида math_0, math_1 и т.д.

### Проблема

Correct answer определяется индексом c:0. Это хрупкая модель для масштабируемого content engine.

### Target

Использовать стабильные answer IDs и correctAnswerId.

## 7. Major technical debt

### P0 — Build system incomplete

package.json ссылается на Vite, но Vite/React/TypeScript и конфигурация приложения отсутствуют.

Risk: npm build не является воспроизводимым.

Action: создать полноценный Foundation отдельным migration step.

### P0 — No real application architecture

Сейчас отсутствуют:
- components;
- routes;
- services;
- repositories;
- content layer;
- schemas;
- state management;
- backend adapter.

Action: создать foundation, не удаляя legacy.

### P0 — Progress is not persistent backend data

Текущий prototype использует localStorage. Это не соответствует MVP-модели.

Action: repository abstraction → Supabase/PostgreSQL.

### P0 — Telegram identity is not securely authenticated

Frontend использует initDataUnsafe.user.first_name для UX.

Это не authentication.

В MVP identity должна подтверждаться backend через Telegram WebApp init data.

### P1 — Local leaderboard conflicts with MVP

Legacy содержит local leaderboard «Лучшие приёмы на этом устройстве».

В новой концепции социальное сравнение детей исключается из MVP.

Action: убрать leaderboard из нового application UI. Legacy оставить без изменений.

### P1 — Child Profile отсутствует как отдельная сущность

Сейчас name + age живут внутри игровой state.

Нужно выделить ChildProfile:
id, name, age, avatar, createdAt, updatedAt.

### P1 — Age adaptation отсутствует

Legacy позволяет выбрать возраст 5–12, но контент не адаптируется по возрасту.

MVP должен поддерживать возрастные группы 6–7, 8–9, 10.

### P1 — Lesson Engine отсутствует

Legacy flow:
subject → quiz → result.

Target:
world → topic → lesson → intro → explain → interactive → game → assessment → reward → progress.

### P1 — Activity Engine отсутствует

MVP:
- quiz
- drag_drop
- matching

Architecture-ready:
- sorting
- memory
- find_object
- sequence

### P1 — Reward system отсутствует

Legacy score не равен XP/Stars.

Нужно разделить Score, XP, Stars, Badges и Unlocks.

### P1 — Mastery/Repetition отсутствуют

Нет topic mastery, weak-topic detection, repetition queue и spaced repetition intervals.

## 8. Telegram integration review

Current:
Telegram.WebApp, ready(), expand(), MainButton, theme params, HapticFeedback, initDataUnsafe.user.first_name.

Сохранить lifecycle, theme, MainButton и haptics.

Создать services/telegram.ts.

Authentication вынести в backend.

## 9. localStorage review

Legacy использует localStorage для sound preference и leaderboard.

Для MVP localStorage оставить только для preferences, temporary session state и cache/offline shell.

Не использовать его как source of truth для profile, progress, attempts, achievements и rewards.

## 10. UI/UX findings

Сильная часть legacy — мобильный игровой UI.

Сохраняем:
- rounded cards;
- mascot;
- bright friendly palette;
- touch-first interaction;
- feedback;
- animation;
- progress.

В новом application branding:
ПОЧЕМУЧКА
Узнавай. Играй. Открывай мир!

Кот становится универсальным Котом-Почемучкой / Котом-исследователем.

Legacy «Кот-Доктор» сохранить как historical/theme reference.

## 11. Accessibility findings

Есть базовые semantic buttons и touch targets.

Нужно добавить/проверить:
- explicit labels;
- keyboard navigation;
- focus states;
- aria-label / aria-live;
- reduced motion;
- non-color-only feedback;
- accessible drag/drop alternative;
- readable contrast;
- screen-reader semantics.

## 12. Content migration

Не переносить BANK непосредственно в React components.

Создать content layer:
content/worlds
content/topics
content/lessons
content/activities

На MVP можно использовать JSON.

Content IDs должны быть стабильными.

## 13. Recommended target architecture

src/
- app/
- components/
- features/
  - profile/
  - home/
  - worlds/
  - lessons/
  - activities/
    - quiz/
    - drag-drop/
    - matching/
  - progress/
  - rewards/
- content/
- services/
  - telegram.ts
  - audio.ts
  - haptics.ts
  - analytics.ts
  - rewards.ts
  - repetition.ts
- repositories/
- schemas/
- lib/
- styles/

Это target architecture, а не инструкция сделать всё одним коммитом.

## 14. Backend target

Recommended:
Supabase → PostgreSQL.

Repositories должны скрывать конкретный backend.

Минимальные сущности:
profiles, worlds, topics, lessons, activities, lesson_progress, activity_attempts, achievements, user_achievements.

Позже:
learning_sessions, reward_transactions, analytics_events.

## 15. MVP content plan

Active MVP worlds:
- 🌍 Мир — 3 lessons
- 🔢 Математика — 4 lessons
- 🐾 Животные — 3 lessons

Total: 10 lessons.

Будущие worlds Космос, Наука и Логика не должны отображаться как активные MVP worlds без опубликованного контента.

## 16. Migration plan

### Phase 0 — DONE
Audit repository and legacy.

### Phase 1 — Foundation
Create Vite, React, TypeScript, entry point, routing, base styles, application shell, service interfaces and repository interfaces. Legacy remains untouched.

### Phase 2 — Content Engine
Extract question bank. Create stable IDs, JSON schemas, validation and world/topic/lesson/activity models.

### Phase 3 — Activity Engine
Implement Quiz, Drag & Drop and Matching. Preserve quiz behavior from legacy.

### Phase 4 — Learning Engine
Implement lesson flow, activity sequencing, assessment, configurable timer and age adaptation.

### Phase 5 — Profile + Session
Implement child profile, onboarding, continue learning and session resume.

### Phase 6 — Backend
Implement authentication, repositories, persistence and Supabase/PostgreSQL.

### Phase 7 — Progress + Rewards
Implement XP, stars, lesson progress, mastery, unlocks and idempotent reward transactions.

### Phase 8 — Repetition
Implement weak topic detection, repetition queue and 1/3/7 day intervals.

### Phase 9 — Parent Dashboard
Implement separately from child UI.

### Phase 10 — Telegram + PWA
Finalize Telegram service, secure initData validation, MainButton, haptics, manifest, service worker and offline shell.

### Phase 11 — QA
Test onboarding, profile, home, world, topic, lesson, quiz, drag/drop, matching, rewards, progress, repetition, Telegram, PWA, refresh, persistence, mobile and accessibility.

## 17. Files disposition

- legacy/index.html — KEEP as regression/reference baseline
- legacy/README.md — KEEP
- docs/POCHEMUCHKA_SPEC_v2.md — KEEP as specification
- docs/ARCHITECTURE_AUDIT.md — KEEP and update
- package.json — REFACTOR during Foundation
- .gitignore — KEEP/update as dependencies are added
- src/ — BUILD new architecture here
- public/ — KEEP for static assets
- root README.md — UPDATE after Foundation

## 18. Things explicitly NOT to do now

Do not:
- delete legacy;
- rewrite everything in one commit;
- move all legacy code blindly into React;
- keep local leaderboard in the new MVP;
- make localStorage the database;
- trust frontend Telegram identity for authentication;
- hardcode XP/stars inside UI components;
- hardcode content inside components;
- create hundreds of lessons;
- activate future worlds without content;
- implement Parent Dashboard inside Child UI.

## 19. Recommended first implementation commit

First implementation step after the audit: Foundation only.

Expected result:
React + TypeScript + Vite → working application shell → legacy preserved → basic routing → typed domain foundation → service/repository interfaces.

The app must build successfully before moving to Content Engine.

## 20. Audit conclusion

The existing prototype is a useful UX/gameplay foundation, but it is not yet an MVP architecture.

Correct migration is incremental.

Priority:
1. reproducible build;
2. modular application foundation;
3. content separation;
4. reusable activity engine;
5. learning/progress model;
6. backend persistence;
7. rewards and repetition;
8. Telegram/PWA production integration;
9. QA.

Principle: preserve what already works, then progressively turn it into the ПОЧЕМУЧКА platform.
