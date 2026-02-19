package com.example.mqttcore.controller;

import com.example.mqttcore.dto.MqttSubscriptionDto;
import com.example.mqttcore.dto.PublishRequest;
import com.example.mqttcore.service.MqttClientService;
import com.example.mqttcore.service.MqttSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mqtt")
@RequiredArgsConstructor
public class MqttController {

    private final MqttSubscriptionService subscriptionService;
    private final MqttClientService mqttClientService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBrokerStatus() {
        return ResponseEntity.ok(Map.of(
                "connected", mqttClientService.isConnected()
        ));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<MqttSubscriptionDto>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @PostMapping("/subscriptions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MqttSubscriptionDto> createSubscription(
            @Valid @RequestBody MqttSubscriptionDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subscriptionService.createSubscription(request));
    }

    @PutMapping("/subscriptions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MqttSubscriptionDto> updateSubscription(
            @PathVariable Long id,
            @Valid @RequestBody MqttSubscriptionDto request) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, request));
    }

    @PatchMapping("/subscriptions/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MqttSubscriptionDto> toggleSubscription(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(subscriptionService.toggleSubscription(id, active));
    }

    @DeleteMapping("/subscriptions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> publish(@Valid @RequestBody PublishRequest request) {
        try {
            mqttClientService.publish(request.getTopic(), request.getPayload(),
                    request.getQos(), request.isRetained());
            return ResponseEntity.ok().build();
        } catch (MqttException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to publish MQTT message: " + e.getMessage());
        }
    }
}
