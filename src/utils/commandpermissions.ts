import { Collections, Command, Interaction, Structures } from 'detritus-client';

import { GuildPrefixCommandPermissions } from '../constants';


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


// if the loaded command permissions stop this member using a command (`applicationCommandIds`, its slash version's ids)
// in this channel. `ALL` is discord's own rule for slash commands: the command's own overwrites, or the app-wide ones.
// `COMMANDS` only looks at the command's own overwrites, `OFF` never blocks. nothing loaded never blocks
export function isBlockedByCommandPermissions(
  context: AnyContext,
  guildId: string,
  applicationCommandIds: Array<string>,
  channel: Structures.Channel,
  member: Structures.Member,
  mode: GuildPrefixCommandPermissions,
): boolean {
  const permissions = context.client.applicationCommandPermissions;
  switch (mode) {
    case GuildPrefixCommandPermissions.OFF: return false;
    case GuildPrefixCommandPermissions.COMMANDS: {
      const guildPermissions = permissions.get(guildId);
      if (!guildPermissions) {
        return false;
      }
      return applicationCommandIds.some((id) => {
        const entry = guildPermissions.get(id);
        return !!entry && !entry.isAllowed(channel, member);
      });
    };
  }
  return !permissions.isAllowed(guildId, applicationCommandIds, channel, member);
}


// the server's `prefixCommandPermissions` for a prefix command, loads them first unless the mode can't block it
// (off, or only single commands and it has no slash version)
export async function isPrefixCommandBlockedByCommandPermissions(
  context: AnyContext,
  guildId: string,
  applicationCommandIds: Array<string>,
  channel: Structures.Channel,
  member: Structures.Member,
  mode: GuildPrefixCommandPermissions,
): Promise<boolean> {
  if (mode === GuildPrefixCommandPermissions.OFF || (mode === GuildPrefixCommandPermissions.COMMANDS && !applicationCommandIds.length)) {
    return false;
  }
  await fillApplicationCommandPermissions(context, guildId).catch(() => null);
  return isBlockedByCommandPermissions(context, guildId, applicationCommandIds, channel, member, mode);
}
