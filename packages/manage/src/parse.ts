import { Config } from '@pabra/tongue-common';
// import { parse } from '@typescript-eslint/parser';
import {
  parse,
  simpleTraverse,
  TSESTree,
} from '@typescript-eslint/typescript-estree'; // eslint-disable-line node/no-extraneous-import
import { readdirSync, readFileSync, statSync } from 'fs';
import { extname, join } from 'path';
// AST_NODE_TYPES.BlockStatement;
// AST_TOKEN_TYPES.Statement;
// TSESTree.Satement

// const relevantImports = ['@pabra/tongue-translate', '@pabra/tongue-react'];
// const tongueImports = {
//   '@pabra/tongue-translate': {
//     relevantExports: {
//       t: ['key', 'args?'],
//       translate: ['lang', 'key', 'args?'],
//     },
//   },
//   '@pabra/tongue-react': {
//     relevantExports: {
//       translate: ['lang', 'key', 'args?'],
//       useTranslate: [],
//       Translate: [],
//     },
//   },
// } as const;
// type IdentifierAndHandler = Readonly<{
//   identifier: (node: TSESTree.Node) => node is TSESTree.Node;
//   handler: (
//     context: TSESTree.Node,
//     node: TSESTree.Node,
//     parent: TSESTree.Node | undefined,
//   ) => void;
// }>;
// type IdentifiersAndHandlers = Readonly<{
//   [name: string]: IdentifierAndHandler;
// }>;
type NodeHandler = (
  context: TSESTree.Node,
  node: TSESTree.Node,
  parent: TSESTree.Node | undefined,
) => TSESTree.Node | TSESTree.Node[] | void;
// type NodeHandlers = { [name: string]: NodeHandler };
const nodeHandlers = {
  importTongueTranslate: (context: TSESTree.Node, node: TSESTree.Node) => {
    if (node.type !== 'ImportDeclaration') {
      return;
    }
    if (node.source.value !== '@pabra/tongue-translate') {
      return;
    }
    console.log(context, node);
    debugger;
    const importedNodes = myTraverse(nodeHandlers.defaultImportTranslate, node);
    if (importedNodes.length !== 1) {
      throw new Error('expected exactly 1 node');
    }
    debugger;
    myTraverse(nodeHandlers.usageTranslate, context);
    return nodes[0];
  },
  defaultImportTranslate: (
    context: TSESTree.Node,
    node: TSESTree.Node,
    parent: TSESTree.Node | undefined,
  ) => {
    if (node.type !== 'ImportDefaultSpecifier') {
      return;
    }
    console.log('context: %o', context);
    console.log('node: %o', node);
    console.log('parent: %o', parent);
    debugger;
    return node;
  },
  usageTranslate: (
    context: TSESTree.Node,
    node: TSESTree.Node,
    parent: TSESTree.Node | undefined,
  ) => {},
  separateCallUsage: () => {},
  getSeparateCallUsageOfNode: (name: string) => {},
} as const;

// const tongueImports = { '@pabra/tongue-translate': { undefined: 1 } } as const;

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

const myTraverse = (handler: NodeHandler, traverseNode: TSESTree.Node) => {
  const nodes: TSESTree.Node[] = [];
  const enter = (node: TSESTree.Node, parent: TSESTree.Node | undefined) => {
    const returnValue = handler(traverseNode, node, parent);

    if (returnValue === undefined) {
      return;
    } else if (Array.isArray(returnValue)) {
      returnValue.forEach(value => nodes.push(value));
    } else {
      nodes.push(returnValue);
    }
  };

  simpleTraverse(traverseNode, { enter });

  return nodes;
};

