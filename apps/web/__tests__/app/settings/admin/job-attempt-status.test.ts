import { attemptStatus } from "@/app/(app)/settings/admin/components/jobs/job-format";
import { describe, expect, it } from "vitest";

import type { AdminJobAttemptDTO, AdminJobState } from "@norish/shared/contracts";

function attempt(number: number, message: string | null = null): AdminJobAttemptDTO {
  return { attempt: number, message, stack: null, steps: [], logs: [] };
}

function job(state: AdminJobState, attempts: AdminJobAttemptDTO[]) {
  return { state, attempts };
}

describe("attemptStatus", () => {
  it("reports the latest attempt of an active job as running (#607)", () => {
    const attempts = [attempt(1)];

    expect(attemptStatus(attempts[0]!, job("active", attempts))).toBe("running");
  });

  it("reports an attempt with an error as failed, even while the job runs again", () => {
    const attempts = [attempt(1, "boom"), attempt(2)];

    expect(attemptStatus(attempts[0]!, job("active", attempts))).toBe("failed");
    expect(attemptStatus(attempts[1]!, job("active", attempts))).toBe("running");
  });

  it("reports the attempts of a finished job as done", () => {
    const attempts = [attempt(1)];

    expect(attemptStatus(attempts[0]!, job("completed", attempts))).toBe("done");
  });
});
