# FC Career Hub 0.2 — Angular + Electron + Career Save Reader

MVP desktop do Career Tracker para EA Sports FC 26.

## O que já funciona

- Angular standalone dentro do Electron.
- IPC seguro via `preload` / `contextBridge`.
- Seleção manual da pasta e de um arquivo de save.
- Busca por saves `CmMgr*`, `*.db`, `*.sav` e nomes relacionados a carreira.
- Caminhos candidatos do FC 26 no Windows.
- Parser local no processo principal do Electron.
- Dois modos de parser:
  - **Save Demo**: fixture sintética incluída em `fixtures/CmMgr_TEST_MAC`.
  - **Save Real**: tenta decodificar o container com `fifa-career-save-parser` e escolhe o schema que produz a base mais consistente.
- Normalização de jogadores, clubes e campos estatísticos encontrados no save.
- Dashboard, Jogadores e Estatísticas passam a usar o save carregado.
- API Node/Mongo continua opcional para publicação; ela não é necessária para ler o save local.

## Testar agora no macOS

```bash
npm install
npm start
```

No macOS o app carrega automaticamente o **Save Demo** depois de iniciar. Você também pode ir em **Minhas Carreiras → Carregar save demo**.

O save demo contém jogadores e estatísticas sintéticas apenas para validar o pipeline:

```text
fixture -> Electron -> career-parser -> Angular -> Dashboard/Estatísticas
```

Arquivo:

```text
fixtures/CmMgr_TEST_MAC
```

## Quando estiver no Windows com o FC 26

Você pode:

1. Abrir **Configurações** e selecionar a pasta do FC 26; ou
2. Em **Minhas Carreiras**, clicar em **Abrir save real** e escolher diretamente um `CmMgr*`.

A detecção automática considera, entre outros:

```text
%USERPROFILE%\Documents\FC 26\settings
%APPDATA%\EA Sports\FC 26
%LOCALAPPDATA%\EA Sports\FC 26
%LOCALAPPDATA%\EA SPORTS FC 26
%LOCALAPPDATA%\EA SPORTS FC 26\settings
```

## Pipeline do save real

```text
CmMgr*
   ↓
Electron / fs
   ↓
career-parser.service.js
   ↓
fifa-career-save-parser
   ↓
db0 / db1
   ↓
normalização
   ├── players
   ├── teams
   ├── teamplayerlinks
   ├── career_playercontract
   ├── tabelas player/*stat* encontradas
   └── career_users
   ↓
ParsedCareerSave
   ↓
Angular
```

O formato de save é parcialmente revertido pela comunidade. Por isso o parser mantém `diagnostics.tables` e `diagnostics.warnings`: quando testarmos com o save real do seu PC, podemos ajustar os nomes exatos das tabelas/campos de estatísticas sem alterar a UI.

## Estrutura importante

```text
electron/
  main.js
  preload.js
  services/fc26/
    save-discovery.service.js
    save-reader.service.js
    career-parser.service.js
    demo-save.service.js

src/app/
  models/
    career-save.models.ts
  services/
    fc26-local.service.ts

fixtures/
  CmMgr_TEST_MAC
```

## API Node / Mongo

Não é necessária para o Career Tracker local. A integração anterior foi mantida para o botão **Publicar no App**:

```text
Save local -> Electron -> Angular
                         ↓ opcional
                     Node API -> MongoDB
```

Se a API `http://127.0.0.1:3333` não estiver rodando, isso não impede abrir o Save Demo ou um save local.

## Segurança

O renderer Angular não recebe `fs`, `path`, `child_process` ou Node genérico. Ele só recebe operações de domínio via IPC, como `parseSave`, `scanSaves` e `loadDemo`.

## Referência técnica

A estratégia FBCHUNKS/schema foi baseada no trabalho público do projeto **Manager-Companion** (MIT), que também usa `fifa-career-save-parser` como bridge para saves do FC 26. O código deste projeto foi organizado especificamente para a arquitetura Angular/Electron do FC Career Hub.

Sempre faça backup dos saves reais antes de qualquer futura funcionalidade de escrita. Esta versão apenas lê.
