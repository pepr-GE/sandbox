package com.example.mqttcore.controller;

import com.example.mqttcore.dto.ReceivedMessageDto;
import com.example.mqttcore.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<Page<ReceivedMessageDto>> getMessages(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        size = Math.min(size, 200);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("receivedAt").descending());
        return ResponseEntity.ok(messageService.getMessages(topic, from, to, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceivedMessageDto> getMessageById(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.getMessageById(id));
    }

    @GetMapping("/topics")
    public ResponseEntity<List<String>> getDistinctTopics() {
        return ResponseEntity.ok(messageService.getDistinctTopics());
    }
}
