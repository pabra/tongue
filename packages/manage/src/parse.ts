import { Config } from '@pabra/tongue-common';
import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import * as ts from 'typescript';

// const relevantExt = ['.js', '.jsx', '.ts', '.tsx'];
const relevantExt = ['.js', '.ts', '.tsx'];
// const ignoreExt = ['.d.ts'];
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
          !name.endsWith('.d.ts')
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

const delint = (program: ts.Program, sourceFile: ts.SourceFile) => {
  const typeChecker = program.getTypeChecker();
  const delintNode = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.CallExpression) {
      const type = typeChecker.getTypeAtLocation(node);
      const typeSymbol = type.getSymbol();
      const fqn = typeSymbol
        ? typeChecker.getFullyQualifiedName(typeSymbol)
        : undefined;
      console.log(fqn);
      const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      console.log(pos);
      debugger;
    }

    ts.forEachChild(node, delintNode);
  };

  delintNode(sourceFile);
};

const main = (config: Config): void => {
  const relevantFiles = getRelevantFiles(config.srcDir);
  debugger;
  const program = ts.createProgram(relevantFiles, {
    jsx: ts.JsxEmit.Preserve,
    jsxFactory: 'h',
  });
  relevantFiles.forEach(fileName => {
    const sourceFile = program.getSourceFile(fileName);
    debugger;
    if (!sourceFile) {
      return;
    }
    delint(program, sourceFile);
  });
};

export { main };
