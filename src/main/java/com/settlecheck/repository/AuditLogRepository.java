package com.settlecheck.repository;

import com.settlecheck.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByRecordId(String recordId);
}
