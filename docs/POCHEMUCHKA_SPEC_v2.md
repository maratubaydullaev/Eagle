# ПОЧЕМУЧКА

## Master Technical Specification / Codex Implementation Brief

### MVP v1

**Рабочее название:** Почемучка
**Слоган:** Узнавай. Играй. Открывай мир!
**Тип продукта:** детское образовательное игровое приложение
**Основная платформа MVP:** WebApp / PWA + Telegram WebApp
**Целевая аудитория:** дети примерно 6–10 лет
**Основной язык MVP:** русский
**Главная задача:** превратить существующий quiz-прототип `cat-doctor-quiz_3.html` в масштабируемую образовательную игровую платформу.

---

# 1. КОНТЕКСТ ПРОЕКТА

В репозитории уже существует рабочий HTML-прототип:

`cat-doctor-quiz_3.html`

Это нельзя считать обычным новым проектом.

Нужно использовать существующий прототип как UI/UX foundation и постепенно преобразовать его в архитектуру MVP.

В текущем прототипе уже реализованы:

* mobile-first интерфейс;
* визуальная система;
* карточки;
* mascot;
* экран имени и возраста;
* выбор предмета;
* quiz gameplay;
* 8 вопросов за раунд;
* 3 жизни;
* таймер 15 секунд;
* score;
* progress bar;
* правильный/неправильный feedback;
* animation;
* confetti;
* sound effects;
* Telegram WebApp integration;
* Telegram MainButton;
* Telegram haptic feedback;
* localStorage;
* локальный leaderboard.

Существующий игровой экран построен вокруг модели:

`question → 4 answers → answer → feedback → next question`

Это необходимо сохранить как один из игровых режимов, но архитектуру сделать универсальной.

---

# 2. НОВАЯ КОНЦЕПЦИЯ

Приложение больше не должно восприниматься как просто quiz.

Новая модель:

`WORLD → TOPIC → LESSON → ACTIVITIES → ASSESSMENT → REWARD → PROGRESS → REPETITION`

Основная единица обучения — **Lesson**.

Пример:

```text
🚀 Космос
    ↓
Солнечная система
    ↓
Урок: Планеты
    ↓
Объяснение
    ↓
Интерактив
    ↓
Игра
    ↓
Вопрос
    ↓
Награда
    ↓
Прогресс
```

---

# 3. ОСНОВНЫЕ ПРИНЦИПЫ

## 3.1. Child first

Интерфейс должен быть понятен ребёнку без объяснений взрослого.

## 3.2. Learning first

Игра должна помогать обучению, а не просто проверять знания.

## 3.3. Short sessions

Один урок должен занимать примерно 3–7 минут.

## 3.4. Positive feedback

Ошибки не должны восприниматься как наказание.

Вместо:

`Неправильно!`

предпочтительно:

`Почти! Давай попробуем ещё раз.`

или:

`Хорошая попытка! Посмотри внимательно.`

## 3.5. No child social ranking in MVP

Не использовать публичный рейтинг детей.

Вместо этого:

* personal progress;
* stars;
* XP;
* badges;
* completed lessons;
* mastery.

## 3.6. Repetition

Система должна запоминать слабые темы и возвращать их ребёнку.

---

# 4. ПРОДУКТОВАЯ СТРУКТУРА

Главная структура:

```text
ПОЧЕМУЧКА
│
├── 🌍 Мир
│
├── 🐾 Животные
│
├── 🚀 Космос
│
├── 🔬 Наука
│
├── 🔢 Математика
│
└── 🧠 Логика
```

Каждый World содержит Topics.

Например:

```text
🚀 Космос

├── Солнечная система
├── Планеты
├── Солнце
├── Луна
└── Звёзды
```

---

# 5. MVP CONTENT

Для первой версии создать минимум:

## World 1 — 🌍 Мир

3 урока.

## World 2 — 🔢 Математика

4 урока.

## World 3 — 🐾 Животные

3 урока.

Итого:

**10 полноценных уроков.**

Не создавать сразу сотни уроков.

Архитектура должна позволять добавлять их без изменения игрового движка.

---

# 6. LESSON STRUCTURE

Каждый Lesson состоит из:

```text
1. Intro
2. Explain
3. Interactive
4. Game
5. Assessment
6. Reward
```

