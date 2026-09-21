import type { AppState } from '../app/types'
import { lessons } from '../content/content'

export function Parent({ s, back }: { s: AppState; back: () => void }) {
  const completed = Object.values(s.progress).filter(p => p.status === 'completed').length
  const weak = Object.values(s.progress).filter(p => p.mastery < .7 && p.attempts > 0)

  return (
    <section>
      <button className="back" onClick={back}>← Назад</button>
      <div className="parent-report card">
        <div className="parent-report-head">
          <div><p className="eyebrow">ДЛЯ РОДИТЕЛЕЙ</p><h1>Прогресс ребёнка</h1><p className="muted">Краткий отчёт об обучении {s.profile!.name}. Здесь нет фиктивного «защитного» примера: настоящий родительский доступ должен подключаться отдельно.</p></div>
          <span>👨‍👩‍👧</span>
        </div>
        <div className="stats-grid">
          <div>📚<b>{completed}</b><small>Уроков</small></div>
          <div>🏆<b>{s.xp}</b><small>Баллов</small></div>
          <div>⭐<b>{s.stars}</b><small>Звёзд</small></div>
        </div>
        <h2>Темы для повторения</h2>
        {weak.length ? weak.map(p => <p key={p.id}>🔁 {lessons.find(l => l.id === p.lessonId)?.title || 'Урок'}</p>) : <p className="muted">Пока нет тем, которые требуют повторения.</p>}
        <div className="parent-note"><b>🔐 Важно</b><small>Для будущего родительского кабинета добавим отдельную аутентификацию, а не арифметический пароль.</small></div>
      </div>
    </section>
  )
}
