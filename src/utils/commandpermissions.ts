import { Collections, Command, Interaction } from 'detritus-client';


// the server's discord command permissions (Server Settings > Integrations), loaded on first use per server

// guild id -> when its fill failed (no `applications.commands` scope fails every time), not retried for a bit, every
// non-admin command in it used to ask again
const RETRY_AFTER = 5 * 60 * 1000;
const failures = new Collections.BaseCollection<string, number>({expire: RETRY_AFTER});

type AnyContext = Command.Context | Interaction.InteractionContext;


// detritus shares one fetch between callers asking at the same time, this only stops asking servers that keep failing
export async function fillApplicationCommandPermissions(context: AnyContext, guildId: string): Promise<void> {
  if (failures.has(guildId)) {
    return;
  }
  try {
    await context.client.applicationCommandPermissions.fill(guildId);
  } catch(error) {
    failures.set(guildId, Date.now());
    throw error;
  }
}


// true when they loaded (so the server install has the `applications.commands` scope), false when the last fetch
// failed (most likely no scope), null when they haven't been asked for yet
export function getApplicationCommandPermissionsLoaded(context: AnyContext, guildId: string): boolean | null {
  if (context.client.applicationCommandPermissions.has(guildId)) {
    return true;
  }
  return (failures.has(guildId)) ? false : null;
}
