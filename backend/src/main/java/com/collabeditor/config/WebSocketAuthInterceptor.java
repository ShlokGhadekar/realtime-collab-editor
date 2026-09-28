package com.collabeditor.config;

import com.collabeditor.repository.RoomMemberRepository;
import com.collabeditor.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    // /topic/room/{code}/... (broadcasts) and /app/room/{code}/... (handlers)
    private static final Pattern ROOM_DESTINATION = Pattern.compile("^/(?:topic|app)/room/([A-Z0-9]+)/[a-z]+$");

    private final JwtUtil jwtUtil;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        switch (accessor.getCommand()) {
            case CONNECT -> accessor.setUser(authenticate(accessor));
            case SUBSCRIBE, SEND -> authorize(accessor);
            default -> { }
        }
        return message;
    }

    // the user set here is remembered for the rest of the WebSocket session
    private Principal authenticate(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Missing token");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new AccessDeniedException("Invalid token");
        }
        return new UsernamePasswordAuthenticationToken(
                jwtUtil.extractEmail(token), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    // only room members may subscribe to or send on a room's destinations
    @SuppressWarnings("unchecked")
    private void authorize(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        String destination = accessor.getDestination();
        if (user == null || destination == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        if (destination.startsWith("/user/queue/")) {
            return;
        }

        Matcher matcher = ROOM_DESTINATION.matcher(destination);
        if (!matcher.matches()) {
            throw new AccessDeniedException("Unknown destination: " + destination);
        }
        String roomCode = matcher.group(1);

        // cache per session so we hit the database once per room, not once per keystroke
        Set<String> allowedRooms = (Set<String>) accessor.getSessionAttributes()
                .computeIfAbsent("allowedRooms", key -> ConcurrentHashMap.newKeySet());
        if (allowedRooms.contains(roomCode)) {
            return;
        }
        if (!roomMemberRepository.existsByRoomCodeAndUserEmail(roomCode, user.getName())) {
            throw new AccessDeniedException("Not a member of room " + roomCode);
        }
        allowedRooms.add(roomCode);
    }
}
