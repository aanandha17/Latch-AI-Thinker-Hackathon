"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LatchDraft, LatchProposal, LatchSavedTask, LatchWorkplaceStatus } from "./latch-approval";
import { requestLatchTasks as api } from "./latch-task-client";

export function useLatchWorkplace(threadId: string) {
  const [status, setStatus] = useState<LatchWorkplaceStatus>();
  const [proposal, setProposal] = useState<LatchProposal>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const selected = useRef(threadId); selected.current = threadId;
  const requestSequence = useRef(0);
  const acting = useRef(false);
  const refresh = useCallback(async () => {
    const id = selected.current, sequence = ++requestSequence.current;
    setRefreshing(true);
    try {
      const next = await api<LatchWorkplaceStatus>("?threadId=" + encodeURIComponent(id));
      if (sequence === requestSequence.current && selected.current === id) { setStatus(next); setError(""); }
      return next;
    } catch (error) {
      if (sequence === requestSequence.current && selected.current === id) setError(error instanceof Error ? error.message : "Refresh failed. Last confirmed records are retained.");
      throw error;
    } finally { if (sequence === requestSequence.current) setRefreshing(false); }
  }, []);
  useEffect(() => {
    setStatus(undefined); setProposal(undefined);
    refresh().catch(() => {});
    return () => { requestSequence.current++; };
  }, [threadId, refresh]);

  const propose = useCallback(async (draft: LatchDraft) => {
    if (acting.current) throw new Error("Wait for the current approval operation.");
    acting.current = true; setBusy(true); setError("");
    try {
      const result = await api<{ proposal: LatchProposal }>("", { operation: "propose", ...draft });
      if (selected.current === draft.thread.threadId) { setProposal(result.proposal); setNotice("Proposal prepared. Review the exact record before approving."); }
      return result.proposal;
    } catch (error) { setError(error instanceof Error ? error.message : "Could not prepare proposal."); throw error; }
    finally { acting.current = false; setBusy(false); }
  }, []);
  const retrieve = useCallback(async (id: string) => {
    const threadId = selected.current;
    const result = await api<{ task: LatchSavedTask }>("?threadId=" + encodeURIComponent(threadId) + "&taskId=" + encodeURIComponent(id));
    if (threadId === selected.current) setNotice("Read back from Ambiguous: " + result.task.id);
    return result.task;
  }, []);
  const approve = async (proposalId: string) => {
    if (acting.current || !proposal || proposal.id !== proposalId) return;
    acting.current = true; setBusy(true); setError("");
    try {
      const { task } = await api<{ task: LatchSavedTask }>("", { operation: "approve", proposalId });
      if (selected.current === task.metadata.threadId) {
        // A refresh started before this write must not replace its confirmed record.
        requestSequence.current++; setRefreshing(false);
        setStatus(previous => ({
          status: "connected", workspaceId: proposal.workspaceId, identityName: proposal.identityName,
          tasks: [...(previous?.status === "connected" && previous.workspaceId === proposal.workspaceId ? previous.tasks.filter(t => t.id !== task.id) : []), task],
        }));
        setProposal(undefined); setNotice("Saved and read back from Ambiguous: " + task.id);
      }
      return task;
    } catch (error) { setError(error instanceof Error ? error.message : "Outcome uncertain. Refresh before attempting another write."); }
    finally { acting.current = false; setBusy(false); }
  };
  const deny = async (proposalId: string) => {
    if (acting.current || !proposal || proposal.id !== proposalId) return;
    acting.current = true; setBusy(true); setError("");
    try {
      await api("", { operation: "deny", proposalId });
      setProposal(undefined); setNotice("Declined. No external task was created.");
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Could not decline this proposal."); }
    finally { acting.current = false; setBusy(false); }
  };
  return { status, proposal, error, notice, busy, refreshing, refresh, propose, retrieve, approve, deny, clearProposal: () => { if (!acting.current) { setProposal(undefined); setError(""); } } };
}
export type LatchWorkplaceControls = ReturnType<typeof useLatchWorkplace>;
