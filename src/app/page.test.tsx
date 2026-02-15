import { render, screen } from '@testing-library/react';
import Home from './page';
import '@testing-library/jest-dom';

// Mock do fetch global
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('Dashboard Page', () => {
  it('deve renderizar o título do dashboard', () => {
    render(<Home />);
    expect(screen.getByText(/Inventário de Ativos Docker/i)).toBeInTheDocument();
  });

  it('deve exibir seções para containers e imagens', () => {
    render(<Home />);
    expect(screen.getByText(/Containers/i)).toBeInTheDocument();
    expect(screen.getByText(/Imagens/i)).toBeInTheDocument();
  });
});
