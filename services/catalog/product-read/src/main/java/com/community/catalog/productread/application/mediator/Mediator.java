package com.community.catalog.productread.application.mediator;

public interface Mediator {
    <R, T> R send(T query, Class<R> returnType);
}
