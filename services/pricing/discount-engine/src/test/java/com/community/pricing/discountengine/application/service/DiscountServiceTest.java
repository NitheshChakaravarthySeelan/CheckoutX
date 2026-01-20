package com.community.pricing.discountengine.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.community.pricing.discountengine.domain.model.DiscountRule;
import com.community.pricing.discountengine.domain.repository.DiscountRuleRepository;
import com.community.pricing.discountengine.interfaces.dto.CartItemDTO;
import com.community.pricing.discountengine.interfaces.dto.DiscountRequest;
import com.community.pricing.discountengine.interfaces.dto.DiscountResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    @Mock private DiscountRuleRepository discountRuleRepository;

    @InjectMocks private DiscountService discountService;

    private DiscountRequest request;
    private DiscountRule rule;

    @BeforeEach
    void setUp() {
        // Common setup for a request with one item
        CartItemDTO item = new CartItemDTO();
        item.setProductId("prod123");
        item.setQuantity(2);
        item.setPriceCents(1000); // $10.00

        request = new DiscountRequest();
        request.setItems(Collections.singletonList(item));

        // Common setup for a valid discount rule
        rule = new DiscountRule();
        rule.setProductId("prod123");
        rule.setDiscountPercentage(new BigDecimal("10.00")); // 10%
        rule.setActive(true);
        rule.setStartDate(Instant.now().minus(1, ChronoUnit.DAYS));
        rule.setEndDate(Instant.now().plus(1, ChronoUnit.DAYS));
    }

    @Test
    void whenValidRuleExists_thenCalculatesDiscount() {
        // Arrange
        when(discountRuleRepository.findByProductIdAndActiveTrueAndStartDateBeforeAndEndDateAfter(
                        anyString(), any(), any()))
                .thenReturn(Collections.singletonList(rule));

        // Act
        DiscountResponse response = discountService.calculateDiscounts(request);

        // Assert
        // 10% of $10.00 is $1.00 (or 100 cents). Quantity is 2. Total discount = 200 cents.
        assertEquals(200, response.getTotalDiscountCents());
    }

    @Test
    void whenNoRuleExists_thenDiscountIsZero() {
        // Arrange
        when(discountRuleRepository.findByProductIdAndActiveTrueAndStartDateBeforeAndEndDateAfter(
                        anyString(), any(), any()))
                .thenReturn(Collections.emptyList());

        // Act
        DiscountResponse response = discountService.calculateDiscounts(request);

        // Assert
        assertEquals(0, response.getTotalDiscountCents());
    }
}
