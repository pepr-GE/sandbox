package com.example.mqttcore.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MqttSubscriptionDto {
    private Long id;

    @NotBlank
    @Size(max = 500)
    private String topicFilter;

    @Min(0)
    @Max(2)
    private int qos = 1;

    private boolean active;

    @Size(max = 255)
    private String description;

    private LocalDateTime createdAt;
}
