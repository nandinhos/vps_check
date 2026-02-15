import { scanDiskUsage } from './system';
import { exec } from 'child_process';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('System Service', () => {
  it('deve retornar o uso de disco de pastas críticas simulando sucesso', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      callback(null, { stdout: '1048576\t/path' });
    });

    const usage = await scanDiskUsage();
    expect(Array.isArray(usage)).toBe(true);
    expect(usage.length).toBe(6); // Definido no array pathsToScan
    expect(usage[0]).toHaveProperty('path', '/var/log');
    expect(usage[0].size).toBe(1048576);
    expect(usage[0].formattedSize).toBe('1.00 MB');
  });

  it('deve tratar erros de permissão graciosamente', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      callback(new Error('Permission denied'), { stdout: '', stderr: 'du: cannot access ...' });
    });

    const usage = await scanDiskUsage();
    expect(usage.length).toBe(0);
  });
});
