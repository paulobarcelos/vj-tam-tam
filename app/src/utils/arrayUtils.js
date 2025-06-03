/**
 * Array utilities for common array manipulation operations
 * Centralizes array filtering, deduplication, searching, and transformation logic
 */

/**
 * Filter array to remove null and undefined values
 * @param {Array} array - Array to filter
 * @returns {Array} - Array with null/undefined values removed
 */
export const filterValidItems = (array) => {
  if (!Array.isArray(array)) return []

  return array.filter((item) => item !== null && item !== undefined)
}

/**
 * Remove duplicate items from array based on a key function
 * @param {Array} array - Array to deduplicate
 * @param {Function} keyFn - Function to generate unique key for each item
 * @returns {Array} - Array with duplicates removed
 */
export const filterUnique = (array, keyFn = (item) => item) => {
  if (!Array.isArray(array)) return []

  const seen = new Set()
  return array.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Remove duplicate items from array by comparing object properties
 * @param {Array} array - Array of objects to deduplicate
 * @param {string|Array} properties - Property name(s) to compare for uniqueness
 * @returns {Array} - Array with duplicates removed
 */
export const filterUniqueByProperty = (array, properties) => {
  if (!Array.isArray(array)) return []

  const props = Array.isArray(properties) ? properties : [properties]

  return filterUnique(array, (item) => {
    return props.map((prop) => item[prop]).join('|')
  })
}

/**
 * Find item in array by property value
 * @param {Array} array - Array to search
 * @param {string} property - Property name to search by
 * @param {any} value - Value to search for
 * @returns {any|undefined} - Found item or undefined
 */
export const findByProperty = (array, property, value) => {
  if (!Array.isArray(array)) return undefined

  return array.find((item) => item && item[property] === value)
}

/**
 * Find all items in array by property value
 * @param {Array} array - Array to search
 * @param {string} property - Property name to search by
 * @param {any} value - Value to search for
 * @returns {Array} - Array of found items
 */
export const findAllByProperty = (array, property, value) => {
  if (!Array.isArray(array)) return []

  return array.filter((item) => item && item[property] === value)
}

/**
 * Find index of item in array by property value
 * @param {Array} array - Array to search
 * @param {string} property - Property name to search by
 * @param {any} value - Value to search for
 * @returns {number} - Index of found item or -1 if not found
 */
export const findIndexByProperty = (array, property, value) => {
  if (!Array.isArray(array)) return -1

  return array.findIndex((item) => item && item[property] === value)
}

/**
 * Group array items by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function to generate group key for each item
 * @returns {Object} - Object with grouped items
 */
export const groupBy = (array, keyFn) => {
  if (!Array.isArray(array)) return {}

  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {})
}

/**
 * Group array items by object property
 * @param {Array} array - Array of objects to group
 * @param {string} property - Property name to group by
 * @returns {Object} - Object with grouped items
 */
export const groupByProperty = (array, property) => {
  return groupBy(array, (item) => item && item[property])
}

/**
 * Sort array by property value
 * @param {Array} array - Array to sort
 * @param {string} property - Property name to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} - New sorted array
 */
export const sortByProperty = (array, property, direction = 'asc') => {
  if (!Array.isArray(array)) return []

  const sortedArray = [...array]
  sortedArray.sort((a, b) => {
    const aVal = a && a[property]
    const bVal = b && b[property]

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  return sortedArray
}

/**
 * Get a subset of array items
 * @param {Array} array - Array to slice
 * @param {number} start - Start index
 * @param {number} count - Number of items to take
 * @returns {Array} - Subset of array items
 */
export const takeItems = (array, start = 0, count) => {
  if (!Array.isArray(array)) return []

  const endIndex = count !== undefined ? start + count : undefined
  return array.slice(start, endIndex)
}

/**
 * Check if array contains an item with specific property value
 * @param {Array} array - Array to check
 * @param {string} property - Property name to check
 * @param {any} value - Value to check for
 * @returns {boolean} - True if array contains item with property value
 */
export const containsItemWithProperty = (array, property, value) => {
  if (!Array.isArray(array)) return false

  return array.some((item) => item && item[property] === value)
}

/**
 * Count items in array that match a condition
 * @param {Array} array - Array to count
 * @param {Function} conditionFn - Function that returns true for items to count
 * @returns {number} - Count of matching items
 */
export const countWhere = (array, conditionFn) => {
  if (!Array.isArray(array)) return 0

  return array.filter(conditionFn).length
}

/**
 * Get the difference between two arrays (items in first array but not in second)
 * @param {Array} array1 - First array
 * @param {Array} array2 - Second array
 * @param {Function} keyFn - Function to generate comparison key
 * @returns {Array} - Items that are in array1 but not in array2
 */
export const arrayDifference = (array1, array2, keyFn = (item) => item) => {
  if (!Array.isArray(array1)) return []
  if (!Array.isArray(array2)) return [...array1]

  const set2 = new Set(array2.map(keyFn))
  return array1.filter((item) => !set2.has(keyFn(item)))
}

/**
 * Get the intersection of two arrays (items that exist in both arrays)
 * @param {Array} array1 - First array
 * @param {Array} array2 - Second array
 * @param {Function} keyFn - Function to generate comparison key
 * @returns {Array} - Items that exist in both arrays
 */
export const arrayIntersection = (array1, array2, keyFn = (item) => item) => {
  if (!Array.isArray(array1) || !Array.isArray(array2)) return []

  const set2 = new Set(array2.map(keyFn))
  return array1.filter((item) => set2.has(keyFn(item)))
}

/**
 * Flatten nested arrays to a single level
 * @param {Array} array - Array that may contain nested arrays
 * @param {boolean} deep - Whether to flatten recursively (default: false)
 * @returns {Array} - Flattened array
 */
export const flattenArray = (array, deep = false) => {
  if (!Array.isArray(array)) return []

  return deep ? array.flat(Infinity) : array.flat()
}

/**
 * Chunk array into smaller arrays of specified size
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array} - Array of chunked arrays
 */
export const chunkArray = (array, size) => {
  if (!Array.isArray(array) || size <= 0) return []

  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
