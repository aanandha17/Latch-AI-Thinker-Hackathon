import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommitmentGraph } from "../components/commitment-graph";
import { fixtureOutput } from "./latch-test-fixture";
import { assignStableIds } from "./latch-validate";
import { latchDemo } from "./latch-demo";
test("graph orders slides above rehearsal and labels the direction with its source evidence",()=>{
  const result=assignStableIds(fixtureOutput(),latchDemo);
  const html=renderToStaticMarkup(createElement(CommitmentGraph,{result,savedTasks:[],declinedIds:new Set<string>(),onReview:()=>{},onEvidence:()=>{}}));
  assert.ok(html.indexOf("Finish slides")<html.indexOf("Start rehearsal"));
  assert.match(html,/must finish before/);
  assert.match(html,/No deadline stated/);
  assert.match(html,/after Marcus finishes the slides/);
  assert.doesNotMatch(html,/In Ambiguous/);
  assert.doesNotMatch(html,/Maybe we should add voice later/);
  assert.equal((html.match(/Review task/g)??[]).length,4);
});
