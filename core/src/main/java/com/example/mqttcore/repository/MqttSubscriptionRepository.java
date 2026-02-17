package com.example.mqttcore.repository;

import com.example.mqttcore.entity.MqttSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MqttSubscriptionRepository extends JpaRepository<MqttSubscription, Long> {

    List<MqttSubscription> findByActiveTrue();

    Optional<MqttSubscription> findByTopicFilter(String topicFilter);

    boolean existsByTopicFilter(String topicFilter);
}
