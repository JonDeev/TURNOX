import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('Console foundation', () => {
  it('renders its application shell', () => {
    expect(renderToStaticMarkup(<App />)).toContain('TURNOX Console');
  });
});
