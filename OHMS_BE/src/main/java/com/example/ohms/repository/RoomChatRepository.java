package com.example.ohms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.ohms.entity.RoomChat;

public  interface RoomChatRepository extends JpaRepository<RoomChat, String>{
     @Query("""
        SELECT r FROM RoomChat r 
        JOIN r.user u1 
        JOIN r.user u2 
        WHERE u1.id = :userId1 AND u2.id = :userId2
    """)
    Optional<RoomChat> findRoomByTwoUsers(String userId1, String userId2);
    List<RoomChat> findByUser_Id(String userId);
}
