import { scanDiskUsage } from './system';

describe('System Service', () => {
  it('deve retornar o uso de disco de pastas críticas', async () => {
    const usage = await scanDiskUsage();
    expect(Array.isArray(usage)).toBe(true);
    if (usage.length > 0) {
      expect(usage[0]).toHaveProperty('path');
      expect(usage[0]).toHaveProperty('size');
      expect(typeof usage[0].size).toBe('number');
    }
  });
});
