import {
  null as srNull,
  partial as srPartial,
  record as srRecord,
  string as srString,
  stringIndex as srStringIndex,
  union as srUnion,
} from 'simple-runtypes';

export const validArgExp = /[a-zA-Z][a-zA-Z0-9_]*/;
export const fullArgExp = new RegExp('^' + validArgExp.source + '$');

export const entriesFile = srStringIndex(
  srPartial(
    srRecord({
      hint: srString(),
      args: srStringIndex(srString()),
    }),
  ),
);

export const translationFile = srStringIndex(srUnion(srNull(), srString()));

const config = srRecord({
  entriesFile: srString(),
  translationsFiles: srStringIndex(srString()),
  srcDir: srString(),
});
export const configFile = srPartial(config);

export type EntriesFile = ReturnType<typeof entriesFile>;
export type TranslationFile = ReturnType<typeof translationFile>;
export type Config = ReturnType<typeof config>;
// export type ConfigFile = Static<typeof configFile>;
