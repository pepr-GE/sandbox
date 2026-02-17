package com.example.mqttcore.config;

import com.example.mqttcore.entity.AppUser;
import com.example.mqttcore.entity.Role;
import com.example.mqttcore.repository.AppUserRepository;
import com.example.mqttcore.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role adminRole = createRoleIfAbsent("ADMIN", "Full administrative access");
        Role userRole  = createRoleIfAbsent("USER",  "Standard user access - can view messages");

        if (!userRepository.existsByUsername("admin")) {
            AppUser admin = new AppUser("admin",
                    passwordEncoder.encode("admin123"),
                    "admin@example.com");
            admin.setRoles(Set.of(adminRole, userRole));
            userRepository.save(admin);
            log.info("Default admin user created (username: admin, password: admin123) - CHANGE THIS IN PRODUCTION");
        }
    }

    private Role createRoleIfAbsent(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role(name, description);
            Role saved = roleRepository.save(role);
            log.info("Created role: {}", name);
            return saved;
        });
    }
}
