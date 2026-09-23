import { useState } from 'react'
import type { AppState } from '../app/types'
import { lessons } from '../content/content'

// Минимальный локальный гейт, пока нет серверной родительской аутентификации.
// PIN живёт в localStorage и не является безопасной защитой от детей —
// настоящий parent-auth (роль в profiles + отдельный endpoint) подключится отдельно.
const PIN_KEY = 'pochemuchka_parent_pin'
const DEFAULT_PIN = '1234'

function readPin(): string {
  try { return localStorage.getItem(PIN_KEY) || DEFAULT_PIN } catch { return DEFAULT_PIN }
}

export function Parent({ s, back }: { s: AppState; back: () => void }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('pochemuchka_parent_unlocked') === '1')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function submit() {
    if (pin === readPin()) {
      sessionStorage.setItem('pochemuchka_parent_unlocked', '1')
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (!unlocked) {
    return (
      <section className="screen center">
        <div className="hero"><span style={{ fontSize: '3rem' }}>👨‍👩‍👧</span><h1>Для родителей</h1><p>Введи код, чтобы открыть отчёт о прогрессе.</p></div>
        <input type="password" inputMode="numeric" autoFocus value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="••••" aria-label="Родительский код" />
        {error && <p className="muted" role="alert">Код не подошёл, попробуй ещё раз.</p>}
        <button className="primary" disabled={!pin} onClick={submit}>Открыть</button>
        <button className="back" onClick={back}>← Назад</button>
      </section>
    )
  }

  const completed = Object.values(s.progress).filter(p => p.status === 'completed').length
  const weak = Object.values(s.progress).filter(p => p.mastery < .7 && p.attempts > 0)

  return (
    <section>
      <button className="back" onClick={back}>← Назад</button>
      <div className="parent-report card">
        <div className="parent-report-head">
          <div><p className="eyebrow">ДЛЯ РОДИТЕЛЕЙ</p><h1>Прогресс ребёнка</h1><p className="muted">Краткий отчёт об обучении {s.profile!.name}.</p></div>
          <span>👨‍👩‍👧</span>
        </div>
        <div className="stats-grid">
          <div>📚<b>{completed}</b><small>Уроков</small></div>
          <div>🏆<b>{s.xp}</b><small>Баллов</small></div>
          <div>⭐<b>{s.stars}</b><small>Звёзд</small></div>
        </div>
        <h2>Темы для повторения</h2>
        {weak.length ? weak.map(p => <p key={p.id}>🔁 {lessons.find(l => l.id === p.lessonId)?.title || 'Урок'}</p>) : <p className="muted">Пока нет тем, которые требуют повторения.</p>}
        <div className="parent-note"><b>🔐 Важно</b><small>Этот код — временная защита. Полноценный родительский кабинет с отдельной аутентификацией подключается отдельно.</small></div>
      </div>
    </section>
  )
}
