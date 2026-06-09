import type { ModifiedFile } from '../types'

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

function allFilesAreNotes(files: ModifiedFile[]): boolean {
  return files.every((file) => {
    const lowerPath = file.relativePath.toLowerCase()
    return lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown')
  })
}

export function generateAutomaticCommitMessage(files: ModifiedFile[]): string {
  if (files.length === 0) return ''
  const noun = allFilesAreNotes(files)
    ? pluralize(files.length, 'note', 'notes')
    : pluralize(files.length, 'file', 'files')
  return `Updated ${files.length} ${noun}`
}
