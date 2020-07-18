import { assertNever, Config } from '@pabra/tongue-common';
// import { parse } from '@typescript-eslint/parser';
import {
  AST_NODE_TYPES,
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

// type NodeHandler = <
//   NodeType extends TSESTree.Node,
//   ReturnType extends TSESTree.Node
// >(
//   context: TSESTree.Node,
//   node: NodeType ,
//   parent: TSESTree.Node | undefined,
// ) => (ReturnType ) | void;

// const identifierForImportDefaultSpecifierFilter = (
//   _context: TSESTree.ImportDeclaration,
//   node: TSESTree.Node,
// ) => {
//   if (node.type !== AST_NODE_TYPES.ImportDefaultSpecifier) {
//     return;
//   }
//
//   return node.local;
// };

// const getIdentifierForImportSpecifierFilter = (imported: string) => (
//   _context: TSESTree.ImportDeclaration,
//   node: TSESTree.Node,
// ) => {
//   if (node.type !== AST_NODE_TYPES.ImportSpecifier) {
//     return;
//   }
//
//   if (node.imported.name !== imported) {
//     return;
//   }
//
//   return node.local;
// };

// const identifierForImportNamespaceSpecifierFilter = (
//   _context: TSESTree.ImportDeclaration,
//   node: TSESTree.Node,
// ) => {
//   if (node.type !== AST_NODE_TYPES.ImportNamespaceSpecifier) {
//     return;
//   }
//
//   return node.local;
// };

const getImportDeclarationFilter = (source: string) => (
  _context: TSESTree.Node,
  node: TSESTree.Node,
) => {
  if (node.type !== AST_NODE_TYPES.ImportDeclaration) {
    return;
  }

  if (node.source.value !== source) {
    return;
  }

  return node;
};

const getIdentifierForImportDeclarationFilter = (
  source: string,
  imported: string,
) => {
  const importDeclarationFilter = getImportDeclarationFilter(source);

  return (context: TSESTree.Node, node: TSESTree.Node) => {
    const importDeclaration = importDeclarationFilter(context, node);

    if (!importDeclaration) {
      return;
    }

    const identifiers = importDeclaration.specifiers.reduce<
      TSESTree.Identifier[]
    >((acc, specifier) => {
      switch (specifier.type) {
        case AST_NODE_TYPES.ImportDefaultSpecifier:
          return imported === 'default' ? [...acc, specifier.local] : acc;

        case AST_NODE_TYPES.ImportSpecifier:
          return specifier.imported.name === imported
            ? [...acc, specifier.local]
            : acc;

        case AST_NODE_TYPES.ImportNamespaceSpecifier:
          // import * as thing from 'there'
          console.warn('ImportNamespaceSpecifier is currently not supported');
          return acc;

        default:
          assertNever(specifier);
      }
    }, []);

    if (identifiers.length > 1) {
      throw new Error('expected none or 1 identifier');
    }

    return identifiers.length === 1 ? identifiers[0] : undefined;
  };
};

// const getImportIndentifier = (name: string): NodeHandler => (
//   context,
//   node,
//   parent,
// ) => {
//   const identifiers: TSESTree.Identifier[] = [];
//   return identifiers;
// };

// const fn = getImportDeclarationFinder('pabra', 'default');
// const x = fn();

const doTongueTranslate = (ast: TSESTree.Node) => {
  // const importDeclarations = myTraverse(
  //   (_context, node) => (node.type === 'ImportDeclaration' ? node : undefined),
  //   ast,
  // ).filter(node => node.source.value === '@pabra/tongue-translate');

  // const importDeclarations = myTraverse(
  //   getImportDeclarationFilter('@pabra/tongue-translate'),
  //   ast,
  // );

  // const importDefaultSpecifiers = importDeclarations.reduce<
  //   TSESTree.Identifier[]
  // >((acc, importDeclaration) => {
  //   return [
  //     ...acc,
  //     ...myTraverse(
  //       (_context: TSESTree.Node, node: TSESTree.Node) =>
  //         node.type === 'Identifier' ? node : undefined,
  //       importDeclaration,
  //     ),
  //   ];
  // }, []);

  // const importDeclarations = myTraverse(filterImportDeclaration, ast);

  const identifiers = myTraverse(
    getIdentifierForImportDeclarationFilter(
      '@pabra/tongue-translate',
      'default',
    ),
    ast,
  );
  console.log('identifiers:', identifiers); // TODO: remove DEBUG
};

// type NodeHandlers = { [name: string]: NodeHandler };
// type NodeHandlerKeys = 'importTongueTranslate' | 'defaultImportTranslate';
// const nodeHandlers: { [K in NodeHandlerKeys]: NodeHandler } = {
//   importTongueTranslate: (context: TSESTree.Node, node: TSESTree.Node) => {
//     if (node.type !== 'ImportDeclaration') {
//       return;
//     }
//     if (node.source.value !== '@pabra/tongue-translate') {
//       return;
//     }
//     console.log(context, node);
//     debugger;
//     const importedNodes = myTraverse(nodeHandlers.defaultImportTranslate, node);
//     if (importedNodes.length !== 1) {
//       throw new Error('expected exactly 1 node');
//     }
//     debugger;
//     // const nodes = myTraverse(nodeHandlers.usageTranslate, context);
//     // return nodes[0];
//   },
//   defaultImportTranslate: (
//     context: TSESTree.Node,
//     node: TSESTree.Node,
//     parent: TSESTree.Node | undefined,
//   ): TSESTree.ImportDefaultSpecifier | void => {
//     if (node.type !== 'ImportDefaultSpecifier') {
//       return;
//     }
//     console.log('context: %o', context);
//     console.log('node: %o', node);
//     console.log('parent: %o', parent);
//     debugger;
//     return node;
//   },
//   // usageTranslate: (
//   //   context: TSESTree.Node,
//   //   node: TSESTree.Node,
//   //   parent: TSESTree.Node | undefined,
//   // ) => {},
//   // separateCallUsage: () => {},
//   // getSeparateCallUsageOfNode: (name: string) => {},
// } as const;

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

const myTraverse = <
  TraverseNode extends TSESTree.Node,
  T extends TSESTree.Node,
  Handler extends (
    context: TraverseNode,
    node: TSESTree.Node,
    parent: TSESTree.Node | undefined,
  ) => T | undefined
>(
  handler: Handler,
  traverseNode: TraverseNode,
) => {
  type R = Exclude<ReturnType<Handler>, undefined>;
  // type ReturnNode = R extends TSESTree.Node ?  R&TSESTree.Node : never;
  // type ReturnNode = (Exclude<T & ReturnType<Handler>, undefined>) & TSESTree.Node;
  const nodes: R[] = [];
  const enter = (node: TSESTree.Node, parent: TSESTree.Node | undefined) => {
    const returnValue = handler(traverseNode, node, parent) as R;

    if (returnValue) {
      nodes.push(returnValue);
    }

    // if (returnValue === undefined) {
    //   return;
    // } else if (Array.isArray(returnValue)) {
    //   returnValue.forEach(value => nodes.push(value));
    // } else {
    //   nodes.push(returnValue);
    // }
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
  // console.log('relevantAsTrees: %o', relevantAsTrees); // TODO: remove DEBUG

  relevantAsTrees.forEach(asTree =>
    // myTraverse(nodeHandlers.importTongueTranslate, asTree.ast),
    doTongueTranslate(asTree.ast),
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
