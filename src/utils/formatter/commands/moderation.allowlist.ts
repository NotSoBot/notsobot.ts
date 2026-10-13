import moment from 'moment';

import { Collections, Command, Interaction } from 'detritus-client';

import { GuildSettings, GuildSettingsAllowlist } from '../../../api/structures/guildsettings';
import { EmbedColors, GuildAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, Paginator, chunkArray, displayReply, toTitleCase } from '../../../utils';
import { getTranslator } from '../../i18n';


export interface CommandArgs {
  only: GuildAllowlistTypes | null,
}

const ELEMENTS_PER_PAGE = 15;

export async function createAllowlistEmbed(
  context: Command.Context | Interaction.InteractionContext,
  allowlist: Collections.BaseCollection<string, GuildSettingsAllowlist>,
  options: {only?: GuildAllowlistTypes | null, title?: string} = {},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  let sorted = allowlist.toArray();
  if (options.only) {
    sorted = sorted.filter((allowed) => allowed.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = chunkArray<GuildSettingsAllowlist>(sorted, ELEMENTS_PER_PAGE);

  const onlyText = (options.only) ? translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`) : '';
  let title = options.title || translate('moderation.allowlist.title');
  let footer = translate('moderation.allowlist.title');
  if (options.only) {
    footer = translate('moderation.allowlist.footer_only', {types: onlyText});
  }
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        payload.title = title;
        payload.footer = (pageLimit === 1) ? footer : translate('moderation.page_of', {footer, page: pageNumber, total: pageLimit});

        const page = pages[pageNumber - 1];
        {
          const description: Array<string> = page.map((allowed, i) => {
            let description = translate('common.unknown');
            let type: string = allowed.type;
            switch (allowed.type) {
              case GuildAllowlistTypes.CHANNEL: {
                const channel = context.client.channels.get(allowed.id);
                if (channel && channel.isGuildCategory) {
                  description = `<#${allowed.id}> (${translate('logger.channel.category')})`;
                } else {
                  description = `<#${allowed.id}>`;
                }
                type = translate('moderation.type.channel');
              }; break;
              case GuildAllowlistTypes.ROLE: {
                if (allowed.id === context.guildId) {
                  description = '@everyone';
                } else {
                  description = `<@&${allowed.id}>`;
                }
                type = translate('moderation.type.role');
              }; break;
              case GuildAllowlistTypes.USER: {
                description = `<@${allowed.id}>`;
                type = translate('moderation.type.user');
              }; break;
            }
            description = `${description} ||(${allowed.id})||`;

            return [
              translate('moderation.entry_added', {index: (i * pageNumber) + 1, type, when: moment(allowed.added).locale(language).fromNow()}),
              `-> ${description}`,
              `-> ${translate('logger.by', {user: `<@${allowed.userId}>`})}`,
            ].join('\n');
          });

          payload.description = description.join('\n');
        }
        return {display: payload};
      },
    });
    return await paginator.start();
  } else {
    const payload: DisplayPayload = {fields: []};
    payload.color = EmbedColors.DEFAULT;

    payload.title = title;
    if (options.only) {
      payload.description = translate('moderation.allowlist.empty_only', {types: onlyText.toLowerCase()});
    } else {
      payload.description = translate('moderation.allowlist.empty');
    }
    payload.footer = footer;
    return displayReply(context, payload);
  }
}

export const COMMAND_ID = 'allowlist';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guildId = context.guildId as string;

  const { allowlist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
  return createAllowlistEmbed(context, allowlist, {only: args.only});
}
