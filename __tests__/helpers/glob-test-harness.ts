import * as fs from 'node:fs'
import * as path from 'node:path'

export interface Globber {
    glob(): Promise<string[]>
}

function normalizePath(filePath: string): string {
    return filePath.split(path.sep).join('/')
}

function toRegex(globPattern: string): RegExp {
    const doubleStarPatterns: string[] = []

    const withDoubleStarTokens = globPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\/?/g, token => {
            const replacement = token === '**/' ? '(?:.*/)?' : '.*'
            doubleStarPatterns.push(replacement)
            return `::DOUBLE_STAR_${doubleStarPatterns.length - 1}::`
        })

    const withSingleStarPatterns = withDoubleStarTokens
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')

    const escaped = doubleStarPatterns.reduce((current, replacement, index) => {
        return current.replace(`::DOUBLE_STAR_${index}::`, replacement)
    }, withSingleStarPatterns)

    return new RegExp(`^${escaped}$`)
}

function collectFiles(root: string): string[] {
    const stack = [root]
    const files: string[] = []

    while (stack.length > 0) {
        const current = stack.pop()
        if (!current) {
            continue
        }

        const entries = fs.readdirSync(current, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) {
                stack.push(fullPath)
            } else if (entry.isFile()) {
                files.push(fullPath)
            }
        }
    }

    return files
}

function resolveWorkspaceRoot(): string {
    return process.env.GITHUB_WORKSPACE || process.cwd()
}

export async function create(patterns: string): Promise<Globber> {
    const patternList = patterns
        .split(/\r?\n/)
        .map(pattern => pattern.trim())
        .filter(pattern => pattern.length > 0)

    return {
        async glob(): Promise<string[]> {
            const workspace = resolveWorkspaceRoot()
            const allFiles = collectFiles(workspace)
            const uniqueMatches = new Set<string>()

            for (const pattern of patternList) {
                const regex = toRegex(normalizePath(pattern))

                for (const filePath of allFiles) {
                    const relative = normalizePath(path.relative(workspace, filePath))
                    if (regex.test(relative)) {
                        uniqueMatches.add(filePath)
                    }
                }
            }

            return Array.from(uniqueMatches).sort((a, b) =>
                normalizePath(path.relative(workspace, a)).localeCompare(
                    normalizePath(path.relative(workspace, b))
                )
            )
        }
    }
}
