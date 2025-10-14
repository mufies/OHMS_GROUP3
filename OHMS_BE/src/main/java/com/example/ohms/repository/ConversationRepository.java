package com.example.ohms.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.ohms.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation,String>  {
   List<Conversation> findByRoomChatId(String roomId);
   void deleteByRoomChatId(String roomId);
   
   @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.user u LEFT JOIN FETCH u.roles WHERE c.roomChat.id = :roomId ORDER BY c.createdAt")
   List<Conversation> findByRoomChatIdWithUserAndRoles(@Param("roomId") String roomId);
}
