package com.community.orders.refund.interfaces.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.community.orders.refund.application.service.RefundService;
import com.community.orders.refund.interfaces.dto.RefundRequest;

@Component
public class RefundKafkaConsumer {

  private final RefundService refundService;

  public RefundKafkaConsumer(RefundService refundService) {
    this.refundService = refundService;
  }

  @KafkaListener(topics = "refund.command.initiate", groupId = "refund-group")
  public void kafkaRefundRequest(RefundRequest refundRequest) {
    try {
      System.out.println("Processing refund request for Order ID: " + refundRequest.getOrderId());

      // Directly pass the refundrequest to the service
      refundService.processRefund(refundRequest);

      System.out.println("Refund request processed successfully for Order ID: " + refundRequest.getOrderId());
    } catch (Exception e) {
      System.err.println(
          "Error processing refund request for Order ID " + refundRequest.getOrderId() + ": " + e.getMessage());
    }
  }
}
