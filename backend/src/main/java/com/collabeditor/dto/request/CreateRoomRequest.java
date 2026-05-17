package com.collabeditor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoomRequest {

    @NotBlank
    @Size(min = 2, max = 50)
    private String name;

    private String language = "javascript";
}