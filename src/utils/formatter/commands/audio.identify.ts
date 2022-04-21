import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { audioToolsIdentify } from '../../../api';
import { DateMomentLogFormat, EmbedBrands, EmbedColors } from '../../../constants';
import {
  Paginator,
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
  fetchMemberOrUserById,
} from '../../../utils';


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { error, result } = await audioToolsIdentify(context, {
    url: args.url,
  });

  if (!result) {
    let content: string;
    if (error) {
      content = `Error: ${error.error_message}`;
    } else {
      content = 'Unable to identify any songs in the media provided';
    }
    return editOrReply(context, {content, flags: MessageFlags.EPHEMERAL});
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Audd.io Result', EmbedBrands.AUDD);
  embed.setTitle(result.title);
  embed.setUrl(result.song_link);

  {
    const description: Array<string> = [];
    description.push(`**Album**: ${result.album}`);
    description.push(`**Artist**: ${result.artist}`);
    if (result.label) {
      description.push(`**Label**: ${result.label}`);
    }
    description.push(`**Release Date**: ${result.release_date}`);
    description.push(`**Title**: ${result.title}`);
    embed.setDescription(description.join('\n'));
  }

  {
    const urls: Array<string> = [Markup.url('lis.tn', result.song_link)];
    if (result.apple_music) {
      urls.push(Markup.url('Apple Music', result.apple_music.url));
    }
    if (result.deezer) {
      urls.push(Markup.url('Deezer', result.deezer.link));
    }
    if (result.napster) {

    }
    if (result.spotify) {
      urls.push(Markup.url('Spotify', result.spotify.external_urls.spotify));
    }
    embed.addField('Direct Links', urls.join(', '));
  }

  {
    const urls: Array<string> = [];
    if (result.apple_music && result.apple_music.previews.length) {
      urls.push(Markup.url('Apple Music', result.apple_music.previews[0].url));
    }
    if (result.deezer && result.deezer.preview) {
      urls.push(Markup.url('Deezer', result.deezer.preview));
    }
    if (result.spotify) {
      urls.push(Markup.url('Spotify', result.spotify.preview_url || result.spotify.external_urls.spotify));
    }
    if (urls.length) {
      embed.addField('Preview Links', urls.join(', '));
    }
  }

  return editOrReply(context, {embed});
  /*
  const pages = [result.apple_music];
  const pageLimit = activities.length || 1;

  const paginator = new Paginator(context, {
    pageLimit,
    isEphemeral: args.isEphemeral,
    onPage: (page) => {
      const embed = new Embed();
      embed.setAuthor(user.toString(), user.avatarUrlFormat(null, {size: 1024}), user.jumpLink);
      embed.setColor(PresenceStatusColors['offline']);
      embed.setDescription(user.mention);

      embed.setThumbnail(member.avatarUrlFormat(null, {size: 1024}));

      return embed;
    },
  });
  return await paginator.start();
  */
}
