package com.settlecheck.service;

import com.settlecheck.model.ExceptionRecord;
import com.settlecheck.repository.ExceptionRecordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * The ONLY class in this codebase that calls an LLM. It writes a
 * human-readable explanation for an already-decided exception — it never
 * decides whether records match. That decision is made entirely by
 * MatcherService's deterministic passes.
 *
 * TODO: wire up your actual provider (Gemini / Claude API). Left as a
 * simple RestClient stub so the call site and prompt shape are clear —
 * swap runLlmCall() for your SDK of choice.
 */
@Service
public class ExplainerService {

    private final ExceptionRecordRepository exceptionRepo;

    @Value("${settlecheck.llm.enabled:false}")
    private boolean llmEnabled;

    public ExplainerService(ExceptionRecordRepository exceptionRepo) {
        this.exceptionRepo = exceptionRepo;
    }

    public void explainAllOpenExceptions() {
        List<ExceptionRecord> open = exceptionRepo.findAll().stream()
                .filter(e -> "OPEN".equals(e.getStatus()) && e.getLlmExplanation() == null)
                .toList();

        for (ExceptionRecord ex : open) {
            String explanation = llmEnabled ? runLlmCall(buildPrompt(ex)) : fallbackExplanation(ex);
            ex.setLlmExplanation(explanation);
            exceptionRepo.save(ex);
        }
    }

    private String buildPrompt(ExceptionRecord ex) {
        return """
                You are writing a one-sentence audit note for a finance reviewer.
                Reason code: %s
                Order IDs involved: %s
                Settlement IDs involved: %s

                Explain, in one plain-English sentence, what most likely went wrong.
                Do not invent numbers you were not given. If you are unsure, say so.
                """.formatted(ex.getReasonCode(), ex.getOrderIds(), ex.getSettlementIds());
    }

    /** Deterministic, no-LLM fallback so the pipeline works before you wire a key in. */
    private String fallbackExplanation(ExceptionRecord ex) {
        return switch (ex.getReasonCode()) {
            case "MISSING_SETTLEMENT" -> "No settlement record found for order(s) "
                    + ex.getOrderIds() + " within the reconciliation window.";
            case "MISSING_ORDER" -> "Settlement " + ex.getSettlementIds()
                    + " has no corresponding order — possible unlinked/duplicate payout.";
            case "LOW_CONFIDENCE_GROUP" -> "A candidate settlement group existed for order(s) "
                    + ex.getOrderIds() + " but confidence fell below the review threshold.";
            case "AMOUNT_MISMATCH" -> "Amounts differ beyond fee tolerance for " + ex.getOrderIds();
            default -> "Unresolved — reason code " + ex.getReasonCode() + " needs manual review.";
        };
    }

    /** Placeholder call — replace with your Gemini/Claude SDK call. */
    private String runLlmCall(String prompt) {
        // Example shape only — do not ship a hardcoded key.
        // RestClient client = RestClient.create("https://your-llm-endpoint");
        // Map<String, Object> body = Map.of("prompt", prompt);
        // return client.post().body(body).retrieve().body(String.class);
        return "LLM call not wired up yet — see runLlmCall() TODO."; // safe no-op until wired up
    }
}
