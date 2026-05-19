package com.collabeditor.service;

import com.collabeditor.dto.request.CreateRoomRequest;
import com.collabeditor.dto.response.RoomResponse;
import com.collabeditor.entity.Room;
import com.collabeditor.entity.RoomMember;
import com.collabeditor.entity.User;
import com.collabeditor.repository.RoomMemberRepository;
import com.collabeditor.repository.RoomRepository;
import com.collabeditor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;

    // gets the currently logged-in user from the JWT context
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        User currentUser = getCurrentUser();

        // generate a unique code — retry if collision (extremely rare)
        String code;
        do {
            code = Room.generateCode();
        } while (roomRepository.existsByCode(code));

        Room room = new Room();
        room.setName(request.getName());
        room.setCode(code);
        room.setLanguage(request.getLanguage());
        room.setOwner(currentUser);
        roomRepository.save(room);

        // owner automatically joins their own room
        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(currentUser);
        roomMemberRepository.save(member);

        return toResponse(room);
    }

    @Transactional
    public RoomResponse joinRoom(String code) {
        User currentUser = getCurrentUser();

        Room room = roomRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Room not found with code: " + code));

        // check if already a member
        if (roomMemberRepository.existsByRoomIdAndUserId(room.getId(), currentUser.getId())) {
            return toResponse(room); // already in room, just return it
        }

        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(currentUser);
        roomMemberRepository.save(member);

        return toResponse(room);
    }

    public List<RoomResponse> getMyRooms() {
        User currentUser = getCurrentUser();
        return roomRepository.findRoomsByUserEmail(currentUser.getEmail())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return toResponse(room);
    }

    @Transactional
    public void updateRoomContent(String roomCode, String content) {
        Room room = roomRepository.findByCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomCode));
        room.setContent(content);
        roomRepository.save(room);
    }

    private RoomResponse toResponse(Room room) {
        List<String> memberUsernames = room.getMembers().stream()
                .map(m -> m.getUser().getUsername())
                .toList();

        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCode(),
                room.getLanguage(),
                room.getContent(), // add this
                room.getOwner().getUsername(),
                memberUsernames,
                memberUsernames.size(),
                room.getCreatedAt());
    }

    public String getRoomContent(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return room.getContent();
    }

    @Transactional
    public void saveContent(Long roomId, String content) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setContent(content);
        roomRepository.save(room);
    }
}
