package com.collabeditor.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPresenceMessage {
    private String roomCode;
    private String username;
    private String event; // "JOINED" or "LEFT"
    private long timestamp;
}
