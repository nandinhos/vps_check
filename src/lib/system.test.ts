import { scanDiskUsage } from './system';
import { exec } from 'child_process';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('System Service Expansion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve incluir o Build Cache do Docker com parsing correto de GB', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      if (cmd.includes('docker system df')) {
        callback(null, '1.2GB\n', '');
      } else {
        callback(null, '1024\t/path\n', '');
      }
    });

    const usage = await scanDiskUsage();
    const cache = usage.find(u => u.path === 'Docker Build Cache');
    expect(cache).toBeDefined();
    expect(cache?.size).toBe(1.2 * 1024 * 1024 * 1024);
    expect(cache?.formattedSize).toBe('1.20 GB');
  });

  it('deve incluir caminhos de sistema como APT e Journal', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      callback(null, '100\t/path\n', '');
    });

    const usage = await scanDiskUsage();
    const paths = usage.map(u => u.path);
    expect(paths).toContain('/var/log/journal');
    expect(paths).toContain('/var/cache/apt');
    expect(paths).toContain('/home/devuser/.cache');
  });
});
