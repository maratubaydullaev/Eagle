import { useState } from 'react'
import type { ChildProfile } from '../app/types'
import { telegram, gradeForAge } from '../services/core'
import { Mascot } from '../components/Mascot'

export function Profile({ onDone }: { onDone: (p: ChildProfile) => void }) {
  const [n, setN] = useState(telegram.firstName())
  const [a, setA] = useState(6)

  function save() {
    if (!n.trim()) return
    const now = new Date().toISOString()
    onDone({
      id: crypto.randomUUID(),
      name: n.trim(),
      age: a,
      grade: gradeForAge(a),
      avatar: '🐱',
      createdAt: now,
      updatedAt: now,
    })
  }

  return (
    <section className="screen center">
      <div className="hero">
        <Mascot mood="happy" />
        <h1>Привет! Я Котёнок-Почемучка</h1>
        <p>Будем узнавать новое, играть и открывать мир.</p>
      </div>
      <label>Как тебя зовут?<input value={n} onChange={e => setN(e.target.value.slice(0, 20))} placeholder="Например, Амина" autoFocus /></label>
      <label>Сколько тебе лет?</label>
      <div className="chips">
        {[4, 5, 6, 7, 8, 9, 10].map(x => <button className={a === x ? 'chip active' : 'chip'} key={x} onClick={() => setA(x)}>{x}</button>)}
      </div>
      <button className="primary" disabled={!n.trim()} onClick={save}>Начать приключение →</button>
    </section>
  )
}
