import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppConfig, DuplicatePolicy, ExtractionResult, OperationProgress, Photo } from '../src/types'
import { readCaptureTime } from './photoMetadata'
import { removeDirectoryIfEmpty, transferPhoto } from './photoTransfer'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])
const defaultConfig: AppConfig = {
  zones: [
    { id: 'zone-01', name: 'Zone 01' },
    { id: 'zone-02', name: 'Zone 02' },
    { id: 'zone-03', name: 'Zone 03' },
    { id: 'zone-04', name: 'Zone 04' },
    { id: 'finish-line', name: 'Finish Line' },
    { id: 'starting-line', name: 'Starting Line' },
  ],
  photographers: [
    { id: 'john-doe', initials: 'JD', name: 'John Doe' },
    { id: 'jane-smith', initials: 'JS', name: 'Jane Smith' },
    { id: 'michael-cruz', initials: 'MC', name: 'Michael Cruz' },
    { id: 'alex-santos', initials: 'AS', name: 'Alex Santos' },
  ],
}

let mainWindow: BrowserWindow | null = null
let cancelRequested = false
let extractionRunning = false
let scannedPhotoPaths = new Set<string>()
let scannedSourcePath: string | null = null

function sendProgress(progress: OperationProgress) {
  mainWindow?.webContents.send('operation:progress', progress)
}

function assertTrustedSender(event: Electron.IpcMainInvokeEvent) {
  const frameUrl = event.senderFrame?.url
  if (!frameUrl) throw new Error('Request origin could not be verified.')
  const url = new URL(frameUrl)
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (url.protocol === 'file:' || (devUrl && url.origin === new URL(devUrl).origin)) return
  throw new Error('Untrusted request origin.')
}

function registerHandler<T extends unknown[], R>(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: T) => R | Promise<R>,
) {
  ipcMain.handle(channel, (event, ...args: T) => {
    assertTrustedSender(event)
    return handler(event, ...args)
  })
}

async function getConfigPath() {
  if (app.isPackaged) return join(dirname(app.getPath('exe')), 'config.json')

  const folder = join(app.getPath('userData'), 'photo-extractor')
  await mkdir(folder, { recursive: true })
  return join(folder, 'config.json')
}

async function loadConfig(): Promise<AppConfig> {
  try {
    const config = JSON.parse(await readFile(await getConfigPath(), 'utf8')) as AppConfig
    if (!Array.isArray(config.zones) || !Array.isArray(config.photographers)) return defaultConfig
    return config
  } catch {
    return defaultConfig
  }
}

function validateConfig(value: AppConfig): AppConfig {
  if (!value || !Array.isArray(value.zones) || !Array.isArray(value.photographers)) {
    throw new Error('Configuration must include zone and photographer lists.')
  }
  const zones = value.zones.filter((item) => item.id.trim() && item.name.trim())
  const photographers = value.photographers.filter(
    (item) => item.id.trim() && item.name.trim() && item.initials.trim(),
  )
  if (zones.length !== value.zones.length || photographers.length !== value.photographers.length) {
    throw new Error('Each zone and photographer needs all required fields.')
  }
  return { zones, photographers }
}

async function scanFolder(sourcePath: string): Promise<Photo[]> {
  const absolutePath = resolve(sourcePath.trim())
  const sourceStat = await stat(absolutePath).catch(() => null)
  if (!sourceStat?.isDirectory()) throw new Error('Source folder could not be found. Please select another folder.')
  await access(absolutePath, constants.R_OK)

  const photos: Photo[] = []
  const pending = [absolutePath]
  let visited = 0
  while (pending.length) {
    const folder = pending.pop()!
    const entries = await readdir(folder, { withFileTypes: true })
    for (const entry of entries) {
      const filePath = join(folder, entry.name)
      if (entry.isDirectory()) {
        pending.push(filePath)
      } else if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
        const fileStat = await stat(filePath)
        const captureTime = await readCaptureTime(filePath, fileStat.birthtime)
        photos.push({
          id: filePath,
          fileName: entry.name,
          filePath,
          extension: extname(entry.name).toLowerCase(),
          size: fileStat.size,
          createdAt: fileStat.birthtime.toISOString(),
          modifiedAt: fileStat.mtime.toISOString(),
          ...captureTime,
        })
      }
      visited += 1
      if (visited % 100 === 0) {
        sendProgress({ current: visited, total: visited, percentage: 0, currentFile: entry.name, operation: 'scan' })
      }
    }
  }
  const sortedPhotos = photos.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  scannedSourcePath = absolutePath
  scannedPhotoPaths = new Set(sortedPhotos.map((photo) => resolve(photo.filePath)))
  return sortedPhotos
}

