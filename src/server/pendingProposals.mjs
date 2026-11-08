import { randomUUID } from "node:crypto";
import { proposalActions } from "./proposalActions.mjs";
import { createProposalStore } from "./pendingProposalStore.mjs";
import { readRecord } from "./records.mjs";

const LIFETIME_MS = 5 * 60 * 1000;
const LEASE_MS = 5 * 60 * 1000;

const unavailable = () => ({
  status: "draft_unavailable",
  saved: false,
});

const store = () => createProposalStore();

function busy(message = "A save is in progress. Retry the same proposal.") {
  throw Object.assign(new Error(message), { httpStatus: 409 });
}

function publicProposal(pending) {
  return {
    ...structuredClone(pending.proposal),
    proposalId: pending.id,
    expiresAt: new Date(pending.expiresAt).toISOString(),
  };
}

function newPending(proposal) {
  return {
    id: randomUUID(),
    expiresAt: Date.now() + LIFETIME_MS,
    proposal: structuredClone(proposal),
    phase: "pending",
    leaseId: null,
    leaseUntil: 0,
    writeStarted: false,
    result: null,
  };
}

export async function rememberProposal(uid, proposal) {
  if (
    proposal.status !== "needs_confirmation" ||
    proposal.saved !== false ||
    (!proposal.event && !proposal.deadline)
  ) {
    throw new Error("Only checked proposals can be stored.");
  }

  const next = newPending(proposal);

  return store().change(uid, current => {
    if (current?.phase === "saving") busy();

    return {
      next,
      result: publicProposal(next),
    };
  });
}

export async function getPendingProposal(uid, proposalId) {
  const pending = await store().read(uid);

  if (
    !pending ||
    pending.id !== proposalId ||
    (
      pending.expiresAt <= Date.now() &&
      pending.phase !== "saving"
    )
  ) {
    return null;
  }

  return structuredClone(pending.proposal);
}

export async function cancelProposal(uid, proposalId) {
  return store().change(uid, pending => {
    if (!pending || pending.id !== proposalId) {
      return { result: false };
    }

    if (pending.phase === "saving") busy();

    if (
      pending.phase !== "pending" ||
      pending.expiresAt <= Date.now()
    ) {
      return { result: false };
    }

    return { next: null, result: true };
  });
}

function conflictSignature(conflicts) {
  return JSON.stringify(
    (conflicts ?? [])
      .map(event => JSON.stringify([
        event.id, event.name, event.start, event.end,
      ]))
      .sort()
  );
}

function changeOwned(uid, id, leaseId, transform) {
  return store().change(uid, pending => {
    if (
      !pending ||
      pending.id !== id ||
      pending.leaseId !== leaseId
    ) {
      busy("Proposal ownership changed. Retry the same proposal.");
    }

    return transform(pending);
  });
}

export async function confirmProposal(
  token,
  uid,
  proposalId,
  recheck,
  writer
) {
  const leaseId = randomUUID();

  const claim = await store().change(uid, pending => {
    if (!pending || pending.id !== proposalId) {
      return { result: { reply: unavailable() } };
    }

    if (
      pending.phase !== "saving" &&
      pending.expiresAt <= Date.now()
    ) {
      return { result: { reply: unavailable() } };
    }

    if (pending.result) {
      return { result: { reply: pending.result } };
    }

    if (pending.leaseUntil > Date.now()) busy();

    const next = {
      ...pending,
      phase: "saving",
      leaseId,
      leaseUntil: Date.now() + LEASE_MS,
    };

    return { next, result: { pending: next } };
  });

  if (claim.reply) return claim.reply;

  const pending = claim.pending;
  const actions = proposalActions(
    pending.proposal,
    { recheck, writer }
  );

  let writeStarted = pending.writeStarted;

  const finish = (phase, result, extra = {}) =>
    changeOwned(uid, proposalId, leaseId, current => ({
      next: {
        ...current,
        ...extra,
        phase,
        leaseId: null,
        leaseUntil: 0,
      },
      result,
    }));

  try {
    // Recover a previous save before reconsidering conflicts.
    let existing = null;

    if (writeStarted) {
      const collection = pending.proposal.kind === "deadline"
        ? "deadlines"
        : "events";

      existing = await readRecord(
        token,
        uid,
        collection,
        `uni-${proposalId}`
      );
    }

    if (!existing) {
      if (!writeStarted && pending.expiresAt <= Date.now()) {
        return await finish("pending", unavailable());
      }

      const fresh = await actions.refresh(token, uid);

      if (fresh.status !== "needs_confirmation") {
        throw new Error("Could not recheck the proposal.");
      }

      fresh.conflicts = (fresh.conflicts ?? []).filter(
        conflict => conflict.id !== `uni-${proposalId}`
      );

      if (
        conflictSignature(fresh.conflicts) !==
        conflictSignature(pending.proposal.conflicts)
      ) {
        if (writeStarted) {
          return await finish("saving", {
            status: "outcome_unknown",
            message:
              "A previous save may have reached Firestore and " +
              "conflicts changed. Do not create a replacement or " +
              "claim success. Retry the same proposal.",
          });
        }

        const next = newPending(fresh);

        return await changeOwned(
          uid,
          proposalId,
          leaseId,
          () => ({
            next,
            result: {
              ...publicProposal(next),
              reason: "conflicts_changed",
            },
          })
        );
      }

      if (!writeStarted && pending.expiresAt <= Date.now()) {
        return await finish("pending", unavailable());
      }
    }

    await changeOwned(uid, proposalId, leaseId, current => ({
      next: {
        ...current,
        writeStarted: true,
        leaseUntil: Date.now() + LEASE_MS,
      },
      result: null,
    }));

    writeStarted = true;

    // Existing writers use fixed IDs and verify duplicate writes.
    const result = await actions.save(token, uid, proposalId);

    return await finish("saved", result, {
      result,
      expiresAt: Date.now() + LIFETIME_MS,
    });
  } catch (error) {
    // Keep an uncertain write's ID so a retry cannot duplicate it.
    await store().change(uid, current => {
      if (
        !current ||
        current.id !== proposalId ||
        current.leaseId !== leaseId
      ) {
        return { result: null };
      }

      return {
        next: {
          ...current,
          phase: writeStarted ? "saving" : "pending",
          leaseId: null,
          leaseUntil: 0,
        },
        result: null,
      };
    }).catch(() => {});

    throw error;
  }
}