Пример:

```json
{
  "id": "space_planets_001",
  "worldId": "space",
  "topicId": "planets",
  "title": "Какие бывают планеты?",
  "ageMin": 6,
  "ageMax": 8,
  "learningGoal": "Ребёнок узнаёт планеты Солнечной системы",
  "steps": [
    {
      "type": "intro"
    },
    {
      "type": "explain"
    },
    {
      "type": "interactive"
    },
    {
      "type": "quiz"
    },
    {
      "type": "reward"
    }
  ]
}
```

---

# 7. ACTIVITY ENGINE

Создать универсальный Activity Engine.

Минимально поддержать:

```text
quiz
drag_drop
matching
sorting
memory
find_object
sequence
```

В MVP обязательно реализовать:

### 1. Quiz

Выбор ответа.

### 2. Drag & Drop

Перетащить объект в правильное место.

### 3. Matching

Соединить пары.

Дополнительные типы подготовить архитектурно, даже если они будут реализованы позже.

---

# 8. QUIZ ENGINE

Существующий quiz engine необходимо сохранить и рефакторить.

Существующая логика:

* случайный выбор вопросов;
* 8 вопросов;
* 3 жизни;
* timer;
* score;
* feedback;
* next button.

Сделать из неё reusable component:

```text
QuizActivity
```

Quiz не должен быть отдельным приложением.

Он должен быть одним из:

```text
ActivityType
```

---

# 9. ИГРОВЫЕ ПРАВИЛА

Не делать всю образовательную систему зависимой от таймера.

Таймер должен быть configurable:

```json
{
  "timer": {
    "enabled": true,
    "seconds": 15
  }
}
```

Для некоторых уроков:

```json
{
  "timer": {
    "enabled": false
  }
}
```

Потому что скорость ответа и качество обучения — разные показатели.

---

# 10. СИСТЕМА ОЧКОВ

Создать:

```text
XP
Stars
```

Пример:

```text
правильный ответ = +10 XP

завершение activity = +5 XP

завершение lesson = +20 XP

идеальное прохождение = +1 bonus star
```

Значения сделать configurable.

Не хардкодить их в компонентах.

---

# 11. REWARD SYSTEM

Создать:

```text
Reward Engine
```

Поддерживать:

* stars;
* XP;
* badges;
* unlocked worlds;
* unlocked lessons.

Пример:

```text
🏆 Первый урок
🌟 10 правильных ответов
🚀 Исследователь космоса
🔢 Мастер чисел
🐾 Друг животных
```

---

# 12. CHILD PROFILE

Текущий экран имени/возраста необходимо превратить в создание профиля.

Сейчас имя и возраст являются частью стартового сценария текущего quiz.

Новая модель:

```text
Child Profile

id
name
age
avatar
createdAt
updatedAt
```

Возраст используется для выбора подходящего контента.

Не показывать ребёнку снова форму имени при каждом запуске.

---

# 13. AGE ADAPTATION

Контент должен иметь возрастной диапазон:

```text
ageMin
ageMax
```

Минимально:

```text
6–7
8–9
10
```

Архитектура должна позволять в будущем расширить:

```text
6–7
8–9
10–11
12+
```

Не предполагать, что один и тот же вопрос одинаково подходит всем возрастам.

---

# 14. HOME SCREEN

После профиля ребёнок попадает на главный экран.

Пример:

```text
👋 Привет, Маша!

⭐ 127 XP

Продолжить обучение
[ 🚀 Космос ]

Твои миры

🌍 Мир
██████░░░░

🐾 Животные
████░░░░░░

🚀 Космос
███░░░░░░░

🔢 Математика
███████░░░
```

Основная CTA:

**Продолжить**

должна вести к следующему незавершённому уроку.

---

# 15. LEARNING MAP

Создать экран:

`WorldMap`

Каждый мир отображается как отдельная область.

Пример:

```text
🌍 МИР

● Урок 1
● Урок 2
🔒 Урок 3
🔒 Урок 4
```

Статусы:

```text
available
in_progress
completed
locked
```

---

# 16. PROGRESS ENGINE

Создать отдельный Progress Engine.

Он должен отслеживать:

```text
lesson completion
activity completion
attempts
correct answers
wrong answers
mastery
XP
stars
badges
```

