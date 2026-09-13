# Conexão e impressão

O `printer-store` é a fonte compartilhada do estado da impressora. O endereço salvo e o
título do recibo permanecem no SQLite; a conexão e o resultado do envio existem apenas
em memória. Salvar ou parear um dispositivo não o torna conectado.

O layout inicia o monitoramento após preparar o banco. Eventos nativos, foco das telas e
retorno ao primeiro plano verificam a conexão. Conectar e imprimir são ações explícitas;
não há reconexão nem reenvio automático. A conexão permanece aberta após o envio.

`connectionStatus` descreve a conexão, enquanto `printStatus` e `printError` descrevem
o envio. Uma falha de escrita não significa necessariamente uma desconexão. O sucesso
confirma o envio ao módulo nativo, não a saída física do papel.

As configurações e a impressão de vendas usam `PrinterConnectionCard`. O serviço
`PrinterBluetooth` concentra permissões e acesso nativo; no iOS, lista acessórios
disponíveis pela biblioteca existente, sem executar a descoberta exclusiva do Android.

## Verificação

Execute `npx tsc --noEmit` e `npm run lint`.

Em um aparelho com impressora compatível:

1. Salve a impressora e confira que salvar não indica conexão ativa.
2. Conecte nas configurações e abra uma venda: ambas as telas devem indicar conexão.
3. Envie dois recibos e confira que a conexão permanece aberta.
4. Desligue a impressora ou o Bluetooth; confira a atualização e a ação para conectar novamente.
5. Volte ao app após alterar Bluetooth/permissões nos ajustes do sistema.
6. Desconecte manualmente e teste trocar e remover o endereço salvo.
7. Negue a permissão e feche a busca enquanto ela está em andamento: a interface deve
   permanecer responsiva, sem alertas repetidos ou resultados após fechar.

Android e iOS exigem uma compilação nativa e hardware compatível com a biblioteca atual.
