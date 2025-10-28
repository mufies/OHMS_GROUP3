package com.example.ohms.service;

import com.example.ohms.dto.request.NoteRequest;
import com.example.ohms.dto.response.NoteResponse;
import com.example.ohms.entity.Note;
import com.example.ohms.entity.User;
import com.example.ohms.repository.NoteRepository;
import com.example.ohms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {
    private final NoteRepository repo;
    private final UserRepository userRepository;

    public NoteService(NoteRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    // Lấy tất cả note
    public List<NoteResponse> getAll() {
        return repo.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Tạo note mới
    public NoteResponse add(NoteRequest noteRequest) {
        User user = userRepository.findById(noteRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = new Note();
        note.setTitle(noteRequest.getTitle()); // ✅ sửa lại dòng này
        note.setUser(user);
        note.setCompleted(noteRequest.isCompleted());

        Note saved = repo.save(note);
        return mapToResponse(saved);
    }

    // Xoá note
    public void delete(String id) {
        repo.deleteById(id);
    }

    // Đảo trạng thái completed
    public NoteResponse toggle(String id) {
        Note note = repo.findById(id).orElseThrow();
        note.setCompleted(!note.isCompleted());
        Note saved = repo.save(note);
        return mapToResponse(saved);
    }

    // Helper: map entity -> response
    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .completed(note.isCompleted())
                .build();
    }
}