async function processExtraction(options: {
  sourcePath: string
  photos: Photo[]
  destinationPath: string
  folderName: string
  operation: 'copy' | 'move'
  duplicatePolicy: DuplicatePolicy
}): Promise<ExtractionResult> {
  if (extractionRunning) throw new Error('An extraction is already in progress.')
  if (!['skip', 'replace', 'rename'].includes(options.duplicatePolicy)) throw new Error('Invalid duplicate policy.')
  if (!['copy', 'move'].includes(options.operation)) throw new Error('Invalid extraction operation.')
  if (!options.photos.length || options.photos.length > 10000) throw new Error('Select between 1 and 10,000 photos.')
  const sourceRoot = resolve(options.sourcePath.trim())
  if (sourceRoot !== scannedSourcePath) throw new Error('Scan the selected source folder before extracting.')
  if (!options.folderName.trim() || ['.', '..'].includes(options.folderName) || basename(options.folderName) !== options.folderName) {
    throw new Error('The extraction folder name is invalid.')
  }
  if (options.photos.some((photo) => !scannedPhotoPaths.has(resolve(photo.filePath)))) {
    throw new Error('The photo list has changed. Scan the source folder again before extracting.')
  }

  const destinationRoot = resolve(options.destinationPath)
  const outputPath = join(destinationRoot, basename(options.folderName))
  const sourcePaths = new Set(options.photos.map((photo) => resolve(photo.filePath)))
  if (sourcePaths.has(outputPath)) throw new Error('Destination cannot replace one of the source photos.')

  extractionRunning = true
  cancelRequested = false
  const result: ExtractionResult = {
    total: options.photos.length,
    successful: 0,
    skipped: 0,
    failed: 0,
    canceled: false,
    sourceFolderRemoved: false,
    destinationPath: outputPath,
    failures: [],
  }

  try {
    await mkdir(outputPath, { recursive: true })
    const startedAt = Date.now()
    for (let index = 0; index < options.photos.length; index += 1) {
      const photo = options.photos[index]
      if (cancelRequested) {
        result.canceled = true
        break
      }

      try {
        const processed = await transferPhoto(photo.filePath, outputPath, options.operation, options.duplicatePolicy)
        if (processed) result.successful += 1
        else result.skipped += 1
      } catch (error) {
        result.failed += 1
        result.failures.push({
          fileName: photo.fileName,
          message: error instanceof Error ? error.message : 'Unable to process file.',
        })
      }

      sendProgress({
        current: index + 1,
        total: options.photos.length,
        percentage: Math.round(((index + 1) / options.photos.length) * 100),
        currentFile: photo.fileName,
        operation: options.operation,
        estimatedRemainingMs: Math.round(((Date.now() - startedAt) / (index + 1)) * (options.photos.length - index - 1)),
      })
    }
    result.sourceFolderRemoved = await removeDirectoryIfEmpty(sourceRoot)
    return result
  } finally {
    extractionRunning = false
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 920,
    minHeight: 680,
    backgroundColor: '#0a0a0a',
    title: 'Photo Extractor',
    webPreferences: {
      preload: join(currentDir, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(currentDir, '../renderer/index.html'))
  }
  mainWindow.on('closed', () => { mainWindow = null })
}

function registerHandlers() {
  registerHandler('dialog:choose-folder', async (_event, initialPath?: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Choose folder',
      defaultPath: initialPath || undefined,
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  registerHandler('photos:scan', (_event, sourcePath: string) => scanFolder(sourcePath))
  registerHandler('config:get', () => loadConfig())
  registerHandler('config:save', async (_event, config: AppConfig) => {
    const validated = validateConfig(config)
    await writeFile(await getConfigPath(), JSON.stringify(validated, null, 2), 'utf8')
  })
  registerHandler('extraction:start', (_event, options: Parameters<typeof processExtraction>[0]) => processExtraction(options))
  registerHandler('extraction:cancel', () => { cancelRequested = true })
  registerHandler('folder:open', (_event, folderPath: string) => shell.openPath(resolve(folderPath)))
}

app.whenReady().then(() => {
  registerHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})