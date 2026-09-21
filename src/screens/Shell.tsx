import type { ReactNode } from 'react'
import type { Route } from '../app/routes'

export function Shell({ children, nav, route }: { children: ReactNode; nav: (r: Route) => void; route: Route }) {
  return (
    <main className="app">
      {children}
      <BottomNav nav={nav} route={route} />
    </main>
  )
}

function BottomNav({ nav, route }: { nav: (r: Route) => void; route: Route }) {
  const worldsActive = route.name === 'world' || route.name === 'lesson' || route.name === 'progress'
  const shopActive = route.name === 'shop' || route.name === 'achievements'
  const profileActive = route.name === 'me' || route.name === 'parent'
  const asset = (p: string) => import.meta.env.BASE_URL + 'images/home-v204/' + p

  return (
    <nav className={'bottom-nav ' + (route.name === 'home' ? 'approved-nav-overlay' : '')} aria-label="Основная навигация">
      <button className={route.name === 'home' ? 'active' : ''} onClick={() => nav({ name: 'home' })} aria-label="Главная">
        <img src={asset('nav/home.png')} alt="" /><small>Главная</small>
      </button>
      <button className={worldsActive ? 'active' : ''} onClick={() => nav({ name: 'progress' })} aria-label="Миры">
        <img src={asset('nav/worlds.png')} alt="" /><small>Миры</small>
      </button>
      <button className={shopActive ? 'active' : ''} onClick={() => nav({ name: 'shop' })} aria-label="Магазин">
        <img src={asset('nav/shop.png')} alt="" /><small>Магазин</small>
      </button>
      <button className={profileActive ? 'active' : ''} onClick={() => nav({ name: 'me' })} aria-label="Профиль">
        <img src={asset('nav/profile.png')} alt="" /><small>Профиль</small>
      </button>
    </nav>
  )
}
