import {
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Patria API", () => {
	it("returns the service health response", async () => {
		const request = new IncomingRequest("http://example.com");
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, {} as never, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			ok: true,
			service: "Patria API",
			lineLogin: "/auth/line",
		});
	});

	it("returns 404 for an unknown route", async () => {
		const response = await SELF.fetch("https://example.com/not-found");
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			success: false,
			error: "Not found",
		});
	});
});
