import { Config } from '@pabra/tongue-common';
// import { parse } from '@typescript-eslint/parser';
import {
  parse,
  // AST_NODE_TYPES,
  // AST_TOKEN_TYPES,
  TSESTree,
} from '@typescript-eslint/typescript-estree'; // eslint-disable-line node/no-extraneous-import
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join } from 'path';
// AST_NODE_TYPES.BlockStatement;
// AST_TOKEN_TYPES.Statement;
// TSESTree.Satement

// const relevantImports = ['@pabra/tongue-translate', '@pabra/tongue-react'];
const tongueImports = {
  '@pabra/tongue-translate': {
    relevantExports: {
      t: ['key', 'args?'],
      translate: ['lang', 'key', 'args?'],
    },
  },
  '@pabra/tongue-react': {
    relevantExports: {
      translate: ['lang', 'key', 'args?'],
      useTranslate: [],
      Translate: [],
    },
  },
} as const;

const relevantExt = ['.js', '.jsx', '.ts', '.tsx'];
const ignoreExt = ['.d.ts'];
const ignoreDirNames = ['node_modules'];
const getRelevantFiles = (dir: string): string[] => {
  const dirEntries = readdirSync(dir).map(name => {
    const fullPath = join(dir, name);
    const statData = statSync(fullPath);

    return { name, fullPath, statData } as const;
  });

  return [
    ...dirEntries
      .filter(({ name, fullPath, statData }) => {
        const ext = extname(fullPath);
        return (
          statData.isFile() &&
          !name.startsWith('.') &&
          relevantExt.includes(ext) &&
          !ignoreExt.includes(ext)
        );
      })
      .map(({ fullPath }) => fullPath),

    ...dirEntries
      .filter(
        ({ name, statData }) =>
          statData.isDirectory() &&
          !name.startsWith('.') &&
          !ignoreDirNames.includes(name),
      )
      .map(({ fullPath }) => getRelevantFiles(fullPath))
      .reduce<string[]>((acc, curr) => [...acc, ...curr], []),
  ];
};

const getAst = (file: string) =>
  parse(readFileSync(file, 'utf-8'), {
    jsx: true,
    loc: true,
    range: true,
    // tokens: true,
  }).body;

// const filterStatements = (
//   testFn: (statement: TSESTree.Statement) => boolean,
//   statements: TSESTree.Statement[],
// ) => statements.filter(testFn);

const isImportDeclaration = (
  statement: TSESTree.Statement,
): statement is TSESTree.ImportDeclaration =>
  statement.type === 'ImportDeclaration' &&
  statement.importKind === 'value' &&
  statement.source.type === 'Literal';

const relevantImports = Object.keys(tongueImports);

const isRelevantImport = (
  statement: TSESTree.ImportDeclaration,
): statement is TSESTree.ImportDeclaration =>
  typeof statement.source.value === 'string' &&
  relevantImports.includes(statement.source.value) &&
  statement.specifiers.some(
    specifier => specifier.type === 'ImportDefaultSpecifier',
  );

const shapeImport = (file: string, statement: TSESTree.ImportDeclaration) => {
  const defaultSpecifier = statement.specifiers.find(
    specifier => specifier.type === 'ImportDefaultSpecifier',
  );

  if (defaultSpecifier === undefined) {
    throw new Error('no ImportDefaultSpecifier');
  }

  return {
    file,
    import: statement.source.value,
    name: defaultSpecifier.local.name,
    range: statement.range,
    loc: statement.loc,
  };
};

const findTongueImports = (
  // relevantFiles: string[],
  asTrees: ProjectAsTrees,
): ReturnType<typeof shapeImport>[] => {
  console.log('relevantImports:', relevantImports); // TODO: remove DEBUG
  const list = asTrees.reduce<ReturnType<typeof shapeImport>[]>(
    (acc, { file, ast }) => {
      return [
        ...acc,
        ...ast
          .filter(isImportDeclaration)
          .filter(isRelevantImport)
          .map(statement => shapeImport(file, statement)),
      ];
    },
    [],
  );

  console.log('list: %o', list); // TODO: remove DEBUG
  return list;
};

const findInitailizedTongue = (
  asTrees: ProjectAsTrees,
  declarationName: string,
) => {};

type ProjectAsTrees = {
  file: string;
  ast: TSESTree.Statement[];
}[];

const main = (config: Config): void => {
  const relevantFiles = getRelevantFiles(join(config.srcDir, '..'));
  const relevantAsTrees: ProjectAsTrees = relevantFiles.map(file => ({
    file,
    ast: getAst(file),
  }));
  const tongueImporters = findTongueImports(relevantAsTrees);
  const tongueImportFiles = tongueImporters.map(importer => importer.file);
  console.log('tongueImporters: %o', tongueImporters); // TODO: remove DEBUG
  const tongueInitializers = findInitailizedTongue(
    relevantAsTrees.filter(asTree => tongueImportFiles.includes(asTree.file)),
  );
};

export { main };
