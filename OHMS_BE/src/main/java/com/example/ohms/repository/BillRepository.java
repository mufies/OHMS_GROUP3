package com.example.ohms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Bill;

public  interface BillRepository extends JpaRepository<Bill,String> {
   List<Bill> findByPatient_Id(String id);
   
}
