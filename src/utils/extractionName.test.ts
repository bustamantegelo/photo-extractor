import { describe, expect, it } from 'vitest'
import type { Photo } from '../types'
import { formatTime, generateExtractionName, getPhotoTimeRange } from './extractionName'

describe('generateExtractionName', () => {
  it('uses the photographer full name and local HHmmss times', () => {
    const first = new Date(2026, 9, 1, 8, 32, 14)
    const last = new Date(2026, 9, 1, 10, 47, 53)

    expect(generateExtractionName('Zone 01', 'John Doe', first, last)).toBe(
      'Zone01_JohnDoe_083214-104753',
    )
  })

  it('removes invalid filesystem characters', () => {
    expect(
      generateExtractionName('Finish/Line', 'Jane: Smith', new Date(2026, 0, 1), new Date(2026, 0, 1)),
    ).toBe('FinishLine_JaneSmith_000000-000000')
  })

  it('calculates the range from taken time instead of filesystem creation time', () => {
    const photos: Photo[] = [
      { id: 'one', fileName: 'one.jpg', filePath: '/one.jpg', extension: '.jpg', size: 1, createdAt: new Date(2026, 9, 1, 12).toISOString(), modifiedAt: new Date(2026, 9, 1, 12).toISOString(), takenAt: new Date(2026, 9, 1, 8, 32, 14).toISOString(), captureTimeSource: 'exif' },
      { id: 'two', fileName: 'two.jpg', filePath: '/two.jpg', extension: '.jpg', size: 1, createdAt: new Date(2026, 9, 1, 12, 1).toISOString(), modifiedAt: new Date(2026, 9, 1, 12, 1).toISOString(), takenAt: new Date(2026, 9, 1, 10, 47, 53).toISOString(), captureTimeSource: 'exif' },
    ]
    const range = getPhotoTimeRange(photos)

    expect(formatTime(range.first)).toBe('083214')
    expect(formatTime(range.last)).toBe('104753')
  })
})