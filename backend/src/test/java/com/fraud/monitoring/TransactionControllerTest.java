package com.fraud.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fraud.monitoring.model.Transaction;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Health endpoint returns UP")
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", containsString("Fraud Monitoring Backend")));
    }

    @Test
    @DisplayName("Create normal transaction produces APPROVED status and low risk score")
    public void testCreateNormalTransaction() throws Exception {
        Transaction tx = new Transaction();
        tx.setTransactionId("TEST-NORM-001");
        tx.setAmount(new BigDecimal("450.00"));
        tx.setCurrency("INR");
        tx.setMerchant("Reliance Fresh");
        tx.setLocation("Mumbai, India");
        tx.setCategory("GROCERY");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId", is("TEST-NORM-001")))
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.isFraud", is(false)))
                .andExpect(jsonPath("$.riskScore", lessThan(70)));
    }

    @Test
    @DisplayName("Create suspicious high-value offshore crypto transaction produces FLAGGED status")
    public void testCreateFraudulentTransaction() throws Exception {
        Transaction tx = new Transaction();
        tx.setTransactionId("TEST-FRAUD-001");
        tx.setAmount(new BigDecimal("350000.00"));
        tx.setCurrency("INR");
        tx.setMerchant("Offshore Crypto Exchange");
        tx.setLocation("High Risk Offshore Zone");
        tx.setCategory("CRYPTO");

        mockMvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId", is("TEST-FRAUD-001")))
                .andExpect(jsonPath("$.status", is("FLAGGED")))
                .andExpect(jsonPath("$.isFraud", is(true)))
                .andExpect(jsonPath("$.riskScore", greaterThanOrEqualTo(70)));
    }

    @Test
    @DisplayName("Admin overview returns valid counts")
    public void testAdminOverview() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.transactions", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.fraudulentTransactions", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("User password is not leaked in GET /api/users")
    public void testUserPasswordSanitization() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].password").doesNotExist());
    }
}
