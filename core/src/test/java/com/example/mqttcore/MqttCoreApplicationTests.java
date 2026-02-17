package com.example.mqttcore;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "mqtt.broker.url=tcp://localhost:11883",
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1"
})
class MqttCoreApplicationTests {

    @Test
    void contextLoads() {
        // Context loading is verified by the annotation
    }
}
