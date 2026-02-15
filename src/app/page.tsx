'use client';

import { useEffect, useState } from 'react';
import { DockerImage, DockerContainer } from '@/lib/docker';

export default function Home() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [imgsRes, contsRes] = await Promise.all([
        fetch('/api/images'),
        fetch('/api/containers'),
      ]);
      
      const imgs = await imgsRes.json();
      const conts = await contsRes.json();
      
      setImages(imgs);
      setContainers(conts);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleRemoveImage = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao remover imagem');
      }
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      <header className="mb-8 border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPS Manager</h1>
          <p className="text-zinc-400 text-sm">Inventário de Ativos Docker</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Status do Sistema</p>
          <p className="text-xs text-green-500 font-mono">Conectado ao Docker Engine</p>
        </div>
      </header>

      <main className="space-y-12">
        {/* Seção de Containers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Containers
            </h2>
            <span className="text-xs text-zinc-500">{containers.length} total</span>
          </div>
          
          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-2 border-b border-zinc-800">Nome</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Imagem</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Status</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Carregando...</td></tr>
                ) : containers.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum container encontrado</td></tr>
                ) : (
                  containers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-zinc-400 truncate max-w-[200px]">{c.image}</td>
                      <td className="px-4 py-2 text-xs">{c.status}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.state === 'running' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {c.state}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção de Imagens */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Imagens
            </h2>
            <span className="text-xs text-zinc-500">{images.length} total</span>
          </div>

          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-2 border-b border-zinc-800">Nome</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Tag</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Tamanho</th>
                  <th className="px-4 py-2 border-b border-zinc-800">Status</th>
                  <th className="px-4 py-2 border-b border-zinc-800 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Carregando...</td></tr>
                ) : images.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Nenhuma imagem encontrada</td></tr>
                ) : (
                  images.map((img) => (
                    <tr key={img.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2 font-medium">
                        <div className="flex flex-col">
                          <span>{img.name.split(':')[0]}</span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{img.id.replace('sha256:', '')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-zinc-400"><code className="bg-zinc-800 px-1 rounded text-xs">{img.tag}</code></td>
                      <td className="px-4 py-2 text-zinc-400">{formatSize(img.size)}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {img.isDangling && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500">
                              Órfã
                            </span>
                          )}
                          {!img.inUse ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-500/10 text-zinc-500">
                              Não utilizada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500">
                              Em uso
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!img.inUse && (
                          <button
                            onClick={() => handleRemoveImage(img.id)}
                            disabled={actionLoading === img.id}
                            className="text-[10px] font-bold uppercase text-red-500 hover:text-red-400 disabled:opacity-50"
                          >
                            {actionLoading === img.id ? 'Removendo...' : 'Remover'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
