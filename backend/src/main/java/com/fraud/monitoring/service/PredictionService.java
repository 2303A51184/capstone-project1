package com.fraud.monitoring.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PredictionService {

    @Autowired
    private FraudPredictionClient fraudPredictionClient;

    public Map<String, Object> predict(double amount, String merchant, String location, String category) {
        return predict(amount, merchant, location, category, "");
    }

    public Map<String, Object> predict(double amount, String merchant, String location, String category, String website) {
        Map<String, Object> response = fraudPredictionClient.predict(amount, merchant, location, category, website);
        if (response == null) {
            return Map.of("riskScore", 0, "fraudProbability", 0.0, "isFraud", false);
        }
        return response;
    }
}
