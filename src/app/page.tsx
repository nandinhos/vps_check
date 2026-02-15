'use client';

import { useEffect, useState } from 'react';
import { DockerImage, DockerContainer, DockerVolume } from '@/lib/docker';
import { DiskUsage } from '@/lib/system';

export default function Home() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [systemScan, setSystemScan] = useState<DiskUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [imgsRes, contsRes, volsRes, scanRes] = await Promise.all([
        fetch('/api/images'),
        fetch('/api/containers'),
        fetch('/api/volumes'),
        fetch('/api/system/scan'),
      ]);
      
      const imgs = await imgsRes.json();
      const conts = await contsRes.json();
      const vols = await volsRes.json();
      const scan = await scanRes.json();
      
      setImages(imgs);
      setContainers(conts);
      setVolumes(vols);
      setSystemScan(scan);
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
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return (mb / 1024).toFixed(2) + ' GB';
    return mb.toFixed(2) + ' MB';
  };

  const handleAction = async (id: string, url: string, method: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(url, { method });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro na operação');
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
          <p className="text-zinc-400 text-sm">Painel de Otimização e Ativos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Status do Sistema</p>
          <p className="text-xs text-green-500 font-mono">Docker Engine Ativo</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Docker Assets */}
        <div className="lg:col-span-8 space-y-12">
          
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
                    <th className="px-4 py-2 border-b border-zinc-800">Nome / Estado</th>
                    <th className="px-4 py-2 border-b border-zinc-800">Logs</th>
                    <th className="px-4 py-2 border-b border-zinc-800 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-500">Carregando...</td></tr>
                  ) : containers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{c.image}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${c.logSize > 100 * 1024 * 1024 ? 'text-red-500 font-bold' : 'text-zinc-400'}`}>
                            {formatSize(c.logSize)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {c.logSize > 0 && (
                          <button
                            onClick={() => handleAction(c.id, `/api/containers/${c.id}/logs`, 'POST', 'Limpar todos os logs deste container?')}
                            disabled={actionLoading === c.id}
                            className="text-[10px] font-bold uppercase text-yellow-500 hover:text-yellow-400 disabled:opacity-50"
                          >
                            Limpar Logs
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
                    <th className="px-4 py-2 border-b border-zinc-800">Nome / Tag</th>
                    <th className="px-4 py-2 border-b border-zinc-800">Tamanho</th>
                    <th className="px-4 py-2 border-b border-zinc-800">Status</th>
                    <th className="px-4 py-2 border-b border-zinc-800 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Carregando...</td></tr>
                  ) : images.map((img) => (
                    <tr key={img.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{img.name.split(':')[0]}</span>
                          <span className="text-[10px] text-zinc-500 italic">{img.tag}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{formatSize(img.size)}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {img.isDangling && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1 rounded">ÓRFÃ</span>}
                          {!img.inUse && <span className="text-[10px] bg-zinc-500/20 text-zinc-400 px-1 rounded">S/ USO</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!img.inUse && (
                          <button
                            onClick={() => handleAction(img.id, `/api/images/${encodeURIComponent(img.id)}`, 'DELETE', 'Remover esta imagem?')}
                            disabled={actionLoading === img.id}
                            className="text-[10px] font-bold uppercase text-red-500 hover:text-red-400"
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção de Volumes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Volumes
              </h2>
              <span className="text-xs text-zinc-500">{volumes.length} total</span>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-2 border-b border-zinc-800">Nome</th>
                    <th className="px-4 py-2 border-b border-zinc-800">Status</th>
                    <th className="px-4 py-2 border-b border-zinc-800 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-500">Carregando...</td></tr>
                  ) : volumes.map((v) => (
                    <tr key={v.name} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-2 font-medium truncate max-w-[250px]">{v.name}</td>
                      <td className="px-4 py-2">
                        {!v.inUse ? (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1 rounded font-bold uppercase">Órfão</span>
                        ) : (
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1 rounded font-bold uppercase">Em uso</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!v.inUse && (
                          <button
                            onClick={() => handleAction(v.name, `/api/volumes/${v.name}`, 'DELETE', 'Remover este volume permanentemente?')}
                            disabled={actionLoading === v.name}
                            className="text-[10px] font-bold uppercase text-red-500 hover:text-red-400"
                          >
                            Apagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Lado Direito: System Scan */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
            <h2 className="text-md font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Varredura de Disco do Sistema
            </h2>
            <div className="space-y-4">
              {loading ? (
                <p className="text-xs text-zinc-500">Analisando...</p>
              ) : systemScan.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Nenhum dado de varredura disponível.</p>
              ) : systemScan.map((s) => (
                <div key={s.path} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-zinc-400 truncate max-w-[180px]">{s.path}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-200">{s.formattedSize}</span>
                      {s.path === 'Docker Build Cache' && s.size > 0 && (
                        <button
                          onClick={() => handleAction('build-cache', '/api/system/prune', 'POST', 'Limpar todo o Build Cache do Docker?')}
                          disabled={actionLoading === 'build-cache'}
                          className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase underline decoration-red-500/30 underline-offset-2"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${s.size > 1024 * 1024 * 1024 ? 'bg-red-500' : 'bg-zinc-600'}`} 
                      style={{ width: `${Math.min((s.size / (50 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                * Nota: Algumas pastas podem exigir permissão de root para leitura completa.
                O uso identificado em <code className="text-zinc-400">/home/devuser</code> costuma conter dados de aplicativos.
              </p>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
