package com.collabeditor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    @Value("${jdoodle.client-id}")
    private String clientId;

    @Value("${jdoodle.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate;

    private static final Map<String, String[]> LANGUAGE_MAP = new HashMap<>() {
        {
            put("java", new String[] { "java", "4" });
            put("python", new String[] { "python3", "4" });
            put("javascript", new String[] { "nodejs", "4" });
            put("cpp", new String[] { "cpp17", "1" });
            put("go", new String[] { "go", "4" });
            put("rust", new String[] { "rust", "4" });
            put("typescript", new String[] { "nodejs", "4" });
        }
    };

    public String execute(String code, String language) {
        String[] langConfig = LANGUAGE_MAP.getOrDefault(language, new String[] { "nodejs", "4" });

        Map<String, String> request = new HashMap<>();
        request.put("clientId", clientId);
        request.put("clientSecret", clientSecret);
        request.put("script", code);
        request.put("language", langConfig[0]);
        request.put("versionIndex", langConfig[1]);

        try {
            Map<?, ?> response = restTemplate.postForObject(
                    "https://api.jdoodle.com/v1/execute",
                    request,
                    Map.class);
            if (response == null)
                return "No response from execution engine";
            Object output = response.get("output");
            return output != null ? output.toString() : "No output";
        } catch (Exception e) {
            return "Execution error: " + e.getMessage();
        }
    }
}