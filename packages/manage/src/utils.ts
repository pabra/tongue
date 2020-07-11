import { readFileSync } from 'fs';
import { join } from 'path';

type StringObject = Record<string, any>;

const getObjectSorted = (o: StringObject): StringObject =>
  Object.keys(o)
    .sort()
    .reduce<StringObject>((acc, key) => {
      acc[key] = o[key];
      return acc;
    }, {});

const getPackageJson = (dir: string): StringObject => {
  const path = join(dir, 'package.json');

  return JSON.parse(readFileSync(path, 'utf-8'));
};

const getOwnPackageJson = (): StringObject => {
  try {
    // while development, __dirname is src/ -> package.json must be one dir up
    return getPackageJson(join(__dirname, '..'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  try {
    // after build, __dirname is dist/cjs/ -> package.json must be two dirs up
    return getPackageJson(join(__dirname, '..', '..'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return {};
};

const getOwnVersionString = (): string => {
  const { name, version } = getOwnPackageJson();
  return `${name} version: ${version}`;
};

export { getObjectSorted, getOwnPackageJson, getOwnVersionString };
