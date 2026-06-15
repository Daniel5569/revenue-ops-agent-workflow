import unittest

from revops_engine.policy import evaluate_action
from revops_engine.scorer import confidence_from_score, score_record


class ScorerPolicyTests(unittest.TestCase):
    def test_hot_inbound_lead_scores_high(self):
        result = score_record(
            {
                "segment": "b2b_saas",
                "seniority": "vp",
                "signals": ["pricing_page", "product_docs"],
            }
        )

        self.assertGreaterEqual(result.score, 90)
        self.assertIn("PRICING_INTENT", result.reason_codes)

    def test_policy_blocks_external_send(self):
        decision = evaluate_action("send_external_email", idempotency_key="abc")

        self.assertEqual(decision.decision, "blocked")
        self.assertEqual(decision.reason_code, "BLOCKED_DESTRUCTIVE_OR_EXTERNAL")

    def test_policy_requires_key(self):
        decision = evaluate_action("create_follow_up_task", idempotency_key=None)

        self.assertEqual(decision.decision, "blocked")
        self.assertEqual(decision.reason_code, "MISSING_IDEMPOTENCY_KEY")

    def test_confidence_is_bounded(self):
        self.assertEqual(confidence_from_score(10), 0.35)
        self.assertEqual(confidence_from_score(140), 0.98)


if __name__ == "__main__":
    unittest.main()
