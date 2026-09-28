package com.collabeditor.dto;

// one Yjs update (base64) stamped with its position in the room's log
public record SyncUpdate(long seq, String update) {
}
