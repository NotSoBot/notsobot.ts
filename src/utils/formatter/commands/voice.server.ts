// `/tts voice-server` and `tts voice server ...`: the server's own cloned voices, anyone there can use them for tts. The
// same messages as the user's own voices (`tts voice ...`) with `server` set, only these ids are their own
export const COMMAND_ID_CREATE = 'voice.server.create';
export const COMMAND_ID_DELETE = 'voice.server.delete';
export const COMMAND_ID_LIST = 'voice.server.list';
export const COMMAND_ID_RENAME = 'voice.server.rename';
export const COMMAND_ID_SAMPLE = 'voice.server.sample';
