package com.example.ohms.service;

import com.example.ohms.dto.request.NoteRequest;
import com.example.ohms.dto.response.NoteResponse;
import com.example.ohms.entity.Note;
import com.example.ohms.repository.NoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {
    private final NoteRepository repo;

    public NoteService(NoteRepository repo) {
        this.repo = repo;
    }

    // ✅ Lấy tất cả note
    public List<NoteResponse> getAll() {
        return repo.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ✅ Tạo mới note
    public NoteResponse add(NoteRequest request) {
        Note note = new Note();
        note.setDate(request.getDate());
        note.setNote(request.getNote());
        note.setTime(request.getTime());
        note.setCompleted(request.isCompleted());


        Note saved = repo.save(note);
        return mapToResponse(saved);
    }

    // ✅ Xoá note
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ✅ Đổi trạng thái
    public NoteResponse toggle(Long id) {
        Note note = repo.findById(id).orElseThrow();
        note.setCompleted(!note.isCompleted());
        Note saved = repo.save(note);
        return mapToResponse(saved);
    }


    // ✅ Helper
    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .date(note.getDate())
                .note(note.getNote())
                .time(note.getTime())
                .completed(note.isCompleted())
                .build();
    }
}
