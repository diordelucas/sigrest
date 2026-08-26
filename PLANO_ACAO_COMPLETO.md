# SIGREST — Plano de Ação Completo (sessão de 2026-08-25)

> Documento de contexto consolidado para retomar o trabalho em outro dispositivo. Reúne, em ordem
> cronológica, tudo que foi discutido e produzido nesta sessão: a varredura comparativa com o
> `mpg-gestao`, o plano de ação priorizado, o que já foi implementado em código (ainda não
> commitado) e o plano de reestruturação do menu lateral.
>
> Branch de trabalho: `worktree-plano-acao-auditoria` (worktree em
> `.claude/worktrees/plano-acao-auditoria`), baseada em `origin/feature/catalogo-erros`.
> Repositório: SIGREST (backend Java 17 + Spring Boot 3.3.11, frontend React 19 + TypeScript +
> Tailwind, PostgreSQL, Docker).

---

## 1. Como chegamos aqui (linha do tempo da sessão)

1. **Pedido inicial:** varredura detalhada comparando o SIGREST com o projeto irmão `mpg-gestao`
   (sistema financeiro maduro da MPG Sistemas, usado como referência de padrão), cobrindo: o que
   pode ser aproveitado visual e funcionalmente, regras de negócio pendentes, segurança,
   usabilidade/intuitividade, mapeamento de erros com mensagens claras, e app mobile.
2. Resultado da varredura entregue ao usuário; pedido para **deixar o plano de ação registrado**
   (persistido em memória) para retomar assim que possível — implementação não iniciada ainda
   nesse ponto.
3. Pedido para **começar a implementação**, em ordem de prioridade (quick wins primeiro).
4. Implementados em código os itens 1 e 2 dos quick wins (detalhes na seção 3).
5. Pedido para **atualizar o plano com melhorias no menu lateral**: permitir retração
   (collapse) e reorganizar os itens em categorias mais intuitivas com submenu, gerado como `.md`
   → produziu `PLANO_MENU_LATERAL.md`.
6. Este documento: consolidação de tudo para uso como contexto em outro dispositivo.

---

## 2. Diagnóstico da varredura comparativa (SIGREST vs. mpg-gestao)

O `mpg-gestao` (`pessoal/mpg-gestao`) é usado como referência porque já está em produção e tem:
JWT completo com validação de segredo obrigatória em prod, Flyway para migrações,
`GlobalExceptionHandler` centralizado e efetivamente consumido pelo frontend, autorização por
perfil sistemática em todos os endpoints sensíveis, e componentes React reutilizáveis
(`Botao`/`Campo`/`Modal`/`Tabela`).

O SIGREST já tem boas fundações — JWT, rate limiting, sistema de `ErrorCode` com ~37 códigos no
backend (`br.com.sigrest.api.exception`), tema claro/escuro pastel — mas tinha gaps de segurança
(autorização incompleta) e um sistema de erros no backend que o frontend não aproveitava (telas
mostravam mensagem genérica fixa em vez da `message` vinda da API).

Segredos hardcoded identificados (ainda não corrigidos — ver item estrutural 5):
`JWT_SECRET` com fallback `sigrest-dev-secret-trocar-em-producao` e `DB_PASSWORD` default
`admin123` em `application.properties` — nada impede subir para produção assim hoje. Vale portar a
ideia do `ProducaoSegurancaValidator` do mpg-gestao (recusa o boot em produção sem segredo
customizado).

Outros pontos aproveitáveis do mpg-gestao, sem prioridade definida ainda:
- `CampoMoeda` — máscara monetária tipo caixa eletrônico.
- `Documentos.java` — normalização + validação de CPF/CNPJ.
- Classe `Perfis` centralizando constantes de autorização (em vez de strings soltas
  `"ADMIN"`/`"OPERADOR"` espalhadas pelo código).
- `mensagemDeErro()` como padrão de função única por tela (o SIGREST adotou uma variante disso —
  `getErrorMessage()` — ver item 1 abaixo).

---

## 3. Plano de ação priorizado

### Quick wins (dias, alto retorno)

