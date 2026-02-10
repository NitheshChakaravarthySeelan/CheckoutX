package com.community.catalog.productread.domain.repository;

import com.community.catalog.productread.domain.model.ProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductViewRepository extends JpaRepository<ProductView, UUID> {

}

