package com.collabeditor.dto;

// client snapshot covering every log entry before `seq`, plus plain text for previews and execution
public record SaveRequest(long seq, String state, String content, String language) {
}
