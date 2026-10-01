import { describe, expect, it } from 'vitest'
import { resolveCaptureTime } from './photoMetadata'

describe('resolveCaptureTime', () => {
  const filesystemDate = new Date('2026-10-01T12:00:00.000Z')

  it('prefers EXIF DateTimeOriginal when it is valid', () => {
    const exifDate = new Date('2026-10-01T08:32:14.000Z')

    expect(resolveCaptureTime(exifDate, filesystemDate)).toEqual({
      takenAt: exifDate.toISOString(),
      captureTimeSource: 'exif',
    })
  })

  it('falls back to filesystem creation time when EXIF time is unavailable', () => {
    expect(resolveCaptureTime(undefined, filesystemDate)).toEqual({
      takenAt: filesystemDate.toISOString(),
      captureTimeSource: 'filesystem',
    })
    expect(resolveCaptureTime(new Date(Number.NaN), filesystemDate).captureTimeSource).toBe('filesystem')
  })
})