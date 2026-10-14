import { Collections, Command, Interaction } from 'detritus-client';

import { deleteGuildAllowlist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistAdd from './moderation.allowlist.add';


export interface CommandArgsBefore {
  payloads: Array<ModerationAllowlistAdd.AllowlistPayload> | null,
}

export interface CommandArgs {
  payloads: Array<ModerationAllowlistAdd.AllowlistPayload>,
}

export async function removeAllowlist(
  context: Command.Context | Interaction.InteractionContext,
  payloads: Array<ModerationAllowlistAdd.AllowlistPayload>,
) {
  const guildId = context.guildId as string;
  const { translate } = await getTranslator(context);

  let title = translate('moderation.allowlist.title');
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildAllowlistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = translate('moderation.allowlist.remove_channel', {id: channel.id});
      }; break;
      case GuildAllowlistTypes.ROLE: {
        const { item: role } = payload;
        title = translate('moderation.allowlist.remove_role', {id: role.id});
      }; break;
      case GuildAllowlistTypes.USER: {
        const { item: user } = payload;
        title = translate('moderation.allowlist.remove_user', {id: user.id});
      }; break;
    }

    await deleteGuildAllowlist(context, guildId, payload.item.id, payload.type);
    settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    // update settings
  } else {
    let channels = 0,
      roles = 0,
      users = 0;
    for (let payload of payloads) {
      switch (payload.type) {
        case GuildAllowlistTypes.CHANNEL: channels++; break;
        case GuildAllowlistTypes.ROLE: roles++; break;
        case GuildAllowlistTypes.USER: users++; break;
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
    title = translate('moderation.allowlist.remove_many', {items: comments.join(', ')});

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    // the api only takes {id, type} and leaves rows that already exist alone, so the remaining entries keep their added/userId
    const allowlist = new Collections.BaseCollection<string, {id: string, type: string}>();
    for (let [key, allowed] of settings.allowlist) {
      allowlist.set(key, {id: allowed.id, type: allowed.type});
    }
    for (let {item, type} of payloads) {
      const key = `${item.id}.${type}`;
      allowlist.delete(key);
    }
    settings = await editGuildSettings(context, guildId, {
      allowlist: allowlist.toArray(),
    });
  }
  return {settings, title};
}

export const COMMAND_ID = 'allowlist.remove';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { payloads } = args;
  const { settings, title } = await removeAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
