import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, ElectronAPI, OperationProgress } from '../src/types'

const api: ElectronAPI = {
  chooseFolder: (initialPath) => ipcRenderer.invoke('dialog:choose-folder', initialPath),
  scanPhotos: (sourcePath) => ipcRenderer.invoke('photos:scan', sourcePath),
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config: AppConfig) => ipcRenderer.invoke('config:save', config),
  extract: (options) => ipcRenderer.invoke('extraction:start', options),
  cancelExtraction: () => ipcRenderer.invoke('extraction:cancel'),
  openFolder: (folderPath) => ipcRenderer.invoke('folder:open', folderPath),
  onProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, value: OperationProgress) => callback(value)
    ipcRenderer.on('operation:progress', listener)
    return () => ipcRenderer.removeListener('operation:progress', listener)
  },
}

contextBridge.exposeInMainWorld('photoExtractor', api)