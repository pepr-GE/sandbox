package com.example.mqttcore.service;

import com.example.mqttcore.repository.MqttSubscriptionRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MqttClientService implements MqttCallbackExtended {

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.broker.client-id}")
    private String clientId;

    @Value("${mqtt.broker.username:}")
    private String username;

    @Value("${mqtt.broker.password:}")
    private String password;

    @Value("${mqtt.broker.connection-timeout:30}")
    private int connectionTimeout;

    @Value("${mqtt.broker.keep-alive-interval:60}")
    private int keepAliveInterval;

    @Value("${mqtt.broker.clean-session:true}")
    private boolean cleanSession;

    @Value("${mqtt.broker.qos:1}")
    private int defaultQos;

    @Value("${mqtt.broker.auto-reconnect:true}")
    private boolean autoReconnect;

    private final MessageService messageService;
    private final MqttSubscriptionRepository subscriptionRepository;

    private MqttClient mqttClient;
    private volatile boolean connected = false;

    @PostConstruct
    public void init() {
        connect();
    }

    public void connect() {
        try {
            mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            mqttClient.setCallback(this);

            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(cleanSession);
            options.setConnectionTimeout(connectionTimeout);
            options.setKeepAliveInterval(keepAliveInterval);
            options.setAutomaticReconnect(autoReconnect);

            if (username != null && !username.isBlank()) {
                options.setUserName(username);
                options.setPassword(password.toCharArray());
            }

            log.info("Connecting to MQTT broker: {}", brokerUrl);
            mqttClient.connect(options);
            // connected flag and resubscribeAll() are handled in connectComplete()

        } catch (MqttException e) {
            connected = false;
            log.error("Failed to connect to MQTT broker: {}", e.getMessage());
        }
    }

    private void resubscribeAll() {
        subscriptionRepository.findByActiveTrue().forEach(sub -> {
            try {
                mqttClient.subscribe(sub.getTopicFilter(), sub.getQos());
                log.info("Resubscribed to topic: {} (QoS {})", sub.getTopicFilter(), sub.getQos());
            } catch (MqttException e) {
                log.error("Failed to resubscribe to topic {}: {}", sub.getTopicFilter(), e.getMessage());
            }
        });
    }

    public void subscribe(String topicFilter, int qos) {
        if (!connected || !mqttClient.isConnected()) {
            log.warn("Not connected to broker, subscription will be applied on reconnect: {}", topicFilter);
            return;
        }
        try {
            mqttClient.subscribe(topicFilter, qos);
            log.info("Subscribed to topic: {} (QoS {})", topicFilter, qos);
        } catch (MqttException e) {
            log.error("Failed to subscribe to topic {}: {}", topicFilter, e.getMessage());
        }
    }

    public void unsubscribe(String topicFilter) {
        if (!connected || !mqttClient.isConnected()) {
            return;
        }
        try {
            mqttClient.unsubscribe(topicFilter);
            log.info("Unsubscribed from topic: {}", topicFilter);
        } catch (MqttException e) {
            log.error("Failed to unsubscribe from topic {}: {}", topicFilter, e.getMessage());
        }
    }

    public void publish(String topic, String payload, int qos, boolean retained) throws MqttException {
        if (!connected || !mqttClient.isConnected()) {
            throw new MqttException(MqttException.REASON_CODE_CLIENT_NOT_CONNECTED);
        }
        MqttMessage message = new MqttMessage(payload.getBytes());
        message.setQos(qos);
        message.setRetained(retained);
        mqttClient.publish(topic, message);
        log.debug("Published to topic {}: {}", topic, payload);
    }

    public boolean isConnected() {
        return connected && mqttClient != null && mqttClient.isConnected();
    }

    // --- MqttCallbackExtended ---

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        connected = true;
        log.info("{} to MQTT broker: {} — resubscribing all active topics",
                reconnect ? "Reconnected" : "Connected", serverURI);
        resubscribeAll();
    }

    @Override
    public void connectionLost(Throwable cause) {
        connected = false;
        log.warn("MQTT connection lost: {}", cause.getMessage());
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload());
        log.debug("MQTT message received on topic [{}]: {}", topic, payload);
        messageService.save(topic, payload, message.getQos(), message.isRetained());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        log.debug("MQTT delivery complete for message id: {}", token.getMessageId());
    }

    @PreDestroy
    public void disconnect() {
        if (mqttClient != null && mqttClient.isConnected()) {
            try {
                mqttClient.disconnect();
                log.info("Disconnected from MQTT broker");
            } catch (MqttException e) {
                log.error("Error disconnecting from MQTT broker: {}", e.getMessage());
            }
        }
    }
}
