import { Config, isKeyof } from '@pabra/tongue-common';
import { join } from 'path';
import {
  BindingElement,
  CallExpression,
  ImportClause,
  ImportDeclaration,
  Node,
  ObjectBindingPattern,
  Project,
  PropertySignature,
  StringLiteral,
  Symbol as TsSymbol,
  VariableDeclaration,
} from 'ts-morph';

export const getLineAndCharacter = (
  node: Node,
): {
  filePath: string;
  line: number;
  column: number;
} => {
  const sourceFile = node.getSourceFile();
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

  return {
    filePath: sourceFile.getFilePath(),
    line,
    column,
  };
};

export const getProject = (config: Config): Project => {
  const tsConfigFilePath = join(config.srcDir, '..', 'tsconfig.json');
  const project = new Project({ tsConfigFilePath });
  return project;
};

type SeparatedNodes<T extends Node = Node, U extends Node = Node> = Readonly<{
  expected: Readonly<T[]>;
  other: Readonly<U[]>;
}>;

// type LiteralStringOccurrences = Readonly<{[key: string]: Readonly<StringLiteral[]>}>
type LiteralStringOccurrences = Readonly<
  Record<string, Readonly<StringLiteral[]>>
>;
// type LiteralStringUses = Readonly<{existing:LiteralStringOccurrences,new:LiteralStringOccurrences}>
type LiteralStringUses = Readonly<
  Record<'existing' | 'new', LiteralStringOccurrences>
>;

const separate = <T extends Node, U extends Node>(
  // return value of false means -> known node + do not add node to other
  // return value of undefined means -> unknown node + add to other
  decide: (node: T) => Readonly<U[]> | U | false | undefined,
  nodes: Readonly<T[]>,
): SeparatedNodes<U, T> =>
  nodes.reduce<SeparatedNodes<U, T>>(
    (acc, node) => {
      const decided = decide(node);

      if (decided === false) {
        return acc;
      }

      if (decided === undefined) {
        return { expected: acc.expected, other: [...acc.other, node] };
      }

      if (Array.isArray(decided)) {
        return { expected: [...acc.expected, ...decided], other: acc.other };
      }

      return { expected: [...acc.expected, decided], other: acc.other };
    },
    { expected: [], other: [] },
  );

export const separateParentCallExpression = (
  nodes: Readonly<Node[]>,
): SeparatedNodes<CallExpression> =>
  separate(node => {
    const parent = node.getParent();

    return parent instanceof ImportClause
      ? false
      : parent instanceof CallExpression
      ? parent
      : undefined;
  }, nodes);

export const separateParentVariableDeclaration = (
  nodes: Readonly<Node[]>,
): SeparatedNodes<VariableDeclaration> =>
  separate(node => {
    const parent = node.getParent();

    return parent instanceof VariableDeclaration ? parent : undefined;
  }, nodes);

export const separateObjectBindingPatternForVariabledeclaration = (
  nodes: Readonly<VariableDeclaration[]>,
): SeparatedNodes<ObjectBindingPattern> =>
  separate(node => {
    const nameNode = node.getNameNode();

    return nameNode instanceof ObjectBindingPattern ? nameNode : undefined;
  }, nodes);

const getSeparateByNthArgumentIsStringLiteral = (n: number) => (
  nodes: Readonly<CallExpression[]>,
): SeparatedNodes<StringLiteral, CallExpression> =>
  separate(node => {
    const args = node.getArguments();
    const argNode = args[n];

    return argNode instanceof StringLiteral ? argNode : undefined;
  }, nodes);

export const getImportDeclarationForProject = (
  importName: string,
  project: Project,
): Readonly<ImportDeclaration[]> => {
  const sourceFiles = project.getSourceFiles();

  return sourceFiles.reduce<Readonly<ImportDeclaration[]>>(
    (acc, sourceFile) => {
      const importDeclaration = sourceFile.getImportDeclaration(importName);

      return importDeclaration ? ([...acc, importDeclaration] as const) : acc;
    },
    [],
  );
};

const complainAboutNodes = (
  nodes: Readonly<Node[]>,
  msg = 'cannot follow node: %o',
  yell: (message: string, ...optional: any[]) => void = console.warn,
): void => {
  nodes.forEach(node => yell(msg, getLineAndCharacter(node)));
};

