import { createFollowupClient } from "./followup-client";
export const requestLatchTasks = createFollowupClient((url, init) => fetch(url, init), "/api/latch/tasks");
