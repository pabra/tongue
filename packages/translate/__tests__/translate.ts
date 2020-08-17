import init from '../src/translate';

const entries = {
  'just test': {},
  'test with multiple words': {},
  'missing entry': {},
  'line\nbreaks': {},
  'test with args': { args: { a: 'hint for a', b: 'hint for b' } },
  'test with duplicate args': { args: { a: 'hint for a', b: 'hint for b' } },
  test2: { args: { arg1: 'first arg', arg2: 'second arg' } },
  test3: { args: { replace: '...' } },
  täßt: { args: { a: '' } },
} as const;

const en = {
  'just test': 'test en',
  'test with multiple words': 'en - test with multiple - en',
  'line\nbreaks': 'en - line\nbreaks - en',
  'test with args': 'test args {a} and {b}.',
  'test with duplicate args': 'test b {b} and b {b} and a {a} and {b}',
  test2: `test
    {arg2} with {arg1
    } and { arg2\n} \nand {\targ1 } again`,
  test3: 'test {replace} {stillThere}',
  täßt: 'tÄẞt{a}ü',
} as const;

const de = { 'just test': 'nur testen' } as const;

const dicts = { de, en } as const;

test('translate', () => {
  const { translate, getLanguage } = init(entries, dicts);

  const anyLanguage: any = 'any';
  expect(() => translate(anyLanguage, 'just test')).toThrow();

  expect(getLanguage()).toBe('de');

  const anyEntry: any = 'nonexistent entry';
  expect(translate('en', anyEntry)).toBe('__nonexistent entry__');

  expect(translate('en', 'just test')).toBe('test en');
  expect(translate('de', 'just test')).toBe('nur testen');
  expect(translate('en', 'test with multiple words')).toBe(
    'en - test with multiple - en',
  );
  expect(translate('en', 'missing entry')).toBe('__missing entry__');
  expect(translate('en', 'line\nbreaks')).toBe('en - line\nbreaks - en');
  expect(translate('en', 'test with args', { a: 'my A', b: 'my B' })).toBe(
    'test args my A and my B.',
  );

  const anyArgs: any = { aa: 'my A', b: 'my B' };
  expect(translate('en', 'test with args', anyArgs)).toBe(
    'test args {a} and my B.',
  );

  expect(
    translate('en', 'test with duplicate args', { a: 'my A', b: 'my B' }),
  ).toBe('test b my B and b my B and a my A and my B');
  expect(
    translate('en', 'test2', { arg1: 'my first', arg2: 'my second' }),
  ).toBe(
    'test\n    my second with my first and my second \nand my first again',
  );
  expect(translate('en', 'test3', { replace: 'Re-Placed {replace}d' })).toBe(
    'test Re-Placed {replace}d {stillThere}',
  );
  expect(translate('en', 'täßt', { a: 'Öö' })).toBe('tÄẞtÖöü');

  // type failures
  // translate('en', 'nonexistent entry');
  // //              ^^^^^^^^^^^^^^^^^^^
  // translate('e', 'just test');
  // //        ^^^
  // translate('en', 'just test', {});
  // //                           ^^
  // translate('en', 'test with args', { aa: 'my A', b: 'my B' });
  // //                                  ^^^^^^^^^^
  // translate('en', 'test with args', {});
  // //                                ^^
  // translate('en', 'test with args');
  // //              ^^^^^^^^^^^^^^^^
});

test('t with dicts', () => {
  const { t, setLanguage, getLanguage } = init(entries, dicts);
  // language should be first entry in dicts now
  expect(getLanguage()).toBe('de');
  expect(t('just test')).toBe('nur testen');

  // explicitly set to en
  setLanguage('en');

  expect(getLanguage()).toBe('en');

  expect(t('just test')).toBe('test en');
  expect(t('test with multiple words')).toBe('en - test with multiple - en');
  expect(t('missing entry')).toBe('__missing entry__');
  expect(t('line\nbreaks')).toBe('en - line\nbreaks - en');
  expect(t('test with args', { a: 'my A', b: 'my B' })).toBe(
    'test args my A and my B.',
  );
  expect(t('test with duplicate args', { a: 'my A', b: 'my B' })).toBe(
    'test b my B and b my B and a my A and my B',
  );
  expect(t('test2', { arg1: 'my first', arg2: 'my second' })).toBe(
    'test\n    my second with my first and my second \nand my first again',
  );
  expect(t('test3', { replace: 'Re-Placed {replace}d' })).toBe(
    'test Re-Placed {replace}d {stillThere}',
  );
  expect(t('täßt', { a: 'Öö' })).toBe('tÄẞtÖöü');

  const anyLanguage: any = 'any';
  expect(() => setLanguage(anyLanguage)).toThrow();

  // type failures
  // setLanguage('e');
  // //          ^^^
  // t('nonexistent entry');
  // //^^^^^^^^^^^^^^^^^^^
  // t('just test', {});
  // //             ^^
  // t('test with args', { aa: 'my A', b: 'my B' });
  // //                    ^^^^^^^^^^
  // t('test with args', {});
  // //                  ^^
  // t('test with args');
  // //^^^^^^^^^^^^^^^^
});

test('new entry', () => {
  const { t, translate } = init(entries, dicts);

  expect(translate.newEntry('en', 'a new entry')).toBe('__a new entry__');

  expect(translate.newEntry('en', '{a} new entry')).toBe('__{a} new entry__');

  expect(
    translate.newEntry('en', 'a new entry with {a}', {
      a: 'my A',
      b: 'my B',
    }),
  ).toBe('__a new entry with my A__');

  expect(t.newEntry('a new entry')).toBe('__a new entry__');

  expect(t.newEntry('{a} new entry')).toBe('__{a} new entry__');

  expect(t.newEntry('a new entry with {b}', { a: 'my A', b: 'my B' })).toBe(
    '__a new entry with my B__',
  );
});

test('init with empty dict', () => {
  expect(() => init(entries, {})).toThrow();
});
