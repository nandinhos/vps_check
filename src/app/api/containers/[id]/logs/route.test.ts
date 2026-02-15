import { POST } from './route';
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

describe('Container Logs POST API Route', () => {
  it('deve limpar os logs de um container com sucesso', async () => {
    (dockerLib.clearContainerLogs as jest.Mock).mockResolvedValue(undefined);

    const response = (await POST(
      {} as any,
      { params: Promise.resolve({ id: 'container-id' }) }
    )) as any;

    expect(dockerLib.clearContainerLogs).toHaveBeenCalledWith('container-id');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true });
  });

  it('deve retornar erro 500 se a limpeza falhar', async () => {
    (dockerLib.clearContainerLogs as jest.Mock).mockRejectedValue(new Error('Log clearing error'));

    const response = (await POST(
      {} as any,
      { params: Promise.resolve({ id: 'container-id' }) }
    )) as any;

    expect(response.status).toBe(500);
    expect(response.data).toEqual({ error: 'Log clearing error' });
  });
});
