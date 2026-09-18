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
