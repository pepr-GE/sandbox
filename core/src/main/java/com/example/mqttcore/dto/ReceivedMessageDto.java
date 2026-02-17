package com.example.mqttcore.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReceivedMessageDto {
    private Long id;
    private String topic;
    private String payload;
    private int qos;
    private boolean retained;
    private LocalDateTime receivedAt;
}
