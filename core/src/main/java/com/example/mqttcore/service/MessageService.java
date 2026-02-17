package com.example.mqttcore.service;

import com.example.mqttcore.dto.ReceivedMessageDto;
import com.example.mqttcore.entity.ReceivedMessage;
import com.example.mqttcore.exception.ResourceNotFoundException;
import com.example.mqttcore.repository.ReceivedMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final ReceivedMessageRepository messageRepository;

    @Transactional
    public ReceivedMessage save(String topic, String payload, int qos, boolean retained) {
        return messageRepository.save(new ReceivedMessage(topic, payload, qos, retained));
    }

    @Transactional(readOnly = true)
    public Page<ReceivedMessageDto> getMessages(String topicFilter,
                                                 LocalDateTime from,
                                                 LocalDateTime to,
                                                 Pageable pageable) {
        Page<ReceivedMessage> page = messageRepository.search(topicFilter, from, to, pageable);
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ReceivedMessageDto getMessageById(Long id) {
        ReceivedMessage msg = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + id));
        return toDto(msg);
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctTopics() {
        return messageRepository.findDistinctTopics();
    }

    private ReceivedMessageDto toDto(ReceivedMessage msg) {
        ReceivedMessageDto dto = new ReceivedMessageDto();
        dto.setId(msg.getId());
        dto.setTopic(msg.getTopic());
        dto.setPayload(msg.getPayload());
        dto.setQos(msg.getQos());
        dto.setRetained(msg.isRetained());
        dto.setReceivedAt(msg.getReceivedAt());
        return dto;
    }
}
