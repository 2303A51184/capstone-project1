package com.fraud.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fraud.monitoring.model.Transaction;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.repository.TransactionRepository;
import com.fraud.monitoring.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class FraudMonitoringApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @BeforeEach
    public void setup() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    public void contextLoads() {
        assertNotNull(userRepository);
        assertNotNull(transactionRepository);
    }

    @Test
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    public void testUserRegistrationAndSecurity() throws Exception {
        String userJson = "{\"username\":\"testuser\",\"password\":\"secretPassword123\",\"email\":\"test@sru.edu.in\",\"fullName\":\"Test User\"}";

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message", is("Registration successful")))
            .andExpect(jsonPath("$.user.username", is("testuser")))
            .andExpect(jsonPath("$.user.password").doesNotExist()); // Password must not be leaked

        // Verify password in DB is hashed, not plaintext
        User saved = userRepository.findByUsername("testuser").orElseThrow();
        assertNotEquals("secretPassword123", saved.getPassword());
    }

    @Test
    public void testTransactionCreationWithFallback() throws Exception {
        Transaction tx = new Transaction();
        tx.setTransactionId("UPI-TEST-001");
        tx.setAmount(new BigDecimal("450.00"));
        tx.setMerchant("Reliance Supermarket");
        tx.setLocation("Mumbai, India");
        tx.setCategory("GROCERY");
        tx.setWebsite("");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tx)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.transactionId", is("UPI-TEST-001")))
            .andExpect(jsonPath("$.status", is("APPROVED")))
            .andExpect(jsonPath("$.riskScore", lessThan(30)))
            .andExpect(jsonPath("$.isFraud", is(false)));

        assertEquals(1, transactionRepository.count());
    }

    @Test
    public void testIllegalWebsiteTransactionBlocked() throws Exception {
        Transaction tx = new Transaction();
        tx.setTransactionId("UPI-TEST-002");
        tx.setAmount(new BigDecimal("150.00")); // Low amount
        tx.setMerchant("5movierulz streaming");
        tx.setLocation("Warangal, India");
        tx.setCategory("TRAVEL");
        tx.setWebsite("https://www.5movierulz.watch/movie");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tx)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("FLAGGED")))
            .andExpect(jsonPath("$.riskScore", greaterThanOrEqualTo(80)))
            .andExpect(jsonPath("$.isFraud", is(true)));
    }

    @Test
    public void testAdminOverviewMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.users", notNullValue()))
            .andExpect(jsonPath("$.transactions", notNullValue()))
            .andExpect(jsonPath("$.fraudulentTransactions", notNullValue()))
            .andExpect(jsonPath("$.highRiskTransactions", notNullValue()));
    }
}
