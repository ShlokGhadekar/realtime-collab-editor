package com.collabeditor.service;

import com.collabeditor.dto.SaveRequest;
import com.collabeditor.dto.SyncState;
import com.collabeditor.dto.SyncUpdate;
import com.collabeditor.entity.Room;
import com.collabeditor.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orders and stores Yjs updates per room. The server never merges or parses
 * updates (the CRDT does that on the clients); it only:
 *   1. stamps every update with a sequence number and broadcasts it,
 *   2. keeps the log so a joining client can catch up,
 *   3. accepts client snapshots to compact the log and persist the room.
 *
 * The log lives in memory, so this assumes a single backend instance.
 */
@Service
@RequiredArgsConstructor
public class RoomSyncService {

    private final RoomRepository roomRepository;
    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<String, RoomLog> rooms = new ConcurrentHashMap<>();

    // snapshot covers every update before baseSeq; tail holds baseSeq, baseSeq + 1, ...
    private static class RoomLog {
        String snapshot;
        long baseSeq;
        final List<String> tail = new ArrayList<>();

        long nextSeq() {
            return baseSeq + tail.size();
        }
    }

    public SyncState getState(String roomCode) {
        RoomLog log = load(roomCode);
        synchronized (log) {
            return new SyncState(log.snapshot, List.copyOf(log.tail), log.nextSeq());
        }
    }

    public void append(String roomCode, String update) {
        RoomLog log = load(roomCode);
        // appending and publishing under one lock keeps broadcast order == seq order
        synchronized (log) {
            long seq = log.nextSeq();
            log.tail.add(update);
            messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/updates", new SyncUpdate(seq, update));
        }
    }

    public void save(String roomCode, SaveRequest request) {
        RoomLog log = load(roomCode);
        synchronized (log) {
            // ignore snapshots older than the one we already have (or from a previous server run)
            if (request.seq() <= log.baseSeq || request.seq() > log.nextSeq()) {
                return;
            }
            log.tail.subList(0, (int) (request.seq() - log.baseSeq)).clear();
            log.baseSeq = request.seq();
            log.snapshot = request.state();
            // persisted inside the lock so an older snapshot can never overwrite a newer one
            roomService.saveSnapshot(roomCode, request.state(), request.content(), request.language());
        }
    }

    private RoomLog load(String roomCode) {
        return rooms.computeIfAbsent(roomCode, code -> {
            RoomLog log = new RoomLog();
            log.snapshot = roomRepository.findByCode(code).map(Room::getYjsState).orElse(null);
            return log;
        });
    }
}
