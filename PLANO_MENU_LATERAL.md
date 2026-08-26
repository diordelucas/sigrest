# Plano de Melhoria do Menu Lateral (Sidebar)

> Documento gerado em 2026-08-25 a partir da análise de `frontend/src/components/Sidebar.tsx`,
> `frontend/src/layouts/MainLayout.tsx` e `frontend/src/router/index.jsx`.
> Faz parte do plano de ação derivado da varredura comparativa SIGREST vs. mpg-gestao
> (ver memória `plano-acao-auditoria-mpg`, item novo abaixo).

## 1. Diagnóstico do estado atual

O `Sidebar.tsx` já agrupa itens em seções (`menuSections`), mas com problemas de organização e UX:

| # | Problema | Evidência |
|---|----------|-----------|
| 1 | **Sem retração no desktop.** A sidebar tem largura fixa `w-64`; o único controle existente é o overlay mobile (`mobileMenuOpen` em `MainLayout.tsx:17`), que não serve para telas grandes. Em monitores menores ou quando o operador quer mais espaço para tabelas/relatórios, não há como reduzir a sidebar a uma barra de ícones. | `Sidebar.tsx:91` (`w-64 shrink-0` fixo) |
| 2 | **"Cadastros" mistura domínio de negócio com administração do sistema.** `Usuários` (gestão de contas/perfis) está no mesmo grupo que `Pessoas`, `Produtos`, `Categorias`, `Fornecedores` (cadastros operacionais). Conceitualmente são categorias diferentes: dado de negócio vs. configuração do sistema. | `Sidebar.tsx:47-54` |
| 3 | **"Movimentações" é heterogêneo demais.** Junta Vendas (2 itens: registrar + listar), Compras (1 item) e Estoque (1 item) num único grupo plano, sem hierarquia — força o operador a escanear 4 itens sem relação direta de fluxo entre eles. | `Sidebar.tsx:56-63` |
| 4 | **Link para nova compra ausente no menu**, embora a rota exista (`purchases/new` em `router/index.jsx:151-153`). Hoje só dá pra chegar lá navegando manualmente pela URL ou por um botão dentro da tela de listagem. | `router/index.jsx:150-153` |
| 5 | **"Financeiro" tem dois subdomínios sem separação visual** (Caixa: abrir/histórico; Contas: pagar/receber) — 4 itens soltos no mesmo nível, sem indicar que Caixa e Contas são fluxos distintos. | `Sidebar.tsx:73-79` |
| 6 | **Sem indicação de submenu/hierarquia.** Todos os 17 itens (menos os filtrados por perfil) aparecem sempre expandidos — não existe colapso por categoria, então a lista cresce indefinidamente conforme o sistema ganha telas novas. | `Sidebar.tsx:101-127` |
| 7 | **Nenhuma persistência de preferência de UI** (estado retraído/expandido, categorias abertas) — cada reload volta ao estado padrão. | N/A (não implementado) |

## 2. Proposta de reestruturação por categorias

Critério usado: agrupar por **fluxo de trabalho do usuário**, não por camada técnica — e separar
**operação diária** de **configuração/administração**, que é o padrão já visto no mpg-gestao.

```
📊 Visão Geral                          (admin)
   ├─ Dashboard
   └─ Relatórios

📇 Cadastros                            (operacional, sem submenu — 4 itens, não precisa aninhar)
   ├─ Pessoas
   ├─ Produtos
   ├─ Categorias
   └─ Fornecedores

🛒 Vendas                               (submenu)
   ├─ Nova Venda
   └─ Histórico de Vendas

📦 Compras & Estoque                    (submenu)
   ├─ Compras
   ├─ Nova Compra              ← novo link (rota já existe, hoje órfã no menu)
   └─ Movimentação de Estoque

👨‍🍳 Produção                            (submenu)
   ├─ Fichas Técnicas
   └─ Ordens de Produção

💰 Financeiro                           (admin, submenu com dois grupos)
   ├─ Caixa
   │   ├─ Controle de Caixa
   │   └─ Histórico de Caixa
   └─ Contas
       ├─ Contas a Pagar
       └─ Contas a Receber

⚙️ Administração                        (admin, separado de Cadastros)
   └─ Usuários
```

**Racional das mudanças:**

- `Usuários` sai de "Cadastros" e vira sua própria categoria **Administração** — cadastro de negócio
  (o que a loja vende/compra/produz) e configuração do sistema (quem acessa o quê) são mentalmente
  diferentes para o operador, e separar reduz ruído para quem não é admin.
