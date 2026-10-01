import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { removeDirectoryIfEmpty, transferPhoto } from './photoTransfer'

let root = ''

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true })
  root = ''
})

async function createFolders() {
  root = await mkdtemp(join(tmpdir(), 'photo-transfer-'))
  const source = join(root, 'source')
  const destination = join(root, 'destination')
  await mkdir(source)
  await mkdir(destination)
  return { source, destination }
}

async function exists(path: string) {
  return stat(path).then(() => true).catch(() => false)
}

describe('photo transfer cleanup', () => {
  it('removes a source image only after copying it successfully', async () => {
    const { source, destination } = await createFolders()
    const sourcePhoto = join(source, 'photo.jpg')
    await writeFile(sourcePhoto, 'image-data')

    await expect(transferPhoto(sourcePhoto, destination, 'copy', 'skip')).resolves.toBe(true)

    expect(await readFile(join(destination, 'photo.jpg'), 'utf8')).toBe('image-data')
    expect(await exists(sourcePhoto)).toBe(false)
  })

  it('keeps a skipped duplicate in the source', async () => {
    const { source, destination } = await createFolders()
    const sourcePhoto = join(source, 'photo.jpg')
    await writeFile(sourcePhoto, 'source-data')
    await writeFile(join(destination, 'photo.jpg'), 'existing-data')

    await expect(transferPhoto(sourcePhoto, destination, 'copy', 'skip')).resolves.toBe(false)

    expect(await readFile(sourcePhoto, 'utf8')).toBe('source-data')
    expect(await readFile(join(destination, 'photo.jpg'), 'utf8')).toBe('existing-data')
  })

  it('moves a source image and preserves its contents', async () => {
    const { source, destination } = await createFolders()
    const sourcePhoto = join(source, 'photo.jpg')
    await writeFile(sourcePhoto, 'image-data')

    await expect(transferPhoto(sourcePhoto, destination, 'move', 'skip')).resolves.toBe(true)

    expect(await readFile(join(destination, 'photo.jpg'), 'utf8')).toBe('image-data')
    expect(await exists(sourcePhoto)).toBe(false)
  })

  it('removes a source directory only when empty', async () => {
    const { source } = await createFolders()
    const sourcePhoto = join(source, 'left-behind.txt')
    await writeFile(sourcePhoto, 'keep')

    await expect(removeDirectoryIfEmpty(source)).resolves.toBe(false)
    expect(await exists(sourcePhoto)).toBe(true)

    await rm(sourcePhoto)
    await expect(removeDirectoryIfEmpty(source)).resolves.toBe(true)
    expect(await exists(source)).toBe(false)
  })
})