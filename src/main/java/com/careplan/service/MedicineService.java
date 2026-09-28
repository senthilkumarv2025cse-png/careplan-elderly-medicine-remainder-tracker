package com.careplan.service;

import com.careplan.dto.MedicineRequest;
import com.careplan.dto.MedicineResponse;
import com.careplan.entity.Medicine;
import com.careplan.exception.ResourceNotFoundException;
import com.careplan.repository.MedicineRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicineService {

    private final MedicineRepository medicineRepository;

    public MedicineService(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    public MedicineResponse create(MedicineRequest request) {
        Medicine medicine = new Medicine();
        apply(medicine, request);
        return toResponse(medicineRepository.save(medicine));
    }

    @Transactional(readOnly = true)
    public List<MedicineResponse> findAll() {
        return medicineRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicineResponse findById(Long id) {
        return toResponse(getMedicine(id));
    }

    public MedicineResponse update(Long id, MedicineRequest request) {
        Medicine medicine = getMedicine(id);
        apply(medicine, request);
        return toResponse(medicineRepository.save(medicine));
    }

    public void delete(Long id) {
        medicineRepository.delete(getMedicine(id));
    }

    private Medicine getMedicine(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", id));
    }

    private void apply(Medicine medicine, MedicineRequest request) {
        medicine.setName(request.name().trim());
        medicine.setDosage(request.dosage().trim());
        medicine.setDescription(request.description() == null ? null : request.description().trim());
    }

    private MedicineResponse toResponse(Medicine medicine) {
        return new MedicineResponse(medicine.getId(), medicine.getName(), medicine.getDosage(),
                medicine.getDescription(), medicine.getCreatedAt());
    }
}