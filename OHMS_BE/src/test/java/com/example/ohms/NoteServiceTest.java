// package com.example.ohms;

// import com.example.ohms.dto.request.NoteRequest;
// import com.example.ohms.dto.response.NoteResponse;
// import com.example.ohms.entity.Note;
// import com.example.ohms.entity.User;
// import com.example.ohms.repository.NoteRepository;
// import com.example.ohms.repository.UserRepository;
// import com.example.ohms.service.NoteService;

// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Nested;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.junit.jupiter.MockitoExtension;

// import java.util.List;
// import java.util.Optional;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.*;

// /**
//  * Complete Test Suite for NoteService
//  * 
//  * Test Coverage:
//  * 1. getAll()
//  * 2. add()
//  * 3. delete()
//  * 4. toggle()
//  */
// @ExtendWith(MockitoExtension.class)
// @DisplayName("NoteService Test Suite")
// class NoteServiceTest {

//     @Mock
//     private NoteRepository repo;

//     @Mock
//     private UserRepository userRepository;

//     @InjectMocks
//     private NoteService noteService;

//     // Test data
//     private User user;
//     private Note note;
//     private NoteRequest noteRequest;

//     @BeforeEach
//     void setUp() {
//         // Setup user
//         user = User.builder()
//                 .id("U001")
//                 .username("John Doe")
//                 .email("user@test.com")
//                 .build();

//         // Setup note
//         note = new Note();
//         note.setId(1L);
//         note.setTitle("Test Note");
//         note.setUser(user);
//         note.setCompleted(false);

//         // Setup note request
//         noteRequest = new NoteRequest();
//         noteRequest.setUserId("U001");
//         noteRequest.setTitle("Test Note");
//         noteRequest.setCompleted(false);
//     }

//     // ==================== 1. GET ALL NOTES TESTS ====================

//     @Nested
//     @DisplayName("1. getAll()")
//     class GetAllNotesTests {

//         @Test
//         @DisplayName("Should get all notes successfully")
//         void shouldGetAllNotes_Successfully() {
//             // Given
//             Note note2 = new Note();
//             note2.setId(2L);
//             note2.setTitle("Second Note");
//             note2.setCompleted(true);

//             when(repo.findAll()).thenReturn(List.of(note, note2));

//             // When
//             List<NoteResponse> responses = noteService.getAll();

//             // Then
//             assertNotNull(responses);
//             assertEquals(2, responses.size());
//             assertEquals(1L, responses.get(0).getId());
//             assertEquals(2L, responses.get(1).getId());
//         }

//         @Test
//         @DisplayName("Should return empty list when no notes")
//         void shouldReturnEmptyList_WhenNoNotes() {
//             // Given
//             when(repo.findAll()).thenReturn(List.of());

//             // When
//             List<NoteResponse> responses = noteService.getAll();

//             // Then
//             assertNotNull(responses);
//             assertTrue(responses.isEmpty());
//         }

//         @Test
//         @DisplayName("Should map notes correctly")
//         void shouldMapNotes_Correctly() {
//             // Given
//             when(repo.findAll()).thenReturn(List.of(note));

//             // When
//             List<NoteResponse> responses = noteService.getAll();

//             // Then
//             assertEquals("Test Note", responses.get(0).getTitle());
//             assertFalse(responses.get(0).isCompleted());
//         }
//     }

//     // ==================== 2. ADD NOTE TESTS ====================

//     @Nested
//     @DisplayName("2. add()")
//     class AddNoteTests {

//         @Test
//         @DisplayName("Should add note successfully")
//         void shouldAddNote_Successfully() {
//             // Given
//             when(userRepository.findById("U001")).thenReturn(Optional.of(user));
//             when(repo.save(any(Note.class))).thenReturn(note);

//             // When
//             NoteResponse response = noteService.add(noteRequest);

//             // Then
//             assertNotNull(response);
//             assertEquals(1L, response.getId());
//             assertEquals("Test Note", response.getTitle());
//             verify(repo).save(any(Note.class));
//         }

//         @Test
//         @DisplayName("Should set completed to false by default")
//         void shouldSetCompletedFalse_ByDefault() {
//             // Given
//             when(userRepository.findById("U001")).thenReturn(Optional.of(user));
//             when(repo.save(any(Note.class))).thenReturn(note);

