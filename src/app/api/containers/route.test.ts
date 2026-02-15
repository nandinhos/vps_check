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

describe('Containers API Route', () => {
  it('deve retornar a lista de containers com sucesso', async () => {
    const mockContainers = [
      { id: '1', name: 'container1', image: 'image1', status: 'Up', state: 'running', created: 123 },
    ];
    (dockerLib.listContainers as jest.Mock).mockResolvedValue(mockContainers);

    const response = (await GET()) as any;

    expect(dockerLib.listContainers).toHaveBeenCalled();
    expect(response.data).toEqual(mockContainers);
    expect(response.status).toBe(200);
  });

  it('deve retornar erro 500 se a listagem falhar', async () => {
    (dockerLib.listContainers as jest.Mock).mockRejectedValue(new Error('Docker error'));

    const response = (await GET()) as any;

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ error: 'Falha ao buscar containers do Docker' });
  });
});
