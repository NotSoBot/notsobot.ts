import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';

import { getTranslator } from '../../i18n';
import { DisplayPayload, displayReply } from '../../../utils';


export interface CommandArgsBefore {
  payload: {
    channels?: Collections.BaseCollection<string, Structures.Channel>,
    emojis?: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild | null,
    memberCount?: number,
    owner?: Structures.User,
    presenceCount?: number,
    voiceStateCount?: number,
  },
}

export interface CommandArgs {
  payload: {
    channels: Collections.BaseCollection<string, Structures.Channel>,
    emojis: Collections.BaseCollection<string, Structures.Emoji>,
    guild: Structures.Guild,
    memberCount: number,
    owner: Structures.User,
    presenceCount: number,
    voiceStateCount: number,
  },
}


export const COMMAND_ID = 'info.guild.icon';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { guild } = args.payload;
  if (guild.icon) {
    const url = guild.iconUrlFormat(null, {size: 512}) as string;

    return displayReply(context, {
      color: Colors.BLURPLE,
      description: `[**${translate('info.guild.icon_url')}**](<${guild.iconUrl}>)`,
      image: url,
      title: guild.name,
      url: guild.jumpLink,
    });
  }
  return displayReply(context, {description: translate('info.guild.no_icon')});
}
