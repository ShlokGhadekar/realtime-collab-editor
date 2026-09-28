package com.collabeditor.dto;

import java.util.List;

// full room state sent to a client when it (re)joins: snapshot + every update since, all base64 Yjs updates
public record SyncState(String snapshot, List<String> updates, long nextSeq) {
}
