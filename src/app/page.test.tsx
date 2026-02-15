import { render, screen, act } from '@testing-library/react';
import Home from './page';
import '@testing-library/jest-dom';

// Mock do fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('Dashboard Page', () => {
  it('deve renderizar o título do dashboard', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/VPS Manager/i)).toBeInTheDocument();
  });

  it('deve exibir seções para containers e imagens', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText(/Containers/i)).toBeInTheDocument();
    expect(screen.getByText(/Imagens/i)).toBeInTheDocument();
  });
});
