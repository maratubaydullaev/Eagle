import type { ReactNode } from 'react'
import { useAppState } from '../state/useAppState'
import { lessons, worlds } from '../content/content'
import { Shell } from '../screens/Shell'
import { Profile } from '../screens/Profile'
import { Home } from '../screens/Home'
import { World } from '../screens/World'
import { Lesson } from '../screens/Lesson'
import { Progress } from '../screens/Progress'
import { Achievements } from '../screens/Achievements'
import { ProfileMe } from '../screens/ProfileMe'
import { Parent } from '../screens/Parent'

export function App() {
  const { state, route, nav, sync, profileDone } = useAppState()

  if (!state.profile) {
    return <main className="app"><Profile onDone={profileDone} /></main>
  }

  let body: ReactNode
  if (route.name === 'home') {
    body = <Home s={state} nav={nav} />
  } else if (route.name === 'world') {
    const world = worlds.find(x => x.id === route.id)
    body = world ? <World s={state} id={route.id} nav={nav} /> : <Home s={state} nav={nav} />
  } else if (route.name === 'lesson') {
    const lesson = lessons.find(x => x.id === route.id)
    body = lesson ? (
      <Lesson
        s={state}
        lesson={lesson}
        back={() => nav({ name: 'world', id: lesson.worldId })}
        sync={sync}
        done={(x) => { sync(x); nav({ name: 'world', id: lesson.worldId }) }}
      />
    ) : <Home s={state} nav={nav} />
  } else if (route.name === 'progress' || route.name === 'shop') {
    body = <Progress s={state} back={() => nav({ name: 'home' })} sync={sync} />
  } else if (route.name === 'achievements') {
    body = <Achievements s={state} back={() => nav({ name: 'home' })} />
  } else if (route.name === 'me') {
    body = <ProfileMe s={state} nav={nav} />
  } else if (route.name === 'parent') {
    body = <Parent s={state} back={() => nav({ name: 'me' })} />
  } else {
    body = <Home s={state} nav={nav} />
  }

  return <Shell nav={nav} route={route}>{body}</Shell>
}
