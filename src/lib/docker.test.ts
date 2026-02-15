import { listContainers, getDockerInstance } from './docker';
import { exec } from 'child_process';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    listContainers: jest.fn().mockResolvedValue([
      {
        Id: '123',
        Names: ['/test-container'],
        Image: 'test-image',
        ImageID: 'img-123',
        Status: 'Up 1 hour',
        State: 'running',
        Created: 123456789,
        Mounts: []
      }
    ]),
    getContainer: jest.fn().mockReturnValue({
      inspect: jest.fn().mockResolvedValue({
        LogPath: '/var/lib/docker/containers/123/123-json.log'
      })
    }),
    listImages: jest.fn().mockResolvedValue([]),
    listVolumes: jest.fn().mockResolvedValue({ Volumes: [] })
  }));
});

describe('Docker Service', () => {
  it('deve listar containers com tamanho de log simulado via du', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
      if (cmd.includes('du -b')) {
        callback(null, '5000\t/path\n', '');
      } else {
        callback(null, '', '');
      }
    });

    const containers = await listContainers();
    
    expect(containers.length).toBe(1);
    expect(containers[0].name).toBe('test-container');
    expect(containers[0].logSize).toBe(5000);
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('sudo du -b'),
      expect.any(Function)
    );
  });
});
