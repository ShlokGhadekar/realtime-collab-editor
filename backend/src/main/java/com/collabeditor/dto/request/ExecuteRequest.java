package com.collabeditor.dto.request;

import lombok.Data;

@Data
public class ExecuteRequest {
    private String code;
    private String language;
}