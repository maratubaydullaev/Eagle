import type { AppState } from '../app/types'
import type { Route } from '../app/routes'
import { lessons } from '../content/content'
import { gradeForAge } from '../services/core'
import { Mascot } from '../components/Mascot'

export function ProfileMe({ s, nav }: { s: AppState; nav: (r: Route) => void }) {
  const p = s.profile!
  const grade = p.grade || gradeForAge(p.age)
  const completed = Object.values(s.progress).filter(x => x.status === 'completed').length
  const total = lessons.filter(l => l.grade === grade).length

  return (
    <section className="me-screen">
      <div className="me-head">
        <div><p className="eyebrow">МОЙ ПРОФИЛЬ</p><h1>Привет, {p.name}! 👋</h1><p>Здесь живут твои успехи и настройки.</p></div>
        <div className="me-avatar">{p.avatar || '🐱'}</div>
      </div>
      <div className="me-profile-card card">
        <div className="me-character"><Mascot mood="happy" /></div>
        <div><span className="me-label">УЧЕНИК</span><h2>{p.name}</h2><p>{p.age} лет · {grade} класс</p></div>
      </div>
      <div className="me-stats">
        <div><b>{completed}</b><small>уроков</small></div>
        <div><b>{s.xp}</b><small>баллов</small></div>
        <div><b>{s.stars}</b><small>звёзд</small></div>
      </div>
      <div className="card me-progress">
        <div className="section-title"><div><p className="section-kicker">ТВОЙ ПУТЬ</p><h2>Учимся дальше</h2></div><b>{total ? Math.round(completed / total * 100) : 0}%</b></div>
        <div className="progress"><i style={{ width: (total ? completed / total * 100 : 0) + '%' }} /></div>
        <button className="me-action" onClick={() => nav({ name: 'progress' })}>Открыть мой прогресс <span>→</span></button>
      </div>
      <div className="card me-menu">
        <button onClick={() => nav({ name: 'progress' })}><span>📚</span><div><b>Мой прогресс</b><small>Уроки, баллы и повторение</small></div><strong>→</strong></button>
        <button onClick={() => nav({ name: 'achievements' })}><span>🏆</span><div><b>Награды</b><small>Достижения и коллекция</small></div><strong>→</strong></button>
        <button onClick={() => nav({ name: 'parent' })}><span>👨‍👩‍👧</span><div><b>Для родителей</b><small>Настройки и подробности</small></div><strong>→</strong></button>
      </div>
      <div className="me-note"><span>💡</span><div><b>Котёнок-Почемучка рядом</b><small>Продолжай маленькими шагами — у тебя всё получится!</small></div></div>
    </section>
  )
}
