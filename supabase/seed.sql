-- POCHEMUЧКА MVP content seed. Safe to re-run.
insert into worlds(id,title,description,icon,order_index,is_active) values
('world','Мир','Узнаём, как устроен мир вокруг нас.','🌍',1,true),
('math','Математика','Считаем, сравниваем и решаем задачи.','🔢',2,true),
('animals','Животные','Исследуем удивительный мир животных.','🐾',3,true),
('space','Космос','Скоро откроем новые космические уроки.','🚀',4,false)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,order_index=excluded.order_index,is_active=excluded.is_active;

insert into topics(id,world_id,title,description,order_index) values
('world-basics','world','Мир вокруг нас','Природа, безопасность и ориентирование.',1),
('math-basics','math','Числа и действия','Счёт, сложение, умножение и деление.',1),
('animals-basics','animals','Знакомство с животными','Особенности животных и их детёнышей.',1)
on conflict(id) do update set world_id=excluded.world_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index;

insert into lessons(id,topic_id,title,description,age_min,age_max,difficulty,learning_goal,order_index,is_active) values
('world-road-001','world-basics','Безопасная дорога','Учимся правильно переходить дорогу.',6,10,1,'["знать базовые правила перехода дороги"]',1,true),
('world-compass-001','world-basics','Стороны света','Разбираемся, что показывает компас.',6,10,1,'["различать основные стороны света"]',2,true),
('world-time-001','world-basics','Время вокруг нас','Дни, часы и минуты.',6,10,1,'["понимать базовые единицы времени"]',3,true),
('math-add-001','math-basics','Складываем числа','Тренируем сложение.',6,10,1,'["складывать числа в пределах 100"]',1,true),
('math-sub-001','math-basics','Вычитаем числа','Учимся находить разность.',6,10,1,'["вычитать двузначные числа"]',2,true),
('math-mult-001','math-basics','Умножаем','Закрепляем таблицу умножения.',7,10,2,'["использовать умножение"]',3,true),
('math-div-001','math-basics','Делим поровну','Знакомимся с делением.',7,10,2,'["понимать простое деление"]',4,true),
('animals-cats-001','animals-basics','Кошки','Узнаём особенности домашних кошек.',6,10,1,'["узнать основные особенности кошек"]',1,true),
('animals-habitat-001','animals-basics','Где живут животные?','Сравниваем разные места обитания.',6,10,1,'["связывать животных со средой обитания"]',2,true),
('animals-facts-001','animals-basics','Животные-рекордсмены','Несколько удивительных фактов.',7,10,2,'["узнать несколько фактов о животных"]',3,true)
on conflict(id) do update set topic_id=excluded.topic_id,title=excluded.title,description=excluded.description,age_min=excluded.age_min,age_max=excluded.age_max,difficulty=excluded.difficulty,learning_goal=excluded.learning_goal,order_index=excluded.order_index,is_active=excluded.is_active;

