import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import init from '../index';

const entries = {
  'just test': {},
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
  const { Translate, useSetLanguage, useTranslate } = init(
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
        data-testid="toggle-language"
        onClick={(): void => setLanguage(lang => (lang === 'en' ? 'de' : 'en'))}
      >
        toggle
      </button>
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
      </div>
    );
  };

  const { container, getByTestId } = render(<App />);

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe('en: test en');
      expect(getByTestId('hoc').textContent).toBe('test en');
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(1);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(1);
    },
    { container },
  );

  fireEvent.click(getByTestId('toggle-language'));

  await waitFor(
    () => {
      expect(getByTestId('translate-fn').textContent).toBe('de: nur testen');
      expect(getByTestId('hoc').textContent).toBe('nur testen');
      expect(indicateRenderApp).toHaveBeenCalledTimes(1);
      expect(indicateRenderTranslateFn).toHaveBeenCalledTimes(2);
      expect(indicateRenderHoc).toHaveBeenCalledTimes(1);
      expect(indicateRenderLanguageToggle).toHaveBeenCalledTimes(2);
    },
    { container },
  );
});
