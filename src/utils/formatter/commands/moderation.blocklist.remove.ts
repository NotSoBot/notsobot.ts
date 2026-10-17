import { Collections, Command, Interaction } from 'detritus-client';

import { deleteGuildBlocklist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistAdd from './moderation.blocklist.add';


export interface CommandArgsBefore {
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload> | null,
}

export interface CommandArgs {
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload>,
}

export async function removeBlocklist(
  context: Command.Context | Interaction.InteractionContext,
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload>,
) {
  const guildId = context.guildId as string;
  const { translate } = await getTranslator(context);

  let title = translate('moderation.blocklist.title');
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildBlocklistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = translate('moderation.blocklist.remove_channel', {id: channel.id});
      }; break;
      case GuildBlocklistTypes.ROLE: {
        const { item: role } = payload;
        title = translate('moderation.blocklist.remove_role', {id: role.id});
      }; break;
      case GuildBlocklistTypes.USER: {
        const { item: user } = payload;
        title = translate('moderation.blocklist.remove_user', {id: user.id});
      }; break;
    }

    await deleteGuildBlocklist(context, guildId, payload.item.id, payload.type);
    settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    // update settings
  } else {
    let channels = 0,
      roles = 0,
      users = 0;
    for (let payload of payloads) {
      switch (payload.type) {
        case GuildBlocklistTypes.CHANNEL: channels++; break;
        case GuildBlocklistTypes.ROLE: roles++; break;
        case GuildBlocklistTypes.USER: users++; break;
      }
    }
    const comments: Array<string> = [];
    if (channels) {
      comments.push(translate('moderation.count.channels', {count: channels}));
    }
    if (roles) {
      comments.push(translate('moderation.count.roles', {count: roles}));
    }
    if (users) {
      comments.push(translate('moderation.count.users', {count: users}));
    }
    title = translate('moderation.blocklist.remove_many', {items: comments.join(', ')});

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    // the api only takes {id, type} and leaves rows that already exist alone, so the remaining entries keep their added/userId
    const blocklist = new Collections.BaseCollection<string, {id: string, type: string}>();
    for (let [key, blocked] of settings.blocklist) {
      blocklist.set(key, {id: blocked.id, type: blocked.type});
    }
    for (let {item, type} of payloads) {
      const key = `${item.id}.${type}`;
      blocklist.delete(key);
    }
    settings = await editGuildSettings(context, guildId, {
      blocklist: blocklist.toArray(),
    });
  }
  return {settings, title};
}

export const COMMAND_ID = 'server.blocklist.remove';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { payloads } = args;
  const { settings, title } = await removeBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
