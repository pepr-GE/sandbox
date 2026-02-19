package com.example.mqttcore.service;

import com.example.mqttcore.dto.MqttSubscriptionDto;
import com.example.mqttcore.entity.MqttSubscription;
import com.example.mqttcore.exception.ConflictException;
import com.example.mqttcore.exception.ResourceNotFoundException;
import com.example.mqttcore.repository.MqttSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MqttSubscriptionService {

    private final MqttSubscriptionRepository subscriptionRepository;
    private final MqttClientService mqttClientService;

    @Transactional(readOnly = true)
    public List<MqttSubscriptionDto> getAllSubscriptions() {
        return subscriptionRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public MqttSubscriptionDto createSubscription(MqttSubscriptionDto request) {
        if (subscriptionRepository.existsByTopicFilter(request.getTopicFilter())) {
            throw new ConflictException("Subscription already exists for topic: " + request.getTopicFilter());
        }

        MqttSubscription sub = new MqttSubscription(
                request.getTopicFilter(),
                request.getQos(),
                request.getDescription()
        );
        sub.setActive(true);
        MqttSubscription saved = subscriptionRepository.save(sub);

        mqttClientService.subscribe(saved.getTopicFilter(), saved.getQos());

        return toDto(saved);
    }

    @Transactional
    public MqttSubscriptionDto updateSubscription(Long id, MqttSubscriptionDto request) {
        MqttSubscription sub = findById(id);
        boolean qosChanged = sub.getQos() != request.getQos();
        sub.setQos(request.getQos());
        sub.setDescription(request.getDescription());
        MqttSubscription saved = subscriptionRepository.save(sub);
        // Re-subscribe with new QoS if active
        if (saved.isActive() && qosChanged) {
            mqttClientService.unsubscribe(saved.getTopicFilter());
            mqttClientService.subscribe(saved.getTopicFilter(), saved.getQos());
        }
        return toDto(saved);
    }

    @Transactional
    public MqttSubscriptionDto toggleSubscription(Long id, boolean active) {
        MqttSubscription sub = findById(id);
        sub.setActive(active);
        MqttSubscription saved = subscriptionRepository.save(sub);

        if (active) {
            mqttClientService.subscribe(saved.getTopicFilter(), saved.getQos());
        } else {
            mqttClientService.unsubscribe(saved.getTopicFilter());
        }

        return toDto(saved);
    }

    @Transactional
    public void deleteSubscription(Long id) {
        MqttSubscription sub = findById(id);
        mqttClientService.unsubscribe(sub.getTopicFilter());
        subscriptionRepository.delete(sub);
    }

    private MqttSubscription findById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found: " + id));
    }

    private MqttSubscriptionDto toDto(MqttSubscription sub) {
        MqttSubscriptionDto dto = new MqttSubscriptionDto();
        dto.setId(sub.getId());
        dto.setTopicFilter(sub.getTopicFilter());
        dto.setQos(sub.getQos());
        dto.setActive(sub.isActive());
        dto.setDescription(sub.getDescription());
        dto.setCreatedAt(sub.getCreatedAt());
        return dto;
    }
}