Пример:

```json
{
  "lessonId": "math_addition_001",
  "status": "completed",
  "score": 85,
  "mastery": 0.82,
  "attempts": 2,
  "completedAt": "..."
}
```

---

# 17. MASTERY

Для каждой темы хранить приблизительный уровень освоения:

```text
0–39% = needs_practice
40–69% = learning
70–89% = good
90–100% = mastered
```

Эти значения должны быть configurable.

---

# 18. REPETITION ENGINE

Создать основу для spaced repetition.

Если ребёнок регулярно ошибается в определённой теме:

```text
weak topic
      ↓
repetition queue
      ↓
future lesson
```

Например:

```text
Math
Addition
mastery = 42%
```

Система должна предложить:

> Давай ещё раз потренируем сложение.

---

# 19. CONTENT ARCHITECTURE

Контент не должен находиться внутри React components.

Создать отдельный слой:

```text
/content
```

Например:

```text
content/
├── worlds/
├── topics/
├── lessons/
└── activities/
```

Можно использовать JSON на первой версии.

Позже этот слой должен без архитектурных изменений перейти на database/CMS.

---

# 20. LESSON JSON SCHEMA

Создать строгую схему.

Пример:

```json
{
  "id": "animals_cat_001",
  "worldId": "animals",
  "topicId": "cats",
  "title": "Кто такие кошки?",
  "description": "Узнаем интересные факты о кошках",
  "ageMin": 6,
  "ageMax": 8,
  "difficulty": 1,
  "learningGoal": [
    "узнать основные особенности кошек"
  ],
  "steps": []
}
```

---

# 21. ACTIVITY JSON SCHEMA

Общая модель:

```json
{
  "id": "activity_001",
  "type": "quiz",
  "title": "Проверь себя",
  "instructions": "Выбери правильный ответ",
  "data": {},
  "reward": {
    "xp": 10,
    "stars": 1
  }
}
```

Каждый тип activity может иметь собственную data schema.

---

# 22. QUIZ DATA

```json
{
  "type": "quiz",
  "data": {
    "question": "Какая планета третья от Солнца?",
    "answers": [
      "Марс",
      "Земля",
      "Венера",
      "Юпитер"
    ],
    "correctAnswer": 1,
    "explanation": "Земля — третья планета от Солнца."
  }
}
```

---

# 23. DRAG & DROP DATA

```json
{
  "type": "drag_drop",
  "data": {
    "instruction": "Поставь планеты по порядку",
    "items": [],
    "targets": []
  }
}
```

---

# 24. MATCHING DATA

```json
{
  "type": "matching",
  "data": {
    "instruction": "Соедини животное с его детёнышем",
    "pairs": []
  }
}
```

---

# 25. DATABASE

Для MVP использовать PostgreSQL-compatible database.

Рекомендуемая реализация:

**Supabase + PostgreSQL**

Но архитектура приложения не должна жёстко зависеть от Supabase SDK.

Создать abstraction layer:

```text
repositories/
```

Например:

```text
UserRepository
LessonRepository
ProgressRepository
AchievementRepository
```

Это позволит заменить backend позднее.

---

# 26. DATABASE TABLES

Минимальные сущности:

```text
profiles
worlds
topics
lessons
activities
lesson_progress
activity_attempts
achievements
user_achievements
```

---

# 27. PROFILES

```text
profiles

id
name
age
avatar
created_at
updated_at
```

Если Telegram user ID используется, не делать Telegram ID публично отображаемым.

---

# 28. WORLDS

```text
worlds

id
title
description
icon
order_index
is_active
```

---

# 29. TOPICS

```text
topics

id
world_id
title
description
order_index
```

---

# 30. LESSONS

```text
lessons

id
topic_id
title
description
age_min
age_max
difficulty
learning_goal
order_index
is_active
```

---

# 31. ACTIVITIES

```text
activities

id
lesson_id
type
order_index
content
config
```

`content/config` может быть JSONB.

---

# 32. LESSON PROGRESS

```text
lesson_progress

id
profile_id
lesson_id
status
score
mastery
attempts
started_at
completed_at
```

---

# 33. ACTIVITY ATTEMPTS

```text
activity_attempts

id
profile_id
activity_id
is_correct
answer
time_spent
created_at
```