- `Vendas` e `Compras & Estoque` deixam de ser um bloco único "Movimentações" e viram categorias
  próprias com submenu — reflete o fluxo real (vender é uma operação de alta frequência para o
  OPERADOR; compra/estoque é outra). Isso também abre espaço para adicionar `Nova Compra`, hoje
  ausente do menu.
- `Financeiro` ganha dois subgrupos (Caixa / Contas) em vez de 4 itens soltos — ambos já eram
  conceitos distintos no backend (`CashRegister` vs. `AccountPayable`/`AccountReceivable`).
- `Cadastros` e `Produção` não precisam de submenu aninhado (poucos itens, mesmo nível semântico) —
  aninhar tudo por padrão criaria cliques extras sem ganho de clareza.

## 3. Especificação funcional: retração (collapse) da sidebar

- **Estados:** `expandido` (padrão, `w-64`, ícone + rótulo + chevron) e `retraído` (`w-20`, só ícone
  centralizado, sem títulos de seção).
- **Controle:** botão fixo no topo/rodapé da sidebar (ícone tipo `PanelLeftClose`/`PanelLeftOpen` do
  `lucide-react`, já usado na dependência atual do projeto) — alterna entre os dois estados com
  transição CSS (`transition-all duration-300`, mesmo padrão já usado no `MainLayout.tsx` para o
  drawer mobile).
- **Persistência:** salvar preferência em `localStorage` (`sigrest:sidebar-collapsed`) para
  sobreviver a reloads — segue o mesmo princípio do `ThemeSwitcher` já existente no projeto.
- **Submenus no estado retraído:** categorias com submenu abrem como **flyout** (popover lateral) ao
  passar o mouse/focar no ícone, em vez de expandir inline — evita que o retraído "quebre" ao abrir
  uma categoria.
- **Item ativo:** quando retraído, o item ativo mantém destaque visual só no ícone (borda/realce),
  sem o rótulo — já existe lógica de `isActive` via `NavLink`, só precisa condicionar a exibição do
  texto.
- **Mobile:** comportamento atual (drawer overlay) não muda — a retração é um recurso de desktop;
  em telas `lg-` o menu continua como overlay full-drawer.
- **Acessibilidade:** botão de colapso com `aria-label` (“Retrair menu” / “Expandir menu”); itens
  retraídos mantêm `title`/tooltip nativo com o rótulo completo para leitura ao passar o mouse.

## 4. Especificação funcional: submenus expansíveis

- Categorias com filhos (`Vendas`, `Compras & Estoque`, `Produção`, `Financeiro`) viram um
  **accordion**: clique no cabeçalho da categoria expande/retrai a lista de subitens, com chevron
  rotacionando (reaproveita o `ChevronRight` já importado no componente).
- **Auto-abertura pela rota ativa:** ao carregar/navegar, a categoria que contém a rota atual abre
  automaticamente (comparação do `pathname` contra os `path` dos itens filhos).
- **Comportamento de múltiplas categorias abertas:** permitir mais de uma aberta ao mesmo tempo (não
  é accordion exclusivo) — o usuário pode estar acompanhando Vendas e Financeiro na mesma sessão.
- Categorias sem submenu (`Cadastros`, `Visão Geral`, `Administração`) continuam como lista plana,
  sem cabeçalho clicável de expansão.

## 5. Estrutura de dados sugerida (`Sidebar.tsx`)

Hoje o tipo já tem `MenuItem`/`MenuSection`; a mudança é permitir que uma seção tenha
**grupos com subitens** em vez de apenas itens soltos:

```ts
interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  adminOnly?: boolean;
}

interface MenuGroup {
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  items: MenuItem[];       // submenu — renderizado como accordion
}

interface MenuSection {
  title: string;
  entries: (MenuItem | MenuGroup)[];  // mistura item direto e grupo com submenu
}
```

Estado local necessário no componente: `collapsed: boolean` (persistido) e
`openGroups: Set<string>` (calculado a partir da rota ativa + toggles manuais).

## 6. Itens fora de escopo deste plano (registrados, não descartados)

- Busca/filtro dentro do menu (útil só quando o número de telas crescer bem além das ~20 atuais).
- Menu configurável por usuário (reordenar/favoritar itens) — não há demanda hoje.
- Atalhos de teclado para navegação do menu.

## 7. Estimativa de esforço

Refatoração isolada no `Sidebar.tsx` (+ pequeno ajuste de layout em `MainLayout.tsx` para o novo
grid quando retraído). Sem mudança de backend, sem migração de dados. Estimativa: **1 a 2 dias**,
já contando testes visuais manuais em claro/escuro e mobile/desktop.
