import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLatchApprovalHandler } from "./latch-approval-http";
import type { Workplace, WorkplaceTask } from "./workplace";
import { latchDemo } from "../latch-demo";
import { fixtureOutput } from "../latch-test-fixture";
import { assignStableIds } from "../latch-validate";
const origin = "http://127.0.0.1:3100";
const extraction = assignStableIds(fixtureOutput(), latchDemo);
const input = { operation: "propose", thread: latchDemo, extraction, commitmentId: extraction.commitments[1].id,
  reviewed: { title: "Slides", owner: "Marcus", dueText: "today by 5 PM", dueAt: "2026-09-13T17:00:00+08:00" } };
const post = (body: unknown, cookie = "", headers: Record<string,string> = {}) => new Request(origin+"/api/latch/tasks",{
  method:"POST",headers:{origin,host:"127.0.0.1:3100","content-type":"application/json",cookie,...headers},body:JSON.stringify(body)
});
class Provider implements Workplace {
  tasks:WorkplaceTask[]=[]; creates=0;
  async identity(){return {id:"demo",workspaceId:"demo-workspace",name:"Disposable demo"};}
  async list(marker:string){return this.tasks.filter(t=>t.description.includes(marker));}
  async get(id:string){const result=this.tasks.find(t=>t.id===id);if(!result)throw new Error("missing");return result;}
  async create(title:string,description:string,beforeWrite:()=>Promise<void>){await beforeWrite();this.creates++;const result={id:randomUUID(),title,description,url:null};this.tasks.push(result);return result;}
}
test("LATCH HTTP browser approval creates exact fields, fresh read retrieves same ID, decline never writes",async t=>{
  const directory=await mkdtemp(join(tmpdir(),"latch-http-"));t.after(()=>rm(directory,{recursive:true,force:true}));
  const provider=new Provider();
  const handler=createLatchApprovalHandler({directory,connect:()=>({workplace:provider,close:async()=>{}})});
  const bootstrap=await handler(new Request(origin+"/api/latch/tasks?session=1"));
  const cookie=bootstrap.headers.get("set-cookie")!.split(";")[0];
  assert.match(cookie,/latch-approval-session/);
  const proposed=await handler(post(input,cookie));
  assert.equal(proposed.status,200);
  const {proposal}=await proposed.json();
  assert.equal(provider.creates,0);
  assert.equal((await handler(post({operation:"approve",proposalId:proposal.id,title:"tampered"},cookie))).status,400);
  assert.equal((await handler(post({operation:"approve",proposalId:proposal.id},"latch-approval-session="+"b".repeat(64)))).status,502);
  const approved=await handler(post({operation:"approve",proposalId:proposal.id},cookie));
  assert.equal(approved.status,200);
  const {task}=await approved.json();
  assert.equal(task.title,proposal.title);assert.equal(task.description,proposal.description);assert.equal(provider.creates,1);
  const fresh=createLatchApprovalHandler({directory:join(directory,"fresh"),connect:()=>({workplace:provider,close:async()=>{}})});
  const read=await fresh(new Request(origin+"/api/latch/tasks?threadId=latch-demo-01&taskId="+task.id));
  assert.equal((await read.json()).task.id,task.id);
  const list=await fresh(new Request(origin+"/api/latch/tasks?threadId=latch-demo-01"));
  assert.equal((await list.json()).tasks[0].id,task.id);
  const next=await handler(post({...input,commitmentId:extraction.commitments[0].id},cookie));
  const p2=(await next.json()).proposal;
  assert.equal((await handler(post({operation:"deny",proposalId:p2.id},cookie))).status,200);
  assert.equal((await handler(post({operation:"approve",proposalId:p2.id},cookie))).status,502);
  assert.equal(provider.creates,1);
});
test("LATCH HTTP enforces origin, session, strict command shape and size before any connection",async()=>{
  let calls=0;
  const handler=createLatchApprovalHandler({directory:"unused",connect:()=>{calls++;return undefined;}});
  assert.equal((await handler(post(input))).status,403);
  const cookie="latch-approval-session="+"a".repeat(64);
  for(const headers of [{origin:"https://evil.test"},{origin:"http://evil.test:3100",host:"evil.test:3100"},{"content-type":"text/plain"}] as Record<string,string>[]){
    assert.equal((await handler(post(input,cookie,headers))).status,403);
  }
  assert.equal((await handler(post({operation:"save_everything"},cookie))).status,400);
  assert.equal((await handler(post({operation:"approve",proposalId:randomUUID(),reviewed:{}},cookie))).status,400);
  assert.equal((await handler(post({padding:"x".repeat(800001)},cookie))).status,413);
  assert.equal(calls,0);
  assert.equal((await handler(post(input,cookie))).status,503);
});
test("LATCH HTTP provider errors never leak secrets",async()=>{
  const provider=new Provider();provider.identity=async()=>{throw new Error("secret-provider-token");};
  const handler=createLatchApprovalHandler({directory:"unused",connect:()=>({workplace:provider,close:async()=>{}})});
  const result=await handler(new Request(origin+"/api/latch/tasks?threadId=latch-demo-01"));
  assert.equal(result.status,502);assert.doesNotMatch(await result.text(),/secret-provider-token/);
});
