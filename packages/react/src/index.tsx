import type { EntriesFile } from '@pabra/tongue-common';
import tongueInit from '@pabra/tongue-translate';
import type { AllTranslations, Args, TOverload } from '@pabra/tongue-translate';
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

type Language<E extends EntriesFile, T extends AllTranslations<E>> = [
  keyof T,
  (arg: keyof T | ((lang: keyof T) => keyof T)) => void,
];

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
  translate: typeof tongue.translate;
  useLanguage: () => Language<Entries, Translations>;
  useSetLanguage: () => SetLanguage<Entries, Translations>;
  useTranslate: () => UseTranslate<Entries, Translations>;
  Translate: TranslateOverload<Entries>;
} => {
  const tongue = tongueInit(entries, translations);
  const useReactLanguage = makeStore(tongue.getLanguage());

  const useLanguage = (): Language<Entries, Translations> => useReactLanguage();

  const useSetLanguage = (): SetLanguage<Entries, Translations> =>
    useReactLanguage('justSetter');

  const useTranslate = (): UseTranslate<Entries, Translations> => {
    const [language, setLanguage] = useReactLanguage();
    const translate: TOverload<Entries> = <E extends keyof Entries>(
      entry: E,
      args?: any,
    ) => tongue.translate(language, entry, args);

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

  return {
    translate: tongue.translate,
    useLanguage,
    useSetLanguage,
    useTranslate,
    Translate,
  };
};

export default init;
