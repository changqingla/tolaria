import { describe, expect, it } from 'vitest'
import { uploadTargetForSelection } from './fileUploadTarget'

describe('uploadTargetForSelection', () => {
  it('uploads to the active vault root outside real folder selections', () => {
    expect(uploadTargetForSelection({
      fallbackVaultPath: '/vault',
      selection: { kind: 'filter', filter: 'all' },
    })).toEqual({ destinationFolder: null, vaultPath: '/vault' })
  })

  it('uploads to the selected folder inside the active vault', () => {
    expect(uploadTargetForSelection({
      fallbackVaultPath: '/vault',
      selection: { kind: 'folder', path: 'Projects/2026' },
    })).toEqual({ destinationFolder: 'Projects/2026', vaultPath: '/vault' })
  })

  it('uses the selected mounted workspace root when present', () => {
    expect(uploadTargetForSelection({
      fallbackVaultPath: '/personal',
      selection: { kind: 'folder', path: 'Research', rootPath: '/team' },
    })).toEqual({ destinationFolder: 'Research', vaultPath: '/team' })
  })

  it('treats a selected vault root folder as root upload', () => {
    expect(uploadTargetForSelection({
      fallbackVaultPath: '/personal',
      selection: { kind: 'folder', path: '', rootPath: '/team' },
    })).toEqual({ destinationFolder: null, vaultPath: '/team' })
  })
})
