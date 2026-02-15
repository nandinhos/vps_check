# Stack Tecnológica

Esta é a definição das tecnologias que serão utilizadas no desenvolvimento da ferramenta de gerenciamento de VPS.

## 1. Core Stack
- **Backend:** Node.js com **TypeScript**.
    - Motivo: Alta performance para I/O e excelente integração com APIs Web.
- **Frontend:** **React** utilizando o framework **Next.js**.
    - Motivo: Padrão de mercado para dashboards modernos, com excelente suporte a SSR e roteamento.
- **Linguagem:** TypeScript em ambos os lados para garantir segurança de tipos e melhor manutenção.

## 2. Interface e Design
- **Framework de CSS:** **Tailwind CSS**.
    - Motivo: Maior afinidade do desenvolvedor e flexibilidade total para criar layouts modernos, responsivos e customizados.
- **Componentes:** Possibilidade de usar bibliotecas como **shadcn/ui** (baseada em Tailwind) para componentes de dashboard profissionais e acessíveis.

## 3. Armazenamento e Dados
- **Banco de Dados Local:** **SQLite**.
    - Motivo: Leve, sem necessidade de servidor dedicado e ideal para armazenar configurações da ferramenta e metadados de inventário na própria VPS.
- **ORM:** Prisma ou Drizzle ORM (para interação segura com o SQLite).

## 4. Integração com Infraestrutura
- **Comunicação Docker:** **Docker Engine API (Docker SDK para Node.js)**.
    - Motivo: Acesso direto ao daemon do Docker para mapear containers, imagens e volumes de forma nativa e eficiente.
- **Monitoramento de Sistema:** Bibliotecas como `systeminformation` para coletar dados de CPU, RAM e Disco da VPS Hostinger.

## 5. Deployment (Self-Hosted)
- **Containerização:** A própria ferramenta será executada em um container Docker.
- **Acesso:** Exposta via um Reverse Proxy (como Nginx ou Traefik) já existente ou a ser configurado na VPS.