Не хранить больше данных о ребёнке, чем необходимо для работы продукта.

---

# 34. ACHIEVEMENTS

```text
achievements

id
title
description
icon
condition
```

---

# 35. USER ACHIEVEMENTS

```text
user_achievements

id
profile_id
achievement_id
earned_at
```

---

# 36. PARENT DASHBOARD

Создать отдельный родительский раздел.

Он не должен быть частью детского игрового интерфейса.

Минимально показывать:

```text
Время обучения

Пройдено уроков

Получено XP

Получено badges

Сильные темы

Темы для повторения
```

Пример:

```text
Сегодня

⏱ 18 минут
📚 3 урока
⭐ +45 XP

Хорошо получается:
🐾 Животные

Нужно повторить:
🔢 Сложение
```

---

# 37. CHILD / PARENT SEPARATION

Не смешивать:

```text
Child UI
```

и

```text
Parent UI
```

Родительские настройки должны быть защищены от случайного доступа ребёнка.

---

# 38. TELEGRAM WEBAPP

Существующую Telegram WebApp интеграцию сохранить.

Текущий прототип уже использует:

* Telegram WebApp;
* `tg.ready()`;
* `tg.expand()`;
* MainButton;
* theme colors;
* haptic feedback;
* получение `first_name`.

Не удалять эту функциональность.

Перенести её в отдельный сервис:

```text
services/telegram.ts
```

или аналогичный module.

---

# 39. TELEGRAM AUTH

Telegram WebApp user identity должна обрабатываться через backend.

Нельзя доверять только данным, пришедшим из frontend.
Backend должен валидировать Telegram WebApp init data.

---

# 40. LOCAL STORAGE

LocalStorage больше не является основной базой.

Можно оставить его для:

```text
sound preference
theme preference
temporary session state
offline cache
```

Но:

```text
progress
profile
achievements
attempts
```

должны храниться через backend/database.

---

# 41. LEADERBOARD

Существующий local leaderboard удалить из основного MVP.

Сейчас он хранится через localStorage и отображается как рейтинг на конкретном устройстве.

Заменить на:

```text
Мой прогресс
```

Не создавать социальное сравнение детей в первой версии.

---

# 42. MASCOT

Существующего кота сохранить как временного mascot.

Но архитектурно mascot сделать универсальным.

Не привязывать весь продукт к:

`Клиника Кота-Доктора`

Предпочтительный образ:

**Кот-исследователь / Кот-Почемучка**

Он может иметь состояния:

```text
normal
happy
sad
thinking
excited
celebrating
encouraging
```

---

# 43. CAT DOCTOR

Существующий «Кот-Доктор» не удалять полностью.

Использовать его позже как тематического персонажа или отдельный world:

```text
🧬 Человек и здоровье
```

---

# 44. UI/UX

Сохранить визуальный язык существующего прототипа:

* rounded cards;
* bright friendly colors;
* large touch targets;
* mascot;
* animation;
* progress bars;
* feedback;
* mobile-first layout.

Текущий UI ограничен примерно 460px шириной, что является хорошей основой для мобильного интерфейса.

Не делать desktop-first redesign.

---

# 45. ACCESSIBILITY

Минимально:

* достаточный размер touch targets;
* читаемый текст;
* keyboard accessibility там, где применимо;
* `aria-label`;
* отсутствие зависимости только от цвета;
* понятные состояния correct/wrong;
* reduced motion support.

---

# 46. SOUND

Существующую систему звуков сохранить.

Сделать отдельный:

```text
AudioService
```

Настройки:

```text
soundEnabled
```

По умолчанию не навязывать громкие звуки.

---

# 47. HAPTICS

Telegram haptic feedback сохранить.

Вынести:

```text
HapticService
```

Поддерживать:

```text
success
error
selection
celebration
```

---

# 48. OFFLINE / PWA

Подготовить приложение к PWA.

Минимально:

* manifest;
* service worker;
* app shell caching;
* cache static assets;
* graceful offline state.

Не требовать полного offline backend.

---

# 49. ANALYTICS

Создать event abstraction:

```text
AnalyticsService
```

События:

```text
app_opened
profile_created
world_opened
topic_opened
lesson_started
activity_started
answer_submitted
answer_correct
answer_wrong
hint_used
lesson_completed
achievement_earned
```

