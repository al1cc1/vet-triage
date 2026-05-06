package com.vettriage.dto.user;

import lombok.Data;

@Data
public class CreateDoctorRequest {
    private String email;
    private String pin;
}
