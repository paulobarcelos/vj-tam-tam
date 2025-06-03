/**
 * Tests for stringUtils module
 */

import { describe, it, expect } from 'vitest'
import {
  interpolate,
  capitalize,
  titleCase,
  camelCase,
  kebabCase,
  snakeCase,
  truncate,
  normalizeWhitespace,
  isBlank,
  padString,
  escapeHtml,
  slugify,
  getFileExtension,
  removeFileExtension,
  formatFileSize,
  randomString,
  wordCount,
  getPlural,
} from './stringUtils.js'

describe('stringUtils', () => {
  describe('interpolate', () => {
    it('should interpolate template strings', () => {
      const template = 'Hello {{name}}, you have {{count}} messages'
      const values = { name: 'Alice', count: 3 }
      expect(interpolate(template, values)).toBe('Hello Alice, you have 3 messages')
    })

    it('should leave unmatched placeholders unchanged', () => {
      const template = 'Hello {{name}}, {{missing}} placeholder'
      const values = { name: 'Alice' }
      expect(interpolate(template, values)).toBe('Hello Alice, {{missing}} placeholder')
    })

    it('should handle empty values object', () => {
      const template = 'Hello {{name}}'
      expect(interpolate(template)).toBe('Hello {{name}}')
    })

    it('should handle non-string input', () => {
      expect(interpolate(null, {})).toBe('')
      expect(interpolate(123, {})).toBe('')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('HELLO')
      expect(capitalize('hELLO')).toBe('HELLO')
    })

    it('should handle edge cases', () => {
      expect(capitalize('')).toBe('')
      expect(capitalize('a')).toBe('A')
      expect(capitalize(null)).toBe('')
      expect(capitalize(123)).toBe('')
    })
  })

  describe('titleCase', () => {
    it('should convert to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World')
      expect(titleCase('the quick brown fox')).toBe('The Quick Brown Fox')
    })

    it('should handle edge cases', () => {
      expect(titleCase('')).toBe('')
      expect(titleCase('a')).toBe('A')
      expect(titleCase(null)).toBe('')
    })
  })

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld')
      expect(camelCase('the quick brown fox')).toBe('theQuickBrownFox')
      expect(camelCase('Hello World')).toBe('helloWorld')
    })

    it('should handle edge cases', () => {
      expect(camelCase('')).toBe('')
      expect(camelCase(null)).toBe('')
    })
  })

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('hello world')).toBe('hello-world')
      expect(kebabCase('helloWorld')).toBe('hello-world')
      expect(kebabCase('HelloWorld')).toBe('hello-world')
    })

    it('should handle edge cases', () => {
      expect(kebabCase('')).toBe('')
      expect(kebabCase(null)).toBe('')
    })
  })

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(snakeCase('hello world')).toBe('hello_world')
      expect(snakeCase('helloWorld')).toBe('hello_world')
      expect(snakeCase('HelloWorld')).toBe('hello_world')
    })

    it('should handle edge cases', () => {
      expect(snakeCase('')).toBe('')
      expect(snakeCase(null)).toBe('')
    })
  })

  describe('truncate', () => {
    it('should truncate string to specified length', () => {
      expect(truncate('Hello world', 8)).toBe('Hello...')
      expect(truncate('Hello world', 5, '...')).toBe('He...')
    })

    it('should not truncate if string is shorter', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should handle custom ellipsis', () => {
      expect(truncate('Hello world', 8, '***')).toBe('Hello***')
    })

    it('should handle edge cases', () => {
      expect(truncate(null, 5)).toBe(null)
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('normalizeWhitespace', () => {
    it('should normalize whitespace', () => {
      expect(normalizeWhitespace('  hello   world  ')).toBe('hello world')
      expect(normalizeWhitespace('hello\t\n world')).toBe('hello world')
    })

    it('should handle edge cases', () => {
      expect(normalizeWhitespace('')).toBe('')
      expect(normalizeWhitespace(null)).toBe('')
    })
  })

  describe('isBlank', () => {
    it('should detect blank strings', () => {
      expect(isBlank('')).toBe(true)
      expect(isBlank('   ')).toBe(true)
      expect(isBlank('\t\n')).toBe(true)
    })

    it('should detect non-blank strings', () => {
      expect(isBlank('hello')).toBe(false)
      expect(isBlank(' hello ')).toBe(false)
    })

    it('should handle non-strings', () => {
      expect(isBlank(null)).toBe(true)
      expect(isBlank(undefined)).toBe(true)
    })
  })

  describe('padString', () => {
    it('should pad string to the right by default', () => {
      expect(padString('hello', 8)).toBe('hello   ')
      expect(padString('hello', 8, '*')).toBe('hello***')
    })

    it('should pad string to the left', () => {
      expect(padString('hello', 8, ' ', 'left')).toBe('   hello')
      expect(padString('hello', 8, '0', 'left')).toBe('000hello')
    })

    it('should pad string to both sides', () => {
      expect(padString('hello', 9, '*', 'both')).toBe('**hello**')
      expect(padString('hello', 8, '*', 'both')).toBe('*hello**')
    })

    it('should not pad if string is already long enough', () => {
      expect(padString('hello world', 5)).toBe('hello world')
    })

    it('should handle non-string input', () => {
      expect(padString(123, 5, '0', 'left')).toBe('00123')
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<div>Hello & "World"</div>')).toBe(
        '&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;'
      )
      expect(escapeHtml("It's a 'test'")).toBe('It&#39;s a &#39;test&#39;')
    })

    it('should handle strings without HTML characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })

    it('should handle edge cases', () => {
      expect(escapeHtml('')).toBe('')
      expect(escapeHtml(null)).toBe('')
    })
  })

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world')
      expect(slugify('The Quick & Brown Fox')).toBe('the-quick-brown-fox')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })

    it('should handle special characters', () => {
      expect(slugify('café-naïve')).toBe('caf-nave')
      expect(slugify('hello_world-test')).toBe('hello-world-test')
    })

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('')
      expect(slugify('!!!')).toBe('')
      expect(slugify(null)).toBe('')
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('photo.jpg')).toBe('jpg')
      expect(getFileExtension('document.PDF')).toBe('pdf')
      expect(getFileExtension('file.with.dots.png')).toBe('png')
    })

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('folder/')).toBe('')
    })

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('')
      expect(getFileExtension(null)).toBe('')
    })
  })

  describe('removeFileExtension', () => {
    it('should remove file extensions', () => {
      expect(removeFileExtension('photo.jpg')).toBe('photo')
      expect(removeFileExtension('file.with.dots.png')).toBe('file.with.dots')
    })

    it('should handle files without extensions', () => {
      expect(removeFileExtension('README')).toBe('README')
    })

    it('should handle edge cases', () => {
      expect(removeFileExtension('')).toBe('')
      expect(removeFileExtension(null)).toBe(null)
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatFileSize(1536, 1)).toBe('1.5 KB')
      expect(formatFileSize(1536, 0)).toBe('2 KB')
    })

    it('should handle edge cases', () => {
      expect(formatFileSize(null)).toBe('0 Bytes')
      expect(formatFileSize('not-a-number')).toBe('0 Bytes')
      expect(formatFileSize(-1024)).toBe('-1 KB')
    })
  })

  describe('randomString', () => {
    it('should generate random strings of specified length', () => {
      const str1 = randomString(8)
      const str2 = randomString(8)
      expect(str1).toHaveLength(8)
      expect(str2).toHaveLength(8)
      expect(str1).not.toBe(str2) // Very unlikely to be the same
    })

    it('should use custom character set', () => {
      const str = randomString(10, '0123456789')
      expect(str).toHaveLength(10)
      expect(/^[0-9]+$/.test(str)).toBe(true)
    })

    it('should handle edge cases', () => {
      expect(randomString(0)).toBe('')
    })
  })

  describe('wordCount', () => {
    it('should count words correctly', () => {
      expect(wordCount('Hello world')).toBe(2)
      expect(wordCount('The quick brown fox jumps')).toBe(5)
      expect(wordCount('  Multiple   spaces  between  words  ')).toBe(4)
    })

    it('should handle edge cases', () => {
      expect(wordCount('')).toBe(0)
      expect(wordCount('   ')).toBe(0)
      expect(wordCount(null)).toBe(0)
      expect(wordCount('single')).toBe(1)
    })
  })

  describe('getPlural', () => {
    it('should return plural suffix for counts not equal to 1', () => {
      expect(getPlural(0)).toBe('s')
      expect(getPlural(2)).toBe('s')
      expect(getPlural(5)).toBe('s')
    })

    it('should return empty string for count of 1', () => {
      expect(getPlural(1)).toBe('')
    })

    it('should handle custom suffix', () => {
      expect(getPlural(0, 'es')).toBe('es')
      expect(getPlural(1, 'es')).toBe('')
      expect(getPlural(2, 'es')).toBe('es')
    })
  })
})