Не отправлять лишние персональные данные.

---

# 50. CONTENT QA

Перед публикацией каждое задание должно проходить:

```text
factual correctness
age suitability
language correctness
answer uniqueness
difficulty
explanation quality
```

Особенно проверить вопросы из существующего банка.

Например, текущий банк содержит вопросы по математике, чтению и «Миру вокруг».
Не переносить существующий банк blindly.

Сначала преобразовать его в новую content schema и провести QA.

---

# 51. ТЕКУЩИЙ QUESTION BANK

Существующий `BANK` не удалять до завершения миграции.

Сначала:

```text
old BANK
   ↓
migration script
   ↓
new JSON/content records
   ↓
validation
   ↓
old BANK removed
```

---

# 52. COMPONENT ARCHITECTURE

Создать компоненты примерно такого уровня:

```text
AppShell
Header
Mascot
HomeScreen
WorldMap
WorldCard
TopicCard
LessonScreen
LessonIntro
ExplanationStep
InteractiveStep
ActivityRenderer
QuizActivity
DragDropActivity
MatchingActivity
RewardScreen
ProgressBar
XPDisplay
StarsDisplay
AchievementCard
ParentDashboard
```

Не создавать один гигантский component.

---

# 53. SERVICE ARCHITECTURE

Создать:

```text
ProfileService
LessonService
ProgressService
RewardService
AnalyticsService
AudioService
HapticService
TelegramService
RepetitionService
```

---

# 54. ACTIVITY RENDERER

Главный механизм:

```text
ActivityRenderer
```

получает:

```text
activity.type
```

и выбирает нужный component.

Пример:

```text
quiz
   → QuizActivity

drag_drop
   → DragDropActivity

matching
   → MatchingActivity
```

Это должно позволять добавлять новый тип игры без изменения Lesson Engine.

---

# 55. STATE MANAGEMENT

Не хранить состояние всего приложения в случайных global variables.

Создать централизованное application state.

Минимальные slices:

```text
profile
navigation
lesson
progress
session
settings
```

---

# 56. NAVIGATION

Основные routes/screens:

```text
/
 /home
 /world/:id
 /topic/:id
 /lesson/:id
 /parent
 /profile
```

Если проект остаётся Telegram Mini App, routing должен работать внутри WebApp.

---

# 57. ERROR STATES

Предусмотреть:

```text
loading
empty
error
offline
unauthorized
lesson-not-found
```

Не показывать ребёнку технические ошибки вроде stack trace.

---

# 58. SECURITY

Обязательно:

* не хранить секреты во frontend;
* environment variables;
* server-side validation;
* validate user identity;
* validate lesson/activity IDs;
* не принимать score от клиента как trusted value;
* сервер должен при необходимости проверять результат;
* минимизировать хранение child data;
* не логировать персональные данные в production.

---

# 59. ADMIN / CONTENT MANAGEMENT

Полноценную CMS пока можно не строить.

Но архитектуру подготовить.

На MVP контент можно хранить:

```text
JSON
```

или database.

Следующим этапом возможно:

```text
Admin panel
```

где контент-менеджер сможет:

* создать world;
* создать topic;
* создать lesson;
* создать activity;
* редактировать текст;
* задавать правильный ответ;
* задавать возраст;
* задавать difficulty;
* публиковать lesson.

---

# 60. TECHNOLOGY

Предпочтительный стек MVP:

```text
Frontend:
React + TypeScript

Build:
Vite или Next.js

Styling:
CSS modules / plain CSS / Tailwind

Backend:
Supabase

Database:
PostgreSQL

Validation:
Zod или equivalent

PWA:
Service Worker / Vite PWA или equivalent

Hosting:
Vercel / Cloudflare / equivalent
```

Если существующий репозиторий уже использует другой современный стек, **не переписывать его без необходимости**.

Сначала определить текущую архитектуру.

---

# 61. ОСНОВНОЕ ПРАВИЛО CODEX

Перед любыми изменениями:

1. прочитать весь repository;
2. определить stack;
3. определить entry points;
4. определить build system;
5. определить dependencies;
6. определить существующие scripts;
7. определить deployment;
8. проверить `cat-doctor-quiz_3.html`;
9. создать migration plan.

