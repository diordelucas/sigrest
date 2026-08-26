package br.com.sigrest.api.repository;

import br.com.sigrest.api.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByIdempotencyKey(String idempotencyKey);

    /** Soma do faturamento (Sale.total) no intervalo informado. Agregação feita no banco. */
    @Query("SELECT COALESCE(SUM(s.total), 0) FROM sale s WHERE s.date BETWEEN :start AND :end")
    BigDecimal sumTotalBetween(@Param("start") Date start, @Param("end") Date end);

    /** Quantidade de vendas no intervalo informado. */
    @Query("SELECT COUNT(s) FROM sale s WHERE s.date BETWEEN :start AND :end")
    long countSalesBetween(@Param("start") Date start, @Param("end") Date end);
}

