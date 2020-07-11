#!/usr/bin/env node

import arg from 'arg';
import { basename } from 'path';
import {
  cleanTongueFiles,
  getConfig,
  loadTongueFiles,
  removeTongueEntry,
  renameTongueEntry,
  writeTongeFiles,
} from './manage';
import {
  // findTongueImports,
  main,
} from './parse';
import { getOwnPackageJson, getOwnVersionString } from './utils';

const args = arg({
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--config-file': String,
  '--sort-and-clean': Boolean,
  '--delete-entry': String,
  '--rename': Boolean,
  '--old': String,
  '--new': String,

  // Aliases
  '-h': '--help',
  '-v': '--version',
  '-c': '--config-file',
  '-s': '--sort-and-clean',
  '-d': '--delete-entry',
  '-r': '--rename',
});

const showHelp = (): void => {
  const { description } = getOwnPackageJson();
  const help = [
    getOwnVersionString(),
    description,
    '',
    'USAGE:',
    `    ${basename(process.argv[1])} [OPTIONS]`,
    '',
    'OPTIONS:',
    '    -h, --help',
    '        show this help',
    '',
    '    -v, --version',
    '        show version',
    '',
    '    -c <FILE_NAME>, --config=<FILE_NAME>',
    '        path to the config file',
    '',
    '    -s, --sort-and-clean',
    '        just sort and clean entry and translation files',
    '',
    '    -d <ENTRY_NAME>, --delete-entry=<ENTRY_NAME>',
    '        delete entry "ENTRY_NAME" from entry and translations files',
    '',
    '    -r --old <OLD_NAME> --new <NEW_NAME>, --rename-entry --old=<OLD_NAME> --new=<NEW_NAME>',
    '        rename "OLD_NAME" entry to "NEW_NAME"',
  ].join('\n');

  process.stdout.write(`${help}\n`);
};

const showVersion = (): void => {
  process.stdout.write(`${getOwnVersionString()}\n`);
};

if (args['--help']) {
  showHelp();
} else if (args['--version']) {
  showVersion();
} else {
  try {
    const extraArgs = args._;
    if (extraArgs.length > 0) {
      showHelp();
      throw new Error(
        `did not expect extra arguments: ${extraArgs.join(', ')}`,
      );
    }

    const config = getConfig(args['--config-file']);
    const tongueFiles = loadTongueFiles(config);

    if (args['--sort-and-clean']) {
      const cleandFiles = cleanTongueFiles(tongueFiles);
      writeTongeFiles(cleandFiles);
    } else if (args['--delete-entry']) {
      const deleteArgs = args['--delete-entry'];
      const reducedFiles = removeTongueEntry(tongueFiles, deleteArgs);
      writeTongeFiles(reducedFiles);
    } else if (args['--rename']) {
      const oldEntry = args['--old'];
      const newEntry = args['--new'];

      if (!oldEntry || !newEntry) {
        showHelp();
        throw new Error('rename requires --old and --new agruments');
      }

      const renamedFiles = renameTongueEntry(tongueFiles, oldEntry, newEntry);
      writeTongeFiles(renamedFiles);
    } else {
      // TODO: remove block
      // findTongueImports(config);
      main(config);
    }
  } catch (err) {
    console.log(String(err));
  }
}
