# Recebi+ — Plano técnico e evolução

Status: planejamento inicial. Nenhum recurso comercial deve ser considerado implementado por este documento.

## Princípios
- Preservar a branch main do Daiz-e original. Todas as alterações experimentais na branch experimento-daize-cobrancas.
- PWA mobile-first; identidade: fundo #102B3C, branco #FFFFFF, símbolo + #55E4B0.
- Começar com lembretes de envio manual pelo WhatsApp, sem prometer envio automático.
- Evitar dependências pagas antes de validar o produto, mas prever limites e migração.
- Dados de diferentes assinantes nunca podem se misturar.
- Não armazenar segredos de pagamento no navegador.

## Auditoria inicial do Daiz-e
- index.html concentra interface e lógica React/HTM e usa localStorage.
- manifest.webmanifest já permite instalação PWA.
- sw.js implementa cache/offline com chaves específicas do Daiz-e.
- Há emissão de recibos e bibliotecas para PDF.
- Dados e textos fixos da Imóveis Manaus devem ser eliminados apenas na versão comercial.
- A estrutura atual não comprova autenticação, multiempresa nem cobrança recorrente.

## Módulos planejados
1. Autenticação e organizações: usuários, organizações, associação usuário-organização e permissões.
2. Perfil da organização: nome, documento, logotipo, contatos, endereço, configurações.
3. Clientes: organização proprietária, nome, telefone normalizado, observações e consentimento de contato.
4. Cobranças: descrição, valor em centavos, vencimento, recorrência opcional, situação calculada.
5. Pagamentos: registros separados, pagamento parcial quando futuramente necessário, histórico e comprovantes.
6. Lembretes: regras de antecedência, registro de tentativas, links WhatsApp com envio confirmado manualmente.
7. Recibos: emissão a partir de pagamento confirmado, numeração por organização, PDF.
8. Assinaturas: plano, período, status sincronizado com provedor de pagamentos e trilha de eventos.

## MVP
- Criar/editar clientes e cobranças; gerar parcelas mensais com vencimentos corretos.
- Painel com vencimentos de hoje, próximos e atrasados; totais calculados sem duplicidade.
- Abrir WhatsApp com texto editável. Nunca registrar como enviado apenas por abrir o link.
- Marcar pagamento e emitir recibo; impedir duplicação acidental.
- Personalizar perfil e logo com tutorial de três passos.
- Login seguro, isolamento por organização e autorização no servidor antes de lançamento para terceiros.

## Segurança e confiabilidade
- Aplicar RLS por organização e políticas de propriedade, incluindo gravações e arquivos.
- Nunca usar apenas flags locais para liberar assinatura; validação no servidor.
- Webhooks de pagamento: validar origem/assinatura quando aplicável, conferir evento na API do provedor, processar de modo idempotente e registrar eventos.
- Estados: trial, active, past_due, canceled, expired, com regras claras e período de tolerância opcional.
- Permitir exportação de dados e exclusão conforme política; evitar dados pessoais desnecessários.
- Backup, logs de erros, testes de restauração e plano de migração de esquema.
- Verificar LGPD e políticas do WhatsApp; envio automático só com integração oficial e consentimento adequado.
- O service worker do Recebi+ deve usar nomes de cache próprios para não interferir no Daiz-e.

## Etapas e critérios de aceite
Fase A: auditoria integral do código, dependências, licenças e arquivos; protótipo isolado.
Fase B: cadastro, parcelas e lembretes manuais testados no Motorola; casos de borda de datas.
Fase C: recibos personalizados, PDF e testes de impressão/compartilhamento.
Fase D: backend, autenticação, RLS e testes de isolamento entre duas contas.
Fase E: assinatura com ambiente de testes, renovação, cancelamento, falha de pagamento e reenvio de webhook.
Fase F: piloto pequeno, métricas de uso e correções; somente depois divulgação comercial.

## Expansão planejada, não implementada
- Alertas push opt-in com limitações de PWA/Android/iOS.
- WhatsApp automático via API oficial com custos, modelos aprovados e opt-in.
- Equipes, permissões, importação CSV, relatórios, múltiplas filiais e integrações.
- Separar futuramente frontend e backend se o volume exigir; evitar microserviços no início.

## Pendências antes de comercializar
- Pesquisa de marca Recebi+ no INPI e nomes similares.
- Validar custos atuais de hospedagem, banco, autenticação e provedor de assinatura.
- Definir domínio, termos, privacidade, suporte, política de cancelamento e preço.
- Não usar dados reais de clientes nos testes iniciais.
