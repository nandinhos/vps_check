# Initial Concept

quero organizar minha VPS, que tem container docker

# Product Vision
Uma ferramenta de gerenciamento web moderna e profissional para administradores solo retomarem o controle de sua infraestrutura VPS. O foco principal é fornecer visibilidade total sobre containers Docker, imagens e bancos de dados persistentes para identificar e eliminar desperdício de recursos.

# Project Context
- **Provedor de Hospedagem:** Hostinger VPS.
- **Ambiente:** Sistema baseado em Linux onde o usuário principal (`devuser`) tem privilégios administrativos (sudo).
- **Idioma de Desenvolvimento:** Toda a documentação técnica (planos, especificações), mensagens de commit e comentários de código devem ser em **Português (Brasil)**. O código (variáveis, funções, classes) deve seguir o padrão internacional em Inglês.

# Target Users
- **Administrador Solo:** Gerenciando serviços pessoais ou de projetos em uma única VPS, necessitando de uma visão clara do consumo de recursos e saúde do sistema.

# Goals
- **Mapeamento de Infraestrutura:** Criar um mapa exato de todas as imagens Docker, bancos de dados persistentes e servidores em execução.
- **Otimização de Recursos:** Identificar e limpar containers não utilizados, volumes órfãos e imagens em cache que ocupam espaço crítico em disco.
- **Melhoria no Gerenciamento:** Substituir verificações manuais no terminal por uma interface amigável, intuitiva e profissional.

# Key Features
- **Dashboard de Inventário:** Uma visão centralizada de todos os ativos relacionados ao Docker (Imagens, Containers, Volumes) e bancos de dados persistentes.
- **Interface Web Moderna:** Uma interface profissional e intuitiva para o gerenciamento contínuo da infraestrutura.
- **Ferramentas de Limpeza:** Processos automatizados ou guiados para remover "lixo" e liberar espaço em disco.

# Success Criteria
- O usuário consegue ver uma lista abrangente de todos os dados persistentes e imagens.
- Recursos não utilizados são facilmente identificados e removíveis via interface.
- A pressão de espaço em disco na VPS é reduzida através de ações de limpeza informadas.
