import { GET } from './route';
import * as systemLib from '@/lib/system';
import { NextResponse } from 'next/server';

jest.mock('@/lib/system');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      ...options,
      status: options?.status || 200,
    })),
  },
}));

describe('System Scan API Route', () => {
  it('deve retornar a varredura de disco com sucesso', async () => {
    const mockUsage = [
      { path: '/var/log', size: 1000, formattedSize: '1KB' },
    ];
    (systemLib.scanDiskUsage as jest.Mock).mockResolvedValue(mockUsage);

    const response = (await GET()) as any;

    expect(systemLib.scanDiskUsage).toHaveBeenCalled();
    expect(response.data).toEqual(mockUsage);
    expect(response.status).toBe(200);
  });
});
