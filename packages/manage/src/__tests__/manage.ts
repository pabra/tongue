import {
  addTongueEntry,
  cleanTongueFiles,
  removeTongueEntry,
  renameTongueEntry,
} from '../manage';

const tongueFiles = {
  entriesFile: {
    path: '',
    entries: {
      c: { hint: 'hint for c' },
      a: { hint: 'hint for a', args: { a: 'arg a', aa: 'arg aa' } },
      b: { args: { bb: 'arg bb', b: 'arg b' }, hint: 'hint for b' },
    },
  },
  translationsFiles: {
    en: { path: '', translations: { x: 'no x', a: 'translated a' } },
  },
};

describe('cleanTongueFiles', () => {
  test('sort and clean', () => {
    const expectation = {
      entriesFile: {
        path: '',
        entries: {
          a: { args: { a: 'arg a', aa: 'arg aa' }, hint: 'hint for a' },
          b: { args: { b: 'arg b', bb: 'arg bb' }, hint: 'hint for b' },
          c: { hint: 'hint for c' },
        },
      },
      translationsFiles: {
        en: { path: '', translations: { a: 'translated a', b: null, c: null } },
      },
    };

    expect(JSON.stringify(cleanTongueFiles(tongueFiles), null, 2)).toBe(
      JSON.stringify(expectation, null, 2),
    );
  });

  test('add entry', () => {
    const newTongueFiles = addTongueEntry(tongueFiles, 'aa', undefined, {
      name: 'name in aa',
    });
    const expectation = {
      entriesFile: {
        path: '',
        entries: {
          a: { args: { a: 'arg a', aa: 'arg aa' }, hint: 'hint for a' },
          aa: { args: { name: 'name in aa' } },
          b: { args: { b: 'arg b', bb: 'arg bb' }, hint: 'hint for b' },
          c: { hint: 'hint for c' },
        },
      },
      translationsFiles: {
        en: {
          path: '',
          translations: { a: 'translated a', aa: null, b: null, c: null },
        },
      },
    };

    expect(JSON.stringify(cleanTongueFiles(newTongueFiles), null, 2)).toBe(
      JSON.stringify(expectation, null, 2),
    );
  });

  test('add duplicate entry', () => {
    expect(() => {
      addTongueEntry(tongueFiles, 'a');
    }).toThrow();
  });

  test('add entry wiht bad arg', () => {
    expect(() => {
      addTongueEntry(tongueFiles, 'aa', 'hint for aa', { '2key': 'value' });
    }).toThrow();
  });

  test('remove entry', () => {
    const newTongueFiles = removeTongueEntry(tongueFiles, 'b');
    const expectation = {
      entriesFile: {
        path: '',
        entries: {
          a: { args: { a: 'arg a', aa: 'arg aa' }, hint: 'hint for a' },
          c: { hint: 'hint for c' },
        },
      },
      translationsFiles: {
        en: { path: '', translations: { a: 'translated a', c: null } },
      },
    };

    expect(JSON.stringify(cleanTongueFiles(newTongueFiles), null, 2)).toBe(
      JSON.stringify(expectation, null, 2),
    );
  });

  test('remove imaginary entry', () => {
    expect(() => {
      removeTongueEntry(tongueFiles, 'xx');
    }).toThrow();
  });

  test('rename entry', () => {
    const newTongueFiles = renameTongueEntry(tongueFiles, 'a', 'bb');
    const expectation = {
      entriesFile: {
        path: '',
        entries: {
          b: { args: { b: 'arg b', bb: 'arg bb' }, hint: 'hint for b' },
          bb: { args: { a: 'arg a', aa: 'arg aa' }, hint: 'hint for a' },
          c: { hint: 'hint for c' },
        },
      },
      translationsFiles: {
        en: {
          path: '',
          translations: {
            b: null,
            bb: 'translated a',
            c: null,
          },
        },
      },
    };

    expect(JSON.stringify(cleanTongueFiles(newTongueFiles), null, 2)).toBe(
      JSON.stringify(expectation, null, 2),
    );
  });

  test('rename imaginary entry', () => {
    expect(() => {
      renameTongueEntry(tongueFiles, 'abc', 'def');
    }).toThrow();
  });

  test('rename duplicate entry', () => {
    expect(() => {
      renameTongueEntry(tongueFiles, 'b', 'c');
    }).toThrow();
  });
});
