/**
 * Tests for validationUtils module
 */

import { describe, it, expect } from 'vitest'
import {
  isValidFile,
  isValidArray,
  isNonEmptyArray,
  isValidString,
  isNonEmptyString,
  isValidNumber,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidObject,
  isValidMediaItem,
  isFileReadyForProcessing,
  validateInput,
  isErrorType,
  isAbortError,
  isNotAllowedError,
  isQuotaExceededError,
} from './validationUtils.js'

describe('validationUtils', () => {
  describe('isValidFile', () => {
    it('should validate File objects', () => {
      const validFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      expect(isValidFile(validFile)).toBe(true)
    })

    it('should reject invalid files', () => {
      expect(isValidFile(null)).toBe(false)
      expect(isValidFile(undefined)).toBe(false)
      expect(isValidFile({})).toBe(false)
      expect(isValidFile('not-a-file')).toBe(false)
    })
  })

  describe('isValidArray', () => {
    it('should validate arrays', () => {
      expect(isValidArray([])).toBe(true)
      expect(isValidArray([1, 2, 3])).toBe(true)
      expect(isValidArray(['a', 'b'])).toBe(true)
    })

    it('should reject non-arrays', () => {
      expect(isValidArray(null)).toBe(false)
      expect(isValidArray(undefined)).toBe(false)
      expect(isValidArray({})).toBe(false)
      expect(isValidArray('string')).toBe(false)
    })
  })

  describe('isNonEmptyArray', () => {
    it('should validate non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true)
      expect(isNonEmptyArray(['a', 'b'])).toBe(true)
    })

    it('should reject empty arrays and non-arrays', () => {
      expect(isNonEmptyArray([])).toBe(false)
      expect(isNonEmptyArray(null)).toBe(false)
      expect(isNonEmptyArray('string')).toBe(false)
    })
  })

  describe('isValidString', () => {
    it('should validate strings', () => {
      expect(isValidString('')).toBe(true)
      expect(isValidString('hello')).toBe(true)
      expect(isValidString('   ')).toBe(true)
    })

    it('should reject non-strings', () => {
      expect(isValidString(null)).toBe(false)
      expect(isValidString(undefined)).toBe(false)
      expect(isValidString(123)).toBe(false)
      expect(isValidString([])).toBe(false)
    })
  })

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('a')).toBe(true)
    })

    it('should reject empty strings and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
    })
  })

  describe('isValidNumber', () => {
    it('should validate numbers', () => {
      expect(isValidNumber(0)).toBe(true)
      expect(isValidNumber(42)).toBe(true)
      expect(isValidNumber(-5)).toBe(true)
      expect(isValidNumber(3.14)).toBe(true)
    })

    it('should reject invalid numbers', () => {
      expect(isValidNumber(NaN)).toBe(false)
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(-Infinity)).toBe(false)
      expect(isValidNumber('123')).toBe(false)
      expect(isValidNumber(null)).toBe(false)
    })
  })

  describe('isPositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true)
      expect(isPositiveNumber(42)).toBe(true)
      expect(isPositiveNumber(0.1)).toBe(true)
    })

    it('should reject zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false)
      expect(isPositiveNumber(-1)).toBe(false)
      expect(isPositiveNumber(-0.1)).toBe(false)
    })
  })

  describe('isNonNegativeNumber', () => {
    it('should validate non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true)
      expect(isNonNegativeNumber(1)).toBe(true)
      expect(isNonNegativeNumber(42)).toBe(true)
    })

    it('should reject negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false)
      expect(isNonNegativeNumber(-0.1)).toBe(false)
    })
  })

  describe('isValidObject', () => {
    it('should validate objects', () => {
      expect(isValidObject({})).toBe(true)
      expect(isValidObject({ key: 'value' })).toBe(true)
    })

    it('should reject non-objects', () => {
      expect(isValidObject(null)).toBe(false)
      expect(isValidObject([])).toBe(false)
      expect(isValidObject('string')).toBe(false)
      expect(isValidObject(123)).toBe(false)
    })
  })

  describe('isValidMediaItem', () => {
    it('should validate media items', () => {
      const validMediaItem = {
        id: 'media_1',
        name: 'test.jpg',
        type: 'image',
        size: 1024,
      }
      expect(isValidMediaItem(validMediaItem)).toBe(true)
    })

    it('should reject invalid media items', () => {
      expect(isValidMediaItem(null)).toBe(false)
      expect(isValidMediaItem({})).toBe(false)
      expect(isValidMediaItem({ id: '', name: 'test.jpg', type: 'image', size: 1024 })).toBe(false)
      expect(isValidMediaItem({ id: 'media_1', name: '', type: 'image', size: 1024 })).toBe(false)
      expect(isValidMediaItem({ id: 'media_1', name: 'test.jpg', type: '', size: 1024 })).toBe(
        false
      )
      expect(isValidMediaItem({ id: 'media_1', name: 'test.jpg', type: 'image', size: -1 })).toBe(
        false
      )
    })
  })

  describe('isFileReadyForProcessing', () => {
    it('should validate files ready for processing', () => {
      const readyFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      expect(isFileReadyForProcessing(readyFile)).toBe(true)
    })

    it('should reject files not ready for processing', () => {
      const fileWithoutName = new File(['content'], '', { type: 'image/jpeg' })
      const fileWithoutType = new File(['content'], 'test.jpg', { type: '' })

      expect(isFileReadyForProcessing(null)).toBe(false)
      expect(isFileReadyForProcessing(fileWithoutName)).toBe(false)
      expect(isFileReadyForProcessing(fileWithoutType)).toBe(false)
    })
  })

  describe('validateInput', () => {
    it('should validate required inputs', () => {
      const result = validateInput('hello', { required: true })
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject missing required inputs', () => {
      const result = validateInput('', { required: true })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Input is required')
    })

    it('should validate type constraints', () => {
      const stringResult = validateInput('hello', { type: 'string' })
      expect(stringResult.isValid).toBe(true)

      const numberResult = validateInput(42, { type: 'number' })
      expect(numberResult.isValid).toBe(true)

      const invalidResult = validateInput('hello', { type: 'number' })
      expect(invalidResult.isValid).toBe(false)
    })

    it('should validate length constraints', () => {
      const validResult = validateInput('hello', { minLength: 3, maxLength: 10 })
      expect(validResult.isValid).toBe(true)

      const tooShortResult = validateInput('hi', { minLength: 3 })
      expect(tooShortResult.isValid).toBe(false)

      const tooLongResult = validateInput('very long string', { maxLength: 5 })
      expect(tooLongResult.isValid).toBe(false)
    })

    it('should validate value constraints for numbers', () => {
      const validResult = validateInput(5, { min: 1, max: 10 })
      expect(validResult.isValid).toBe(true)

      const tooSmallResult = validateInput(0, { min: 1 })
      expect(tooSmallResult.isValid).toBe(false)

      const tooBigResult = validateInput(15, { max: 10 })
      expect(tooBigResult.isValid).toBe(false)
    })
  })

  describe('error type checking', () => {
    it('should identify error types correctly', () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'

      const notAllowedError = new Error('Permission denied')
      notAllowedError.name = 'NotAllowedError'

      const quotaError = new Error('Storage quota exceeded')
      quotaError.name = 'QuotaExceededError'

      expect(isErrorType(abortError, 'AbortError')).toBe(true)
      expect(isAbortError(abortError)).toBe(true)
      expect(isNotAllowedError(notAllowedError)).toBe(true)
      expect(isQuotaExceededError(quotaError)).toBe(true)

      expect(isAbortError(notAllowedError)).toBe(false)
      expect(isNotAllowedError(abortError)).toBe(false)
    })
  })
})
