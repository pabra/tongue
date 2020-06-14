import {
  Config,
  configFile,
  entriesFile,
  EntriesFile,
  fullArgExp,
  isKeyof,
  translationFile,
  TranslationFile,
} from '@pabra/tongue-common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import * as rt from 'runtypes';
import { getObjectSorted } from './utils';

type TongueFiles = {
  entriesFile: { readonly path: string; entries: EntriesFile };
  translationsFiles: {
    [_: string]: { readonly path: string; translations: TranslationFile };
  };
};

const configFileName = '.tonguerc.json';
const defaultConfig: Config = {
  entriesFile: join(__dirname, '..', 'tongue_entries.json'),
  translationsFiles: {},
  srcDir: join(__dirname, '..', 'src'),
};

const findConfig = (dir: string): null | string => {
  const fullPath = join(dir, configFileName);
  const exists = existsSync(fullPath);

  return exists ? fullPath : dir === '/' ? null : findConfig(dirname(dir));
};

const getConfig = (path?: string): Config => {
  const absPath = path && (isAbsolute(path) ? path : join(process.cwd(), path));
  const configFilePath = absPath ?? findConfig(__dirname);
  const configFileContent = configFilePath
    ? getJsonFile(configFilePath, configFile)
    : {};

  return { ...defaultConfig, ...configFileContent };
};

const getBadArgs = (args: Record<string, string>): string[] =>
  Object.keys(args).filter(arg => !fullArgExp.test(arg));

const getJsonFile = <T extends rt.Runtype>(
  path: string,
  runtype: T,
): rt.Static<T> => {
  const content = JSON.parse(readFileSync(path, 'utf-8'));

  return runtype.check(content);
};

export const writeJsonFile = (
  path: string,
  content: Record<string | number, any>,
): void => {
  writeFileSync(path, JSON.stringify(content, null, 2) + '\n', 'utf-8');
};

const loadEntriesFile = (path: string): EntriesFile => {
  const content = getJsonFile(path, entriesFile);

  const badArgsEntries = Object.keys(content).reduce<[string, string[]][]>(
    (acc, key) => {
      const args = content[key].args;

      if (args === undefined) {
        return acc;
      }

      const badArgs = getBadArgs(args);

      if (badArgs.length > 0) {
        acc.push([key, badArgs]);
      }

      return acc;
    },
    [],
  );

  if (badArgsEntries.length > 0) {
    throw new Error(
      `bad args for entries: ${badArgsEntries
        .map(([key, args]) => `${key}: [${args.join(',')}]`)
        .join(', ')}`,
    );
  }

  return content;
};

const loadTongueFiles = (conf: Config): TongueFiles => {
  const { entriesFile: entriesFilePath } = conf;

  return {
    entriesFile: {
      path: entriesFilePath,
      // entries: getJsonFile(entriesFilePath, entriesFile),
      entries: loadEntriesFile(entriesFilePath),
    },
    translationsFiles: Object.entries(conf.translationsFiles).reduce<
      TongueFiles['translationsFiles']
    >((acc, [lang, translationFilePath]) => {
      acc[lang] = {
        path: translationFilePath,
        translations: getJsonFile(translationFilePath, translationFile),
      };
      return acc;
    }, {}),
  };
};

const writeTongeFiles = (tongueFiles: TongueFiles): void => {
  writeJsonFile(tongueFiles.entriesFile.path, tongueFiles.entriesFile.entries);
  for (const { path, translations } of Object.values(
    tongueFiles.translationsFiles,
  )) {
    writeJsonFile(path, translations);
  }
};

const addEntry = (
  entries: EntriesFile,
  newEntry: string,
  hint?: string,
  args?: Record<string, string>,
): EntriesFile => {
  if (isKeyof(entries, newEntry)) {
    throw new Error(`entry ${newEntry} does already exist`);
  }

  const badArgsNames = args ? getBadArgs(args) : [];

  if (badArgsNames.length > 0) {
    throw new Error(`bad arg names: ${badArgsNames.join(',')}`);
  }

  return {
    ...entries,
    [newEntry]: {
      ...(hint ? { hint } : null),
      ...(args ? { args } : null),
    },
  };
};

