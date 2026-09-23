import { useEffect, useState } from 'react'
import type { AppState } from '../app/types'
import type { Route } from '../app/routes'
import { worlds, lessons } from '../content/content'
import { gradeForAge } from '../services/core'
import { backend } from '../services/backend'

export function Home({ s, nav }: { s: AppState; nav: (r: Route) => void }) {
  const visibleWorlds = worlds.filter(w => w.isActive).slice(0, 4)
  const asset = (p: string) => `${import.meta.env.BASE_URL}images/home-v204/${p}`
  const completedCount = Object.values(s.progress).filter(x => x.status === 'completed').length
  const iconByWorld: Record<string, string> = { world: 'globe.png', math: 'math_1234.png', animals: 'paw.png', languages: 'abc.png' }
  const labelByWorld: Record<string, string> = { world: 'Мир', math: 'Математика', animals: 'Животные', languages: 'Языки' }
  const giftLabels: Record<string, string> = { sticker: '🎁 Набор наклеек', avatar: '🧢 Новый аватар', treasure: '🪄 Волшебный сундук' }

  const [dueReviewIds, setDueReviewIds] = useState<string[]>([])
  useEffect(() => {
    if (!backend.enabled) return
    let alive = true
    backend.getDueReviews().then(rows => {
      if (alive) setDueReviewIds(rows.map(r => r.lessonId))
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const dueLessons = lessons.filter(l => dueReviewIds.includes(l.id))

  return (
    <section className="home-v204">
      <div className="home-v204-top">
        <div><p className="home-v204-kicker">ПОЧЕМУЧКИ</p><h1>Привет, {s.profile!.name}!</h1><p>Продолжай учиться — тебя ждут новые открытия!</p></div>
        <button className="home-v204-bell" onClick={() => nav({ name: 'me' })} aria-label="Уведомления"><img src={asset('ui/notification_bell.png')} alt="" /></button>
      </div>
      {dueLessons.length > 0 && (
        <div className="card review-box">
          <b>🔁 Пора повторить</b>
          {dueLessons.slice(0, 3).map(l => (
            <button key={l.id} className="review-lesson" onClick={() => nav({ name: 'lesson', id: l.id })}>
              <span>📚</span><div><b>{l.title}</b><small>Повторить сейчас</small></div><strong>→</strong>
            </button>
          ))}
        </div>
      )}
      {s.purchasedGifts.length > 0 && (
        <div className="home-v204-my-gifts">
          <div><b>Мои подарки</b><small>Ты уже получил:</small></div>
          <div className="home-v204-my-gifts-list">{s.purchasedGifts.map(id => <span key={id}>{giftLabels[id] || id}</span>)}</div>
        </div>
      )}
      <div className="home-v204-hero">
        <img className="home-v204-hero-bg" src={asset('backgrounds/landscape_card.png')} alt="" />
        <div className="home-v204-speech">
          <img src={asset('ui/speech_bubble.png')} alt="" />
          <span>Я проверю твои знания и помогу узнать много нового!</span>
        </div>
        <img className="home-v204-cat" src={asset('characters/main_doctor_cat.png')} alt="Котёнок-Почемучка" />
      </div>
      <div className="home-v204-stats">
        <div><img src={asset('ui/coin_star.png')} alt="" /><b>{s.xp}</b><span>баллов</span></div>
        <div><img src={asset('ui/star.png')} alt="" /><b>{s.stars}</b><span>звёзд</span></div>
        <div><img src={asset('ui/books_stack.png')} alt="" /><b>{completedCount}/{lessons.filter(l => l.grade === (s.profile!.grade || gradeForAge(s.profile!.age))).length}</b><span>уроков</span></div>
      </div>
      <div className="home-v204-section-head">
        <div><p>ТВОИ МИРЫ</p><h2>Выбирай, что изучить</h2></div>
        <button onClick={() => nav({ name: 'progress' })}>Все миры →</button>
      </div>
      <div className="home-v204-worlds">
        {visibleWorlds.map(w => {
          const grade = s.profile!.grade || gradeForAge(s.profile!.age)
          const ls = lessons.filter(l => l.worldId === w.id && l.grade === grade)
          const done = ls.filter(l => s.progress[l.id]?.status === 'completed').length
          const percent = ls.length ? Math.round(done / ls.length * 100) : 0
          return (
            <button key={w.id} className="home-v204-world world-card" onClick={() => nav({ name: 'world', id: w.id })}>
              <img className="home-v204-world-icon" src={asset(`world_icons/${iconByWorld[w.id] || 'globe.png'}`)} alt="" />
              <span className="home-v204-world-copy"><b>{labelByWorld[w.id] || w.title}</b><small>{done}/{ls.length} уроков</small><i><em style={{ width: percent + '%' }} /></i></span>
            </button>
          )
        })}
      </div>
      <div className="home-v204-actions">
        <button onClick={() => nav({ name: 'progress' })}><img src={asset('actions/progress_chart.png')} alt="" /><span><b>Мой прогресс</b><small>Посмотри свой путь</small></span><strong>→</strong></button>
        <button onClick={() => nav({ name: 'achievements' })}><img src={asset('actions/medal.png')} alt="" /><span><b>Мои достижения</b><small>Собирай награды</small></span><strong>→</strong></button>
      </div>
      <div className="home-v204-banner">
        <img className="home-v204-banner-bg" src={asset('backgrounds/landscape_strip.png')} alt="" />
        <img className="home-v204-banner-cat" src={asset('characters/doctor_with_bulb.png')} alt="" />
        <b>Вопросы сегодня —<br />большие знания завтра!</b>
      </div>
    </section>
  )
}