| # | Item | Status |
|---|------|--------|
| 1 | **Interceptor central de erro no frontend** (`getErrorMessage` em `frontend/src/services/api.ts`) — liga o `ErrorCode`/`ErrorResponse` que já existe no backend a todas as telas. Antes, metade das telas ignorava a `message` do backend e mostrava string fixa (ex. `ProductForm.tsx`, `LoginForm.tsx`). Era o item de maior ROI do relatório inteiro. | ✅ **Implementado em código** (24 arquivos), commit pendente. Falta rodar type-check (`npx tsc --noEmit` ou `npm run build` em `frontend/`) para confirmar que compila limpo. |
| 2 | **`@PreAuthorize` nos controllers sem restrição de perfil**: Vendas (`SellItemController`), Compras (`PurchaseItemController`), Ficha Técnica (`TechnicalSheetController`), Ordens de Produção (`ProductionOrderController`) — só nos endpoints de exclusão (`@DeleteMapping`), reaproveitando o padrão já usado em `ProductController`. `SaleController`, `PurchaseController` e `StockMovementController` não têm endpoint de delete, então não precisaram de alteração. | ✅ **Implementado em código** (4 arquivos), commit pendente. Falta rodar build do backend (`mvn -q compile` ou equivalente) para confirmar. |
| 3 | Remover resíduos MUI órfãos (`frontend/src/theme.js` não importado em lugar nenhum, dependências `@mui/*`/`@emotion/*` mortas no `package.json`), terminar de tipar `router/index.jsx`, `utils/masks.js`, `utils/currency.js` (ainda `.js` puro). | ⏳ Não iniciado. |
| 4 | Trocar `alert()` nativo (estava em `ProductionOrderList.tsx`) e erro engolido em `console.error` (`Dashboard.tsx`, KPIs ficavam zerados sem avisar) por toast consistente (`react-hot-toast`, já usado no projeto). | ✅ **Feito** como parte do trabalho do item 1 (mesmos arquivos tocados). Falta apenas confirmar por grep se resta algum `alert()`/`console.error` silencioso solto em outra tela. |

### Estrutural (semanas)

| # | Item | Status |
|---|------|--------|
| 5 | Migrar `ddl-auto=update` para Flyway com `ddl-auto=validate` — **bloqueante antes de qualquer deploy real em produção**; é o maior risco silencioso do projeto (Hibernate altera schema de produção sozinho a cada boot). Corrigir junto os segredos hardcoded (`JWT_SECRET`, `DB_PASSWORD`) citados na seção 2. | ⏳ Não iniciado. |
| 6 | Bean Validation nos DTOs (zero `@Valid`/`@NotNull` hoje) + tratar `MethodArgumentNotValidException` no `GlobalExceptionHandler` (hoje viraria 500 genérico). | ⏳ Não iniciado. |
| 7 | `@Version` (lock otimista) em `Product` para resolver race condition em `StockMovementService.updateProductStorage` (leitura/comparação/save sem lock — duas vendas simultâneas podem gerar estoque negativo), com handler de 409 dedicado. | ⏳ Não iniciado. |
| 8 | Índices únicos para idempotência em venda/compra/pagamento (zero hoje) + validação de dígito verificador de CPF/CNPJ (campo `String` solto em `Person`/`Supplier`). | ⏳ Não iniciado. |
| 9 | Ligar contas a pagar/receber ao `CashMovement` — hoje pagar/receber só muda status, não mexe no caixa; fluxo de caixa real fica furado. | ⏳ Não iniciado. |
| 10 | `LogAtividadeService` (auditoria) para operações financeiras/sensíveis — hoje não existe nenhum log de atividade. | ⏳ Não iniciado. |
| 11 | Migrar classes CSS soltas (`.btn-primary`, `.input-field`) para componentes React reutilizáveis (`Botao`/`Campo`/`Modal`/`Tabela`), inspirado em `mpg-gestao/front-end/src/componentes/ui.tsx`. | ⏳ Não iniciado. |
| 12 | PWA (manifest customizado + service worker básico) como base — nenhum dos dois projetos tem app mobile ou PWA real hoje. App nativo (React Native/Flutter) só se surgir necessidade real de operação offline em campo; não priorizar antes dos itens de segurança. | ⏳ Não iniciado. |
| 13 | **Reestruturar o menu lateral** — retração/collapse no desktop + reagrupamento em categorias mais intuitivas com submenu. Plano completo na seção 5 e no arquivo `PLANO_MENU_LATERAL.md`. | 📝 Plano/documentação pronta. Implementação não iniciada. |

