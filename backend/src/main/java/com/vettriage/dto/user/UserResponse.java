package com.vettriage.dto.user;

import com.vettriage.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private Role role;
}
