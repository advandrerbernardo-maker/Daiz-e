# Daiz-e · pacote PWA

Arquivos: `index.html` (o app), `manifest.webmanifest`, `sw.js` (uso offline) e os ícones.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub. Prefira **privado**: o código traz o CNPJ e o endereço da imobiliária. (GitHub Pages em repositório privado depende do plano; se não estiver disponível, use Netlify ou Vercel.)
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings > Pages**, escolha a branch `main` e a pasta `/ (root)` e salve.
4. Aguarde alguns minutos e abra o endereço `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/` no Chrome do Android.

## Instalar no celular
No Chrome, abra o menu (três pontos) e toque em **Instalar app** (ou **Adicionar à tela inicial**).

## Uso offline
Na primeira abertura, com internet, o app guarda as bibliotecas (React, PDF, DOCX) no aparelho. Depois disso, abre sem internet. Para não depender de endereços externos nunca, baixe essas bibliotecas e aponte as tags `<script>` do `index.html` para cópias locais.

## O que NÃO funciona fora do Claude
A leitura automática dos dados da foto (nome, CPF e endereço) usa o Claude e só roda dentro do claude.ai. Fora dele, o app avisa e os campos ficam manuais. Para ativar, é preciso um serviço de leitura de documentos com chave de acesso guardada em um servidor, nunca dentro do app.

## Como testar o compartilhamento no Android
1. Abra o app instalado, emita um recibo e toque em **COMPARTILHAR VIA WHATSAPP**.
2. O menu do Android deve listar WhatsApp e WhatsApp Business.
3. O app só informa que o menu foi concluído. Confirme no WhatsApp se a mensagem foi enviada.

## Atualizar o app
Ao alterar o `index.html`, mude `V='daiz-e-v1'` em `sw.js` (por exemplo, para `v2`) para os celulares receberem a nova versão.

## Dados
Clientes e recibos ficam só no navegador do aparelho. Limpar os dados do site apaga tudo.
