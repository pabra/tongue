type Key = string | number | symbol;

export const assertNever = (x: never): never => {
  throw new Error('Unexpected object: ' + x);
};

export const isKeyof = <T extends Record<Key, any>>(
  obj: T,
  key: Key,
): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);
