package com.example.ohms;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.entity.Conversation;
import com.example.ohms.entity.RoomChat;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.ConversationMapper;
import com.example.ohms.repository.ConversationRepository;
import com.example.ohms.repository.RoomChatRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.MessageService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for MessageService
 * 
 * Test Coverage:
 * 1. createMessage()
 * 2. getMessage()
 * 3. deleteMessage()
 * 4. update()
 * 5. deleteMessageByRoomId()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MessageService Test Suite")
class MessageServiceTest {

    @Mock
    private ConversationMapper conversationMapper;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private RoomChatRepository roomChatRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MessageService messageService;

    // Test data
    private User user;
    private RoomChat roomChat;
    private Conversation conversation;
    private ConversationRequest conversationRequest;
    private ConversationResponse conversationResponse;

    @BeforeEach
    void setUp() {
        // Setup user
        user = User.builder()
                .id("U001")
                .username("John Doe")
                .email("user@test.com")
                .build();

        // Setup room chat
        roomChat = new RoomChat();
        roomChat.setId("RC001");

        // Setup conversation
        conversation = new Conversation();
        conversation.setId("C001");
        conversation.setRoomChat(roomChat);
        conversation.setUser(user);
        conversation.setMessage("Hello, Doctor!");
        conversation.setCreatedAt(LocalDateTime.now());

        // Setup conversation request
        conversationRequest = ConversationRequest.builder()
                .user("U001")
                .message("Hello, Doctor!")
                .build();

        // Setup conversation response
        conversationResponse = ConversationResponse.builder()
                .id("C001")
                .message("Hello, Doctor!")
                .user(null)
                .imageUrls(null)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ==================== 1. CREATE MESSAGE TESTS ====================

    @Nested
    @DisplayName("1. createMessage()")
    class CreateMessageTests {

        @Test
        @DisplayName("Should create message successfully")
        void shouldCreateMessage_WhenDataIsValid() {
            // Given
            when(conversationMapper.toConversation(conversationRequest)).thenReturn(conversation);
            when(roomChatRepository.findById("RC001")).thenReturn(Optional.of(roomChat));
            when(userRepository.findByIdWithRoles("U001")).thenReturn(Optional.of(user));
            when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
            when(conversationMapper.toConversationResponse(conversation)).thenReturn(conversationResponse);

            // When
            ConversationResponse response = messageService.createMessage("RC001", conversationRequest, null);

            // Then
            assertNotNull(response);
            assertEquals("C001", response.getId());
            assertEquals("Hello, Doctor!", response.getMessage());
            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @DisplayName("Should create message with image URLs")
        void shouldCreateMessage_WithImages() {
            // Given
            List<String> imageUrls = List.of("http://image1.jpg", "http://image2.jpg");

            when(conversationMapper.toConversation(conversationRequest)).thenReturn(conversation);
            when(roomChatRepository.findById("RC001")).thenReturn(Optional.of(roomChat));
            when(userRepository.findByIdWithRoles("U001")).thenReturn(Optional.of(user));
            when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
            when(conversationMapper.toConversationResponse(conversation)).thenReturn(conversationResponse);

            // When
            ConversationResponse response = messageService.createMessage("RC001", conversationRequest, imageUrls);

            // Then
            assertNotNull(response);
            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @DisplayName("Should throw exception when room chat not found")
        void shouldThrowException_WhenRoomChatNotFound() {
            // Given
            when(conversationMapper.toConversation(conversationRequest)).thenReturn(conversation);
            when(roomChatRepository.findById("RC001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.createMessage("RC001", conversationRequest, null);
            });

            assertEquals(ErrorCode.ROOM_CHAT_NOT_FOUND, exception.getErrorCode());
            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowException_WhenUserNotFound() {
            // Given
            when(conversationMapper.toConversation(conversationRequest)).thenReturn(conversation);
            when(roomChatRepository.findById("RC001")).thenReturn(Optional.of(roomChat));
            when(userRepository.findByIdWithRoles("U001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.createMessage("RC001", conversationRequest, null);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 2. GET MESSAGE TESTS ====================

    @Nested
    @DisplayName("2. getMessage()")
    class GetMessageTests {

        @Test
        @DisplayName("Should get all messages in room")
        void shouldGetMessages_WhenRoomExists() {
            // Given
            when(conversationRepository.findByRoomChatIdWithUserAndRoles("RC001"))
                    .thenReturn(List.of(conversation));
            when(conversationMapper.toConversationResponse(conversation)).thenReturn(conversationResponse);

            // When
            List<ConversationResponse> responses = messageService.getMessage("RC001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("C001", responses.get(0).getId());
        }

        @Test
        @DisplayName("Should return empty list when room has no messages")
        void shouldReturnEmptyList_WhenRoomHasNoMessages() {
            // Given
            when(conversationRepository.findByRoomChatIdWithUserAndRoles("RC001"))
                    .thenReturn(List.of());

            // When
            List<ConversationResponse> responses = messageService.getMessage("RC001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 3. DELETE MESSAGE TESTS ====================

    @Nested
    @DisplayName("3. deleteMessage()")
    class DeleteMessageTests {

        @Test
        @DisplayName("Should delete message when within 30 minutes")
        void shouldDeleteMessage_WhenWithin30Minutes() {
            // Given
            conversation.setCreatedAt(LocalDateTime.now().minusMinutes(20));
            when(conversationRepository.findById("C001")).thenReturn(Optional.of(conversation));
            doNothing().when(conversationRepository).deleteById("C001");

            // When
            messageService.deleteMessage("C001");

            // Then
            verify(conversationRepository).deleteById("C001");
        }

        @Test
        @DisplayName("Should throw exception when message older than 30 minutes")
        void shouldThrowException_WhenMessageOlderThan30Minutes() {
            // Given
            conversation.setCreatedAt(LocalDateTime.now().minusMinutes(31));
            when(conversationRepository.findById("C001")).thenReturn(Optional.of(conversation));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.deleteMessage("C001");
            });

            assertEquals(ErrorCode.MESSAGE_CANNOT_DELETE, exception.getErrorCode());
            verify(conversationRepository, never()).deleteById(anyString());
        }

        @Test
        @DisplayName("Should throw exception when message not found for delete")
        void shouldThrowException_WhenMessageNotFoundForDelete() {
            // Given
            when(conversationRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.deleteMessage("INVALID_ID");
            });

            assertEquals(ErrorCode.MESSAGE_NOT_FOUND, exception.getErrorCode());
        }

        // @Test
        // @DisplayName("Should delete message at exactly 30 minutes boundary")
        // void shouldDeleteMessage_AtExactly30Minutes() {
        //     // Given
        //     conversation.setCreatedAt(LocalDateTime.now().minusMinutes(30).minusSeconds(1));
        //     when(conversationRepository.findById("C001")).thenReturn(Optional.of(conversation));
        //     doNothing().when(conversationRepository).deleteById("C001");

        //     // When
        //     messageService.deleteMessage("C001");

        //     // Then
        //     verify(conversationRepository).deleteById("C001");
        // }
    }

    // ==================== 4. UPDATE MESSAGE TESTS ====================

    @Nested
    @DisplayName("4. update()")
    class UpdateMessageTests {

        @Test
        @DisplayName("Should update message when within 30 minutes")
        void shouldUpdateMessage_WhenWithin30Minutes() {
            // Given
            ConversationRequest updateRequest = ConversationRequest.builder()
                    .user("U001")
                    .message("Updated message")
                    .build();

            conversation.setCreatedAt(LocalDateTime.now().minusMinutes(20));
            when(conversationRepository.findById("C001")).thenReturn(Optional.of(conversation));
            when(conversationRepository.save(any(Conversation.class))).thenReturn(conversation);
            when(conversationMapper.toConversationResponse(conversation)).thenReturn(conversationResponse);

            // When
            ConversationResponse response = messageService.update("C001", updateRequest);

            // Then
            assertNotNull(response);
            verify(conversationRepository).save(any(Conversation.class));
        }

        @Test
        @DisplayName("Should throw exception when updating message older than 30 minutes")
        void shouldThrowException_WhenUpdatingOldMessage() {
            // Given
            ConversationRequest updateRequest = ConversationRequest.builder()
                    .user("U001")
                    .message("Updated message")
                    .build();

            conversation.setCreatedAt(LocalDateTime.now().minusMinutes(31));
            when(conversationRepository.findById("C001")).thenReturn(Optional.of(conversation));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.update("C001", updateRequest);
            });

            assertEquals(ErrorCode.MESSAGE_CANNOT_DELETE, exception.getErrorCode());
            verify(conversationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when message not found for update")
        void shouldThrowException_WhenMessageNotFoundForUpdate() {
            // Given
            ConversationRequest updateRequest = ConversationRequest.builder()
                    .user("U001")
                    .message("Updated message")
                    .build();

            when(conversationRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                messageService.update("INVALID_ID", updateRequest);
            });

            assertEquals(ErrorCode.MESSAGE_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 5. DELETE MESSAGES BY ROOM ID TESTS ====================

    @Nested
    @DisplayName("5. deleteMessageByRoomId()")
    class DeleteMessageByRoomIdTests {

        @Test
        @DisplayName("Should delete all messages in room")
        void shouldDeleteAllMessages_InRoom() {
            // Given
            doNothing().when(conversationRepository).deleteByRoomChatId("RC001");

            // When
            messageService.deleteMessageByRoomId("RC001");

            // Then
            verify(conversationRepository).deleteByRoomChatId("RC001");
        }

        @Test
        @DisplayName("Should handle deleting messages from empty room")
        void shouldHandle_DeletingFromEmptyRoom() {
            // Given
            doNothing().when(conversationRepository).deleteByRoomChatId("RC001");

            // When
            messageService.deleteMessageByRoomId("RC001");

            // Then
            verify(conversationRepository).deleteByRoomChatId("RC001");
        }
    }
}
