import { useCallback, useEffect, useState } from 'react'
import type { AppState, ChildProfile } from '../app/types'
import { storage, gradeForAge } from '../services/core'
import { backend } from '../services/backend'
import { outbox } from '../services/outbox'
import { parseRoute, serializeRoute, type Route } from '../app/routes'

function routeFromLocation(): Route {
  return parseRoute(location.hash)
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => storage.load())
  const [route, setRoute] = useState<Route>(() => routeFromLocation())

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromLocation())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const nav = useCallback((next: Route) => {
    const hash = serializeRoute(next)
    if (location.hash !== '#' + hash) location.hash = hash
    setRoute(next)
  }, [])

  const sync = useCallback((next: AppState) => {
    setState(next)
  }, [])

  const profileDone = useCallback((p: ChildProfile) => {
    const next = storage.profile(p)
    setState(next)
    void backend.saveProfile(p)
    void backend.event('profile_created', { age: p.age, grade: p.grade })
    nav({ name: 'home' })
  }, [nav])

  useEffect(() => {
    if (!backend.enabled) return
    let alive = true
    const local = storage.load()
    if (local.profile && !local.profile.grade) {
      local.profile = { ...local.profile, grade: gradeForAge(local.profile.age) }
      storage.save(local)
    }
    backend.bootstrap().then((remote) => {
      if (!alive) return
      if (!remote?.profile) {
        if (local.profile) {
          storage.save(local)
          setState(local)
          void backend.saveProfile(local.profile).catch(() => {})
        }
        return
      }
      const merged: AppState = {
        ...remote,
        profile: remote.profile ? { ...remote.profile, grade: remote.profile.grade || gradeForAge(remote.profile.age) } : remote.profile,
        lastLessonId: local.lastLessonId || remote.lastLessonId,
      }
      storage.save(merged)
      setState(merged)
      // Досылаем накопленный офлайн-прогресс после реконсилиации.
      void outbox.flush()
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const onOnline = () => { void outbox.flush() }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return { state, route, nav, sync, profileDone }
}
