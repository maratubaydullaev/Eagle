import type { AppState } from '../app/types'
import type { Route } from '../app/routes'
import { worlds, lessons, topics } from '../content/content'
import { learning, gradeForAge } from '../services/core'
import { Mascot } from '../components/Mascot'

export function World({ s, id, nav }: { s: AppState; id: string; nav: (r: Route) => void }) {
  const w = worlds.find(x => x.id === id)
  if (!w) return null

  const grade = s.profile!.grade || gradeForAge(s.profile!.age)
  const ls = lessons.filter(l => l.worldId === id && l.grade === grade).sort((a, b) => a.orderIndex - b.orderIndex)
  const done = ls.filter(l => s.progress[l.id]?.status === 'completed').length
  const active = ls.find(l => s.progress[l.id]?.status === 'in_progress') || ls.find(l => s.progress[l.id]?.status !== 'completed')
  const percent = ls.length ? Math.round(done / ls.length * 100) : 0

  return (
    <section className="world-screen">
      <button className="back" onClick={() => nav({ name: 'home' })}>← Назад</button>
      <div className="world-hero card">
        <div className="world-hero-copy">
          <span className="world-kicker">МИР {grade} КЛАССА</span>
          <div className="world-title-row"><span className="world-big-icon">{w.icon}</span><div><h1>{w.title}</h1><p>{w.description}</p></div></div>
          <div className="world-progress-line"><div><span>Твой прогресс</span><b>{done} из {ls.length} уроков</b></div><strong>{percent}%</strong></div>
          <div className="progress"><i style={{ width: percent + '%' }} /></div>
        </div>
        <Mascot mood={active ? 'happy' : 'thinking'} />
      </div>
      <div className="world-mission card">
        {active ? (
          <>
            <span>✨ СЛЕДУЮЩИЙ ШАГ</span>
            <div>
              <div><b>{active.title}</b><small>{s.progress[active.id]?.status === 'in_progress' ? 'Урок уже начат' : 'Готов открыть новую тему?'}</small></div>
              <button onClick={() => nav({ name: 'lesson', id: active.id })}>{s.progress[active.id]?.status === 'in_progress' ? 'Продолжить →' : 'Начать →'}</button>
            </div>
          </>
        ) : (
          <>
            <span>🏆 МИССИЯ ВЫПОЛНЕНА</span>
            <div><b>Все уроки пройдены!</b><small>Отличная работа. Загляни в другие миры.</small><button onClick={() => nav({ name: 'home' })}>К мирам →</button></div>
          </>
        )}
      </div>
      {topics.filter(t => t.worldId === id).map(t => (
        <div className="world-topic card" key={t.id}><span>💡</span><div><p className="section-kicker">ТЕМА</p><h2>{t.title}</h2><p>{t.description}</p></div></div>
      ))}
      <div className="world-lessons-heading"><div><p className="section-kicker">ПУТЬ ОБУЧЕНИЯ</p><h2>Уроки</h2></div><span>{done}/{ls.length}</span></div>
      <div className="lesson-list">
        {ls.map((l, index) => {
          const st = learning.status(s, l)
          const retryLocked = st === 'completed_locked'
          const completed = s.progress[l.id]?.status === 'completed'
          return (
            <button className={'lesson-row ' + st} disabled={st === 'locked' || retryLocked} key={l.id} onClick={() => nav({ name: 'lesson', id: l.id })}>
              <span className="lesson-index">{completed ? '⭐' : retryLocked ? '⏳' : st === 'locked' ? '🔒' : st === 'in_progress' ? '▶️' : String(index + 1).padStart(2, '0')}</span>
              <div><b>{l.title}</b><small>{retryLocked ? 'Повторить можно завтра' : l.description}</small></div>
              <strong>{completed ? (retryLocked ? 'Завтра' : 'Пройдено') : st === 'locked' ? 'Закрыт' : st === 'in_progress' ? 'Продолжить →' : 'Начать →'}</strong>
            </button>
          )
        })}
      </div>
    </section>
  )
}
