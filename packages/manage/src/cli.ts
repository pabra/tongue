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
  process.stdout.write(
    `usage ${basename(process.argv[1])} [options]

    Options:
      -h, --help        show this help
      -v, --version     show version
      -c <file>, --config-file=<file>
                        path to the config file
      -s, --sort-and-clean
                        just sort and clean entry and translation files
      -d entry-name, --delete-entry=<entry-name>
                        delete entry "entry-name" from entry and translations files
      -r --old old-name --new new-name, --rename-entry --old=old-name --new=new-name
                        rename "old-name" entry to "new-name"
    \n`,
  );
};

const showVersion = (): void => {
  let packageJson: any = {};

  /* eslint-disable node/no-missing-require, @typescript-eslint/no-var-requires */
  try {
    packageJson = require('../package.json');
  } catch (err1) {
    if (err1.code !== 'MODULE_NOT_FOUND') {
      throw err1;
    }
    try {
      packageJson = require('../../package.json');
    } catch (err2) {
      if (err2.code !== 'MODULE_NOT_FOUND') {
        throw err2;
      }
    }
  }
  /* eslint-enable node/no-missing-require, @typescript-eslint/no-var-requires */
  process.stdout.write(`${packageJson.name} version: ${packageJson.version}\n`);
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
    }
  } catch (err) {
    console.log(String(err));
  }
}
