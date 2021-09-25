import { Interaction } from 'detritus-client';

import { fetchTagsServer } from '../../api';


export async function tags(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  try {
    const serverId = context.guildId || context.channelId!;
    const { tags } = await fetchTagsServer(context, serverId, {
      name: context.value,
      limit: 25,
    });
    choices = tags.map((tag) => ({name: tag.name, value: tag.name}));
  } catch(error) {
    choices = [];
  }
  return context.respond({choices});
}
