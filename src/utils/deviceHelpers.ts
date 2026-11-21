export function alive(lastSeen: string | null) {
  return !!lastSeen &&
    Date.now() - new Date(lastSeen).getTime() < 30_000
}