package com.example.mqttcore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRequest {

    @Email
    private String email;

    @Size(min = 6, max = 100)
    private String password;

    private Boolean active;

    private Set<String> roles;
}