//             // When
//             NoteResponse response = noteService.add(noteRequest);

//             // Then
//             assertFalse(response.isCompleted());
//         }

//         @Test
//         @DisplayName("Should throw exception when user not found")
//         void shouldThrowException_WhenUserNotFound() {
//             // Given
//             when(userRepository.findById("U001")).thenReturn(Optional.empty());

//             // When & Then
//             assertThrows(RuntimeException.class, () -> {
//                 noteService.add(noteRequest);
//             });

//             verify(repo, never()).save(any());
//         }

//         @Test
//         @DisplayName("Should add note with completed true")
//         void shouldAddNote_WithCompletedTrue() {
//             // Given
//             NoteRequest completedRequest = new NoteRequest();
//             completedRequest.setUserId("U001");
//             completedRequest.setTitle("Completed Note");
//             completedRequest.setCompleted(true);

//             Note completedNote = new Note();
//             completedNote.setId(3L);
//             completedNote.setTitle("Completed Note");
//             completedNote.setCompleted(true);

//             when(userRepository.findById("U001")).thenReturn(Optional.of(user));
//             when(repo.save(any(Note.class))).thenReturn(completedNote);

//             // When
//             NoteResponse response = noteService.add(completedRequest);

//             // Then
//             assertTrue(response.isCompleted());
//         }
//     }

//     // ==================== 3. DELETE NOTE TESTS ====================

//     @Nested
//     @DisplayName("3. delete()")
//     class DeleteNoteTests {

//         @Test
//         @DisplayName("Should delete note successfully")
//         void shouldDeleteNote_Successfully() {
//             // Given
//             doNothing().when(repo).deleteById("N001");

//             // When
//             noteService.delete("N001");

//             // Then
//             verify(repo).deleteById("N001");
//         }

//         @Test
//         @DisplayName("Should handle deleting non-existent note")
//         void shouldHandle_DeletingNonExistentNote() {
//             // Given
//             doNothing().when(repo).deleteById("INVALID_ID");

//             // When
//             noteService.delete("INVALID_ID");

//             // Then
//             verify(repo).deleteById("INVALID_ID");
//         }
//     }

//     // ==================== 4. TOGGLE NOTE TESTS ====================

//     @Nested
//     @DisplayName("4. toggle()")
//     class ToggleNoteTests {

//         @Test
//         @DisplayName("Should toggle note from false to true")
//         void shouldToggleNote_FromFalseToTrue() {
//             // Given
//             note.setCompleted(false);
//             when(repo.findById("N001")).thenReturn(Optional.of(note));
//             when(repo.save(any(Note.class))).thenReturn(note);

//             // When
//             NoteResponse response = noteService.toggle("N001");

//             // Then
//             assertNotNull(response);
//             verify(repo).save(argThat(n -> n.isCompleted()));
//         }

//         @Test
//         @DisplayName("Should toggle note from true to false")
//         void shouldToggleNote_FromTrueToFalse() {
//             // Given
//             note.setCompleted(true);
//             when(repo.findById("N001")).thenReturn(Optional.of(note));
//             when(repo.save(any(Note.class))).thenReturn(note);

//             // When
//             NoteResponse response = noteService.toggle("N001");

//             // Then
//             assertNotNull(response);
//             verify(repo).save(argThat(n -> !n.isCompleted()));
//         }

//         @Test
//         @DisplayName("Should throw exception when note not found for toggle")
//         void shouldThrowException_WhenNoteNotFoundForToggle() {
//             // Given
//             when(repo.findById("INVALID_ID")).thenReturn(Optional.empty());

//             // When & Then
//             assertThrows(Exception.class, () -> {
//                 noteService.toggle("INVALID_ID");
//             });
//         }

//         @Test
//         @DisplayName("Should toggle multiple times correctly")
//         void shouldToggleMultipleTimes_Correctly() {
//             // Given
//             note.setCompleted(false);
//             when(repo.findById("N001")).thenReturn(Optional.of(note));
//             when(repo.save(any(Note.class))).thenReturn(note);

//             // When - Toggle first time
//             noteService.toggle("N001");
//             note.setCompleted(true);
            
//             // Toggle second time
//             noteService.toggle("N001");

//             // Then
//             verify(repo, times(2)).save(any(Note.class));
//         }
//     }
// }
