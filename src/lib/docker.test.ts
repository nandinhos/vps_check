import { getDockerInstance } from './docker';

describe('Docker Service', () => {
  it('deve retornar uma instância do Dockerode', () => {
    const docker = getDockerInstance();
    expect(docker).toBeDefined();
  });

  it('deve conseguir listar imagens (valida conectividade)', async () => {
    const docker = getDockerInstance();
    try {
      const images = await docker.listImages();
      expect(Array.isArray(images)).toBe(true);
    } catch (error) {
      console.error('Erro ao conectar com Docker:', error);
      throw error;
    }
  });

  it('deve retornar uma lista de imagens formatada com ID, nome e tamanho', async () => {
    const { listImages } = await import('./docker');
    const images = await listImages();
    
    expect(Array.isArray(images)).toBe(true);
    if (images.length > 0) {
      expect(images[0]).toHaveProperty('id');
      expect(images[0]).toHaveProperty('name');
      expect(images[0]).toHaveProperty('size');
      expect(typeof images[0].size).toBe('number');
    }
  });

  it('deve retornar uma lista de containers formatada', async () => {
    const { listContainers } = await import('./docker');
    const containers = await listContainers();
    
    expect(Array.isArray(containers)).toBe(true);
    if (containers.length > 0) {
      expect(containers[0]).toHaveProperty('id');
      expect(containers[0]).toHaveProperty('name');
      expect(containers[0]).toHaveProperty('image');
      expect(containers[0]).toHaveProperty('status');
      expect(containers[0]).toHaveProperty('state');
    }
  });
});
