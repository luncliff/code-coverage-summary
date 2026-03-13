type InputOptions = {
  required?: boolean
  trimWhitespace?: boolean
}

const infoMessages: string[] = []
const failedMessages: string[] = []
const debugMessages: string[] = []
const inputValues: Record<string, string> = {}

export function getInput(name: string, options?: InputOptions): string {
  const value = inputValues[name] ?? ''
  if (options?.required && !value) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  if (options?.trimWhitespace === false) {
    return value
  }
  return value.trim()
}

export function debug(message: string): void {
  debugMessages.push(message)
}

export function info(message: string): void {
  infoMessages.push(message)
}

export function setFailed(message: string): void {
  failedMessages.push(message)
  process.exitCode = 1
}

export const coreMock = {
  debug,
  getInput,
  info,
  setFailed
}

export function resetActionTestState(): void {
  infoMessages.length = 0
  failedMessages.length = 0
  debugMessages.length = 0
  process.exitCode = 0
  for (const key of Object.keys(inputValues)) {
    delete inputValues[key]
  }
}

export function setActionInputs(inputs: Record<string, string>): void {
  for (const key of Object.keys(inputValues)) {
    delete inputValues[key]
  }
  for (const [key, value] of Object.entries(inputs)) {
    inputValues[key] = value
  }
}

export function getInfoMessages(): string[] {
  return [...infoMessages]
}

export function getFailedMessages(): string[] {
  return [...failedMessages]
}

export function getDebugMessages(): string[] {
  return [...debugMessages]
}
