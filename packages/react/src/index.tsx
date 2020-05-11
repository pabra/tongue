import type { EntriesFile } from '@tongue/common';
import localixInit from '@tongue/translate';
import type { AllTranslations, Args, TOverload } from '@tongue/translate';
import React from 'react';
import makeStore from 'react-hooksack';

type TranslateOverload<Entries extends EntriesFile> = {
  <E extends keyof Entries, A = Args<Entries, E>>({
    entry,
  }: {
    entry: E & [A] extends [never] ? E : never;
  }): JSX.Element;
  <E extends keyof Entries, A extends Args<Entries, E>>({
    entry,
    args,
  }: {
    entry: E;
    args: A;
  }): JSX.Element;
};

type SetLanguage<E extends EntriesFile, T extends AllTranslations<E>> = (
  arg: keyof T | ((lang: keyof T) => keyof T),
) => void;

type UseTranslate<E extends EntriesFile, T extends AllTranslations<E>> = {
  language: keyof T;
  setLanguage: SetLanguage<E, T>;
  translate: TOverload<E>;
};

const init = <
  Entries extends EntriesFile,
  Translations extends AllTranslations<Entries>
>(
  entries: Entries,
  translations: Translations,
): {
  useSetLanguage: () => SetLanguage<Entries, Translations>;
  useTranslate: () => UseTranslate<Entries, Translations>;
  Translate: TranslateOverload<Entries>;
} => {
  const localix = localixInit(entries, translations);
  const useReactLanguage = makeStore(localix.getLanguage());

  const useSetLanguage = (): SetLanguage<Entries, Translations> =>
    useReactLanguage('justSetter');
  const useTranslate = (): UseTranslate<Entries, Translations> => {
    const [language, setLanguage] = useReactLanguage();
    const translate: TOverload<Entries> = <E extends keyof Entries>(
      entry: E,
      args?: any,
    ) => localix.translate(language, entry, args);

    return { language, setLanguage, translate };
  };

  const Translate: TranslateOverload<Entries> = <E extends keyof Entries>({
    entry,
    args,
  }: {
    entry: E;
    args?: any;
  }) => {
    const { translate: t } = useTranslate();
    return <>{t(entry, args)}</>;
  };

  return { useSetLanguage, useTranslate, Translate };
};

export default init;
