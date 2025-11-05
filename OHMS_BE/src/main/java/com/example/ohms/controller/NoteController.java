package com.example.ohms.controller;

import com.example.ohms.dto.request.NoteRequest;
import com.example.ohms.dto.response.NoteResponse;
import com.example.ohms.service.NoteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/notes")
public class NoteController {
    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @GetMapping
    public List<NoteResponse> getAll() {
        return service.getAll();
    }

    @PostMapping
    public NoteResponse add(@RequestBody NoteRequest note) {
        return service.add(note);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/{id}/toggle")
    public NoteResponse toggle(@PathVariable Long id) {
        return service.toggle(id);
    }
}
