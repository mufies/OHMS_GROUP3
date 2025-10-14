package com.example.ohms.entity;


import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

// V
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "role", schema = "swpbackend")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {
   @Id
   String name;
   String description;
   @ManyToMany
   Set<Permission> permissions;
}
