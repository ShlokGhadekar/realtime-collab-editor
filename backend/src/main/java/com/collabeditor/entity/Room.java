package com.collabeditor.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code; // the join code, e.g. "AB3X9K"

    @Column(columnDefinition = "TEXT")
    private String content = ""; // the actual code being edited

    @Column(nullable = false)
    private String language = "javascript"; // syntax highlighting language

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; // who created the room

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomMember> members = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // generates a random 6-character join code
    public static String generateCode() {
        return UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase();
    }
}