export const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null
}

export const isString = (value: any): boolean => {
  return typeof value === 'string'
}
export const isNumber = (value: any): boolean => {
  return typeof value === 'number'
}

export const isFunction = (value: any): boolean => {
  return typeof value === 'function'
}
export const isArray = Array.isArray;
export const assign = Object.assign;