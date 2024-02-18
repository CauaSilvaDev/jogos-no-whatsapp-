# Projetos em Node.js

Bem-vindo aos projetos em Node.js desenvolvidos por CauaSilvaDev!

Este repositório contém uma coleção de projetos desenvolvidos totalmente do zero. A seguir, você terá passo a passo para usar os projetos disponiveis em NODE.JS para usar no Linux Ubuntu 18 ou superior:

# Passo 1: Atualizar o Sistema

```markdown
sudo apt update && sudo apt upgrade -y
```

# Passo 2: Instalar Node.js e npm

```markdown
sudo apt install nodejs npm -y
```

# Passo 3: Instalar o nvm (Node Version Manager)

```markdown
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```

# Passo 4: Configurar o nvm

```markdown
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

# Passo 5: Instalar uma versão específica do Node.js

```markdown
nvm install 16
```

# Passo 6: Instalar Dependências Adicionais

```markdown
sudo apt install ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release -y
```

Após seguir esses passos, seu ambiente estará configurado e pronto para utilizar o projeto Node.js desenvolvido por CauaSilvaDev.
