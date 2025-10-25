# AI-Assisted Unit Testing - Complete Evidence Documentation

## 📌 Project Information

**Project:** OAHCS (Online appointment and consultation of hospital system)
**Module:** AppointmentService Unit Testing  
**Date:** October 25, 2025  
**AI Tool:** Claude Sonet 4.5 AI  
**Final Achievement:** 96% instruction coverage, 80% branch coverage, 52 test cases

---

## 📝 Section 1: Successful Prompts & Deliverables

### 1.1 Service Analysis Prompt

**My Prompt:**
```
[Pasted AppointmentService.java - 400+ lines]

Base on this service function, identify:
1. Main functionality
2. Input parameters and types
3. Expected return values
4. Potential edge cases
5. Dependencies that need mocking
```

**AI Response:** ✅ Generated complete analysis table with 15 methods  
**Deliverable:** Method analysis document  
**Time:** 2 minutes

***

### 1.2 Test Case Generation Prompt

**My Prompt:**
```
Base on service function. Generate me testcase for each function inside it.
Use Given-When-Then pattern to make it clear and easy to understand.
Include enough scenario like:
- Happy path scenarios
- Edge cases (boundary values)
- Error scenarios
- Integration
```

**AI Response:** ✅ Generated 52 test case specifications  
**Deliverable:** Complete test scenarios with Given-When-Then format  
**Time:** 3 minutes

---

### 1.3 Test Matrix Visualization Prompt

**My Prompt:**
```
give me a test case matrix for createAppointment
```

**AI Response:** ✅ Professional test case table  
**Deliverable:** Test matrix (16 scenarios for createAppointment)  
**Time:** 1 minute

***

### 1.4 JUnit Code Generation Prompt

**My Prompt:**
```
Base on the unit test case you generated. Create JUnit code to test all function inside AppointmentService. 

Need to:
- Generate mock data
- Comment clearly
- Name of the function clean enough to understand the mean of test function
```

**AI Response:** ✅ Complete JUnit test class (2000+ lines)  
**Deliverable:** AppointmentServiceTest.java  
**Time:** 5 minutes

***

### 1.5 Code Restructuring Prompt

**My Prompt:**
```
cấu trúc code lại cho nó theo thứ tự func trong service
```

**AI Response:** ✅ Reorganized tests to match service method order  
**Deliverable:** Better organized test file  
**Time:** 2 minutes

***



## 🐛 Section 2: Error Prompts & Solutions

### ERROR #1: MockitoException - doNothing()

**My Prompt:**
```
org.mockito.exceptions.base.MockitoException: 
Only void methods can doNothing()!
Example of correct use of doNothing():
    doNothing().
    doThrow(new RuntimeException())
    .when(mock).someVoidMethod();
Above means:
someVoidMethod() does nothing the 1st time but throws an exception the 2nd time
```

**AI Analysis:**
- Identified wrong usage of doNothing() on non-void method
- Explained void vs non-void method mocking

**AI Solution:**
```java
// ❌ Wrong
doNothing().when(roomChatService).createRoomChat(any());

// ✅ Correct
when(roomChatService.createRoomChat(any())).thenReturn(null);
```

**Result:** ✅ Fixed - Test now passes  
**Time to Fix:** 1 minute

---

### ERROR #2: TooManyActualInvocations

**My Prompt:**
```
org.mockito.exceptions.verification.TooManyActualInvocations: 
medicleExaminatioRepository.findById([any string]);
Wanted 2 times:
 at com.example.ohms.AppointmentServiceTest$CreateAppointmentTests.shouldCreateAppointment_WithMultipleMedicalExaminations:261
But was 4 times
```

**AI Analysis:**
- Service calls findById() 4 times (not 2)
- 2 times to add examinations
- 2 times to check for online consultation

**AI Solution:**
```java
// ❌ Wrong expectation
verify(medicleExaminatioRepository, times(2)).findById(anyString());

// ✅ Correct expectation
verify(medicleExaminatioRepository, times(4)).findById(anyString());
```

**Result:** ✅ Fixed - Verification now matches actual calls  
**Time to Fix:** 1 minute

***

### ERROR #3: Medical Examination Not Found

**My Prompt:**
```
java.lang.RuntimeException: Medical examination not found: E001
 at com.example.ohms.service.AppointmentService.lambda$3(AppointmentService.java:96)
 at java.base/java.util.Optional.orElseThrow(Unknown Source)
 at com.example.ohms.service.AppointmentService.createAppointment(AppointmentService.java:96)
 at com.example.ohms.AppointmentServiceTest$ParentChildAppointmentTests.shouldSkipParent_WhenParentIdIsBlank(AppointmentServiceTest.java:1243)

sao data mock lại lỗi nhỉ
```

**AI Analysis:**
- Test setup missing mock for medical examination repository
- Request has medicalExaminationIds but no mock defined

**AI Solution:**
```java
// Add missing mock in test setup
when(medicleExaminatioRepository.findById("E001"))
    .thenReturn(Optional.of(examination));
```

**Result:** ✅ Fixed - Mock now returns proper examination  
**Time to Fix:** 1 minute

***

### ERROR #4: UnnecessaryStubbingException

