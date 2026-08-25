package com.settlecheck.repository;

import com.settlecheck.model.MatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRecordRepository extends JpaRepository<MatchRecord, String> {
}
