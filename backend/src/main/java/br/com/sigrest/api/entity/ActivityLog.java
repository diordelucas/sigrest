package br.com.sigrest.api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Registro de auditoria para operações financeiras/sensíveis (abertura/fechamento de caixa,
 * movimentações manuais, pagamento/recebimento de contas, vendas, compras, exclusão de usuário).
 *
 * <p>O nome do usuário é gravado de forma desnormalizada (além do id) para que o histórico
 * continue legível mesmo que o usuário seja excluído depois.
 */
@Entity
@Table(name = "activity_log")
@Data
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    /** Ex.: "ABRIR_CAIXA", "PAGAR_CONTA", "CRIAR_VENDA". */
    @Column(nullable = false)
    private String acao;

    /** Nome simples da entidade afetada, ex.: "CashRegister", "AccountPayable". */
    @Column(nullable = false)
    private String entidade;

    private Long entidadeId;

    @Column(length = 1000)
    private String detalhes;

    private Long usuarioId;

    private String usuarioNome;
}
