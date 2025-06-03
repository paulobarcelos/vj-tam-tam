/**
 * Tests for objectUtils module
 */

import { describe, it, expect } from 'vitest'
import {
  getNestedProperty,
  setNestedProperty,
  hasNestedProperty,
  deepClone,
  deepMerge,
  pick,
  omit,
  isDeepEqual,
  isEmpty,
  getPropertyPaths,
  transformObject,
  serializeDates,
  deserializeDates,
} from './objectUtils.js'

describe('objectUtils', () => {
  describe('getNestedProperty', () => {
    it('should get nested property values', () => {
      const obj = { user: { profile: { name: 'Alice', age: 25 } } }
      expect(getNestedProperty(obj, 'user.profile.name')).toBe('Alice')
      expect(getNestedProperty(obj, 'user.profile.age')).toBe(25)
    })

    it('should return default value for missing properties', () => {
      const obj = { user: { profile: { name: 'Alice' } } }
      expect(getNestedProperty(obj, 'user.profile.missing', 'default')).toBe('default')
      expect(getNestedProperty(obj, 'user.missing.name', null)).toBe(null)
    })

    it('should handle invalid inputs', () => {
      expect(getNestedProperty(null, 'user.name')).toBeUndefined()
      expect(getNestedProperty({}, '')).toBeUndefined()
      expect(getNestedProperty({}, null)).toBeUndefined()
    })
  })

  describe('setNestedProperty', () => {
    it('should set nested property values', () => {
      const obj = {}
      setNestedProperty(obj, 'user.profile.name', 'Alice')
      expect(obj.user.profile.name).toBe('Alice')
    })

    it('should create intermediate objects', () => {
      const obj = {}
      setNestedProperty(obj, 'a.b.c.d', 'value')
      expect(obj.a.b.c.d).toBe('value')
    })

    it('should handle existing paths', () => {
      const obj = { user: { profile: { name: 'Alice' } } }
      setNestedProperty(obj, 'user.profile.age', 25)
      expect(obj.user.profile.age).toBe(25)
      expect(obj.user.profile.name).toBe('Alice')
    })

    it('should handle invalid inputs', () => {
      expect(setNestedProperty(null, 'user.name', 'value')).toBe(null)
      const obj = {}
      expect(setNestedProperty(obj, '', 'value')).toBe(obj)
    })
  })

  describe('hasNestedProperty', () => {
    it('should check if nested property exists', () => {
      const obj = { user: { profile: { name: 'Alice' } } }
      expect(hasNestedProperty(obj, 'user.profile.name')).toBe(true)
      expect(hasNestedProperty(obj, 'user.profile')).toBe(true)
      expect(hasNestedProperty(obj, 'user.profile.missing')).toBe(false)
    })

    it('should handle invalid inputs', () => {
      expect(hasNestedProperty(null, 'user.name')).toBe(false)
      expect(hasNestedProperty({}, '')).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(null)).toBe(null)
    })

    it('should clone dates', () => {
      const date = new Date('2023-01-01')
      const cloned = deepClone(date)
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })

    it('should clone arrays deeply', () => {
      const array = [1, [2, 3], { a: 4 }]
      const cloned = deepClone(array)
      expect(cloned).toEqual(array)
      expect(cloned).not.toBe(array)
      expect(cloned[1]).not.toBe(array[1])
      expect(cloned[2]).not.toBe(array[2])
    })

    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2, d: [3, 4] } }
      const cloned = deepClone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
      expect(cloned.b.d).not.toBe(obj.b.d)
    })
  })

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } }
      const source = { b: { d: 3 }, e: 4 }
      const result = deepMerge(target, source)

      expect(result).toBe(target) // Should mutate target
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 })
    })

    it('should handle multiple sources', () => {
      const target = { a: 1 }
      const source1 = { b: 2 }
      const source2 = { c: 3 }
      const result = deepMerge(target, source1, source2)

      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should handle array values', () => {
      const target = { a: [1, 2] }
      const source = { a: [3, 4] }
      const result = deepMerge(target, source)

      expect(result.a).toEqual([3, 4]) // Arrays are replaced, not merged
    })

    it('should handle invalid inputs', () => {
      expect(deepMerge(null, { a: 1 })).toEqual({})
      expect(deepMerge({ a: 1 }, null)).toEqual({ a: 1 })
    })
  })

  describe('pick', () => {
    it('should pick specified properties', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const picked = pick(obj, ['a', 'c'])
      expect(picked).toEqual({ a: 1, c: 3 })
    })

    it('should handle missing properties', () => {
      const obj = { a: 1, b: 2 }
      const picked = pick(obj, ['a', 'missing'])
      expect(picked).toEqual({ a: 1 })
    })

    it('should handle invalid inputs', () => {
      expect(pick(null, ['a'])).toEqual({})
      expect(pick({ a: 1 }, null)).toEqual({})
    })
  })

  describe('omit', () => {
    it('should omit specified properties', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const omitted = omit(obj, ['b'])
      expect(omitted).toEqual({ a: 1, c: 3 })
    })

    it('should handle missing properties', () => {
      const obj = { a: 1, b: 2 }
      const omitted = omit(obj, ['missing'])
      expect(omitted).toEqual({ a: 1, b: 2 })
    })

    it('should not mutate original object', () => {
      const obj = { a: 1, b: 2 }
      const omitted = omit(obj, ['b'])
      expect(obj).toEqual({ a: 1, b: 2 })
      expect(omitted).not.toBe(obj)
    })
  })

  describe('isDeepEqual', () => {
    it('should return true for equal primitives', () => {
      expect(isDeepEqual(42, 42)).toBe(true)
      expect(isDeepEqual('hello', 'hello')).toBe(true)
      expect(isDeepEqual(null, null)).toBe(true)
    })

    it('should return false for different primitives', () => {
      expect(isDeepEqual(42, 43)).toBe(false)
      expect(isDeepEqual('hello', 'world')).toBe(false)
      expect(isDeepEqual(null, undefined)).toBe(false)
    })

    it('should compare objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: 2 } }
      const obj3 = { a: 1, b: { c: 3 } }

      expect(isDeepEqual(obj1, obj2)).toBe(true)
      expect(isDeepEqual(obj1, obj3)).toBe(false)
    })

    it('should handle different object lengths', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1 }
      expect(isDeepEqual(obj1, obj2)).toBe(false)
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty objects', () => {
      expect(isEmpty({ a: 1 })).toBe(false)
    })

    it('should return true for non-objects', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty('string')).toBe(true)
      expect(isEmpty(42)).toBe(true)
    })
  })

  describe('getPropertyPaths', () => {
    it('should get all property paths', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } } }
      const paths = getPropertyPaths(obj)
      expect(paths).toContain('a')
      expect(paths).toContain('b')
      expect(paths).toContain('b.c')
      expect(paths).toContain('b.d')
      expect(paths).toContain('b.d.e')
    })

    it('should handle arrays', () => {
      const obj = { a: [1, 2], b: { c: 3 } }
      const paths = getPropertyPaths(obj)
      expect(paths).toContain('a')
      expect(paths).toContain('b')
      expect(paths).toContain('b.c')
      // Arrays are not traversed further
    })

    it('should handle invalid inputs', () => {
      expect(getPropertyPaths(null)).toEqual([])
      expect(getPropertyPaths('string')).toEqual([])
    })
  })

  describe('transformObject', () => {
    it('should transform object properties', () => {
      const obj = { firstName: 'Alice', lastName: 'Smith' }
      const transformed = transformObject(obj, (key, value) => [
        key.toUpperCase(),
        value.toUpperCase(),
      ])
      expect(transformed).toEqual({ FIRSTNAME: 'ALICE', LASTNAME: 'SMITH' })
    })

    it('should filter out undefined keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const transformed = transformObject(obj, (key, value) =>
        key === 'b' ? [undefined, value] : [key, value]
      )
      expect(transformed).toEqual({ a: 1, c: 3 })
    })

    it('should handle invalid inputs', () => {
      expect(transformObject(null, () => ['key', 'value'])).toEqual({})
      expect(transformObject({ a: 1 }, null)).toEqual({})
    })
  })

  describe('serializeDates', () => {
    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      expect(serializeDates(date)).toBe('2023-01-01T00:00:00.000Z')
    })

    it('should serialize dates in objects', () => {
      const obj = {
        name: 'Alice',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        nested: {
          updatedAt: new Date('2023-01-02T00:00:00.000Z'),
        },
      }
      const serialized = serializeDates(obj)
      expect(serialized.createdAt).toBe('2023-01-01T00:00:00.000Z')
      expect(serialized.nested.updatedAt).toBe('2023-01-02T00:00:00.000Z')
      expect(serialized.name).toBe('Alice')
    })

    it('should serialize dates in arrays', () => {
      const array = [new Date('2023-01-01'), 'string', { date: new Date('2023-01-02') }]
      const serialized = serializeDates(array)
      expect(serialized[0]).toBe('2023-01-01T00:00:00.000Z')
      expect(serialized[1]).toBe('string')
      expect(serialized[2].date).toBe('2023-01-02T00:00:00.000Z')
    })

    it('should handle non-date values', () => {
      expect(serializeDates(null)).toBe(null)
      expect(serializeDates('string')).toBe('string')
      expect(serializeDates(42)).toBe(42)
    })
  })

  describe('deserializeDates', () => {
    it('should convert ISO strings to Date objects for specified fields', () => {
      const obj = {
        name: 'Alice',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      }
      const deserialized = deserializeDates(obj, ['createdAt', 'updatedAt'])
      expect(deserialized.createdAt).toBeInstanceOf(Date)
      expect(deserialized.updatedAt).toBeInstanceOf(Date)
      expect(deserialized.name).toBe('Alice')
    })

    it('should handle arrays', () => {
      const array = [
        { createdAt: '2023-01-01T00:00:00.000Z' },
        { createdAt: '2023-01-02T00:00:00.000Z' },
      ]
      const deserialized = deserializeDates(array, ['createdAt'])
      expect(deserialized[0].createdAt).toBeInstanceOf(Date)
      expect(deserialized[1].createdAt).toBeInstanceOf(Date)
    })

    it('should handle missing fields', () => {
      const obj = { name: 'Alice' }
      const deserialized = deserializeDates(obj, ['createdAt'])
      expect(deserialized).toEqual({ name: 'Alice' })
    })

    it('should handle invalid inputs', () => {
      expect(deserializeDates(null, [])).toBe(null)
      expect(deserializeDates('string', [])).toBe('string')
    })
  })
})
