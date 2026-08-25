package com.settlecheck.repository;

import com.settlecheck.model.ExceptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, String> {
}
