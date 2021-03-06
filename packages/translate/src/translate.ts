import {
  EntriesFile,
  isKeyof,
  TranslationFile,
  validArgExp,
} from '@pabra/tongue-common';

export type Args<
  Entries extends EntriesFile,
  Entry extends keyof Entries,
  X = 'args'
> = X extends keyof Entries[Entry]
  ? { [E in keyof Entries[Entry][X]]: string }
  : never;

type Translation<Entries extends EntriesFile> = {
  [E in keyof Partial<Entries>]: TranslationFile[string];
};

export type AllTranslations<Entries extends EntriesFile> = Record<
  string,
  Translation<Entries>
>;

type NewTranslateOverload<
  Entries extends EntriesFile,
  Translations extends AllTranslations<Entries>
> = {
  // new entry with args
  <
    L extends keyof Translations,
    E extends string,
    A extends Args<EntriesFile, E>
  >(
    lang: L,
    entry: E,
    args: A,
  ): string;

  // new entry without args
  <L extends keyof Translations, E extends string>(lang: L, entry: E): string;
};

type TranslateOverload<
  Entries extends EntriesFile,
  Translations extends AllTranslations<Entries>
> = {
  newEntry: NewTranslateOverload<Entries, Translations>;

  // entry with args
  <
    L extends keyof Translations,
    E extends keyof Entries,
    A extends Args<Entries, E>
  >(
    lang: L,
    entry: E,
    args: A,
  ): string;

  // entry without args
  <L extends keyof Translations, E extends keyof Entries, A = Args<Entries, E>>(
    lang: L,
    entry: E & [A] extends [never] ? E : never,
  ): string;
};

type NewTOverload = {
  // new entry with args
  <E extends string, A extends Args<EntriesFile, E>>(entry: E, args: A): string;

  // new entry without args
  <E extends string>(entry: E): string;
};

export type TOverload<Entries extends EntriesFile> = {
  newEntry: NewTOverload;

  // entry wth args
  <E extends keyof Entries, A extends Args<Entries, E>>(
    entry: E,
    args: A,
  ): string;

  // entry without args
  <E extends keyof Entries, A = Args<Entries, E>>(
    entry: E & [A] extends [never] ? E : never,
  ): string;
};

type CurrentLanguage<
  Entries extends EntriesFile,
  Translations extends AllTranslations<Entries>
> = keyof Translations;

const argPlaceholderExp = new RegExp(`{\\s*(${validArgExp.source})\\s*}`, 'g');

const init = <
  Entries extends EntriesFile,
  Translations extends AllTranslations<Entries>
>(
  _entries: Entries,
  translations: Translations,
): {
  translate: TranslateOverload<Entries, Translations>;
  setLanguage: (language: keyof Translations) => void;
  getLanguage: () => CurrentLanguage<Entries, Translations>;
  t: TOverload<Entries>;
} => {
  const languages: (keyof Translations)[] = Object.keys(translations);

  if (languages.length < 1) {
    throw new Error('at least one translation file is required');
  }

  let language: CurrentLanguage<Entries, Translations> = languages[0];

  const markNotFound = (entry: keyof Entries): string => `__${entry}__`;

  function assertValidLanguage(
    lang: string | number | symbol,
  ): asserts lang is keyof Translations {
    if (!isKeyof(translations, lang)) {
      throw new Error(
        `Unknown language '${String(lang)}'. Expected one of: ${languages.join(
          ', ',
        )}`,
      );
    }
  }

  const setLanguage = (lang: keyof Translations): void => {
    assertValidLanguage(lang);

    language = lang;
  };

  const getLanguage = (): CurrentLanguage<Entries, Translations> => language;

  const translate: TranslateOverload<Entries, Translations> = <
    L extends keyof Translations,
    E extends keyof Entries,
    A extends Args<Entries, E>
  >(
    lang: L,
    entry: E,
    args?: A,
  ) => {
    assertValidLanguage(lang);

    const dict = translations[lang];
    const translation = isKeyof(dict, entry) ? dict[entry] : null;
    const value = translation ?? markNotFound(entry);

    return args
      ? value.replace(argPlaceholderExp, (match, argName) =>
          typeof argName === 'string' && isKeyof(args, argName)
            ? args[argName]
            : match,
        )
      : value;
  };

  translate.newEntry = translate;

  const t: TOverload<Entries> = <E extends keyof Entries>(
    key: E,
    args?: any,
  ): string => translate(language, key, args);

  t.newEntry = t;

  return { translate, setLanguage, getLanguage, t };
};

export default init;
