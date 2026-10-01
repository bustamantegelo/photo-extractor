import exifr from 'exifr'

export type CaptureTimeSource = 'exif' | 'filesystem'

export interface CaptureTime {
  takenAt: string
  captureTimeSource: CaptureTimeSource
}

export function resolveCaptureTime(exifDate: unknown, filesystemDate: Date): CaptureTime {
  if (exifDate instanceof Date && Number.isFinite(exifDate.getTime())) {
    return { takenAt: exifDate.toISOString(), captureTimeSource: 'exif' }
  }

  return { takenAt: filesystemDate.toISOString(), captureTimeSource: 'filesystem' }
}

export async function readCaptureTime(filePath: string, filesystemDate: Date): Promise<CaptureTime> {
  try {
    const metadata = await exifr.parse(filePath, { pick: ['DateTimeOriginal'] })
    return resolveCaptureTime(metadata?.DateTimeOriginal, filesystemDate)
  } catch {
    return resolveCaptureTime(undefined, filesystemDate)
  }
}