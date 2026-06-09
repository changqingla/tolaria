import type { SidebarSelection } from '../types'

export interface UploadTargetOptions {
  fallbackVaultPath: string
  selection: SidebarSelection
}

export interface UploadTarget {
  destinationFolder: string | null
  vaultPath: string
}

export function uploadTargetForSelection({
  fallbackVaultPath,
  selection,
}: UploadTargetOptions): UploadTarget {
  if (selection.kind !== 'folder') {
    return { destinationFolder: null, vaultPath: fallbackVaultPath }
  }

  const vaultPath = selection.rootPath?.trim() ? selection.rootPath : fallbackVaultPath
  return {
    destinationFolder: selection.path.length > 0 ? selection.path : null,
    vaultPath,
  }
}
