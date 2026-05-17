package com.collabeditor.repository;

import com.collabeditor.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

    long countByRoomId(Long roomId);
}
