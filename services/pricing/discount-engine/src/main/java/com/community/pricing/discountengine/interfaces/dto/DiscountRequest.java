package com.community.pricing.discountengine.interfaces.dto;

import java.util.List;
import lombok.Data;
import com.community.pricing.discountengine.interfaces.dto.CartItemDTO;

// A simple representation of cart details for the request
@Data
public class DiscountRequest {
  private String cartId;
  private String userId;
  private List<CartItemDTO> items;
}
