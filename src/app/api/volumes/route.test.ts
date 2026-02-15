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

describe('Volumes API Route', () => {
  it('deve retornar a lista de volumes com sucesso', async () => {
    const mockVolumes = [
      { name: 'vol1', driver: 'local', mountpoint: '/var/lib/docker/volumes/vol1/_data', inUse: true },
    ];
    (dockerLib.listVolumes as jest.Mock).mockResolvedValue(mockVolumes);

    const response = (await GET()) as any;

    expect(dockerLib.listVolumes).toHaveBeenCalled();
    expect(response.data).toEqual(mockVolumes);
    expect(response.status).toBe(200);
  });

  it('deve retornar erro 500 se a listagem falhar', async () => {
    (dockerLib.listVolumes as jest.Mock).mockRejectedValue(new Error('Docker error'));

    const response = (await GET()) as any;

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ error: 'Falha ao buscar volumes do Docker' });
  });
});
