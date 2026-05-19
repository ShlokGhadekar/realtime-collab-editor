package com.collabeditor.controller;

import com.collabeditor.dto.request.CreateRoomRequest;
import com.collabeditor.dto.response.RoomResponse;
import com.collabeditor.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;

    @PostMapping("/create")
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return ResponseEntity.ok(roomService.createRoom(request));
    }

    @PostMapping("/join/{code}")
    public ResponseEntity<RoomResponse> joinRoom(@PathVariable String code) {
        return ResponseEntity.ok(roomService.joinRoom(code));
    }

    @GetMapping("/my-rooms")
    public ResponseEntity<List<RoomResponse>> getMyRooms() {
        return ResponseEntity.ok(roomService.getMyRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<String> getRoomContent(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomContent(id));
    }

    @PutMapping("/{id}/save")
    public ResponseEntity<Void> saveContent(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        roomService.saveContent(id, body.get("content"));
        return ResponseEntity.ok().build();
    }
}