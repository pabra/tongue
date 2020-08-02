import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import init from '../index';

const entries = {
  'just test': {},
  'test with {name}': { args: { name: '' } },
} as const;

const en = {
  'just test': 'test en',
} as const;

const de = { 'just test': 'nur testen' } as const;

const translations = { en, de } as const;

test('translate', async () => {
  const indicateRenderTranslateFn = jest.fn();
  const indicateRenderLanguageToggle = jest.fn();
  const indicateRenderApp = jest.fn();
  const indicateRenderHoc = jest.fn();
  const { Translate, useLanguage, useSetLanguage, useTranslate } = init(
    entries,
    translations,
  );

  const ComponentUsingTranslateFn: React.FC = () => {
    const { language, translate: t } = useTranslate();
    indicateRenderTranslateFn();

    return (
      <span data-testid="translate-fn">
        {language}: {t('just test')}
      </span>
    );
  };

  const LanguageToggle: React.FC = () => {
    const setLanguage = useSetLanguage();
    indicateRenderLanguageToggle();

    return (
      <button
        data-testid="language-toggle"
        onClick={(): void => setLanguage(lang => (lang === 'en' ? 'de' : 'en'))}
      >
        toggle
      </button>
    );
  };

  const LanguageSelect: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const handleChange = (lang: string): void => {
      setLanguage(lang === 'en' ? 'en' : 'de');
    };

    return (
      <select
        data-testid="language-select"
        value={language}
        onChange={(ev): void => handleChange(ev.target.value)}
      >
        <option value="en" data-testid="language-option-en">
          en
        </option>
        <option value="de" data-testid="language-option-de">
          de
        </option>
      </select>
    );
  };

  const HOC: React.FC = ({ children }) => {
    indicateRenderHoc();

    return <div data-testid="hoc">{children}</div>;
  };

  const App: React.FC = () => {
    indicateRenderApp();

    return (
      <div>
        <ComponentUsingTranslateFn />
        <HOC>
          <Translate entry="just test" />
        </HOC>
        <LanguageToggle />
        <LanguageSelect />
      </div>
    );
  };

  const { container, getByTestId } = render(<App />);

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe('en: test en');
      expect(getByTestId('hoc').textContent).toBe('test en');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(1);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );

  fireEvent.click(getByTestId('language-toggle'));

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe('de: nur testen');
      expect(getByTestId('hoc').textContent).toBe('nur testen');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(2);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );

  userEvent.selectOptions(getByTestId('language-select'), 'en');

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe('en: test en');
      expect(getByTestId('hoc').textContent).toBe('test en');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(3);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );
});

test('translate with args', async () => {
  const indicateRenderTranslateFn = jest.fn();
  const indicateRenderLanguageToggle = jest.fn();
  const indicateRenderApp = jest.fn();
  const indicateRenderHoc = jest.fn();
  const { Translate, useLanguage, useSetLanguage, useTranslate } = init(
    entries,
    translations,
  );

  const ComponentUsingTranslateFn: React.FC = () => {
    const { language, translate: t } = useTranslate();
    indicateRenderTranslateFn();

    return (
      <span data-testid="translate-fn">
        {language}: {t('test with {name}', { name: 'my name' })}
      </span>
    );
  };

  const LanguageToggle: React.FC = () => {
    const setLanguage = useSetLanguage();
    indicateRenderLanguageToggle();

    return (
      <button
        data-testid="language-toggle"
        onClick={(): void => setLanguage(lang => (lang === 'en' ? 'de' : 'en'))}
      >
        toggle
      </button>
    );
  };

  const LanguageSelect: React.FC = () => {
    const [language, setLanguage] = useLanguage();
    const handleChange = (lang: string): void => {
      setLanguage(lang === 'en' ? 'en' : 'de');
    };

    return (
      <select
        data-testid="language-select"
        value={language}
        onChange={(ev): void => handleChange(ev.target.value)}
      >
        <option value="en" data-testid="language-option-en">
          en
        </option>
        <option value="de" data-testid="language-option-de">
          de
        </option>
      </select>
    );
  };

  const HOC: React.FC = ({ children }) => {
    indicateRenderHoc();

    return <div data-testid="hoc">{children}</div>;
  };

  const App: React.FC = () => {
    indicateRenderApp();

    return (
      <div>
        <ComponentUsingTranslateFn />
        <HOC>
          <Translate entry="test with {name}" args={{ name: 'my name' }} />
        </HOC>
        <LanguageToggle />
        <LanguageSelect />
      </div>
    );
  };

  const { container, getByTestId } = render(<App />);

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe(
        'en: __test with my name__',
      );
      expect(getByTestId('hoc').textContent).toBe('__test with my name__');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(1);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );

  fireEvent.click(getByTestId('language-toggle'));

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe(
        'de: __test with my name__',
      );
      expect(getByTestId('hoc').textContent).toBe('__test with my name__');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(2);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );

  userEvent.selectOptions(getByTestId('language-select'), 'en');

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe(
        'en: __test with my name__',
      );
      expect(getByTestId('hoc').textContent).toBe('__test with my name__');
      expect(
        (getByTestId('language-option-en') as HTMLOptionElement).selected,
      ).toBe(true);
      expect(
        (getByTestId('language-option-de') as HTMLOptionElement).selected,
      ).toBe(false);
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(3);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );
});
