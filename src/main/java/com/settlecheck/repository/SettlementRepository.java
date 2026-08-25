package com.settlecheck.repository;

import com.settlecheck.model.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, String> {
    List<Settlement> findByStatus(String status);
}