const getAst = (
  // tsConfigPath: string,
  file: string,
) => {
  const code = readFileSync(file, 'utf-8');
  const ast1 = parse(code, {
    jsx: true,
    loc: true,
    range: true,
    // tokens: true,
  });
  return ast1;
  // const ast2 = parseAndGenerateServices(code, {
  //   errorOnTypeScriptSyntacticAndSemanticIssues: true,
  //   project: tsConfigPath,
  //   filePath: file,
  // });
  // simpleTraverse(ast1, {
  //   enter: (node: TSESTree.Node, parent: TSESTree.Node | undefined) => {
  //     console.log('node: %o', node);
  //     console.log('parent: %o', parent);
  //     debugger;
  //     switch (node.type) {
  //       case 'ArrayExpression':
  //         console.log('type: %o', node.type);
  //         break;
  //
  //       default:
  //         throw new Error();
  //     }
  //   },
  // });
  // ast2.services.program;
  // return { ast1, ast2 };
};

// const filterStatements = (
//   testFn: (statement: TSESTree.Statement) => boolean,
//   statements: TSESTree.Statement[],
// ) => statements.filter(testFn);

// const isImportDeclaration = (
//   statement: TSESTree.Statement,
// ): statement is TSESTree.ImportDeclaration =>
//   statement.type === 'ImportDeclaration' &&
//   statement.importKind === 'value' &&
//   statement.source.type === 'Literal';

// const relevantImports = Object.keys(tongueImports);

// const isRelevantImport = (
//   statement: TSESTree.ImportDeclaration,
// ): statement is TSESTree.ImportDeclaration =>
//   typeof statement.source.value === 'string' &&
//   relevantImports.includes(statement.source.value) &&
//   statement.specifiers.some(
//     specifier => specifier.type === 'ImportDefaultSpecifier',
//   );

// const shapeImport = (file: string, statement: TSESTree.ImportDeclaration) => {
//   const defaultSpecifier = statement.specifiers.find(
//     specifier => specifier.type === 'ImportDefaultSpecifier',
//   );
//
//   if (defaultSpecifier === undefined) {
//     throw new Error('no ImportDefaultSpecifier');
//   }
//
//   return {
//     file,
//     import: statement.source.value,
//     name: defaultSpecifier.local.name,
//     range: statement.range,
//     loc: statement.loc,
//   };
// };

// const findTongueImports = (
//   // relevantFiles: string[],
//   asTrees: ProjectAsTrees,
// ): ReturnType<typeof shapeImport>[] => {
//   console.log('relevantImports:', relevantImports); // TODO: remove DEBUG
//   const list = asTrees.reduce<ReturnType<typeof shapeImport>[]>(
//     (acc, { file, ast }) => {
//       return [
//         ...acc,
//         ...ast
//           .filter(isImportDeclaration)
//           .filter(isRelevantImport)
//           .map(statement => shapeImport(file, statement)),
//       ];
//     },
//     [],
//   );
//
//   console.log('list: %o', list); // TODO: remove DEBUG
//   return list;
// };

// const findInitailizedTongue = (
//   asTrees: ProjectAsTrees,
//   declarationName: string,
// ) => {};

// type ProjectAsTrees = {
//   file: string;
//   ast: TSESTree.Statement[];
// }[];

const main = (config: Config): void => {
  // const tsConfigFilePath = join(config.srcDir, '..', 'tsconfig.json');
  const relevantFiles = getRelevantFiles(join(config.srcDir, '..'));
  const relevantAsTrees = relevantFiles.map(file => ({
    file,
    ast: getAst(
      // tsConfigFilePath,
      file,
    ),
  }));
  console.log('relevantAsTrees: %o', relevantAsTrees); // TODO: remove DEBUG
  relevantAsTrees.forEach(asTree =>
    myTraverse(nodeHandlers.importTongueTranslate, asTree.ast),
  );
  debugger;
  // const tongueImporters = findTongueImports(relevantAsTrees);
  // const tongueImportFiles = tongueImporters.map(importer => importer.file);
  // console.log('tongueImporters: %o', tongueImporters); // TODO: remove DEBUG
  // console.log('tongueImportFiles: %o', tongueImportFiles); // TODO: remove DEBUG
  // const tongueInitializers = findInitailizedTongue(
  //   relevantAsTrees.filter(asTree => tongueImportFiles.includes(asTree.file)),
  // );
};

export { main };
