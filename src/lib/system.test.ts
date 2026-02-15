import { scanDiskUsage } from './system';
import { exec } from 'child_process';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('System Service', () => {
  it('deve retornar o uso de disco de pastas críticas simulando sucesso', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      // Importante: du -sb retorna "size\tpath\n"
      callback(null, '1048576\t/some/path\n', '');
    });

    const usage = await scanDiskUsage();
    expect(Array.isArray(usage)).toBe(true);
    expect(usage.length).toBe(6); // Definido no array pathsToScan
    expect(usage[0]).toHaveProperty('path', '/var/log');
    expect(usage[0].size).toBe(1048576);
    expect(usage[0].formattedSize).toBe('1.00 MB');
  });

  it('deve tratar erros de permissão mas ainda retornar se houver stdout', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      // Simula erro de saída (exit code 1) mas com stdout parcial
      callback(new Error('Command failed'), '500\t/path\n', 'du: permission denied');
    });

    const usage = await scanDiskUsage();
    expect(usage.length).toBe(6);
    expect(usage[0].size).toBe(500);
  });
});
