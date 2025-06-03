/**
 * Tests for arrayUtils module
 */

import { describe, it, expect } from 'vitest'
import {
  filterValidItems,
  filterUnique,
  filterUniqueByProperty,
  findByProperty,
  findAllByProperty,
  findIndexByProperty,
  groupBy,
  groupByProperty,
  sortByProperty,
  takeItems,
  containsItemWithProperty,
  countWhere,
  arrayDifference,
  arrayIntersection,
  flattenArray,
  chunkArray,
} from './arrayUtils.js'

describe('arrayUtils', () => {
  describe('filterValidItems', () => {
    it('should filter out null and undefined values', () => {
      const array = [1, null, 'hello', undefined, 0, false, '']
      const filtered = filterValidItems(array)
      expect(filtered).toEqual([1, 'hello', 0, false, ''])
    })

    it('should handle empty arrays', () => {
      expect(filterValidItems([])).toEqual([])
    })

    it('should handle non-arrays', () => {
      expect(filterValidItems(null)).toEqual([])
      expect(filterValidItems('not-array')).toEqual([])
    })
  })

  describe('filterUnique', () => {
    it('should remove duplicate primitive values', () => {
      const array = [1, 2, 2, 3, 1, 4]
      const unique = filterUnique(array)
      expect(unique).toEqual([1, 2, 3, 4])
    })

    it('should work with custom key function', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ]
      const unique = filterUnique(array, (item) => item.id)
      expect(unique).toHaveLength(2)
      expect(unique[0].id).toBe(1)
      expect(unique[1].id).toBe(2)
    })

    it('should handle non-arrays', () => {
      expect(filterUnique(null)).toEqual([])
    })
  })

  describe('filterUniqueByProperty', () => {
    it('should remove duplicates by single property', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Charlie' },
      ]
      const unique = filterUniqueByProperty(array, 'id')
      expect(unique).toHaveLength(2)
      expect(unique.map((item) => item.id)).toEqual([1, 2])
    })

    it('should remove duplicates by multiple properties', () => {
      const array = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Alice', age: 26 },
      ]
      const unique = filterUniqueByProperty(array, ['name', 'age'])
      expect(unique).toHaveLength(3)
    })
  })

  describe('findByProperty', () => {
    it('should find item by property value', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]
      const found = findByProperty(array, 'name', 'Bob')
      expect(found).toEqual({ id: 2, name: 'Bob' })
    })

    it('should return undefined if not found', () => {
      const array = [{ id: 1, name: 'Alice' }]
      const found = findByProperty(array, 'name', 'Bob')
      expect(found).toBeUndefined()
    })

    it('should handle non-arrays', () => {
      expect(findByProperty(null, 'name', 'Bob')).toBeUndefined()
    })
  })

  describe('findAllByProperty', () => {
    it('should find all items with matching property value', () => {
      const array = [
        { type: 'image', name: 'photo1.jpg' },
        { type: 'video', name: 'movie.mp4' },
        { type: 'image', name: 'photo2.png' },
      ]
      const images = findAllByProperty(array, 'type', 'image')
      expect(images).toHaveLength(2)
      expect(images.every((item) => item.type === 'image')).toBe(true)
    })

    it('should return empty array if none found', () => {
      const array = [{ type: 'image' }]
      const videos = findAllByProperty(array, 'type', 'video')
      expect(videos).toEqual([])
    })
  })

  describe('findIndexByProperty', () => {
    it('should find index of item by property value', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const index = findIndexByProperty(array, 'name', 'Bob')
      expect(index).toBe(1)
    })

    it('should return -1 if not found', () => {
      const array = [{ id: 1, name: 'Alice' }]
      const index = findIndexByProperty(array, 'name', 'Bob')
      expect(index).toBe(-1)
    })
  })

  describe('groupBy', () => {
    it('should group items by key function', () => {
      const array = [
        { type: 'image', name: 'photo1.jpg' },
        { type: 'video', name: 'movie.mp4' },
        { type: 'image', name: 'photo2.png' },
      ]
      const grouped = groupBy(array, (item) => item.type)
      expect(grouped).toHaveProperty('image')
      expect(grouped).toHaveProperty('video')
      expect(grouped.image).toHaveLength(2)
      expect(grouped.video).toHaveLength(1)
    })

    it('should handle empty arrays', () => {
      const grouped = groupBy([], (item) => item.type)
      expect(grouped).toEqual({})
    })
  })

  describe('groupByProperty', () => {
    it('should group items by property', () => {
      const array = [
        { category: 'fruit', name: 'apple' },
        { category: 'vegetable', name: 'carrot' },
        { category: 'fruit', name: 'banana' },
      ]
      const grouped = groupByProperty(array, 'category')
      expect(grouped.fruit).toHaveLength(2)
      expect(grouped.vegetable).toHaveLength(1)
    })
  })

  describe('sortByProperty', () => {
    it('should sort by property ascending', () => {
      const array = [
        { name: 'Charlie', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 },
      ]
      const sorted = sortByProperty(array, 'age', 'asc')
      expect(sorted.map((item) => item.age)).toEqual([20, 25, 30])
    })

    it('should sort by property descending', () => {
      const array = [
        { name: 'Charlie', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 },
      ]
      const sorted = sortByProperty(array, 'age', 'desc')
      expect(sorted.map((item) => item.age)).toEqual([30, 25, 20])
    })

    it('should not mutate original array', () => {
      const original = [{ age: 30 }, { age: 20 }]
      const sorted = sortByProperty(original, 'age')
      expect(original[0].age).toBe(30) // Original unchanged
      expect(sorted[0].age).toBe(20) // Sorted result
    })
  })

  describe('takeItems', () => {
    it('should take specified number of items from start', () => {
      const array = [1, 2, 3, 4, 5]
      const taken = takeItems(array, 1, 3)
      expect(taken).toEqual([2, 3, 4])
    })

    it('should take from start with count only', () => {
      const array = [1, 2, 3, 4, 5]
      const taken = takeItems(array, 0, 3)
      expect(taken).toEqual([1, 2, 3])
    })

    it('should slice to end if no count specified', () => {
      const array = [1, 2, 3, 4, 5]
      const taken = takeItems(array, 2)
      expect(taken).toEqual([3, 4, 5])
    })
  })

  describe('containsItemWithProperty', () => {
    it('should return true if item with property value exists', () => {
      const array = [
        { id: 1, active: true },
        { id: 2, active: false },
      ]
      expect(containsItemWithProperty(array, 'active', true)).toBe(true)
      expect(containsItemWithProperty(array, 'active', false)).toBe(true)
      expect(containsItemWithProperty(array, 'id', 3)).toBe(false)
    })

    it('should handle non-arrays', () => {
      expect(containsItemWithProperty(null, 'id', 1)).toBe(false)
    })
  })

  describe('countWhere', () => {
    it('should count items matching condition', () => {
      const array = [1, 2, 3, 4, 5, 6]
      const evenCount = countWhere(array, (num) => num % 2 === 0)
      expect(evenCount).toBe(3)
    })

    it('should return 0 for empty arrays', () => {
      const count = countWhere([], () => true)
      expect(count).toBe(0)
    })

    it('should handle non-arrays', () => {
      expect(countWhere(null, () => true)).toBe(0)
    })
  })

  describe('arrayDifference', () => {
    it('should return items in first array but not in second', () => {
      const array1 = [1, 2, 3, 4]
      const array2 = [3, 4, 5, 6]
      const diff = arrayDifference(array1, array2)
      expect(diff).toEqual([1, 2])
    })

    it('should work with custom key function', () => {
      const array1 = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const array2 = [{ id: 2 }, { id: 4 }]
      const diff = arrayDifference(array1, array2, (item) => item.id)
      expect(diff).toHaveLength(2)
      expect(diff.map((item) => item.id)).toEqual([1, 3])
    })
  })

  describe('arrayIntersection', () => {
    it('should return items that exist in both arrays', () => {
      const array1 = [1, 2, 3, 4]
      const array2 = [3, 4, 5, 6]
      const intersection = arrayIntersection(array1, array2)
      expect(intersection).toEqual([3, 4])
    })

    it('should work with custom key function', () => {
      const array1 = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const array2 = [{ id: 2 }, { id: 3 }]
      const intersection = arrayIntersection(array1, array2, (item) => item.id)
      expect(intersection).toHaveLength(2)
      expect(intersection.map((item) => item.id)).toEqual([2, 3])
    })
  })

  describe('flattenArray', () => {
    it('should flatten one level by default', () => {
      const nested = [1, [2, 3], [4, [5, 6]]]
      const flattened = flattenArray(nested)
      expect(flattened).toEqual([1, 2, 3, 4, [5, 6]])
    })

    it('should flatten deeply when specified', () => {
      const nested = [1, [2, [3, [4, 5]]]]
      const flattened = flattenArray(nested, true)
      expect(flattened).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle non-arrays', () => {
      expect(flattenArray(null)).toEqual([])
    })
  })

  describe('chunkArray', () => {
    it('should split array into chunks of specified size', () => {
      const array = [1, 2, 3, 4, 5, 6, 7]
      const chunks = chunkArray(array, 3)
      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    it('should handle arrays smaller than chunk size', () => {
      const array = [1, 2]
      const chunks = chunkArray(array, 5)
      expect(chunks).toEqual([[1, 2]])
    })

    it('should handle invalid inputs', () => {
      expect(chunkArray(null, 3)).toEqual([])
      expect(chunkArray([1, 2, 3], 0)).toEqual([])
      expect(chunkArray([1, 2, 3], -1)).toEqual([])
    })
  })
})
