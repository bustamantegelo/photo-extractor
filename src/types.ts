export interface Photo {
  id: string
  fileName: string
  filePath: string
  extension: string
  size: number
  createdAt: string
  modifiedAt: string
  takenAt: string
  captureTimeSource: 'exif' | 'filesystem'
}

export interface Zone {
  id: string
  name: string
}

export interface Photographer {
  id: string
  initials: string
  name: string
}

export interface AppConfig {
  zones: Zone[]
  photographers: Photographer[]
}

export interface OperationProgress {
  current: number
  total: number
  percentage: number
  currentFile: string
  operation: 'scan' | 'copy' | 'move'
  estimatedRemainingMs?: number | null
}

export interface ExtractionResult {
  total: number
  successful: number
  skipped: number
  failed: number
  canceled: boolean
  sourceFolderRemoved: boolean
  destinationPath: string
  failures: Array<{ fileName: string; message: string }>
}

export type DuplicatePolicy = 'skip' | 'replace' | 'rename'

export interface ElectronAPI {
  chooseFolder: (initialPath?: string) => Promise<string | null>
  scanPhotos: (sourcePath: string) => Promise<Photo[]>
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: AppConfig) => Promise<void>
  extract: (options: {
    sourcePath: string
    photos: Photo[]
    destinationPath: string
    folderName: string
    operation: 'copy' | 'move'
    duplicatePolicy: DuplicatePolicy
  }) => Promise<ExtractionResult>
  cancelExtraction: () => Promise<void>
  openFolder: (folderPath: string) => Promise<string>
  onProgress: (callback: (progress: OperationProgress) => void) => () => void
}

declare global {
  interface Window {
    photoExtractor: ElectronAPI
  }
}