import type { AppState } from '../app/types'
import { lessons } from '../content/content'

export function Achievements({ s, back }: { s: AppState; back: () => void }) {
  const completed = Object.values(s.progress).filter(p => p.status === 'completed').length
  const achievements = [
    { id: 'bronze-medal', icon: '🥉', title: 'Бронзовая медаль', text: 'Пройди 50 уроков', done: completed >= 50 },
    { id: 'silver-medal', icon: '🥈', title: 'Серебряная медаль', text: 'Пройди 100 уроков', done: completed >= 100 },
    { id: 'gold-medal', icon: '🥇', title: 'Золотая медаль', text: 'Пройди 200 уроков', done: completed >= 200 },
    { id: 'first-lesson', icon: '🎯', title: 'Первый урок', text: 'Пройди свой первый урок', done: completed >= 1 },
    { id: 'five-lessons', icon: '📚', title: '5 уроков', text: 'Пройди 5 уроков', done: completed >= 5 },
    { id: 'hundred-points', icon: '🏆', title: '100 баллов', text: 'Набери 100 баллов', done: s.xp >= 100 },
    { id: 'ten-stars', icon: '⭐', title: '10 звёзд', text: 'Получи 10 звёзд', done: s.stars >= 10 },
    { id: 'first-language', icon: '🔤', title: 'Первый язык', text: 'Пройди первый урок из мира «Языки»', done: Object.values(s.progress).some(p => p.status === 'completed' && lessons.find(l => l.id === p.lessonId)?.worldId === 'languages') },
    { id: 'world-explorer', icon: '🌍', title: 'Исследователь мира', text: 'Пройди 3 урока из мира «Природа»', done: Object.values(s.progress).filter(p => p.status === 'completed' && lessons.find(l => l.id === p.lessonId)?.worldId === 'world').length >= 3 },
    { id: 'mathematician', icon: '🔢', title: 'Математик', text: 'Пройди 4 урока из мира «Математика»', done: Object.values(s.progress).filter(p => p.status === 'completed' && lessons.find(l => l.id === p.lessonId)?.worldId === 'math').length >= 4 },
    { id: 'animal-friend', icon: '🐾', title: 'Друг животных', text: 'Пройди 3 урока из мира «Растения и животные»', done: Object.values(s.progress).filter(p => p.status === 'completed' && lessons.find(l => l.id === p.lessonId)?.worldId === 'animals').length >= 3 },
  ]
  const unlocked = achievements.filter(a => a.done).length

  return (
    <section className="rewards-screen">
      <button className="back" onClick={back}>← Назад</button>
      <div className="rewards-hero card">
        <div><p className="eyebrow">НАГРАДЫ</p><h1>Твои достижения 🏆</h1><p>Каждый урок открывает новые маленькие победы.</p></div>
        <div className="rewards-trophy">🏆<small>{unlocked}/{achievements.length}</small></div>
      </div>
      <div className="rewards-tabs">
        <div className="rewards-stat active"><span>🏅</span><b>{unlocked}</b><small>Открыто</small></div>
        <div className="rewards-stat"><span>⭐</span><b>{s.stars}</b><small>Звёзд</small></div>
        <div className="rewards-stat"><span>🎯</span><b>{completed}</b><small>Уроков</small></div>
      </div>
      <div className="card rewards-section">
        <div className="section-title"><div><p className="section-kicker">КОЛЛЕКЦИЯ</p><h2>Достижения</h2></div><span className="rewards-count">{unlocked} / {achievements.length}</span></div>
        <div className="achievement-grid">
          {achievements.map(a => <div className={a.done ? 'achievement-card unlocked' : 'achievement-card'} key={a.id}><span>{a.icon}</span><div><b>{a.title}</b><small>{a.text}</small></div>{a.done ? <em>✓</em> : <i>🔒</i>}</div>)}
        </div>
      </div>
    </section>
  )
}
