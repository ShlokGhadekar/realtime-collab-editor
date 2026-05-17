package com.collabeditor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String code;
    private String language;
    private String ownerUsername;
    private String content;
    private List<String> memberUsernames;
    private long memberCount;
    private LocalDateTime createdAt;
}
