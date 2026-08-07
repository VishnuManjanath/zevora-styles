import type { Types } from "mongoose";
import { Dispute, DisputeEvidence } from "../models/Dispute.js";
import { Errors } from "../utils/errors.js";

export async function uploadDisputeEvidence(
  disputeId: string,
  userId: Types.ObjectId,
  fileUrl: string,
  forensics?: Record<string, unknown>,
) {
  const dispute = await Dispute.findOne({ _id: disputeId, userId });
  if (!dispute) throw Errors.notFound("Dispute not found");

  const evidence = await DisputeEvidence.create({
    disputeId: dispute._id,
    type: "upload",
    fileUrl,
    trustTier: "C",
    forensics: forensics ?? { source: "upload", tier: "C" },
  });

  if (dispute.status === "opened") {
    dispute.status = "evidence_pending";
    await dispute.save();
  }

  return evidence;
}
