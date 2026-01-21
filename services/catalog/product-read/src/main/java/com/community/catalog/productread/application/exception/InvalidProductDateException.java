package com.community.catalog.productread.application.exception;

public class InvalidProductDateException extends RuntimeException {
  public InvalidProductDateException(String message, Throwable cause) {
    super(message, cause);
  }
}
