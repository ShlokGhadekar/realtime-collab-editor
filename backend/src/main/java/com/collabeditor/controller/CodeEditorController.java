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
        // use principal if available, otherwise use sender from message
        String sender = (principal != null) ? principal.getName() : message.getSenderUsername();
        message.setSenderUsername(sender);
        message.setTimestamp(Instant.now().toEpochMilli());

        roomService.updateRoomContent(message.getRoomCode(), message.getContent());

        messagingTemplate.convertAndSend(
                "/topic/room/" + message.getRoomCode(),
                message);
    }

    @MessageMapping("/room/presence")
    public void handlePresence(@Payload UserPresenceMessage message,
            Principal principal) {
        String sender = (principal != null) ? principal.getName() : message.getUsername();
        message.setUsername(sender);
        message.setTimestamp(Instant.now().toEpochMilli());

        messagingTemplate.convertAndSend(
                "/topic/room/" + message.getRoomCode() + "/presence",
                message);
    }
}
