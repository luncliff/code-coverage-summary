import { validateFormat, validateOutput } from '../src/input-validator'

describe('Input Validator', () => {
  describe('validateFormat', () => {
    it('should accept valid format: text', () => {
      expect(() => validateFormat('text')).not.toThrow()
    })

    it('should accept valid format: md', () => {
      expect(() => validateFormat('md')).not.toThrow()
    })

    it('should accept valid format: markdown', () => {
      expect(() => validateFormat('markdown')).not.toThrow()
    })

    it('should throw exact error for invalid format', () => {
      expect(() => validateFormat('json')).toThrow('Error: Unknown output format.')
      expect(() => validateFormat('html')).toThrow('Error: Unknown output format.')
      expect(() => validateFormat('csv')).toThrow('Error: Unknown output format.')
    })
  })

  describe('validateOutput', () => {
    it('should accept valid output: console', () => {
      expect(() => validateOutput('console')).not.toThrow()
    })

    it('should accept valid output: file', () => {
      expect(() => validateOutput('file')).not.toThrow()
    })

    it('should accept valid output: both', () => {
      expect(() => validateOutput('both')).not.toThrow()
    })

    it('should throw exact error for invalid output', () => {
      expect(() => validateOutput('somewhere')).toThrow('Error: Unknown output type.')
      expect(() => validateOutput('database')).toThrow('Error: Unknown output type.')
      expect(() => validateOutput('network')).toThrow('Error: Unknown output type.')
    })
  })
})