Не начинать с удаления старого кода.

---

# 62. MIGRATION STRATEGY

Использовать постепенную миграцию:

```text
CURRENT PROTOTYPE
        ↓
Foundation
        ↓
Componentization
        ↓
Content extraction
        ↓
Activity Engine
        ↓
Learning Engine
        ↓
Backend
        ↓
Progress
        ↓
Parent
        ↓
PWA
        ↓
Production MVP
```

---

# 63. НЕ ДЕЛАТЬ BIG BANG REWRITE

Запрещено:

```text
delete old project
rewrite everything
```

без backup/branch.

Сначала создать:

```text
branch: mvp-foundation
```

или аналогичный безопасный branch.

---

# 64. ПОРЯДОК РАЗРАБОТКИ

## PHASE 0 — Audit

* inspect repository;
* inspect HTML;
* inspect package;
* inspect deployment;
* inspect Telegram integration;
* inspect existing assets.

Deliverable:

`ARCHITECTURE_AUDIT.md`

---

## PHASE 1 — Foundation

* scaffold architecture;
* TypeScript;
* routing;
* components;
* services;
* styles;
* preserve existing UI.

Deliverable:

working app.

---

## PHASE 2 — Content Engine

* extract BANK;
* define schemas;
* create JSON content;
* create validation;
* create Lesson Engine.

Deliverable:

lessons load from content.

---

## PHASE 3 — Activity Engine

Implement:

1. Quiz
2. Drag & Drop
3. Matching

Deliverable:

three working activity types.

---

## PHASE 4 — Learning Map

Implement:

* Home;
* Worlds;
* Topics;
* Lessons;
* locked/unlocked states;
* continue button.

---

## PHASE 5 — Profile

Implement:

* child profile;
* age;
* avatar;
* persistent profile.

---

## PHASE 6 — Backend

Implement:

* database;
* repositories;
* authentication;
* profile persistence;
* progress persistence.

---

## PHASE 7 — Progress

Implement:

* XP;
* stars;
* mastery;
* achievements;
* lesson completion.

---

## PHASE 8 — Repetition

Implement:

* weak topics;
* repetition queue;
* recommended lesson.

---

## PHASE 9 — Parent

Implement:

* parent dashboard;
* statistics;
* strengths;
* weak topics;
* learning time.

---

## PHASE 10 — Telegram

Finalize:

* Telegram auth;
* MainButton;
* theme;
* haptics;
* Telegram-specific behavior.

---

## PHASE 11 — PWA

Implement:

* manifest;
* service worker;
* offline shell;
* installability.

---

## PHASE 12 — QA

Test:

* mobile;
* Telegram;
* desktop browser;
* touch;
* keyboard;
* dark mode;
* slow network;
* offline;
* incorrect answers;
* lesson completion;
* refresh;
* repeated sessions.

---

# 65. TESTING

Обязательно добавить:

```text
unit tests
integration tests
e2e tests
```

Минимально проверить:

### Quiz

* correct answer;
* wrong answer;
* timeout;
* lives;
* score;
* next question;
* end state.

### Lesson

* start;
* activity sequence;
* completion;
* reward.

### Progress

* save;
* load;
* update;
* repeat.

### Profile

* create;
* load;
* update.

---

# 66. DEFINITION OF DONE

MVP считается готовым, если ребёнок может:

```text
1. открыть приложение
2. создать профиль
3. попасть на Home
4. выбрать World
5. выбрать Topic
6. открыть Lesson
7. пройти объяснение
8. выполнить интерактив
9. сыграть минимум 3 типа игр
10. завершить урок
11. получить XP
12. получить stars
13. увидеть progress
14. закрыть приложение
15. открыть снова
16. продолжить обучение
```

А родитель может:

```text
1. открыть Parent Dashboard
2. увидеть время обучения
3. увидеть завершённые уроки
4. увидеть progress
5. увидеть сильные темы
6. увидеть темы для повторения
```

---

# 67. MVP TARGET

Первая production-ready версия должна содержать:

```text
3 Worlds
10 Lessons
3 Activity Types
1 Child Profile
Progress
XP
Stars
Achievements
Basic Repetition
Parent Dashboard
Telegram WebApp
PWA
Analytics foundation
```

