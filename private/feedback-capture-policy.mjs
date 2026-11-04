// Agent decision contract. It does not inspect private chat content or execute
// any write; the caller supplies classified intent and verified identity.
export function feedbackCaptureDecision({
  explicitFileRequest = false, athleteResolved = false,
  sourceKnown = false, observedDateKnown = false,
  meaningfulAthleticEvidence = false, sensitiveOrAmbiguous = false,
  authenticatedWriterAvailable = false
} = {}) {
  if (!meaningfulAthleticEvidence && !explicitFileRequest) return 'leave_in_conversation';
  if (!athleteResolved || !sourceKnown || !observedDateKnown || sensitiveOrAmbiguous)
    return 'ask_one_clarifying_question';
  if (explicitFileRequest)
    return authenticatedWriterAvailable ? 'file_and_read_back' : 'request_authorized_connection';
  return 'ask_once_whether_to_file';
}