const getCallExpressionsForDeclarationReferences = (
  declarationReferences: Readonly<Node[]>,
) =>
  declarationReferences.reduce<Readonly<CallExpression[]>>(
    (acc, declarationReference) => {
      const parent = declarationReference.getParent();
      const grandParent = parent && parent.getParent();

      if (!parent) {
        return acc;
      }

      if (grandParent && grandParent instanceof CallExpression) {
        return [...acc, grandParent] as const;
      }

      if (!(parent instanceof BindingElement)) {
        return acc;
      }

      // const propertyAccessExpressions = parent
      //   .findReferencesAsNodes()
      //   .map(node => node.getParent())
      //   .filter(
      //     (node): node is PropertyAccessExpression =>
      //       node instanceof PropertyAccessExpression,
      //   );
      // console.log('propertyAccessExpressions:', propertyAccessExpressions); // TODO: remove DEBUG
      // propertyAccessExpressions.forEach(node =>
      //   console.log(getLineAndCharacter(node)),
      // );

      const callExpressions = parent
        .findReferencesAsNodes()
        .map(node => node.getParent())
        .filter(
          (node): node is CallExpression => node instanceof CallExpression,
        )
        .filter(node => !acc.includes(node));

      return callExpressions.length === 0
        ? acc
        : ([...acc, ...callExpressions] as const);
    },
    [],
  );

const getCallExpressionsForDeclarations = (declarations: Readonly<Node[]>) =>
  declarations.reduce<Readonly<CallExpression[]>>((acc, declaration) => {
    if (!(declaration instanceof PropertySignature)) {
      throw new Error('not a PropertySignature');
    }
    const declarationReferences = declaration.findReferencesAsNodes();
    const callExpressions = getCallExpressionsForDeclarationReferences(
      declarationReferences,
    ).filter(node => !acc.includes(node));

    return callExpressions.length === 0
      ? acc
      : ([...acc, ...callExpressions] as const);
  }, []);

const getPropertySymbolForDeclarations = (
  declarations: Readonly<Node[]>,
  propertyName: string,
) => {
  const allSymbols = declarations
    .reduce<TsSymbol[]>((acc, declaration) => {
      const symbol = declaration.getType().getPropertyOrThrow(propertyName);
      return [...acc, symbol];
    }, [])
    .filter((symbol, idx, symbols) => symbols.indexOf(symbol) === idx);

  if (allSymbols.length !== 1) {
    throw new Error('expected exacly 1 symbol');
  }

  return allSymbols[0];
};

const getUniqueNodeFilter = (nodeList: Readonly<Node[]>) => (node: Node) =>
  !nodeList.includes(node);

export const getCallExpressionsForTranslateInit = (
  callExpressions: Readonly<CallExpression[]>,
): Readonly<
  Record<'t' | 'translate' | 'tNew' | 'translateNew', readonly CallExpression[]>
> =>
  callExpressions.reduce<
    Readonly<
      Record<
        't' | 'translate' | 'tNew' | 'translateNew',
        Readonly<CallExpression[]>
      >
    >
  >(
    (acc, callExpression) => {
      // debugger;
      const returnType = callExpression.getReturnType();
      const symbol = returnType.getSymbolOrThrow();

      // const tSymbol = returnType.getPropertyOrThrow('t');
      const tSymbol = symbol.getMemberOrThrow('t');
      const tDeclarations = tSymbol.getDeclarations();
      const tCalls = getCallExpressionsForDeclarations(tDeclarations).filter(
        getUniqueNodeFilter(acc.t),
      );

      // const tDeclaredType = tSymbol.getDeclaredType();
      // const tNewEntrySymbol = tDeclaredType.getPropertyOrThrow('newEntry');
      // const tNewEntrySymbol = tDeclarations[0]
      //   .getType()
      //   .getPropertyOrThrow('newEntry');
      const tNewEntrySymbol = getPropertySymbolForDeclarations(
        tDeclarations,
        'newEntry',
      );
      // console.log('tNewEntrySymbol:', tNewEntrySymbol); // TODO: remove DEBUG
      // console.log('tNewEntrySymbol:'); // TODO: remove DEBUG
      // (tNewEntrySymbol.getDeclarations() as any[])[0]
      //   .findReferencesAsNodes()
      //   .forEach((n: Node) =>
      //     console.log(n.getSourceFile().getBaseName(), n.getStartLineNumber()),
      //   ); // TODO: remove DEBUG
      const tNewEntryDeclarations = tNewEntrySymbol.getDeclarations();
      const tNewEntryCalls = getCallExpressionsForDeclarations(
        tNewEntryDeclarations,
      ).filter(getUniqueNodeFilter(acc.tNew));

      const translateSymbol = symbol.getMemberOrThrow('translate');
      const translateDeclarations = translateSymbol.getDeclarations();
      const translateCalls = getCallExpressionsForDeclarations(
        translateDeclarations,
      ).filter(getUniqueNodeFilter(acc.translate));

      const translateNewEntrySymbol = getPropertySymbolForDeclarations(
        translateDeclarations,
        'newEntry',
      );
      // console.log('translateNewEntrySymbol:', translateNewEntrySymbol); // TODO: remove DEBUG
      // console.log('translateNewEntrySymbol:'); // TODO: remove DEBUG
      // (translateNewEntrySymbol.getDeclarations() as any[])[0]
      //   .findReferencesAsNodes()
      //   .forEach((n: Node) =>
      //     console.log(n.getSourceFile().getBaseName(), n.getStartLineNumber()),
      //   ); // TODO: remove DEBUG
      const translateNewEntryDeclarations = translateNewEntrySymbol.getDeclarations();
      const translateNewEntryCalls = getCallExpressionsForDeclarations(
        translateNewEntryDeclarations,
      ).filter(getUniqueNodeFilter(acc.translateNew));

      return !(
        tCalls.length +
        tNewEntryCalls.length +
        translateCalls.length +
        translateNewEntryCalls.length
      )
        ? acc
        : ({
            t: tCalls.length ? [...acc.t, ...tCalls] : acc.t,
            tNew: tNewEntryCalls.length
              ? [...acc.tNew, ...tNewEntryCalls]
              : acc.tNew,
            translate: translateCalls.length
              ? [...acc.translate, ...translateCalls]
              : acc.translate,
            translateNew: translateNewEntryCalls.length
              ? [...acc.translateNew, ...translateNewEntryCalls]
              : acc.translateNew,
          } as const);
    },
    { t: [], translate: [], tNew: [], translateNew: [] },
  );

