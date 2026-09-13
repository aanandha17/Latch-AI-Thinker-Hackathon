import test from "node:test";
import assert from "node:assert/strict";
import { createExtractionController, type ExtractionState } from "./latch-extraction-client";
import { latchDemo } from "./latch-demo";
import { fixtureOutput } from "./latch-test-fixture";
test("button/tool calls coalesce, stale results are discarded, saved records untouched", async () => {
  let current = structuredClone(latchDemo), calls = 0;
  let resolve!: (response: Response) => void;
  let state: ExtractionState | undefined;
  const saved = [{ id: "real-provider-id", title: "Previously saved task" }];
  const controller = createExtractionController(() => current, value => { state = value; }, (async () => { calls++; return new Promise<Response>(done => { resolve = done; }); }) as typeof fetch);
  const first = controller.extractCurrentThread();
  assert.equal(controller.extractCurrentThread(), first);
  await Promise.resolve();
  assert.equal(calls, 1);
  current = { ...current, revision: current.revision + 1 };
  resolve(Response.json(fixtureOutput()));
  assert.equal((await first).status, "error");
  assert.equal(state?.result, null);
  assert.match(state?.error ?? "", /changed/);
  assert.equal(saved[0].id, "real-provider-id");
});
test("retry succeeds; changed content without revision increment is also stale", async () => {
  let current = structuredClone(latchDemo);
  let state: ExtractionState | undefined;
  let calls = 0;
  const controller = createExtractionController(() => current, value => { state = value; }, (async () => {
    calls++;
    if (calls === 1) return new Response("secret", { status: 502 });
    return Response.json(fixtureOutput());
  }) as typeof fetch);
  assert.equal((await controller.extractCurrentThread()).status, "error");
  assert.doesNotMatch(state?.error ?? "", /secret/);
  assert.equal((await controller.extractCurrentThread()).status, "success");
  const stale = createExtractionController(() => current, value => { state = value; }, (async () => {
    current.messages[0].text = "Changed while running";
    return Response.json(fixtureOutput());
  }) as typeof fetch);
  assert.equal((await stale.extractCurrentThread()).status, "error");
  assert.equal(state?.result, null);
});
test("invalid API evidence never reaches frontend results", async () => {
  const result = fixtureOutput(); result.commitments[0].sourceMessageIds = ["invented"];
  const controller = createExtractionController(() => latchDemo, () => {}, (async () => Response.json(result)) as typeof fetch);
  assert.equal((await controller.extractCurrentThread()).status, "error");
});
