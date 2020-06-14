import * as rt from 'runtypes';

export const validArgExp = /[a-zA-Z][a-zA-Z0-9_]*/;
export const fullArgExp = new RegExp('^' + validArgExp.source + '$');

export const entriesFile = rt.Dictionary(
  rt.Partial({
    hint: rt.String,
    args: rt.Dictionary(rt.String, 'string'),
  }),
  'string',
);

export const translationFile = rt.Dictionary(
  rt.Union(rt.Null, rt.String),
  'string',
);

const configContent = {
  entriesFile: rt.String,
  translationsFiles: rt.Dictionary(rt.String),
  srcDir: rt.String,
};
const config = rt.Record(configContent);
export const configFile = rt.Partial(configContent);

export type EntriesFile = rt.Static<typeof entriesFile>;
export type TranslationFile = rt.Static<typeof translationFile>;
export type Config = rt.Static<typeof config>;
// export type ConfigFile = Static<typeof configFile>;
