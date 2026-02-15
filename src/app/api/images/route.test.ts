import { GET } from './route';
import * as dockerLib from '@/lib/docker';
import { NextResponse } from 'next/server';

jest.mock('@/lib/docker');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      ...options,
      status: options?.status || 200,
    })),
  },
}));

describe('Images API Route', () => {
  it('deve retornar a lista de imagens com sucesso', async () => {
    const mockImages = [
      { id: '1', name: 'image1', size: 100, created: 123, tag: 'latest' },
    ];
    (dockerLib.listImages as jest.Mock).mockResolvedValue(mockImages);

    const response = (await GET()) as any;

    expect(dockerLib.listImages).toHaveBeenCalled();
    expect(response.data).toEqual(mockImages);
    expect(response.status).toBe(200);
  });

  it('deve retornar erro 500 se a listagem falhar', async () => {
    (dockerLib.listImages as jest.Mock).mockRejectedValue(new Error('Docker error'));

    const response = (await GET()) as any;

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ error: 'Falha ao buscar imagens do Docker' });
  });
});
