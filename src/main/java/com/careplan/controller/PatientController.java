package com.careplan.controller;

import com.careplan.dto.PatientRequest;
import com.careplan.dto.PatientResponse;
import com.careplan.service.PatientService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody PatientRequest request) {
        PatientResponse patient = patientService.create(request);
        return ResponseEntity.created(URI.create("/api/patients/" + patient.id())).body(patient);
    }

    @GetMapping
    public List<PatientResponse> findAll() {
        return patientService.findAll();
    }

    @GetMapping("/{id}")
    public PatientResponse findById(@PathVariable Long id) {
        return patientService.findById(id);
    }

    @PutMapping("/{id}")
    public PatientResponse update(@PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        return patientService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}