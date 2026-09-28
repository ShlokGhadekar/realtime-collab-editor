package com.collabeditor.controller;

import com.collabeditor.dto.SaveRequest;
import com.collabeditor.dto.SyncState;
import com.collabeditor.service.RoomSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

// STOMP endpoints for a room; membership is enforced in WebSocketAuthInterceptor
@Controller
@RequiredArgsConstructor
public class CollabController {

    private final RoomSyncService syncService;

    // one-shot reply to the subscriber (SUBSCRIBE /app/room/{code}/state)
    @SubscribeMapping("/room/{code}/state")
    public SyncState state(@DestinationVariable String code) {
        return syncService.getState(code);
    }

    @MessageMapping("/room/{code}/update")
    public void update(@DestinationVariable String code, @Payload String update) {
        syncService.append(code, update);
    }

    // cursors and who's online: relayed as-is, never stored
    @MessageMapping("/room/{code}/awareness")
    @SendTo("/topic/room/{code}/awareness")
    public String awareness(@Payload String update) {
        return update;
    }

    @MessageMapping("/room/{code}/save")
    @SendToUser(destinations = "/queue/saved", broadcast = false)
    public long save(@DestinationVariable String code, @Payload SaveRequest request) {
        syncService.save(code, request);
        return request.seq();
    }
}
