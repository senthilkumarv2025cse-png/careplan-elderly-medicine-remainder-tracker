package com.careplan.controller;

import com.careplan.dto.MedicineRequest;
import com.careplan.dto.MedicineResponse;
import com.careplan.service.MedicineService;
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
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @PostMapping
    public ResponseEntity<MedicineResponse> create(@Valid @RequestBody MedicineRequest request) {
        MedicineResponse medicine = medicineService.create(request);
        return ResponseEntity.created(URI.create("/api/medicines/" + medicine.id())).body(medicine);
    }

    @GetMapping
    public List<MedicineResponse> findAll() {
        return medicineService.findAll();
    }

    @GetMapping("/{id}")
    public MedicineResponse findById(@PathVariable Long id) {
        return medicineService.findById(id);
    }

    @PutMapping("/{id}")
    public MedicineResponse update(@PathVariable Long id, @Valid @RequestBody MedicineRequest request) {
        return medicineService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}