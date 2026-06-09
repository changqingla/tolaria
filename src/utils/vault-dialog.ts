/**
 * Vault dialog utilities.
 * In Tauri mode, uses the native dialog plugin for folder picking.
 * In browser mode, falls back to window.prompt() for testing.
 */

import { isTauri } from '../mock-tauri'
import {
  isRestartRequiredAfterUpdate,
  markRestartRequiredAfterUpdate,
  RESTART_REQUIRED_FOLDER_PICKER_MESSAGE,
} from '../lib/appUpdater'

const NS_OPEN_PANEL_UNAVAILABLE_MARKER = 'unexpected NULL returned from +[NSOpenPanel openPanel]'

interface NativeDialogOptions {
  directory: boolean
  multiple: false
  title: string
  filters?: Array<{
    name: string
    extensions: string[]
  }>
}

export interface ImportableVaultFilePickerCopy {
  title: string
  filters: {
    markdownAndPdf: string
    markdown: string
    pdf: string
  }
}

const DEFAULT_IMPORTABLE_VAULT_FILE_PICKER_COPY: ImportableVaultFilePickerCopy = {
  title: 'Upload file',
  filters: {
    markdownAndPdf: 'Markdown and PDF files',
    markdown: 'Markdown',
    pdf: 'PDF',
  },
}

export class NativeFolderPickerBlockedError extends Error {
  constructor(message = RESTART_REQUIRED_FOLDER_PICKER_MESSAGE) {
    super(message)
    this.name = 'NativeFolderPickerBlockedError'
  }
}

export function isNativeFolderPickerBlockedError(
  error: unknown,
): error is NativeFolderPickerBlockedError {
  return error instanceof NativeFolderPickerBlockedError
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return ''
}

function isUnavailableNativeFolderPicker(error: unknown): boolean {
  return errorMessage(error).includes(NS_OPEN_PANEL_UNAVAILABLE_MARKER)
}

export function formatFolderPickerActionError(
  action: string,
  error: unknown,
): string {
  if (isNativeFolderPickerBlockedError(error)) {
    return error.message
  }

  const message = errorMessage(error)

  return message ? `${action}: ${message}` : action
}

function normalizePickedPath(path: string): string {
  if (!path.startsWith('file://')) {
    return path
  }

  try {
    const parsed = new URL(path)
    if (parsed.protocol !== 'file:') {
      return path
    }

    const decodedPath = decodeURIComponent(parsed.pathname)
    if (parsed.hostname) {
      return `//${parsed.hostname}${decodedPath}`
    }

    if (/^\/[A-Za-z]:/.test(decodedPath)) {
      return decodedPath.slice(1)
    }

    return decodedPath
  } catch {
    return path
  }
}

function normalizePickedSinglePath(selected: string | string[] | null): string | null {
  const selectedPath = Array.isArray(selected)
    ? (typeof selected[0] === 'string' ? selected[0] : null)
    : selected

  return typeof selectedPath === 'string' ? normalizePickedPath(selectedPath) : null
}

let folderPickerRequestInFlight = false
let filePickerRequestInFlight = false

async function pickNativePath(options: NativeDialogOptions): Promise<string | null> {
  if (isRestartRequiredAfterUpdate()) {
    throw new NativeFolderPickerBlockedError()
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open(options)
    return normalizePickedSinglePath(selected)
  } catch (error) {
    if (isUnavailableNativeFolderPicker(error)) {
      markRestartRequiredAfterUpdate()
      throw new NativeFolderPickerBlockedError()
    }
    throw error
  }
}

async function pickNativeFolder(title?: string): Promise<string | null> {
  return pickNativePath({
    directory: true,
    multiple: false,
    title: title ?? 'Select folder',
  })
}

/**
 * Opens a native folder picker dialog (Tauri) or falls back to prompt (browser).
 * Returns the selected folder path, or null if the user cancelled.
 */
export async function pickFolder(title?: string): Promise<string | null> {
  if (folderPickerRequestInFlight) return null

  folderPickerRequestInFlight = true
  try {
    if (isTauri()) {
      return await pickNativeFolder(title)
    }
    return normalizePickedSinglePath(prompt(title ?? 'Enter folder path:'))
  } finally {
    folderPickerRequestInFlight = false
  }
}

/**
 * Opens a native file picker for importing vault files.
 * Returns the selected file path, or null if the user cancelled.
 */
export async function pickImportableVaultFile(
  copy: ImportableVaultFilePickerCopy = DEFAULT_IMPORTABLE_VAULT_FILE_PICKER_COPY,
): Promise<string | null> {
  if (filePickerRequestInFlight) return null

  filePickerRequestInFlight = true
  try {
    if (!isTauri()) {
      return normalizePickedSinglePath(prompt(copy.title))
    }

    return await pickNativePath({
      directory: false,
      multiple: false,
      title: copy.title,
      filters: [
        { name: copy.filters.markdownAndPdf, extensions: ['md', 'markdown', 'pdf'] },
        { name: copy.filters.markdown, extensions: ['md', 'markdown'] },
        { name: copy.filters.pdf, extensions: ['pdf'] },
      ],
    })
  } finally {
    filePickerRequestInFlight = false
  }
}
