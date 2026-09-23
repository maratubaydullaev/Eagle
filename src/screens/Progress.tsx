import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { AppState } from '../app/types'
import { storage, gradeForAge } from '../services/core'
import { backend } from '../services/backend'
import { lessons, worlds } from '../content/content'
import { GIFT_COSTS } from '../../supabase/functions/_shared/rewards'

export function Progress({ s, back, sync }: { s: AppState; back: () => void; sync: (s: AppState) => void }) {
  const [tab, setTab] = useState<'stars' | 'lessons' | null>(() => (location.hash.replace('#/', '') === 'shop' ? 'stars' : null))
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const grade = s.profile!.grade || gradeForAge(s.profile!.age)
  const availableLessons = lessons.filter(l => l.grade === grade).sort((a, b) => a.orderIndex - b.orderIndex)
  const completedLessons = availableLessons.filter(l => s.progress[l.id]?.status === 'completed')
  const weak = Object.values(s.progress).filter(p => p.mastery < .7 && p.attempts > 0).map(p => lessons.find(l => l.id === p.lessonId)).filter(Boolean)
  const percent = availableLessons.length ? Math.round(completedLessons.length / availableLessons.length * 100) : 0
  const nextLesson = availableLessons.find(l => s.progress[l.id]?.status !== 'completed')
  const gifts = [
    { id: 'sticker', icon: '🎁', title: 'Набор наклеек', cost: GIFT_COSTS.sticker },
    { id: 'avatar', icon: '🧢', title: 'Новый аватар', cost: GIFT_COSTS.avatar },
    { id: 'treasure', icon: '🪄', title: 'Волшебный сундук', cost: GIFT_COSTS.treasure },
  ]

  async function buyGift(id: string) {
    if (purchasing) return
    const gift = gifts.find(g => g.id === id)!
    setPurchasing(id)
    setError(null)
    try {
      if (backend.enabled) {
        const fresh = await backend.bootstrap()
        if (fresh?.profile) {
          storage.save(fresh)
          sync(fresh)
          if (fresh.purchasedGifts.includes(id) || fresh.stars < gift.cost) { setTab('stars'); return }
        }
        const result = await backend.purchaseGift(id)
        const latest = await backend.bootstrap()
        const next = latest?.profile ? latest : { ...s, stars: result.stars, purchasedGifts: result.purchasedGifts }
        storage.save(next)
        sync(next)
      } else {
        if (s.purchasedGifts.includes(id) || s.stars < gift.cost) return
        sync(storage.purchaseGift(id))
      }
      setTab('stars')
      location.hash = '/progress'
    } catch (err) {
      console.error('gift purchase failed', err)
      setError('Не получилось обменять звёзды. Попробуй ещё раз через минутку.')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <section className="progress-screen">
      <button className="back" onClick={back}>← Назад</button>
      <div className="progress-hero card">
        <div><p className="eyebrow">МОЙ ПРОГРЕСС</p><h1>Привет, {s.profile!.name}! 🌟</h1><p>Ты уже прошёл {completedLessons.length} из {availableLessons.length} уроков.</p></div>
        <div className="progress-ring" style={{ '--progress': percent } as CSSProperties}><strong>{percent}%</strong><small>готово</small></div>
      </div>
      {error && <div className="toast error" role="alert"><span>😿</span><div><b>Упс!</b><small>{error}</small></div></div>}
      <div className="progress-summary">
        <div><span>⭐</span><b>{s.stars}</b><small>Звёзды</small></div>
        <div><span>⚡</span><b>{s.xp}</b><small>Баллы</small></div>
        <div><span>🎯</span><b>{completedLessons.length}</b><small>Уроков</small></div>
      </div>
      {nextLesson && <button className="progress-next card" onClick={() => { location.hash = '/lesson:' + nextLesson.id }}><span>📚</span><div><small>Следующий шаг</small><b>{nextLesson.title}</b><em>Продолжить →</em></div></button>}
      <div className="stats-grid progress-cards">
        <button className={tab === null ? 'stat-card active' : 'stat-card'} onClick={() => setTab(null)}>🧭<b>{percent}%</b><small>Мой путь</small></button>
        <button className={tab === 'stars' ? 'stat-card active' : 'stat-card'} onClick={() => setTab('stars')}>🎁<b>{s.stars}</b><small>Подарки</small></button>
        <button className={tab === 'lessons' ? 'stat-card active' : 'stat-card'} onClick={() => setTab('lessons')}>📚<b>{completedLessons.length}/{availableLessons.length}</b><small>Уроки</small></button>
      </div>
      <div className="card progress-content">
        {tab === null && <>
          <h2>Твой путь</h2>
          <p>Каждый пройденный урок приближает тебя к следующему открытию.</p>
          {weak.length > 0 && <div className="review-box"><b>🔁 Пора повторить</b>{weak.slice(0, 3).map(l => <p key={l!.id}>• {l!.title} {s.progress[l!.id]?.nextReviewAt && new Date(s.progress[l!.id].nextReviewAt!) <= new Date() ? '— уже пора' : ''}</p>)}</div>}
          <div className="world-progress-list">
            {worlds.filter(w => w.isActive).map(w => {
              const ls = availableLessons.filter(l => l.worldId === w.id)
              if (!ls.length) return null
              const done = ls.filter(l => s.progress[l.id]?.status === 'completed').length
              return <div className="world-progress-row" key={w.id}><span>{w.icon}</span><div><b>{w.title}</b><small>{done} из {ls.length} уроков</small><i><em style={{ width: (done / ls.length * 100) + '%' }} /></i></div><strong>{Math.round(done / ls.length * 100)}%</strong></div>
            })}
          </div>
        </>}
        {tab === 'stars' && <>
          <h2>🎁 Подарки</h2>
          <p className="muted">Обменивай звёзды на награды. Купленные подарки остаются в твоей коллекции.</p>
          <div className="gift-grid">
            {gifts.map(g => {
              const bought = s.purchasedGifts.includes(g.id)
              const canBuy = s.stars >= g.cost && !bought
              return <div className="gift-card" key={g.id}><span>{g.icon}</span><b>{g.title}</b><small>{g.cost} ⭐</small><button disabled={bought || !canBuy || purchasing === g.id} onClick={() => void buyGift(g.id)}>{bought ? 'Получено' : purchasing === g.id ? 'Обмениваем…' : canBuy ? 'Обменять' : 'Не хватает звёзд'}</button></div>
            })}
          </div>
        </>}
        {tab === 'lessons' && <>
          <h2>📚 Все уроки</h2>
          <p className="muted">Твой учебный путь по всем мирам.</p>
          <div className="lesson-progress-list">
            {availableLessons.map(l => {
              const done = s.progress[l.id]?.status === 'completed'
              return <div className={done ? 'lesson-progress-item done' : 'lesson-progress-item'} key={l.id}><span>{done ? '⭐' : '○'}</span><div><b>{l.title}</b><small>{done ? 'Пройден' : 'Не пройден'}</small></div></div>
            })}
          </div>
        </>}
      </div>
    </section>
  )
}
