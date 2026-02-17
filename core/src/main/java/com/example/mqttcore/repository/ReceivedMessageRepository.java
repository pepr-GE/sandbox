package com.example.mqttcore.repository;

import com.example.mqttcore.entity.ReceivedMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReceivedMessageRepository extends JpaRepository<ReceivedMessage, Long> {

    Page<ReceivedMessage> findByTopicOrderByReceivedAtDesc(String topic, Pageable pageable);

    Page<ReceivedMessage> findByTopicContainingIgnoreCaseOrderByReceivedAtDesc(String topicFilter, Pageable pageable);

    Page<ReceivedMessage> findAllByOrderByReceivedAtDesc(Pageable pageable);

    @Query("SELECT DISTINCT m.topic FROM ReceivedMessage m ORDER BY m.topic")
    List<String> findDistinctTopics();

    @Query("SELECT m FROM ReceivedMessage m WHERE " +
           "(:topic IS NULL OR m.topic LIKE %:topic%) AND " +
           "(:from IS NULL OR m.receivedAt >= :from) AND " +
           "(:to IS NULL OR m.receivedAt <= :to) " +
           "ORDER BY m.receivedAt DESC")
    Page<ReceivedMessage> search(
            @Param("topic") String topic,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);
}
