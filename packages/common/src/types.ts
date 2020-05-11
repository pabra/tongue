import { Dictionary, Partial, Record, Static, String } from 'runtypes';

export const validArgExp = /[a-zA-Z][a-zA-Z0-9_]*/;
export const fullArgExp = new RegExp('^' + validArgExp.source + '$');

export const entriesFile = Dictionary(
  Partial({
    hint: String,
    args: Dictionary(String, 'string'),
  }),
  'string',
);

const configContent = { entriesFile: String, srcFiles: String };
const config = Record(configContent);
export const configFile = Partial(configContent);

export type EntriesFile = Static<typeof entriesFile>;
export type Config = Static<typeof config>;
// export type ConfigFile = Static<typeof configFile>;
