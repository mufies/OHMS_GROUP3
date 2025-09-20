package com.example.ohms.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.ohms.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation,String>  {
   List<Conversation> findByRoomChatId(String roomId);
   void deleteByRoomChatId(String roomId);
}
