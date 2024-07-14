import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.alias';

export interface CommandArgsBefore {
  name: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  name: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  if (args.tag.name === args.name) {
    return editOrReply(context, 'ok');
  }

  if (isFromInteraction && !context.hasServerPermissions && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  }

  const tag = await putTag(context, {
    name: args.name,
    referenceTagId: args.tag.id,
    serverId: context.guildId || context.channelId,
  });

  return editOrReply(context, `Ok, created an alias tag called ${Markup.codestring(tag.name)} for tag ${Markup.codestring(args.tag.name)}`);
}
