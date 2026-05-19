package com.collabeditor.controller;

import com.collabeditor.dto.request.ExecuteRequest;
import com.collabeditor.service.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execute")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExecutionController {

    private final CodeExecutionService codeExecutionService;

    @PostMapping
    public ResponseEntity<String> execute(@RequestBody ExecuteRequest request) {
        String output = codeExecutionService.execute(request.getCode(), request.getLanguage());
        return ResponseEntity.ok(output);
    }
}