---

# 68. ЧТО НЕ ДЕЛАТЬ В MVP

Не тратить время на:

* multiplayer;
* social chat;
* public leaderboard;
* complicated avatars;
* marketplace;
* advertising;
* school management;
* advanced AI tutor;
* voice conversation;
* hundreds of game types;
* complex CMS;
* payments before core learning loop works.

---

# 69. AI CONTENT PIPELINE — ПОДГОТОВИТЬ АРХИТЕКТУРУ

В будущем контент должен создаваться по pipeline:

```text
Topic
 ↓
AI pedagogical script
 ↓
Illustration
 ↓
Voice
 ↓
Activity
 ↓
Quiz
 ↓
QA
 ↓
Lesson
```

Но AI generation не должен быть hard dependency runtime приложения.

Контент генерируется заранее и сохраняется как validated content.

---

# 70. CONTENT VALIDATION

Создать validator.

Проверять:

```text
required fields
unique IDs
valid activity type
correct answer exists
answer count
age range
lesson order
world/topic relation
reward values
```

Build должен падать, если content schema нарушена.

---

# 71. CODE QUALITY

Требования:

* TypeScript strict mode;
* no unnecessary `any`;
* no duplicated business logic;
* reusable components;
* small modules;
* meaningful names;
* comments only where useful;
* no secrets;
* no hardcoded API keys;
* no giant components;
* no giant global state.

---

# 72. DOCUMENTATION

Создать:

```text
README.md
ARCHITECTURE.md
CONTENT_SCHEMA.md
DATABASE.md
GAME_ENGINE.md
DEPLOYMENT.md
```

---

# 73. ENVIRONMENT

Создать:

```text
.env.example
```

с описанием необходимых variables.

Никогда не коммитить:

```text
.env
secrets
private keys
service role keys
```

---

# 74. GIT WORKFLOW

Создавать небольшие commits:

```text
feat: create app foundation
feat: extract lesson content
feat: add activity engine
feat: add progress
feat: add backend
feat: add parent dashboard
fix: ...
```

После каждого крупного этапа:

```text
npm run build
npm test
```

если соответствующие scripts существуют.

---

# 75. CODEX EXECUTION RULES

Работай итерационно.

После каждого крупного этапа:

1. изменить код;
2. запустить lint;
3. запустить tests;
4. запустить build;
5. исправить ошибки;
6. показать изменённые файлы;
7. кратко описать архитектурные изменения.

Не переходить к следующему этапу при сломанном build.

---

# 76. ВАЖНО: СУЩЕСТВУЮЩИЙ UI

Не менять визуальный стиль без необходимости.

Сначала сохранить:

* цветовую палитру;
* typography;
* cards;
* mascot;
* animations;
* sound;
* mobile layout.

После архитектурного рефакторинга улучшения UI можно делать отдельно.

---

# 77. ВАЖНО: EXISTING QUESTIONS
Не удалять существующий question bank до успешной миграции.

Создать migration utility.

После миграции:

```text
old questions
→ normalized schema
→ validation report
```

Отдельно вывести вопросы, которые требуют ручного content QA.

Не изменять спорный контент молча.

---

# 78. FIRST IMPLEMENTATION TASK

Начать не с написания нового приложения.

Сначала выполнить:

```text
TASK 001

Perform complete repository audit.

Inspect:
- current files
- package.json
- scripts
- framework
- dependencies
- entry points
- cat-doctor-quiz_3.html
- Telegram integration
- localStorage
- assets

Create:

ARCHITECTURE_AUDIT.md

Include:
- current architecture
- reusable code
- technical debt
- migration risks
- proposed target architecture
- exact migration plan
- files to keep
- files to refactor
- files to remove only later
```

После этого перейти к Foundation.

---

# 79. SECOND IMPLEMENTATION TASK

После успешного audit:

```text
TASK 002

Create MVP foundation.

Requirements:

- preserve current working prototype;
- create application architecture;
- introduce TypeScript where appropriate;
- create reusable components;
- create services layer;
- create content layer;
- create routing;
- keep Telegram compatibility;
- keep current visual design.

Do not remove existing functionality unless replacement exists and passes tests.
```

---

# 80. THIRD IMPLEMENTATION TASK