**My Prompt:**
```
org.mockito.exceptions.misusing.UnnecessaryStubbingException: 
Unnecessary stubbings detected.
Clean & maintainable test code requires zero unnecessary code.
Following stubbings are unnecessary (click to navigate to relevant line of code):
 at com.example.ohms.AppointmentServiceTest$ParentChildAppointmentTests.shouldSkipParent_WhenParentIdIsBlank(AppointmentServiceTest.java:1237)

Please remove unnecessary stubbings or use 'lenient' strictness.

    @Test
    @DisplayName("Should skip parent when parentId is blank")
    void shouldSkipParent_WhenParentIdIsBlank() {
        // Given
        validRequest.setParentAppointmentId("   "); // ← Blank string

        when(appointmentRepository.canCreateAppointment(any(), any(), any(), any(), any()))
            .thenReturn(true);
        when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
        when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
        when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.createAppointment(validRequest);

        // Then
        assertNotNull(response);
        verify(appointmentRepository, never()).findById("   ");
    }
```

**AI Analysis:**
- Mock `canCreateAppointment()` defined but never called
- When parentId is blank (not null), conflict check is skipped in service logic
- Mock is unnecessary for this test scenario

**AI Solution - Option 1 (Recommended):**
```java
// Remove unnecessary mock
@Test
void shouldSkipParent_WhenParentIdIsBlank() {
    validRequest.setParentAppointmentId("   ");
    validRequest.setMedicalExaminationIds(null); // Simplify test
    
    // Remove this mock - not needed when parent is blank
    // when(appointmentRepository.canCreateAppointment(...)).thenReturn(true);
    
    when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
    when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
    when(appointmentRepository.save(any())).thenReturn(appointment);
    
    AppointmentResponse response = appointmentService.createAppointment(validRequest);
    
    assertNotNull(response);
    verify(appointmentRepository, never()).findById("   ");
    verify(appointmentRepository, never()).canCreateAppointment(any(), any(), any(), any(), any());
}
```

**AI Solution - Option 2:**
```java
// Use lenient() if you want to keep the mock
lenient().when(appointmentRepository.canCreateAppointment(any(), any(), any(), any(), any()))
    .thenReturn(true);
```

**Result:** ✅ Fixed - Clean test without unnecessary mocks  
**Time to Fix:** 2 minutes

***


### ERROR #5: Maven Test Execution Issue

**My Prompt:**
```
ý là khi tôi bấm chạy cái file ServiceTest đó thì nó chạy bth
còn khi chạy mvn test thì nó có lỗi

# Created at 2025-10-24T21:32:20.443
Boot Manifest-JAR contains absolute paths in classpath 'D:\FPT\FA25\swp\OHMS\SWP_Project\OHMS_BE\target\test-classes'
Hint: <argLine>-Xshare:off</argLine>
```

**AI Analysis:**
- IDE run works (uses IntelliJ's classpath)
- Maven run fails (uses manifest JAR with absolute paths)
- Issue with Spring Boot Maven plugin and JaCoCo interaction

**AI Solution:**
```xml
<!-- Add to pom.xml -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>2.22.2</version>
    <configuration>
        <argLine>-Xshare:off @{argLine}</argLine>
        <useSystemClassLoader>false</useSystemClassLoader>
    </configuration>
</plugin>
```

**Alternative Solution:**
```bash
# Run tests without JaCoCo agent first
mvn test -DskipTests=false

# Then run with coverage separately
mvn jacoco:report
```

**Result:** ✅ Fixed - Maven tests now run successfully  
**Time to Fix:** 3 minutes

***

## 📊 Section 3: Coverage Analysis Prompts



### 3.1 Coverage Report Analysis

**My Prompt:**
```
missed branch với missed instruction la sao
```

**AI Response:**
- **Missed Instructions:** Bytecode not executed (ILOAD, IMUL, etc.)
- **Missed Branches:** Decision paths not tested (if/else, ternary)
- Visual explanation with code examples

**Deliverable:** Deep understanding of JaCoCo metrics

***

### 3.2 Specific Coverage Improvement

**My Prompt:**
```
[Pasted JaCoCo HTML showing yellow coverage]

giờ phân tích cái file test này đã test những gì
```

**AI Response:**
- Analyzed which branches are covered/missed
- Identified specific lines with partial coverage
- Suggested additional tests needed

**Deliverable:** Coverage improvement recommendations

***

### 3.3 Method-Level Coverage Analysis

**My Prompt:**
```
[Pasted method code + JaCoCo report]

public AppointmentResponse createAppointment(AppointmentRequest request) {
    // ... service code
}

nó vẫn vàng ở cái service này
```

**AI Response:**
- Line-by-line analysis of missed branches
- Identified null/blank checks not covered
- Provided specific test cases to add

**Deliverable:** 3 additional test cases to reach 100% coverage

***

## 📈 Section 4: Final Results

### Achievement Summary

| Metric | Initial | After AI Assistance | Target | Status |
|--------|---------|-------------------|--------|--------|
| **Instruction Coverage** | 0% | 96% | 80% | ✅ Exceeded |
| **Branch Coverage** | 0% | 80% | 80% | ✅ Met |
| **Method Coverage** | 0% | 97% | 90% | ✅ Exceeded |
| **Test Cases** | 0 | 52 | 40+ | ✅ Exceeded |
| **Time Invested** | - | 25 min | - | ✅ Efficient |

### Error Resolution Summary

| Error Type | Occurrences | Time to Fix | Success Rate |
|------------|-------------|-------------|--------------|
| Mockito Setup | 2 | 1-2 min | 100% |
| Mock Verification | 1 | 1 min | 100% |
| Unnecessary Stubbing | 1 | 2 min | 100% |
| Coverage Report | 1 | 30 sec | 100% |
| Maven Execution | 1 | 3 min | 100% |
| **Total** | **6 errors** | **~8 min** | **100%** |

***
