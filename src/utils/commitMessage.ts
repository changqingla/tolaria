import type { ModifiedFile } from '../types'

const VERB_MAP: Record<string, string> = {
  modified: 'Update',
  added: 'Add',
  untracked: 'Add',
  deleted: 'Delete',
  renamed: 'Rename',
}

const MAX_LISTED_FILES = 3

function isMarkdownPath(relativePath: string): boolean {
  const lowerPath = relativePath.toLowerCase()
  return lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown')
}

function displayName(relativePath: string): string {
  const basename = relativePath.split('/').pop() ?? relativePath
  return isMarkdownPath(basename) ? basename.replace(/\.(md|markdown)$/i, '') : basename
}

function verb(files: ModifiedFile[]): string {
  const statuses = new Set(files.map((f) => f.status))
  if (statuses.size === 1) return VERB_MAP[files[0].status] ?? 'Update'
  return 'Update'
}

/** Generate a heuristic commit message from modified files. */
export function generateCommitMessage(files: ModifiedFile[]): string {
  if (files.length === 0) return ''
  const action = verb(files)
  if (files.length <= MAX_LISTED_FILES) {
    const names = files.map((f) => displayName(f.relativePath)).join(', ')
    return `${action} ${names}`
  }
  const noun = files.every((file) => isMarkdownPath(file.relativePath)) ? 'notes' : 'files'
  return `${action} ${files.length} ${noun}`
}
