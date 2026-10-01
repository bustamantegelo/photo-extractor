import type { Photo } from '../types'

function sanitizeSegment(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[. ]+$/g, '')
    .trim()
}

export function formatTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}${minutes}${seconds}`
}

export function getPhotoTimeRange(photos: Photo[]) {
  const timestamps = photos.map((photo) => new Date(photo.takenAt).getTime())
  const first = new Date(Math.min(...timestamps))
  const last = new Date(Math.max(...timestamps))
  return { first, last }
}

export function generateExtractionName(
  zoneName: string,
  photographerName: string,
  firstCreatedAt: Date,
  lastCreatedAt: Date,
): string {
  const zone = sanitizeSegment(zoneName)
  const photographer = sanitizeSegment(photographerName)
  if (!zone || !photographer) return ''
  return `${zone}_${photographer}_${formatTime(firstCreatedAt)}-${formatTime(lastCreatedAt)}`
}