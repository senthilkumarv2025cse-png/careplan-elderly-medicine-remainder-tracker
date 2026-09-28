package com.careplan.controller;

import com.careplan.dto.DoseLogRequest;
import com.careplan.dto.DoseLogResponse;
import com.careplan.service.DoseService;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DoseLogController {

    private final DoseService doseService;

    public DoseLogController(DoseService doseService) {
        this.doseService = doseService;
    }

    @PostMapping("/doses")
    public ResponseEntity<DoseLogResponse> create(@RequestBody DoseLogRequest request) {
        DoseLogResponse doseLog = doseService.create(request);
        return ResponseEntity.created(URI.create("/api/doses/" + doseLog.id())).body(doseLog);
    }

    @GetMapping("/patients/{patientId}/doses/today")
    public List<DoseLogResponse> getTodaysExpectedDoses(@PathVariable Long patientId) {
        return doseService.getTodaysExpectedDoses(patientId);
    }

    @PutMapping("/doses/{doseId}/taken")
    public DoseLogResponse markAsTaken(@PathVariable Long doseId) {
        return doseService.markAsTaken(doseId);
    }
}