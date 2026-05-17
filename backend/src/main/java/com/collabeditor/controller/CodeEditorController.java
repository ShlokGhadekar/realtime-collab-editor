package com.collabeditor.controller;

import com.collabeditor.dto.CodeChangeMessage;
import com.collabeditor.dto.UserPresenceMessage;
import com.collabeditor.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

@Controller
@RequiredArgsConstructor
public class CodeEditorController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    // called when a user sends a code change
    // listens at /app/room/edit
    @MessageMapping("/room/edit")
    public void handleCodeChange(@Payload CodeChangeMessage message,
            Principal principal) {
        // stamp who sent it and when
        message.setSenderUsername(principal.getName());
        message.setTimestamp(Instant.now().toEpochMilli());

        // save the latest content to database
        roomService.updateRoomContent(message.getRoomCode(), message.getContent());

        // broadcast to everyone subscribed to this room's topic
        messagingTemplate.convertAndSend(
                "/topic/room/" + message.getRoomCode(),
                message);
    }

    // called when a user joins or leaves a room
    // listens at /app/room/presence
    @MessageMapping("/room/presence")
    public void handlePresence(@Payload UserPresenceMessage message,
            Principal principal) {
        message.setUsername(principal.getName());
        message.setTimestamp(Instant.now().toEpochMilli());

        messagingTemplate.convertAndSend(
                "/topic/room/" + message.getRoomCode() + "/presence",
                message);
    }
}
