/**
 * Object utilities for common object manipulation operations
 * Centralizes object property access, manipulation, and validation logic
 */

/**
 * Safely get nested property value from object using dot notation
 * @param {Object} obj - Object to get property from
 * @param {string} path - Dot-separated path to property (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value to return if property not found
 * @returns {any} - Property value or default value
 */
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object' || !path) {
    return defaultValue
  }

  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue
  }, obj)
}

/**
 * Safely set nested property value in object using dot notation
 * @param {Object} obj - Object to set property in
 * @param {string} path - Dot-separated path to property
 * @param {any} value - Value to set
 * @returns {Object} - Modified object (mutates original)
 */
export const setNestedProperty = (obj, path, value) => {
  if (!obj || typeof obj !== 'object' || !path) {
    return obj
  }

  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return obj
}

/**
 * Check if object has a specific property (including nested)
 * @param {Object} obj - Object to check
 * @param {string} path - Dot-separated path to property
 * @returns {boolean} - True if property exists
 */
export const hasNestedProperty = (obj, path) => {
  if (!obj || typeof obj !== 'object' || !path) {
    return false
  }

  return (
    path.split('.').reduce((current, key) => {
      return current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : false
    }, obj) !== false
  )
}

/**
 * Create a deep copy of an object
 * @param {any} obj - Object to clone
 * @returns {any} - Deep copy of the object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item))
  }

  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }

  return cloned
}

/**
 * Merge two or more objects deeply
 * @param {Object} target - Target object to merge into
 * @param {...Object} sources - Source objects to merge from
 * @returns {Object} - Merged object
 */
export const deepMerge = (target, ...sources) => {
  if (!target || typeof target !== 'object') {
    return {}
  }

  sources.forEach((source) => {
    if (source && typeof source === 'object') {
      Object.keys(source).forEach((key) => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {}
          }
          deepMerge(target[key], source[key])
        } else {
          target[key] = source[key]
        }
      })
    }
  })

  return target
}

/**
 * Pick specific properties from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Array of property names to pick
 * @returns {Object} - New object with only picked properties
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) {
    return {}
  }

  const result = {}
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  })

  return result
}

/**
 * Omit specific properties from an object
 * @param {Object} obj - Source object
 * @param {Array<string>} keys - Array of property names to omit
 * @returns {Object} - New object without omitted properties
 */
export const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object' || !Array.isArray(keys)) {
    return { ...obj }
  }

  const result = { ...obj }
  keys.forEach((key) => {
    delete result[key]
  })

  return result
}

/**
 * Check if two objects are deeply equal
 * @param {any} obj1 - First object to compare
 * @param {any} obj2 - Second object to compare
 * @returns {boolean} - True if objects are deeply equal
 */
export const isDeepEqual = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true
  }

  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}

/**
 * Check if object is empty (has no own properties)
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if object is empty
 */
export const isEmpty = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return true
  }

  return Object.keys(obj).length === 0
}

/**
 * Get all property paths from an object (flattened)
 * @param {Object} obj - Object to get paths from
 * @param {string} prefix - Prefix for paths (used for recursion)
 * @returns {Array<string>} - Array of property paths
 */
export const getPropertyPaths = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') {
    return []
  }

  const paths = []

  Object.keys(obj).forEach((key) => {
    const currentPath = prefix ? `${prefix}.${key}` : key
    paths.push(currentPath)

    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      paths.push(...getPropertyPaths(obj[key], currentPath))
    }
  })

  return paths
}

/**
 * Transform object properties using a mapping function
 * @param {Object} obj - Object to transform
 * @param {Function} transformFn - Function to transform each property (key, value) => [newKey, newValue]
 * @returns {Object} - Transformed object
 */
export const transformObject = (obj, transformFn) => {
  if (!obj || typeof obj !== 'object' || typeof transformFn !== 'function') {
    return {}
  }

  const result = {}

  Object.entries(obj).forEach(([key, value]) => {
    const [newKey, newValue] = transformFn(key, value)
    if (newKey !== undefined) {
      result[newKey] = newValue
    }
  })

  return result
}

/**
 * Safely convert Date objects to ISO strings in an object (useful for serialization)
 * @param {Object} obj - Object that may contain Date objects
 * @returns {Object} - Object with Date objects converted to ISO strings
 */
export const serializeDates = (obj) => {
  if (!obj) return obj

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDates(item))
  }

  if (typeof obj === 'object') {
    const serialized = {}
    Object.keys(obj).forEach((key) => {
      serialized[key] = serializeDates(obj[key])
    })
    return serialized
  }

  return obj
}

/**
 * Safely convert ISO strings back to Date objects in an object
 * @param {Object} obj - Object that may contain ISO date strings
 * @param {Array<string>} dateFields - Array of field names that should be converted to Date objects
 * @returns {Object} - Object with ISO strings converted to Date objects
 */
export const deserializeDates = (obj, dateFields = []) => {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => deserializeDates(item, dateFields))
  }

  const deserialized = { ...obj }
  dateFields.forEach((field) => {
    if (deserialized[field] && typeof deserialized[field] === 'string') {
      deserialized[field] = new Date(deserialized[field])
    }
  })

  return deserialized
}