insert into activities(id,lesson_id,type,order_index,content,config) values
('w1a','world-road-001','quiz',1,'{"question":"Что нужно сделать перед переходом дороги?","answers":[{"id":"0","text":"Смотреть по сторонам"},{"id":"1","text":"Закрыть глаза"},{"id":"2","text":"Бежать"}],"correctAnswerId":"0","explanation":"Сначала остановись и внимательно посмотри по сторонам."}','{"xp":10}'),
('w1b','world-road-001','quiz',2,'{"question":"На какой сигнал светофора можно переходить?","answers":[{"id":"0","text":"Красный"},{"id":"1","text":"Жёлтый"},{"id":"2","text":"Зелёный"}],"correctAnswerId":"2","explanation":"Зелёный сигнал разрешает переход, если переход безопасен."}','{"xp":10}'),
('w2a','world-compass-001','quiz',1,'{"question":"Что показывает компас?","answers":[{"id":"0","text":"Время"},{"id":"1","text":"Стороны света"},{"id":"2","text":"Вес"}],"correctAnswerId":"1","explanation":"Компас помогает определить направление."}','{"xp":10}'),
('w2b','world-compass-001','drag_drop',2,'{"items":["Север","Юг","Восток","Запад"],"targets":["N","S","E","W"],"correct":["Север","Юг","Восток","Запад"]}','{"xp":10}'),
('w3a','world-time-001','quiz',1,'{"question":"Сколько минут в одном часе?","answers":[{"id":"0","text":"30"},{"id":"1","text":"60"},{"id":"2","text":"100"}],"correctAnswerId":"1","explanation":"В одном часе 60 минут."}','{"xp":10}'),
('w3b','world-time-001','quiz',2,'{"question":"Сколько дней в обычном году?","answers":[{"id":"0","text":"365"},{"id":"1","text":"300"},{"id":"2","text":"400"}],"correctAnswerId":"0","explanation":"Обычный год содержит 365 дней."}','{"xp":10}'),
('m1a','math-add-001','quiz',1,'{"question":"Сколько будет 7 + 8?","answers":[{"id":"0","text":"15"},{"id":"1","text":"14"},{"id":"2","text":"16"}],"correctAnswerId":"0","explanation":"7 и 8 вместе дают 15."}','{"xp":10}'),
('m1b','math-add-001','quiz',2,'{"question":"Сколько будет 12 + 39?","answers":[{"id":"0","text":"51"},{"id":"1","text":"49"},{"id":"2","text":"52"}],"correctAnswerId":"0","explanation":"12 + 39 = 51."}','{"xp":10}'),
('m2a','math-sub-001','quiz',1,'{"question":"Сколько будет 45 − 19?","answers":[{"id":"0","text":"26"},{"id":"1","text":"24"},{"id":"2","text":"25"}],"correctAnswerId":"0","explanation":"45 − 19 = 26."}','{"xp":10}'),
('m2b','math-sub-001','quiz',2,'{"question":"Сколько будет 100 − 45?","answers":[{"id":"0","text":"55"},{"id":"1","text":"65"},{"id":"2","text":"45"}],"correctAnswerId":"0","explanation":"100 − 45 = 55."}','{"xp":10}'),
('m3a','math-mult-001','quiz',1,'{"question":"6 × 6 = ?","answers":[{"id":"0","text":"36"},{"id":"1","text":"30"},{"id":"2","text":"42"}],"correctAnswerId":"0","explanation":"Шесть шестёрок — это 36."}','{"xp":10}'),
('m3b','math-mult-001','quiz',2,'{"question":"7 × 7 = ?","answers":[{"id":"0","text":"49"},{"id":"1","text":"42"},{"id":"2","text":"56"}],"correctAnswerId":"0","explanation":"7 × 7 = 49."}','{"xp":10}'),
('m4a','math-div-001','quiz',1,'{"question":"Раздели 36 на 6.","answers":[{"id":"0","text":"6"},{"id":"1","text":"5"},{"id":"2","text":"7"}],"correctAnswerId":"0","explanation":"36 разделить на 6 — это 6."}','{"xp":10}'),
('m4b','math-div-001','quiz',2,'{"question":"Раздели 48 на 8.","answers":[{"id":"0","text":"6"},{"id":"1","text":"5"},{"id":"2","text":"8"}],"correctAnswerId":"0","explanation":"48 разделить на 8 — это 6."}','{"xp":10}'),
('a1a','animals-cats-001','quiz',1,'{"question":"Чем кошки покрыты?","answers":[{"id":"0","text":"Шерстью"},{"id":"1","text":"Чешуёй"},{"id":"2","text":"Панцирем"}],"correctAnswerId":"0","explanation":"У большинства кошек тело покрыто шерстью."}','{"xp":10}'),
('a1b','animals-cats-001','matching',2,'{"pairs":[["Кошка","Котёнок"],["Собака","Щенок"],["Корова","Телёнок"]]}','{"xp":10}'),
('a2a','animals-habitat-001','quiz',1,'{"question":"Где живёт белый медведь?","answers":[{"id":"0","text":"В Арктике"},{"id":"1","text":"В пустыне"},{"id":"2","text":"В джунглях"}],"correctAnswerId":"0","explanation":"Белые медведи живут в арктических районах."}','{"xp":10}'),
('a2b','animals-habitat-001','drag_drop',2,'{"items":["Верблюд","Дельфин","Лев"],"targets":["Пустыня","Море","Саванна"],"correct":["Верблюд","Дельфин","Лев"]}','{"xp":10}'),
('a3a','animals-facts-001','quiz',1,'{"question":"Какое животное самое высокое на суше?","answers":[{"id":"0","text":"Жираф"},{"id":"1","text":"Слон"},{"id":"2","text":"Лошадь"}],"correctAnswerId":"0","explanation":"Жираф — самое высокое современное наземное животное."}','{"xp":10}'),
('a3b','animals-facts-001','quiz',2,'{"question":"Что дают пчёлы?","answers":[{"id":"0","text":"Мёд"},{"id":"1","text":"Молоко"},{"id":"2","text":"Шерсть"}],"correctAnswerId":"0","explanation":"Пчёлы производят мёд из нектара."}','{"xp":10}')
on conflict(id) do update set lesson_id=excluded.lesson_id,type=excluded.type,order_index=excluded.order_index,content=excluded.content,config=excluded.config;
