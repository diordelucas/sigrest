package br.com.sigrest.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase")
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private LocalDate date;

    private BigDecimal total;

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();

    /**
     * Chave de idempotência gerada pelo frontend por envio de formulário: reenvio da mesma
     * compra (duplo clique, retry de rede) devolve o registro já criado em vez de duplicar
     * (ver PLANO_ACAO_COMPLETO.md, item 8).
     */
    @Column(unique = true)
    private String idempotencyKey;
}

