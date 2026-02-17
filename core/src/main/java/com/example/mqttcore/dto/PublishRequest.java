package com.example.mqttcore.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PublishRequest {

    @NotBlank
    @Size(max = 500)
    private String topic;

    @NotBlank
    private String payload;

    @Min(0)
    @Max(2)
    private int qos = 0;

    private boolean retained = false;
}
