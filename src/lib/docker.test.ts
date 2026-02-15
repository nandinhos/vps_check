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
});
