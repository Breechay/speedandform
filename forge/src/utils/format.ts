export function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  if (hours < 1) return `${mins} min`
  return `${hours}h ${mins}m`
}

export function formatDistance(distanceMeters: number | null, units: 'km' | 'mi') {
  if (!distanceMeters || distanceMeters <= 0) return '—'
  if (units === 'mi') {
    return `${(distanceMeters / 1609.344).toFixed(1)} mi`
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`
}

export function formatPace(avgPaceSecondsPerKm: number | null, units: 'km' | 'mi') {
  if (!avgPaceSecondsPerKm || avgPaceSecondsPerKm <= 0) return '—'
  const secPerUnit = units === 'mi' ? avgPaceSecondsPerKm * 1.609344 : avgPaceSecondsPerKm
  const mins = Math.floor(secPerUnit / 60)
  const secs = Math.round(secPerUnit % 60).toString().padStart(2, '0')
  return `${mins}:${secs} /${units}`
}
