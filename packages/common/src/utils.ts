export const isKeyof = <T extends {}>(
  obj: T,
  key: string | number | symbol,
): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);

// export const isStringKeyof = <T extends Record<string, unknown>>(
//   obj: T,
//   key: string|number|symbol,
// ): key is keyof T => isKeyof(obj, key);
