# FC Career Hub - Front/Desktop

Projeto independente com Angular + Electron.

## Desenvolvimento

```bash
npm install
npm start
```

Por padrão, configure no app a API em `http://127.0.0.1:3333` e a mesma `SYNC_API_KEY` usada no backend.

## Build desktop

```bash
npm run dist
```

No Windows, o electron-builder gera o instalador `.exe` em `release/`.

## Save demo no Mac

O fixture `fixtures/CmMgr_TEST_MAC` permite testar o fluxo local de leitura e sincronização sem ter o FC 26 instalado.
