// Kept dependency-free (no mongoose import) so middleware.ts can import it
// under the Edge runtime without pulling in Node-only modules.
export const SESSION_COOKIE = "session_token";
export const OAUTH_STATE_COOKIE = "oauth_state";
