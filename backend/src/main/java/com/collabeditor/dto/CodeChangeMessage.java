package com.collabeditor.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeChangeMessage {
    private String roomCode; // which room this edit belongs to
    private String content; // the full code content after the edit
    private String senderUsername; // who made the edit
    private String language; // programming language
    private long timestamp; // when the edit happened
}