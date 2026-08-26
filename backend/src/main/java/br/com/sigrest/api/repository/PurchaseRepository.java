package br.com.sigrest.api.repository;

import br.com.sigrest.api.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Optional<Purchase> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Purchase p WHERE p.date BETWEEN :start AND :end")
    BigDecimal sumTotalBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}