const extendLiteralStringOccurrences = (
  occurrences: LiteralStringOccurrences,
  nodes: Readonly<StringLiteral[]>,
): LiteralStringOccurrences => {
  const nodeOccurrences = nodes.reduce<Record<string, StringLiteral[]>>(
    (acc, node) => {
      const entry = node.getLiteralText();

      if (!isKeyof(acc, entry)) {
        acc[entry] = isKeyof(occurrences, entry) ? [...occurrences[entry]] : [];
      }

      acc[entry].push(node);

      return acc;
    },
    {},
  );

  return { ...occurrences, ...nodeOccurrences };
};

// get entries for tongue-translate
export const getEntriesTranslate = (config: Config): LiteralStringUses => {
  const importName = '@pabra/tongue-translate';
  const project = getProject(config);
  const importDeclarations = getImportDeclarationForProject(
    importName,
    project,
  );

  if (importDeclarations.length === 0) {
    console.log(`module ${importName} is not used`);
    return { existing: {}, new: {} };
  }

  if (importDeclarations.length !== 1) {
    throw new Error(`module ${importName} should only be used once`);
  }

  const importIdentifier = importDeclarations[0].getDefaultImportOrThrow();

  const importReferences = importIdentifier.findReferencesAsNodes();

  const {
    expected: callExpressions,
    other: otherThanCallExpressions,
  } = separateParentCallExpression(importReferences);

  complainAboutNodes(
    otherThanCallExpressions,
    'cannot follow non-CallExpression node: %o',
  );

  const translationCalls = getCallExpressionsForTranslateInit(callExpressions);

  // existing t entries
  const {
    expected: tStringLiterals,
    other: otherThanTStringLiterals,
  } = getSeparateByNthArgumentIsStringLiteral(0)(translationCalls.t);

  complainAboutNodes(
    otherThanTStringLiterals,
    'not a string literal passed as 1st argument',
    console.error,
  );

  // existing translate entries
  const {
    expected: translateStringLiterals,
    other: otherThanTranslateStringLiterals,
  } = getSeparateByNthArgumentIsStringLiteral(1)(translationCalls.translate);

  complainAboutNodes(
    otherThanTranslateStringLiterals,
    'not a string literal passed as 2nd argument',
    console.error,
  );

  // new t entries
  const {
    expected: tNewStringLiterals,
    other: otherThanTNewStringLiterals,
  } = getSeparateByNthArgumentIsStringLiteral(0)(translationCalls.tNew);

  complainAboutNodes(
    otherThanTNewStringLiterals,
    'not a string literal passed as 1st argument',
    console.error,
  );

  // new translate entries
  const {
    expected: translateNewStringLiterals,
    other: otherThanTranslateNewStringLiterals,
  } = getSeparateByNthArgumentIsStringLiteral(1)(translationCalls.translateNew);

  complainAboutNodes(
    otherThanTranslateNewStringLiterals,
    'not a string literal passed as 2nd argument',
    console.error,
  );

  // all enties
  const existingOccurrences = extendLiteralStringOccurrences(
    extendLiteralStringOccurrences({}, tStringLiterals),
    translateStringLiterals,
  );

  const newOccurrences = extendLiteralStringOccurrences(
    extendLiteralStringOccurrences({}, tNewStringLiterals),
    translateNewStringLiterals,
  );

  const occurrences = { existing: existingOccurrences, new: newOccurrences };
  console.log('occurrences:', occurrences); // TODO: remove DEBUG

  return occurrences;
};

export const main = (config: Config): void => {
  getEntriesTranslate(config);
};
