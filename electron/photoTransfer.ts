import { copyFile, rename, rm, rmdir, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, extname, join } from 'node:path'
import type { DuplicatePolicy } from '../src/types'

async function findAvailablePath(path: string): Promise<string> {
  const extension = extname(path)
  const stem = extension ? path.slice(0, -extension.length) : path
  let suffix = 2
  let candidate = path
  while (await stat(candidate).then(() => true).catch(() => false)) {
    candidate = `${stem} (${suffix})${extension}`
    suffix += 1
  }
  return candidate
}

export async function transferPhoto(
  sourcePath: string,
  destinationFolder: string,
  operation: 'copy' | 'move',
  duplicatePolicy: DuplicatePolicy,
): Promise<boolean> {
  let destinationPath = join(destinationFolder, basename(sourcePath))
  const destinationExists = await stat(destinationPath).then(() => true).catch(() => false)

  if (destinationExists && duplicatePolicy === 'skip') return false
  if (destinationExists && duplicatePolicy === 'rename') destinationPath = await findAvailablePath(destinationPath)

  if (operation === 'copy' || (destinationExists && duplicatePolicy === 'replace')) {
    await copyFile(sourcePath, destinationPath, destinationExists ? 0 : constants.COPYFILE_EXCL)
    await rm(sourcePath)
    return true
  }

  await rename(sourcePath, destinationPath).catch(async (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EXDEV') throw error
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL)
    await rm(sourcePath)
  })
  return true
}

export async function removeDirectoryIfEmpty(path: string): Promise<boolean> {
  try {
    await rmdir(path)
    return true
  } catch {
    return false
  }
}