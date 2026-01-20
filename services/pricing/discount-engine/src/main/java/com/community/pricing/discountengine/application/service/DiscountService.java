package com.community.pricing.discountengine.application.service;

import com.community.pricing.discountengine.domain.model.DiscountRule;
import com.community.pricing.discountengine.domain.repository.DiscountRuleRepository;
import com.community.pricing.discountengine.interfaces.dto.CartItemDTO;
import com.community.pricing.discountengine.interfaces.dto.DiscountRequest;
import com.community.pricing.discountengine.interfaces.dto.DiscountResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRuleRepository discountRuleRepository;

    @Transactional(readOnly = true)
    public DiscountResponse calculateDiscounts(DiscountRequest request) {
        long totalDiscountCents = 0;

        for (CartItemDTO item : request.getItems()) {
            Instant now = Instant.now();
            List<DiscountRule> rules =
                    discountRuleRepository
                            .findByProductIdAndActiveTrueAndStartDateBeforeAndEndDateAfter(
                                    item.getProductId(), now, now);

            // Simple logic: apply the first valid rule found
            if (!rules.isEmpty()) {
                DiscountRule ruleToApply = rules.get(0);
                BigDecimal originalPrice = BigDecimal.valueOf(item.getPriceCents());
                BigDecimal discountMultiplier =
                        ruleToApply.getDiscountPercentage().divide(BigDecimal.valueOf(100));
                BigDecimal discountAmount = originalPrice.multiply(discountMultiplier);
                totalDiscountCents += discountAmount.longValue() * item.getQuantity();
            }
        }
        return new DiscountResponse(totalDiscountCents);
    }
}
