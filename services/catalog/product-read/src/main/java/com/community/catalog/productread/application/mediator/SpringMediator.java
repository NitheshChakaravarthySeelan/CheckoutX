package com.community.catalog.productread.application.mediator;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;

@Component
public class SpringMediator implements Mediator {

    private final ApplicationContext applicationContext;

    public SpringMediator(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    public <R, T> R send(T query, Class<R> returnType) {
        try {
            // Find all beans (handlers) in the Spring context
            String[] beanNames = applicationContext.getBeanDefinitionNames();
            for (String beanName : beanNames) {
                Object bean = applicationContext.getBean(beanName);
                // Find a method named "handle" that takes our query type as a parameter
                Method handleMethod = findHandleMethod(bean.getClass(), query.getClass());
                if (handleMethod != null) {
                    // If found, invoke it and return the result
                    Object result = handleMethod.invoke(bean, query);
                    return returnType.cast(result);
                }
            }
            throw new IllegalStateException("No handler found for query: " + query.getClass().getName());
        } catch (Exception e) {
            throw new RuntimeException("Error dispatching query", e);
        }
    }

    private Method findHandleMethod(Class<?> handlerClass, Class<?> queryClass) {
        return Arrays.stream(handlerClass.getMethods())
                .filter(method -> method.getName().equals("handle") && method.getParameterCount() == 1 && method.getParameterTypes()[0].equals(queryClass))
                .findFirst()
                .orElse(null);
    }
}