---

## 4. O que já está implementado em código nesta sessão (não commitado)

Estado do worktree no momento deste documento: **34 arquivos modificados** + 2 arquivos novos
(`PLANO_MENU_LATERAL.md`, este arquivo). Nada foi commitado ainda.

### Backend (item 2 — `@PreAuthorize`)
- `backend/src/main/java/br/com/sigrest/api/controller/SellItemController.java` — `@PreAuthorize("hasRole('ADMIN')")` em `deleteSellItem`.
- `backend/src/main/java/br/com/sigrest/api/controller/PurchaseItemController.java` — idem em `deletePurchaseItem`.
- `backend/src/main/java/br/com/sigrest/api/controller/TechnicalSheetController.java` — idem em `delete`.
- `backend/src/main/java/br/com/sigrest/api/controller/ProductionOrderController.java` — idem em `delete`.

### Frontend (itens 1 e 4 — `getErrorMessage` + toast)
- `frontend/src/types/index.ts` — novo tipo `ApiErrorResponse` (espelha o `ErrorResponse` do backend: `codigo`, `message`, `status`, `timestamp`).
- `frontend/src/services/api.ts` — novo helper `getErrorMessage(err, fallback)` que extrai `err.response.data.message` (ou usa fallback em erro de rede), mantendo a instância axios e o interceptor 401 existentes.
- 24 componentes trocaram `import api from '../services/api'` por `import api, { getErrorMessage } from '../services/api'` e substituíram mensagens de erro fixas/genéricas por `getErrorMessage(err, 'fallback específico')`: `AccountPayableForm/List`, `AccountReceivableForm/List`, `CashRegisterForm/List`, `CategoryForm/List`, `PersonForm/List`, `ProductForm/List`, `ProductionOrderForm`, `PurchaseForm/List`, `SaleForm/List`, `ReportPage`, `StockMovementList`, `SupplierForm/List`, `TechnicalSheetForm/List`, `UserForm/List`.
- `LoginForm.tsx` — import isolado de `getErrorMessage` (não usa `api` diretamente); erro de login agora usa `getErrorMessage(err, 'Não foi possível entrar. Tente novamente.')`.
- `ProductionOrderList.tsx` — trocou `alert('Erro ao finalizar ordem:\n' + msg)` por `toast.error(getErrorMessage(err, 'Erro ao finalizar ordem de produção.'))`.
- `Dashboard.tsx` — catch que antes só fazia `console.error` (KPIs ficavam zerados silenciosamente) agora dispara `toast.error(getErrorMessage(err, 'Não foi possível carregar os indicadores do dashboard.'))`, mantendo os valores zerados como fallback visual.
- Observação: em `CashRegisterForm.tsx` um catch (`catch { setMovements([]); }`) foi deixado como estava de propósito — é um fallback silencioso intencional, não uma mensagem de erro para o usuário.

### Pendente de verificação antes de commitar
- [ ] `cd frontend && npx tsc --noEmit` (ou `npm run build`) — confirmar que os 24 arquivos compilam sem erro de tipo.
- [ ] Build do backend (Maven) — confirmar que os 4 controllers compilam com o import de `@PreAuthorize`.
- [ ] Grep por `alert(` e `console.error` "solto" (sem toast) para fechar de vez o item 4.
- [ ] `git add` seletivo (não `-A` cego) + commit com mensagem descrevendo os dois quick wins.
- [ ] Push da branch (worktree tem remote configurado — branch atual `worktree-plano-acao-auditoria`).

---

## 5. Plano de reestruturação do menu lateral (item 13)

Resumo do documento completo em `PLANO_MENU_LATERAL.md` (mesma pasta deste arquivo).

### Diagnóstico do `Sidebar.tsx` atual
- Sem retração no desktop — largura fixa `w-64`; único controle existente é o overlay mobile.
- `Usuários` misturado em `Cadastros` junto com cadastros operacionais (Pessoas/Produtos/etc.) — mistura dado de negócio com configuração de sistema.
- `Movimentações` heterogêneo: Vendas (2 itens), Compras (1 item) e Estoque (1 item) num grupo plano só.
- Link para **Nova Compra** ausente do menu, embora a rota `purchases/new` já exista no `router/index.jsx`.
- `Financeiro` tem Caixa e Contas (2 subdomínios distintos) soltos no mesmo nível, sem separação visual.
- Nenhum submenu/accordion — lista sempre totalmente expandida, sem colapso por categoria.
- Nenhuma persistência de preferência de UI (estado retraído, categorias abertas).

