import moment from 'moment';

import { Collections, Command, Interaction } from 'detritus-client';

import { GuildSettings, GuildSettingsBlocklist } from '../../../api/structures/guildsettings';
import { EmbedColors, GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, Paginator, chunkArray, displayReply, toTitleCase } from '../../../utils';
import { getTranslator } from '../../i18n';


export interface CommandArgs {
  only: GuildBlocklistTypes | null,
}

const ELEMENTS_PER_PAGE = 15;

export async function createBlocklistEmbed(
  context: Command.Context | Interaction.InteractionContext,
  blocklist: Collections.BaseCollection<string, GuildSettingsBlocklist>,
  options: {only?: GuildBlocklistTypes | null, title?: string} = {},
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  let sorted = blocklist.toArray();
  if (options.only) {
    sorted = sorted.filter((blocked) => blocked.type === options.only);
  }
  sorted.sort((x, y) => {
    return y.added.localeCompare(x.added);
  });
  // maybe compare dates?

  const pages = chunkArray<GuildSettingsBlocklist>(sorted, ELEMENTS_PER_PAGE);

  const onlyText = (options.only) ? translateMaybe(`moderation.types.${options.only}`, `${toTitleCase(options.only)}s`) : '';
  let title = options.title || translate('moderation.blocklist.title');
  let footer = translate('moderation.blocklist.title');
  if (options.only) {
    footer = translate('moderation.blocklist.footer_only', {types: onlyText});
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
          const description: Array<string> = page.map((blocked, i) => {
            let description = translate('common.unknown');
            let type: string = blocked.type;
            switch (blocked.type) {
              case GuildBlocklistTypes.CHANNEL: {
                const channel = context.client.channels.get(blocked.id);
                if (channel && channel.isGuildCategory) {
                  description = `<#${blocked.id}> (${translate('logger.channel.category')})`;
                } else {
                  description = `<#${blocked.id}>`;
                }
                type = translate('moderation.type.channel');
              }; break;
              case GuildBlocklistTypes.ROLE: {
                if (blocked.id === context.guildId) {
                  description = '@everyone';
                } else {
                  description = `<@&${blocked.id}>`;
                }
                type = translate('moderation.type.role');
              }; break;
              case GuildBlocklistTypes.USER: {
                description = `<@${blocked.id}>`;
                type = translate('moderation.type.user');
              }; break;
            }
            description = `${description} ||(${blocked.id})||`;

            return [
              translate('moderation.entry_added', {index: (i * pageNumber) + 1, type, when: moment(blocked.added).locale(language).fromNow()}),
              `-> ${description}`,
              `-> ${translate('logger.by', {user: `<@${blocked.userId}>`})}`,
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
      payload.description = translate('moderation.blocklist.empty_only', {types: onlyText.toLowerCase()});
    } else {
      payload.description = translate('moderation.blocklist.empty');
    }
    payload.footer = footer;
    return displayReply(context, payload);
  }
}

export const COMMAND_ID = 'blocklist';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guildId = context.guildId as string;

  const { blocklist } = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
  return createBlocklistEmbed(context, blocklist, {only: args.only});
}
