package com.collabeditor.repository;

import com.collabeditor.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    boolean existsByRoomCodeAndUserEmail(String roomCode, String userEmail);
}