### Nova árvore de categorias proposta
```
📊 Visão Geral (admin)            → Dashboard, Relatórios
📇 Cadastros                      → Pessoas, Produtos, Categorias, Fornecedores
🛒 Vendas (submenu)                → Nova Venda, Histórico de Vendas
📦 Compras & Estoque (submenu)    → Compras, Nova Compra (novo link), Movimentação de Estoque
👨‍🍳 Produção (submenu)             → Fichas Técnicas, Ordens de Produção
💰 Financeiro (admin, submenu)    → Caixa (Controle/Histórico), Contas (Pagar/Receber)
⚙️ Administração (admin)          → Usuários
```

### Retração (collapse)
- Dois estados: `expandido` (`w-64`) e `retraído` (`w-20`, só ícone).
- Botão de alternância (`PanelLeftClose`/`PanelLeftOpen` do `lucide-react`), transição CSS igual ao padrão já usado no drawer mobile.
- Preferência persistida em `localStorage` (`sigrest:sidebar-collapsed`), seguindo o mesmo princípio do `ThemeSwitcher` já existente.
- Categorias com submenu, quando retraídas, abrem como **flyout** (popover) ao passar o mouse, em vez de expandir inline.
- Mobile continua com o comportamento atual (drawer overlay) — retração é recurso de desktop.

### Submenus (accordion)
- Categorias com filhos (`Vendas`, `Compras & Estoque`, `Produção`, `Financeiro`) viram accordion — clique no cabeçalho expande/retrai, chevron rotaciona.
- A categoria da rota ativa abre automaticamente ao navegar/carregar.
- Mais de uma categoria pode ficar aberta ao mesmo tempo (não é accordion exclusivo).
- `Cadastros`, `Visão Geral` e `Administração` continuam como lista plana (poucos itens, não precisam de submenu).

### Estrutura de dados sugerida
```ts
interface MenuGroup {
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  items: MenuItem[];       // submenu — renderizado como accordion
}
interface MenuSection {
  title: string;
  entries: (MenuItem | MenuGroup)[];
}
```
Estado local necessário: `collapsed: boolean` (persistido) + `openGroups: Set<string>` (calculado
pela rota ativa + toggles manuais).

### Estimativa
1 a 2 dias — refatoração isolada em `Sidebar.tsx` + pequeno ajuste de layout em `MainLayout.tsx`.
Sem mudança de backend, sem migração de dados.

---

## 6. Próximos passos imediatos (ordem sugerida ao retomar)

1. Rodar type-check do frontend e build do backend para validar o que já foi implementado
   (itens 1, 2 e 4 dos quick wins).
2. Commitar (e dar push) o que já está pronto — 34 arquivos modificados, sem novas features
   pendentes de decisão, só verificação técnica.
3. Item 3 dos quick wins: limpar resíduos MUI + terminar tipagem TS (`router/index.jsx`,
   `utils/masks.js`, `utils/currency.js`).
4. Confirmar por grep se restou algum `alert()`/erro silencioso solto (fechar item 4 de vez).
5. Implementar o item 13 (menu lateral) seguindo `PLANO_MENU_LATERAL.md`.
6. Seguir para os itens estruturais (5 a 12), começando pelo item 5 (Flyway + segredos hardcoded)
   por ser bloqueante para produção.

---

## 7. Onde encontrar cada coisa

- Memória de longo prazo do plano (para outras sessões neste mesmo ambiente):
  `project_plano_acao_auditoria_mpg.md` (tipo `project`, slug `plano-acao-auditoria-mpg`).
- Plano detalhado do menu lateral: `PLANO_MENU_LATERAL.md` (raiz do repo, branch
  `worktree-plano-acao-auditoria`).
- Este documento consolidado: `PLANO_ACAO_COMPLETO.md` (raiz do repo, mesma branch) — pensado para
  ser copiado/lido em outro dispositivo como contexto único de retomada.
