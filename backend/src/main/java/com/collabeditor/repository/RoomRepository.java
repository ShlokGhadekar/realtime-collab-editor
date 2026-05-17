package com.collabeditor.repository;

import com.collabeditor.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT r FROM Room r JOIN r.members m WHERE m.user.email = :email")
    List<Room> findRoomsByUserEmail(@Param("email") String email);
}