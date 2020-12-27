import { join } from 'path';
import {
  getCallExpressionsForTranslateInit,
  getEntriesTranslate,
  getImportDeclarationForProject,
  getLineAndCharacter,
  getProject,
  separateObjectBindingPatternForVariabledeclaration,
  separateParentCallExpression,
  separateParentVariableDeclaration,
} from '../src/parse';

const testProjectDir = join(process.cwd(), '__tests_project__');
const config = {
  entriesFile: join(testProjectDir, 'tongue_entries.json'),
  translationsFiles: {
    en: join(testProjectDir, 'tongue_en.json'),
  },
  srcDir: join(testProjectDir, 'src'),
};

const sortLineAndChar = (
  a: ReturnType<typeof getLineAndCharacter>,
  b: ReturnType<typeof getLineAndCharacter>,
) => {
  // prettier-ignore
  return (
    a.filePath > b.filePath ? 1 :
    a.filePath < b.filePath ? -1 :

    a.line > b.line ? 1 :
    a.line < b.line ? -1 :

    a.column > b.column ? 1 :
    a.column < b.column ? -1 :

    0
  )
};

describe('find init usage', () => {
  const project = getProject(config);
  const importDeclarations = getImportDeclarationForProject(
    '@pabra/tongue-translate',
    project,
  );

  test('found one import', () => expect(importDeclarations.length).toBe(1));

  const importIdentifier = importDeclarations[0].getDefaultImportOrThrow();
  const initReferenceNodes = importIdentifier.findReferencesAsNodes();

  const {
    expected: callExpressions,
    other: otherThanCallExpression,
  } = separateParentCallExpression(initReferenceNodes);
  const {
    expected: variableDeclarations,
    other: otherThanVariableDeclaration,
  } = separateParentVariableDeclaration(callExpressions);
  const {
    expected: objectBindingPattern,
    other: otherThanObjectBindingPattern,
  } = separateObjectBindingPatternForVariabledeclaration(variableDeclarations);
  const translationCalls = getCallExpressionsForTranslateInit(callExpressions);

  test('found init references', () => {
    expect(
      initReferenceNodes
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 1,
        column: 8,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 6,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 7,
        column: 19,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 8,
        column: 21,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 12,
        column: 27,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 16,
        column: 26,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 19,
        column: 24,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 1,
        column: 21,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 3,
        column: 1,
      },
    ]);
  });

  test('found call expressions of init', () => {
    expect(
      callExpressions
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 6,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 7,
        column: 19,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 12,
        column: 27,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 16,
        column: 26,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 3,
        column: 1,
      },
    ]);

    expect(
      otherThanCallExpression
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 8,
        column: 21,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 19,
        column: 24,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 1,
        column: 21,
      },
    ]);
  });

  test('found variable declarations of init calls', () => {
    expect(
      variableDeclarations
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 7,
        column: 7,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 12,
        column: 9,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 16,
        column: 7,
      },
    ]);

    expect(
      otherThanVariableDeclaration
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 6,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 3,
        column: 1,
      },
    ]);
  });

  test('found object binding pattern of init call variableDeclarations', () => {
    expect(
      objectBindingPattern
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 12,
        column: 9,
      },
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 16,
        column: 7,
      },
    ]);

    expect(
      otherThanObjectBindingPattern
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 7,
        column: 7,
      },
    ]);
  });

  test('found t calls', () => {
    expect(
      translationCalls.t
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'init.ts').replace(/\\/g, '/'),
        line: 13,
        column: 3,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 4,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 5,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 6,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 16,
        column: 3,
      },
    ]);
  });

  test('found translate calls', () => {
    expect(
      translationCalls.translate
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 9,
        column: 1,
      },
    ]);
  });

  test('found t newEntry calls', () => {
    expect(
      translationCalls.tNew
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'translate.ts')
          .replace(/\\/g, '/')
          .replace(/\\/g, '/'),
        line: 7,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 8,
        column: 1,
      },
    ]);
  });

  test('found translate newEntry calls', () => {
    expect(
      translationCalls.translateNew
        .map(node => getLineAndCharacter(node))
        .sort(sortLineAndChar),
    ).toMatchObject([
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 10,
        column: 1,
      },
      {
        filePath: join(testProjectDir, 'src', 'translate.ts').replace(
          /\\/g,
          '/',
        ),
        line: 11,
        column: 1,
      },
    ]);
  });

  test('found entries in translate source files', () => {
    const occurrences = getEntriesTranslate(config);

    expect(Object.keys(occurrences.existing).sort()).toMatchObject([
      'test',
      'test with args',
    ]);

    expect(Object.keys(occurrences.new).sort()).toMatchObject([
      'another entry',
      'another new entry',
      'new entry',
    ]);
  });
});
