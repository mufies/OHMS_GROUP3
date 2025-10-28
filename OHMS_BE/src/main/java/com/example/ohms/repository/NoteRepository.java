package com.example.ohms.repository;
// Repository = cầu nối giữa ứng dụng với database

import com.example.ohms.entity.Note; // inport  entity Task để ch reository biết kiểu dữ liệu mình làm việc với
import org.springframework.data.jpa.repository.JpaRepository; //
import org.springframework.scheduling.config.Task;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, String>{
    // Tạo interface Repository. kế thừa JpaRepository
    // Tham số đầu tin là kiểu Entity (Task)
    // Tham số thứ 2 là kiểu khóa chính (Long)

    // Không cần viết code đây vì JPA sẽ tự sinh hàm CRUD

    List<Note> findByUserId(String userId);
}
