package com.community.cart.cartpricing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import org.springframework.context.annotation.Primary;

@Configuration
@ConfigurationProperties(prefix = "app")
@Primary
public class CartPricingConfig {

    private final Clients clients = new Clients();

    public Clients getClients() {
        return clients;
    }

    public static class Clients {
        private final CartSnapshot cartSnapshot = new CartSnapshot();

        public CartSnapshot getCartSnapshot() {
            return cartSnapshot;
        }

        public static class CartSnapshot {
            private String url;

            public String getUrl() {
                return url;
            }

            public void setUrl(String url) {
                this.url = url;
            }
        }
    }
}
