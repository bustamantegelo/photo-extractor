import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  FolderOpen,
  HardDrive,
  Image,
  LoaderCircle,
  MoveRight,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { AppConfig, DuplicatePolicy, ExtractionResult, OperationProgress, Photo } from './types'
import { formatTime, generateExtractionName, getPhotoTimeRange } from './utils/extractionName'

type Screen = 'extract' | 'setup'

function App() {
  const [screen, setScreen] = useState<Screen>('extract')
  const [sourcePath, setSourcePath] = useState('')
  const [destinationPath, setDestinationPath] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [config, setConfig] = useState<AppConfig>({ zones: [], photographers: [] })
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedPhotographer, setSelectedPhotographer] = useState('')
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('skip')
  const [progress, setProgress] = useState<OperationProgress | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void window.photoExtractor.getConfig().then(setConfig).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Could not load settings.')
    })
    return window.photoExtractor.onProgress(setProgress)
  }, [])

  const selectedZoneData = config.zones.find((zone) => zone.id === selectedZone)
  const selectedPhotographerData = config.photographers.find((person) => person.id === selectedPhotographer)
  const timeRange = useMemo(() => photos.length ? getPhotoTimeRange(photos) : null, [photos])
  const extractionName = useMemo(() => {
    if (!selectedZoneData || !selectedPhotographerData || !timeRange) return ''
    return generateExtractionName(selectedZoneData.name, selectedPhotographerData.name, timeRange.first, timeRange.last)
  }, [selectedZoneData, selectedPhotographerData, timeRange])

  async function browse(path: 'source' | 'destination') {
    const value = await window.photoExtractor.chooseFolder(path === 'source' ? sourcePath : destinationPath)
    if (value) path === 'source' ? setSourcePath(value) : setDestinationPath(value)
  }

  async function scan() {
    setError('')
    setBusy(true)
    setProgress({ current: 0, total: 0, percentage: 0, currentFile: '', operation: 'scan' })
    try {
      const found = await window.photoExtractor.scanPhotos(sourcePath)
      if (!found.length) {
        setPhotos([])
        setError('No supported photos were found. Choose a folder containing JPG, PNG, WEBP, HEIC, or HEIF files.')
        return
      }
      setPhotos(found)
      setSelectedZone('')
      setSelectedPhotographer('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to scan this folder.')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  async function startExtraction(operation: 'copy' | 'move') {
    if (!extractionName) return
    setError('')
    setResult(null)
    setBusy(true)
    setProgress({ current: 0, total: photos.length, percentage: 0, currentFile: '', operation, estimatedRemainingMs: null })
    try {
      const outcome = await window.photoExtractor.extract({
        sourcePath,
        photos,
        destinationPath,
        folderName: extractionName,
        operation,
        duplicatePolicy,
      })
      setResult(outcome)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Extraction could not be started.')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  function resetExtraction() {
    setPhotos([])
    setSelectedZone('')
    setSelectedPhotographer('')
    setResult(null)
    setError('')
  }

  if (screen === 'setup') {
    return (
      <Layout screen={screen} setScreen={setScreen}>
        <SetupScreen config={config} setConfig={setConfig} onSaved={() => setSaved(true)} />
        {saved && <div className="toast" role="status"><CheckCircle2 size={17} /> Crew settings saved</div>}
      </Layout>
    )
  }

  if (result) {
    return (
      <Layout screen={screen} setScreen={setScreen}>
        <Completion result={result} onReset={resetExtraction} />
      </Layout>
    )
  }

  const extractionReady = Boolean(
    photos.length && extractionName && sourcePath.trim() && destinationPath.trim(),
  )

  return (
    <Layout screen={screen} setScreen={setScreen}>
      <header className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-mark" /> EVENT OPERATIONS <span className="eyebrow-index">/ NEW BATCH</span></div>
          <h1>Photo extraction</h1>
          <p className="subheading">Scan, assign, review, and transfer one batch from a single workspace.</p>
        </div>
        <div className="photo-count"><Image size={17} /><strong>{photos.length.toLocaleString()}</strong><span>PHOTOS</span></div>
      </header>

      <main className="workspace workspace-all">
        {error && <ErrorMessage message={error} />}
        <section className="batch-section folder-stage">
          <div className="section-intro"><span className="section-kicker">01 / LOCATIONS</span><h2>Folders</h2><p>Choose the source and destination, then scan for supported images.</p></div>
          <div className="folder-fields-grid">
            <FolderField label="Source folder" value={sourcePath} onChange={setSourcePath} onBrowse={() => void browse('source')} icon={<Image size={18} />} />
            <FolderField label="Destination folder" value={destinationPath} onChange={setDestinationPath} onBrowse={() => void browse('destination')} icon={<HardDrive size={18} />} />
          </div>
          <div className="scan-toolbar">
            <span className="scan-note"><ShieldCheck size={16} /><span>Only successfully processed photos are removed from the source.</span></span>
            <button className="button-primary" disabled={busy || !sourcePath.trim() || !destinationPath.trim()} onClick={() => void scan()}>
              {busy && progress?.operation === 'scan' ? <LoaderCircle className="spin" size={17} /> : <Image size={17} />} Scan photos
            </button>
          </div>
          {busy && progress?.operation === 'scan' && <ProgressPanel progress={progress} label="Scanning photo library" />}
        </section>
        {busy && progress && progress.operation !== 'scan' && <ProgressPanel progress={progress} label={progress.operation === 'copy' ? 'Copying and cleaning up photos' : 'Moving photos'} onCancel={() => void window.photoExtractor.cancelExtraction()} />}
        <div className="batch-grid">
          <div className="batch-main">
            {photos.length > 0 && (
              <section className="batch-section assignment-section">
                <div className="section-intro"><span className="section-kicker">02 / BATCH DETAILS</span><h2>Assign this batch</h2><p>Choose one zone and one photographer. The name preview updates immediately.</p></div>
                <div className="assignment-grid">
                  <div className="assignment-group">
                    <span className="field-label">OBSTACLE / ZONE</span>
                    <div className="selection-grid zones-grid" role="radiogroup" aria-label="Choose a zone">
                      {config.zones.map((zone, index) => <ChoiceButton key={zone.id} selected={selectedZone === zone.id} onClick={() => setSelectedZone(zone.id)} index={String(index + 1).padStart(2, '0')} label={zone.name} />)}
                      {!config.zones.length && <p className="empty-state">Add zones in Crew setup.</p>}
                    </div>
                  </div>
                  <div className="assignment-group">
                    <span className="field-label">PHOTOGRAPHER</span>
                    <div className="selection-grid photographers-grid" role="radiogroup" aria-label="Choose a photographer">
                      {config.photographers.map((person) => <button key={person.id} className={`photographer-choice ${selectedPhotographer === person.id ? 'selected' : ''}`} role="radio" aria-checked={selectedPhotographer === person.id} onClick={() => setSelectedPhotographer(person.id)}>
                        <span className="initials">{person.initials}</span><span className="photographer-name">{person.name}</span><ChevronRight className="choice-arrow" size={17} />
                      </button>)}
                      {!config.photographers.length && <p className="empty-state">Add photographers in Crew setup.</p>}
                    </div>
                  </div>
                </div>
                {timeRange && selectedZoneData && selectedPhotographerData && (
                  <div className="inline-review">
                    <div className="review-facts">
                      <Fact label="Photos" value={`${photos.length.toLocaleString()} files`} />
                      <Fact label="Taken" value={`${formatTime(timeRange.first).replace(/(..)(..)(..)/, '$1:$2:$3')} → ${formatTime(timeRange.last).replace(/(..)(..)(..)/, '$1:$2:$3')}`} />
                      <Fact label="Zone" value={selectedZoneData.name} />
                      <Fact label="Photographer" value={<><span className="inline-initials">{selectedPhotographerData.initials}</span>{selectedPhotographerData.name}</>} />
                    </div>
                    <div className="name-preview"><span className="field-label">GENERATED FOLDER NAME</span><div className="name-output"><span>{extractionName}</span><button title="Copy folder name" aria-label="Copy folder name" onClick={() => void navigator.clipboard.writeText(extractionName)}><Clipboard size={16} /></button></div><small>Full photographer name included · initials are display-only</small></div>
                    <div className="destination-preview"><FolderOpen size={17} /><div><span className="field-label">OUTPUT LOCATION</span><strong>{joinPath(destinationPath, extractionName)}</strong></div></div>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="operation-panel batch-operations">
            <span className="section-kicker">03 / TRANSFER</span>
            <h2>Process photos</h2>
            <p className="operation-description">Choose what to do when a destination file already exists.</p>
            <div className="policy-list" role="radiogroup" aria-label="Duplicate file handling">
              <PolicyButton value="skip" current={duplicatePolicy} onChange={setDuplicatePolicy} title="Skip existing" detail="Keep the destination file" />
              <PolicyButton value="rename" current={duplicatePolicy} onChange={setDuplicatePolicy} title="Rename incoming" detail="Add a number to the filename" />
              <PolicyButton value="replace" current={duplicatePolicy} onChange={setDuplicatePolicy} title="Replace existing" detail="Overwrite the destination file" />
            </div>
            <div className="cleanup-note"><ShieldCheck size={16} /><span>Successfully copied or moved photos are removed from the source. Other files stay untouched.</span></div>
            <div className="operation-buttons">
              <button className="button-secondary" disabled={busy || !extractionReady} onClick={() => void startExtraction('copy')}><Clipboard size={17} /> Copy & remove source files</button>
              <button className="button-primary" disabled={busy || !extractionReady} onClick={() => void startExtraction('move')}><MoveRight size={17} /> Cut / Move</button>
            </div>
            {!photos.length && <p className="operation-hint">Scan a source folder to enable transfer.</p>}
          </aside>
        </div>
      </main>
    </Layout>
  )
}

function Layout({ children, screen, setScreen }: { children: React.ReactNode; screen: Screen; setScreen: (screen: Screen) => void }) {
  return <div className="app-shell"><aside className="sidebar">
    <div className="brand"><div className="brand-symbol"><span /></div><div><strong>PHOTO<span>EXTRACTOR</span></strong><small>EVENT OPERATIONS</small></div></div>
    <div className="side-caption">WORKSPACE</div>
    <nav className="side-nav" aria-label="Main navigation">
      <button className={screen === 'extract' ? 'active' : ''} onClick={() => setScreen('extract')}><Image size={17} /><span>New extraction</span><span className="nav-marker" /></button>
      <button className={screen === 'setup' ? 'active' : ''} onClick={() => setScreen('setup')}><Users size={17} /><span>Crew setup</span><span className="nav-marker" /></button>
    </nav>
    <div className="sidebar-footer"><div className="status-led" /><div><strong>LOCAL WORKSTATION</strong><span>Files stay on this device</span></div></div>
  </aside><div className="main-shell"><div className="topbar"><div><span>EVENT OPERATIONS</span><ChevronRight size={14} /><strong>{screen === 'extract' ? 'PHOTO EXTRACTION' : 'CREW CONFIGURATION'}</strong></div><div className="topbar-right"><span className="topbar-dot" /> READY</div></div>{children}<footer className="app-footer"><span>PHOTO EXTRACTOR <span className="footer-divider">/</span> DESKTOP</span><span>LOCAL PROCESSING <span className="footer-divider">·</span> NO UPLOADS</span></footer></div></div>
}

function FolderField({ label, value, onChange, onBrowse, icon }: { label: string; value: string; onChange: (value: string) => void; onBrowse: () => void; icon: React.ReactNode }) {
  return <label className="folder-field"><span className="field-label">{label}</span><span className="folder-control"><span className="folder-icon">{icon}</span><input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter or browse to a folder" /><button className="button-secondary browse-button" type="button" onClick={onBrowse}><FolderOpen size={16} /> Browse</button></span></label>
}

function ChoiceButton({ selected, onClick, index, label }: { selected: boolean; onClick: () => void; index: string; label: string }) {
  return <button className={`zone-choice ${selected ? 'selected' : ''}`} role="radio" aria-checked={selected} onClick={onClick}><span className="zone-index">{index}</span><span>{label}</span><span className="selection-indicator">{selected && <Check size={14} />}</span></button>
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="fact"><span className="field-label">{label}</span><strong>{value}</strong></div>
}

function PolicyButton({ value, current, onChange, title, detail }: { value: DuplicatePolicy; current: DuplicatePolicy; onChange: (value: DuplicatePolicy) => void; title: string; detail: string }) {
  const selected = current === value
  return <button className={`policy-option ${selected ? 'selected' : ''}`} role="radio" aria-checked={selected} onClick={() => onChange(value)}><span className="policy-radio">{selected && <span />}</span><span><strong>{title}</strong><small>{detail}</small></span></button>
}

function ProgressPanel({ progress, label, onCancel }: { progress: OperationProgress; label: string; onCancel?: () => void }) {
  const percentage = progress.total ? progress.percentage : 0
  const estimatedCompletion = typeof progress.estimatedRemainingMs === 'number'
    ? new Date(Date.now() + progress.estimatedRemainingMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : 'Calculating…'

  return <div className="progress-panel" aria-live="polite"><div className="progress-heading"><strong>{label}</strong><span>{progress.total ? `${progress.current.toLocaleString()} / ${progress.total.toLocaleString()}` : progress.current ? `${progress.current.toLocaleString()} entries checked` : 'Preparing'}</span></div><div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div><div className="progress-meta"><span>{progress.currentFile || 'Reading folders and file details…'}</span>{progress.total > 0 && <strong>{percentage}%</strong>}</div><div className="progress-eta"><span>ESTIMATED TIME OF COMPLETION</span><strong>{progress.operation === 'scan' ? 'Available after scan' : estimatedCompletion}</strong>{onCancel && <button className="cancel-button" onClick={onCancel}><X size={14} /> Cancel</button>}</div></div>
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="error-message" role="alert"><X size={16} /><span>{message}</span></div>
}

function Completion({ result, onReset }: { result: ExtractionResult; onReset: () => void }) {
  return <section className="completion-screen"><div className={`completion-stamp ${result.failed ? 'has-errors' : ''}`}><CheckCircle2 size={31} /></div><span className="section-kicker">BATCH REPORT / COMPLETE</span><h1>{result.canceled ? 'Processing stopped' : result.failed ? 'Completed with issues' : 'Extraction complete'}</h1><p className="subheading">{result.canceled ? 'The batch was canceled. Completed files are listed below.' : 'Your photo batch has been processed.'}</p><p className="source-cleanup-result" role="status">{result.sourceFolderRemoved ? 'The source folder was empty and has been removed.' : 'The source folder remains because it contains files or could not be removed.'}</p><div className="result-grid"><ResultMetric label="Total files" count={result.total} /><ResultMetric label="Successful" count={result.successful} /><ResultMetric label="Skipped" count={result.skipped} /><ResultMetric label="Failed" count={result.failed} /></div><div className="result-destination"><FolderOpen size={18} /><div><span className="field-label">DESTINATION FOLDER</span><strong>{result.destinationPath}</strong></div><button className="button-secondary" onClick={() => void window.photoExtractor.openFolder(result.destinationPath)}><FolderOpen size={16} /> Open folder</button></div>{result.failures.length > 0 && <div className="failure-list"><strong>FILES THAT NEED ATTENTION</strong>{result.failures.slice(0, 8).map((failure) => <div key={failure.fileName}><span>{failure.fileName}</span><small>{failure.message}</small></div>)}</div>}<button className="button-primary" onClick={onReset}><Plus size={17} /> Extract another batch</button></section>
}

function ResultMetric({ label, count }: { label: string; count: number }) {
  return <div className="result-metric"><span>{label}</span><strong>{count.toLocaleString()}</strong></div>
}

function SetupScreen({ config, setConfig, onSaved }: { config: AppConfig; setConfig: (config: AppConfig) => void; onSaved: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateZone(id: string, field: 'name', value: string) {
    setConfig({ ...config, zones: config.zones.map((zone) => zone.id === id ? { ...zone, [field]: value } : zone) })
  }

  function updatePhotographer(id: string, field: 'name' | 'initials', value: string) {
    setConfig({ ...config, photographers: config.photographers.map((person) => person.id === id ? { ...person, [field]: value } : person) })
  }

  async function save() {
    setBusy(true)
    setError('')
    try {
      await window.photoExtractor.saveConfig(config)
      onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save crew settings.')
    } finally {
      setBusy(false)
    }
  }

  return <><header className="page-heading setup-heading"><div><div className="eyebrow"><span className="eyebrow-mark" /> CONFIGURATION <span className="eyebrow-index">/ CREW</span></div><h1>Course & crew</h1><p className="subheading">Maintain the zone labels and photographer identities used for each batch.</p></div><button className="button-primary" disabled={busy} onClick={() => void save()}>{busy ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} Save configuration</button></header><main className="setup-content"><section className="config-section"><div className="config-section-heading"><div><span className="section-kicker">COURSE POSITIONS</span><h2>Zones</h2></div><button className="button-secondary small-button" onClick={() => setConfig({ ...config, zones: [...config.zones, { id: `zone-${crypto.randomUUID()}`, name: '' }] })}><Plus size={15} /> Add zone</button></div><div className="config-list">{config.zones.map((zone, index) => <div className="config-row" key={zone.id}><span className="config-index">{String(index + 1).padStart(2, '0')}</span><input aria-label={`Zone ${index + 1} name`} value={zone.name} onChange={(event) => updateZone(zone.id, 'name', event.target.value)} /><button className="icon-button" title="Remove zone" aria-label={`Remove ${zone.name || 'zone'}`} onClick={() => setConfig({ ...config, zones: config.zones.filter((entry) => entry.id !== zone.id) })}><Trash2 size={16} /></button></div>)}{!config.zones.length && <p className="empty-state">No zones configured.</p>}</div></section><section className="config-section"><div className="config-section-heading"><div><span className="section-kicker">PEOPLE ON THE COURSE</span><h2>Photographers</h2></div><button className="button-secondary small-button" onClick={() => setConfig({ ...config, photographers: [...config.photographers, { id: `photographer-${crypto.randomUUID()}`, initials: '', name: '' }] })}><Plus size={15} /> Add photographer</button></div><div className="config-list">{config.photographers.map((person, index) => <div className="config-row photographer-config-row" key={person.id}><span className="config-index">{String(index + 1).padStart(2, '0')}</span><input aria-label={`Photographer ${index + 1} initials`} className="initials-input" value={person.initials} onChange={(event) => updatePhotographer(person.id, 'initials', event.target.value.toUpperCase())} maxLength={5} /><input aria-label={`Photographer ${index + 1} full name`} value={person.name} onChange={(event) => updatePhotographer(person.id, 'name', event.target.value)} placeholder="Full name" /><button className="icon-button" title="Remove photographer" aria-label={`Remove ${person.name || 'photographer'}`} onClick={() => setConfig({ ...config, photographers: config.photographers.filter((entry) => entry.id !== person.id) })}><Trash2 size={16} /></button></div>)}{!config.photographers.length && <p className="empty-state">No photographers configured.</p>}</div></section>{error && <ErrorMessage message={error} />}</main></>
}

function joinPath(root: string, name: string) {
  const separator = root.includes('\\') ? '\\' : '/'
  return `${root.replace(/[\\/]+$/, '')}${separator}${name}`
}

export default App