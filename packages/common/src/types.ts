import {
  dictionary as srDictionary,
  nullOr as srNullOr,
  optional as srOptional,
  partial as srPartial,
  record as srRecord,
  string as srString,
} from 'simple-runtypes';

export const validArgExp = /[a-zA-Z][a-zA-Z0-9_]*/;
export const fullArgExp = new RegExp('^' + validArgExp.source + '$');

export const entriesFile = srDictionary(
  srString(),
  srRecord({
    hint: srOptional(srString()),
    args: srOptional(srDictionary(srString(), srString())),
  }),
);

export const translationFile = srDictionary(srString(), srNullOr(srString()));

const config = srRecord({
  entriesFile: srString(),
  translationsFiles: srDictionary(srString(), srString()),
  srcDir: srString(),
});
export const configFile = srPartial(config);

export type EntriesFile = ReturnType<typeof entriesFile>;
export type TranslationFile = ReturnType<typeof translationFile>;
export type Config = ReturnType<typeof config>;
// export type ConfigFile = Static<typeof configFile>;
