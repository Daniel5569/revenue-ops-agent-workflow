import unittest

from revops_engine.worker import WorkerState, process_event, reclaim_stale_pending


class WorkerTests(unittest.TestCase):
    def test_process_event_creates_policy_gated_proposal(self):
        state = WorkerState()
        result = process_event(
            {
                "source": "hubspot-demo",
                "externalRef": "lead_1001",
                "eventType": "lead.created",
                "payload": {
                    "domain": "northstar.example",
                    "segment": "b2b_saas",
                    "seniority": "vp",
                    "signals": ["pricing_page"],
                },
            },
            state,
        )

        self.assertEqual(result["status"], "processed")
        self.assertEqual(result["proposal"]["policyDecision"], "requires_approval")
        self.assertEqual(len(state.audit), 1)

    def test_duplicate_is_ignored(self):
        state = WorkerState()
        event = {
            "source": "hubspot-demo",
            "externalRef": "lead_1001",
            "eventType": "lead.created",
            "payload": {"domain": "northstar.example"},
        }

        first = process_event(event, state)
        second = process_event(event, state)

        self.assertEqual(first["status"], "processed")
        self.assertEqual(second["status"], "duplicate")
        self.assertEqual(len(state.proposals), 1)

    def test_invalid_payload_goes_to_dead_letter(self):
        state = WorkerState()
        result = process_event({"payload": None}, state)

        self.assertEqual(result["status"], "dead_letter")
        self.assertEqual(state.dead_letter[0]["reason"], "INVALID_PAYLOAD")

    def test_reclaim_stale_pending_jobs(self):
        reclaimed = reclaim_stale_pending(
            [{"id": "1", "idleMs": 50}, {"id": "2", "idleMs": 5000}],
            older_than_ms=1000,
        )

        self.assertEqual([job["id"] for job in reclaimed], ["2"])
        self.assertTrue(reclaimed[0]["reclaimed"])


if __name__ == "__main__":
    unittest.main()
