package com.example.mqttcore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RoleDto {
    private Long id;

    @NotBlank
    @Size(min = 2, max = 50)
    private String name;

    @Size(max = 255)
    private String description;
}
