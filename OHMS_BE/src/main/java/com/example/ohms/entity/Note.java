package com.example.ohms.entity;

import jakarta.persistence.*; //inport các cái annotation của JPA như @Entity, @Id
import lombok.*; //dung lombok để từ động sinh getter setter, constructor


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Note {
    @Id // đánh dấu Id là khóa chính của bảng
    @GeneratedValue(strategy = GenerationType.IDENTITY) // dể giá trị id có thể tự động tăng lên () auto- increment
    private Long id;
    @ManyToOne
    private User user;
    private String title;
    private boolean completed = false;
}
