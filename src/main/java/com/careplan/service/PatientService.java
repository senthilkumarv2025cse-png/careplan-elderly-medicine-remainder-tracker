package com.careplan.service;

import com.careplan.dto.PatientRequest;
import com.careplan.dto.PatientResponse;
import com.careplan.entity.Patient;
import com.careplan.exception.ResourceNotFoundException;
import com.careplan.repository.PatientRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public PatientResponse create(PatientRequest request) {
        Patient patient = new Patient();
        apply(patient, request);
        return toResponse(patientRepository.save(patient));
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long id) {
        return toResponse(getPatient(id));
    }

    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = getPatient(id);
        apply(patient, request);
        return toResponse(patientRepository.save(patient));
    }

    public void delete(Long id) {
        patientRepository.delete(getPatient(id));
    }

    private Patient getPatient(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
    }

    private void apply(Patient patient, PatientRequest request) {
        patient.setName(request.name().trim());
        patient.setAge(request.age());
        patient.setPhone(request.phone().trim());
        patient.setAddress(request.address().trim());
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(patient.getId(), patient.getName(), patient.getAge(),
                patient.getPhone(), patient.getAddress(), patient.getCreatedAt());
    }
}