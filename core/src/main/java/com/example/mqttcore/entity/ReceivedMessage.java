package com.example.mqttcore.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "received_messages", indexes = {
        @Index(name = "idx_topic", columnList = "topic"),
        @Index(name = "idx_received_at", columnList = "receivedAt")
})
@Getter
@Setter
@NoArgsConstructor
public class ReceivedMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private int qos;

    @Column(nullable = false)
    private boolean retained;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime receivedAt;

    public ReceivedMessage(String topic, String payload, int qos, boolean retained) {
        this.topic = topic;
        this.payload = payload;
        this.qos = qos;
        this.retained = retained;
    }
}
