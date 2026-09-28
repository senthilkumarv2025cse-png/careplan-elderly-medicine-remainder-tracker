package com.careplan.controller;

import com.careplan.dto.ScheduleRequest;
import com.careplan.dto.ScheduleResponse;
import com.careplan.service.ScheduleService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping("/schedules")
    public ResponseEntity<ScheduleResponse> create(@Valid @RequestBody ScheduleRequest request) {
        ScheduleResponse schedule = scheduleService.create(request);
        return ResponseEntity.created(URI.create("/api/schedules/" + schedule.id())).body(schedule);
    }

    @GetMapping("/schedules/{id}")
    public ScheduleResponse findById(@PathVariable Long id) {
        return scheduleService.findById(id);
    }

    @GetMapping("/patients/{patientId}/schedules")
    public List<ScheduleResponse> findByPatientId(@PathVariable Long patientId) {
        return scheduleService.findByPatientId(patientId);
    }

    @PutMapping("/schedules/{id}")
    public ScheduleResponse update(@PathVariable Long id, @Valid @RequestBody ScheduleRequest request) {
        return scheduleService.update(id, request);
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/schedules/{id}/activate")
    public ScheduleResponse activate(@PathVariable Long id) {
        return scheduleService.activate(id);
    }

    @PatchMapping("/schedules/{id}/deactivate")
    public ScheduleResponse deactivate(@PathVariable Long id) {
        return scheduleService.deactivate(id);
    }
}