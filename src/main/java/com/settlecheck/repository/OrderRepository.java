package com.settlecheck.repository;

import com.settlecheck.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByStatus(String status);
}
