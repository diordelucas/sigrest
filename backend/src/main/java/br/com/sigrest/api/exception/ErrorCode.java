package br.com.sigrest.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Catálogo central de erros do SIGREST. Cada valor é um erro de significado único — reutilizado
 * em todos os pontos do código onde a mesma causa se repete (ex.: "produto não encontrado" usa
 * sempre {@link #PROD_NAO_ENCONTRADO}, não importa o endpoint que disparou).
 *
 * <p>O código (ex. {@code SIGREST-PROD-001}) é estável e não deve ser reaproveitado para outro
 * significado, mesmo que o erro original seja removido — times de suporte podem ter esse código
 * em histórico de atendimento.
 */
public enum ErrorCode {

    // Autenticação e sessão
    AUTH_CREDENCIAIS_INVALIDAS("SIGREST-AUTH-001", "E-mail ou senha inválidos.", HttpStatus.UNAUTHORIZED),
    AUTH_SESSAO_EXPIRADA("SIGREST-AUTH-002", "Sessão expirada ou ausente. Faça login novamente.", HttpStatus.UNAUTHORIZED),
    AUTH_PERMISSAO_INSUFICIENTE("SIGREST-AUTH-003", "Você não tem permissão para esta operação.", HttpStatus.FORBIDDEN),
    AUTH_MUITAS_TENTATIVAS("SIGREST-AUTH-004", "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.", HttpStatus.TOO_MANY_REQUESTS),

    // Usuários
    USER_NAO_ENCONTRADO("SIGREST-USER-001", "Usuário não encontrado.", HttpStatus.NOT_FOUND),
    USER_ULTIMO_ADMIN("SIGREST-USER-002", "Não é possível remover o último administrador do sistema.", HttpStatus.BAD_REQUEST),

    // Produtos e categorias
    PROD_NAO_ENCONTRADO("SIGREST-PROD-001", "Produto não encontrado.", HttpStatus.NOT_FOUND),
    PROD_CATEGORIA_OBRIGATORIA("SIGREST-PROD-002", "Selecione uma categoria para o produto.", HttpStatus.BAD_REQUEST),
    CAT_NAO_ENCONTRADA("SIGREST-CAT-001", "Categoria não encontrada.", HttpStatus.NOT_FOUND),

    // Pessoas (clientes) e fornecedores
    PERSON_NAO_ENCONTRADA("SIGREST-PERSON-001", "Cliente não encontrado.", HttpStatus.NOT_FOUND),
    PERSON_CPF_INVALIDO("SIGREST-PERSON-002", "CPF inválido.", HttpStatus.BAD_REQUEST),
    SUPP_NAO_ENCONTRADO("SIGREST-SUPP-001", "Fornecedor não encontrado.", HttpStatus.NOT_FOUND),
    SUPP_CNPJ_INVALIDO("SIGREST-SUPP-002", "CNPJ inválido.", HttpStatus.BAD_REQUEST),

    // Endereço, cidade e estado
    ADDRESS_NAO_ENCONTRADO("SIGREST-GEO-001", "Endereço não encontrado.", HttpStatus.NOT_FOUND),
    CITY_NAO_ENCONTRADA("SIGREST-GEO-002", "Cidade não encontrada.", HttpStatus.NOT_FOUND),
    STATE_NAO_ENCONTRADO("SIGREST-GEO-003", "Estado não encontrado.", HttpStatus.NOT_FOUND),

    // Vendas e itens
    SALE_NAO_ENCONTRADA("SIGREST-SALE-001", "Venda não encontrada.", HttpStatus.NOT_FOUND),
    ITEM_VENDA_NAO_ENCONTRADO("SIGREST-ITEM-001", "Item de venda não encontrado.", HttpStatus.NOT_FOUND),

    // Compras e itens
    PURCH_NAO_ENCONTRADA("SIGREST-PURCH-001", "Compra não encontrada.", HttpStatus.NOT_FOUND),
    ITEM_COMPRA_NAO_ENCONTRADO("SIGREST-ITEM-002", "Item de compra não encontrado.", HttpStatus.NOT_FOUND),

    // Estoque
    STOCK_INSUFICIENTE("SIGREST-STOCK-001", "Estoque insuficiente para concluir esta operação.", HttpStatus.BAD_REQUEST),
    STOCK_MOVIMENTO_NAO_ENCONTRADO("SIGREST-STOCK-002", "Movimentação de estoque não encontrada.", HttpStatus.NOT_FOUND),
    STOCK_CONFLITO_CONCORRENCIA("SIGREST-STOCK-003", "Este produto foi alterado por outra operação simultânea. Tente novamente.", HttpStatus.CONFLICT),

    // Ficha técnica
    TECH_FICHA_NAO_ENCONTRADA("SIGREST-TECH-001", "Ficha técnica não encontrada.", HttpStatus.NOT_FOUND),

    // Ordens de produção
    PORD_NAO_ENCONTRADA("SIGREST-PORD-001", "Ordem de produção não encontrada.", HttpStatus.NOT_FOUND),
    PORD_JA_FINALIZADA("SIGREST-PORD-002", "Esta ordem de produção já foi finalizada.", HttpStatus.BAD_REQUEST),
    PORD_CANCELADA("SIGREST-PORD-003", "Esta ordem de produção foi cancelada.", HttpStatus.BAD_REQUEST),
    PORD_PRODUTO_NAO_ASSOCIADO("SIGREST-PORD-004", "Ordem de produção sem produto associado.", HttpStatus.CONFLICT),
    PORD_SEM_FICHA_TECNICA("SIGREST-PORD-005", "Este produto não tem ficha técnica cadastrada.", HttpStatus.BAD_REQUEST),

    // Caixa
    CASH_JA_ABERTO("SIGREST-CASH-001", "Já existe um caixa aberto.", HttpStatus.BAD_REQUEST),
    CASH_NAO_ENCONTRADO("SIGREST-CASH-002", "Caixa não encontrado.", HttpStatus.NOT_FOUND),
    CASH_NAO_ABERTO("SIGREST-CASH-003", "Este caixa não está aberto.", HttpStatus.BAD_REQUEST),

    // Contas a pagar
    PAY_NAO_ENCONTRADA("SIGREST-PAY-001", "Conta a pagar não encontrada.", HttpStatus.NOT_FOUND),
    PAY_JA_PAGA("SIGREST-PAY-002", "Esta conta já foi paga.", HttpStatus.BAD_REQUEST),

    // Contas a receber
    REC_NAO_ENCONTRADA("SIGREST-REC-001", "Conta a receber não encontrada.", HttpStatus.NOT_FOUND),
    REC_JA_RECEBIDA("SIGREST-REC-002", "Esta conta já foi recebida.", HttpStatus.BAD_REQUEST),

    // Genéricos / infraestrutura
    GEN_REQUISICAO_INVALIDA("SIGREST-GEN-001", "Requisição inválida. Confira os dados enviados.", HttpStatus.BAD_REQUEST),
    GEN_PARAMETRO_AUSENTE("SIGREST-GEN-002", "Parâmetro obrigatório ausente na requisição.", HttpStatus.BAD_REQUEST),
    GEN_VALIDACAO_FALHOU("SIGREST-GEN-003", "Dados inválidos. Confira os campos destacados.", HttpStatus.BAD_REQUEST),
    GEN_CONFLITO_DADOS("SIGREST-GEN-004", "Já existe um registro com esses dados.", HttpStatus.CONFLICT),
    GEN_ERRO_INTERNO("SIGREST-GEN-500", "Ocorreu um erro inesperado. Tente novamente em instantes.", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String codigo;
    private final String mensagemPadrao;
    private final HttpStatus status;

    ErrorCode(String codigo, String mensagemPadrao, HttpStatus status) {
        this.codigo = codigo;
        this.mensagemPadrao = mensagemPadrao;
        this.status = status;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getMensagemPadrao() {
        return mensagemPadrao;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
