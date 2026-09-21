export type Route =
  | { name: 'home' }
  | { name: 'world'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'progress' }
  | { name: 'shop' }
  | { name: 'achievements' }
  | { name: 'me' }
  | { name: 'parent' }

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [name, id] = raw.split(':')
  switch (name) {
    case 'world':
      return { name, id: id ?? '' }
    case 'lesson':
      return { name, id: id ?? '' }
    case 'progress':
    case 'shop':
    case 'achievements':
    case 'me':
    case 'parent':
      return { name }
    default:
      return { name: 'home' }
  }
}

export function serializeRoute(route: Route): string {
  switch (route.name) {
    case 'world':
    case 'lesson':
      return `/${route.name}:${route.id}`
    case 'home':
      return '/home'
    default:
      return `/${route.name}`
  }
}
