import { DELETE } from './route';
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

describe('Image Delete API Route', () => {
  it('deve remover uma imagem com sucesso', async () => {
    (dockerLib.removeImage as jest.Mock).mockResolvedValue(undefined);

    const response = (await DELETE(
      {} as any,
      { params: Promise.resolve({ id: 'image-id' }) }
    )) as any;

    expect(dockerLib.removeImage).toHaveBeenCalledWith('image-id');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true });
  });

  it('deve retornar erro 500 se a remoção falhar', async () => {
    (dockerLib.removeImage as jest.Mock).mockRejectedValue(new Error('Docker removal error'));

    const response = (await DELETE(
      {} as any,
      { params: Promise.resolve({ id: 'image-id' }) }
    )) as any;

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ error: 'Docker removal error' });
  });
});