```text
TASK 003

Extract existing question bank into validated content schema.

Create:

/content/worlds
/content/topics
/content/lessons
/content/activities

Create schemas and validation.

Migrate existing math, reading and world questions.

Do not silently modify question meaning.

Generate a QA report for questionable or ambiguous questions.
```

---

# 81. FOURTH IMPLEMENTATION TASK

```text
TASK 004

Implement Activity Engine.

Create ActivityRenderer.

Implement:

- QuizActivity
- DragDropActivity
- MatchingActivity

Existing quiz functionality must continue working.

All activities must support:

- instructions
- success state
- error state
- retry
- completion
- reward
```

---

# 82. FIFTH IMPLEMENTATION TASK

```text
TASK 005

Implement Learning Engine.

Create:

- HomeScreen
- WorldMap
- TopicScreen
- LessonScreen
- lesson progression
- locked/unlocked states
- Continue Learning

Implement:

WORLD → TOPIC → LESSON → ACTIVITY
```

---

# 83. SIXTH IMPLEMENTATION TASK

```text
TASK 006

Implement child profile and persistent progress.

Create:

- profile
- lesson_progress
- activity_attempts
- XP
- stars
- achievements

Replace localStorage as source of truth.

Keep localStorage only for local settings/session/offline cache.
```

---

# 84. SEVENTH IMPLEMENTATION TASK

```text
TASK 007

Implement repetition engine.

Track mastery by topic.

Create weak-topic queue.

Recommend lessons based on:

- incomplete lessons
- weak mastery
- recent errors
- repetition schedule
```

---

# 85. EIGHTH IMPLEMENTATION TASK

```text
TASK 008

Implement Parent Dashboard.

Show:

- learning time
- lessons completed
- XP
- stars
- achievements
- strengths
- topics requiring repetition

Keep parent interface separate from child interface.
```

---

# 86. NINTH IMPLEMENTATION TASK

```text
TASK 009

Finalize Telegram WebApp integration.

Keep:

- Telegram theme
- MainButton
- haptics
- WebApp lifecycle

Move integration into TelegramService.

Implement secure server-side identity validation.
```

---

# 87. TENTH IMPLEMENTATION TASK

```text
TASK 010

Finalize PWA.

Implement:

- manifest
- service worker
- static asset caching
- installability
- offline shell
- offline fallback
```

---

# 88. FINAL QA TASK

```text
TASK 011

Run complete MVP QA.

Test:

- onboarding
- profile
- home
- world
- topic
- lesson
- quiz
- drag/drop
- matching
- rewards
- progress
- repetition
- parent dashboard
- Telegram
- PWA
- refresh
- persistence
- errors
- mobile layout

Run:

lint
tests
build

Fix all blocking issues.

Create:

MVP_QA_REPORT.md
```

---

# 89. FINAL DELIVERABLE

После выполнения всех этапов проект должен представлять собой не просто quiz.

Он должен быть:

**детским образовательным игровым WebApp с системой уроков, интерактивов, прогресса, наград и повторения.**

Главный пользовательский цикл:

```text
ОТКРЫЛ
   ↓
ПРОДОЛЖИЛ
   ↓
УЗНАЛ
   ↓
ПОИГРАЛ
   ↓
ОТВЕТИЛ
   ↓
ПОЛУЧИЛ НАГРАДУ
   ↓
УВИДЕЛ ПРОГРЕСС
   ↓
ПОЛУЧИЛ НОВУЮ ЦЕЛЬ
   ↓
ВЕРНУЛСЯ
```

---

# 90. ФИНАЛЬНОЕ ТРЕБОВАНИЕ К CODEX

Не воспринимай этот документ как задачу «написать всё одним большим коммитом».

Воспринимай его как **Product + Technical Specification**.

Работай последовательно.

Приоритет:

```text
1. Existing prototype stability
2. Architecture
3. Content engine
4. Activity engine
5. Learning engine
6. Backend
7. Progress
8. Repetition
9. Parent dashboard
10. Telegram
11. PWA
12. QA
```

Главный принцип:

**Сначала сохранить работающий продукт, затем превратить его в масштабируемую архитектуру.**

Не ломать рабочую функциональность ради архитектурной чистоты.

Каждый этап должен оставлять приложение запускаемым и проверяемым.