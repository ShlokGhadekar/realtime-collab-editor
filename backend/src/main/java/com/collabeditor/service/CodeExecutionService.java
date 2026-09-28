package com.collabeditor.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class CodeExecutionService {

    @Value("${jdoodle.client-id}")
    private String clientId;

    @Value("${jdoodle.client-secret}")
    private String clientSecret;

    private final RestClient restClient = RestClient.create("https://api.jdoodle.com/v1");

    // editor language -> { JDoodle language, JDoodle version index }
    private static final Map<String, String[]> LANGUAGE_MAP = Map.of(
            "java", new String[] { "java", "4" },
            "python", new String[] { "python3", "4" },
            "javascript", new String[] { "nodejs", "4" },
            "typescript", new String[] { "nodejs", "4" },
            "cpp", new String[] { "cpp17", "1" },
            "go", new String[] { "go", "4" },
            "rust", new String[] { "rust", "4" });

    public String execute(String code, String language) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            return "Code execution is not configured on this server.";
        }

        String[] langConfig = LANGUAGE_MAP.getOrDefault(language, LANGUAGE_MAP.get("javascript"));
        Map<String, String> request = Map.of(
                "clientId", clientId,
                "clientSecret", clientSecret,
                "script", code,
                "language", langConfig[0],
                "versionIndex", langConfig[1]);

        try {
            Map<?, ?> response = restClient.post()
                    .uri("/execute")
                    .body(request)
                    .retrieve()
                    .body(Map.class);
            if (response == null)
                return "No response from execution engine";
            Object output = response.get("output");
            return output != null ? output.toString() : "No output";
        } catch (Exception e) {
            return "Execution error: " + e.getMessage();
        }
    }
}
