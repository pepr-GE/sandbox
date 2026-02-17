package com.example.mqttcore.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mqtt_subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class MqttSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String topicFilter;

    @Column(nullable = false)
    private int qos = 1;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 255)
    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public MqttSubscription(String topicFilter, int qos, String description) {
        this.topicFilter = topicFilter;
        this.qos = qos;
        this.description = description;
    }
}