const removeEntry = (
  entries: EntriesFile,
  toRemoveEntry: string,
): EntriesFile => {
  if (!isKeyof(entries, toRemoveEntry)) {
    throw new Error(`entry ${toRemoveEntry} does not exist`);
  }

  return Object.keys(entries)
    .filter(entry => entry !== toRemoveEntry)
    .reduce<EntriesFile>((acc, entry) => {
      acc[entry] = entries[entry];
      return acc;
    }, {});
};

const addTongueEntry = (
  tongueFiles: TongueFiles,
  newEntry: string,
  hint?: string,
  args?: Record<string, string>,
): TongueFiles => {
  const newEntries = addEntry(
    tongueFiles.entriesFile.entries,
    newEntry,
    hint,
    args,
  );

  return cleanTongueFiles({
    entriesFile: { path: tongueFiles.entriesFile.path, entries: newEntries },
    translationsFiles: tongueFiles.translationsFiles,
  });
};

const removeTongueEntry = (
  tongueFiles: TongueFiles,
  toRemoveEntry: string,
): TongueFiles => {
  const newEntries = removeEntry(
    tongueFiles.entriesFile.entries,
    toRemoveEntry,
  );

  return cleanTongueFiles({
    entriesFile: { path: tongueFiles.entriesFile.path, entries: newEntries },
    translationsFiles: tongueFiles.translationsFiles,
  });
};

const renameTongueEntry = (
  tongueFiles: TongueFiles,
  oldEntry: string,
  newEntry: string,
): TongueFiles => {
  const reducedEntries = removeEntry(tongueFiles.entriesFile.entries, oldEntry);

  const extendedEntries = addEntry(
    reducedEntries,
    newEntry,
    tongueFiles.entriesFile.entries[oldEntry].hint,
    tongueFiles.entriesFile.entries[oldEntry].args,
  );

  const newTranslations = Object.keys(tongueFiles.translationsFiles).reduce<
    TongueFiles['translationsFiles']
  >((acc, lang) => {
    const translationsObj = tongueFiles.translationsFiles[lang];
    const translations = {
      ...translationsObj.translations,
      [newEntry]: translationsObj.translations[oldEntry],
    };

    acc[lang] = {
      path: translationsObj.path,
      translations: translations,
    };

    return acc;
  }, {});

  return cleanTongueFiles({
    entriesFile: {
      path: tongueFiles.entriesFile.path,
      entries: extendedEntries,
    },
    translationsFiles: newTranslations,
  });
};

const cleanTongueFiles = (tongueFiles: TongueFiles): TongueFiles => {
  const languages = Object.keys(tongueFiles.translationsFiles);
  const sortedEntryKeys = Object.keys(tongueFiles.entriesFile.entries).sort();

  const newTongueFiles: TongueFiles = {
    entriesFile: {
      path: tongueFiles.entriesFile.path,
      entries: sortedEntryKeys.reduce<TongueFiles['entriesFile']['entries']>(
        (acc, entry) => {
          const entryObj = tongueFiles.entriesFile.entries[entry];
          acc[entry] = {
            ...(entryObj.args
              ? {
                  args: getObjectSorted(entryObj.args),
                }
              : null),
            ...(entryObj.hint ? { hint: entryObj.hint } : null),
          };

          return acc;
        },
        {},
      ),
    },
    translationsFiles: languages.reduce<TongueFiles['translationsFiles']>(
      (accLang, lang) => {
        const translations = tongueFiles.translationsFiles[lang].translations;

        accLang[lang] = {
          path: tongueFiles.translationsFiles[lang].path,
          translations: sortedEntryKeys.reduce<
            TongueFiles['translationsFiles'][string]['translations']
          >((accEntry, entry) => {
            accEntry[entry] = isKeyof(translations, entry)
              ? translations[entry]
              : null;

            return accEntry;
          }, {}),
        };

        return accLang;
      },
      {},
    ),
  };

  return newTongueFiles;
};

export {
  addTongueEntry,
  cleanTongueFiles,
  getConfig,
  loadTongueFiles,
  removeTongueEntry,
  renameTongueEntry,
  writeTongeFiles,
};
