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
  formatTime,
} from '../..';


export const COMMAND_ID = 'audio.identify';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const songs = await audioToolsIdentify(context, {
    url: args.url,
  });

  if (songs.length) {
    const pageLimit = songs.length || 1;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const song = songs[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setTitle(song.title);

        {
          let footer: string;
          if (pageLimit === 1) {
            footer = 'Audio Recognition Result';
          } else {
            footer = `Page ${page}/${pageLimit} of Audio Recognition Results`;
          }
          embed.setFooter(footer, EmbedBrands.NOTSOBOT);
        }

        let thumbnail: string | undefined;
        for (let key in song.platforms) {
          const platform = (song.platforms as any)[key];
          if (platform && platform.album && platform.album.cover_url) {
            thumbnail = platform.album.cover_url;
            break;
          }
        }

        if (thumbnail) {
          embed.setThumbnail(thumbnail);
        }

        {
          const description: Array<string> = [];
          description.push(`**Album**: ${song.album.name}`);
          description.push(`**Artist**: ${song.artists[0]!.name}`);
          description.push(`**Duration**: ${formatTime(song.duration)}`);
          if (song.label) {
            description.push(`**Label**: ${song.label}`);
          }
          if (song.genres.length) {
            description.push(`**Genres**: ${song.genres.join(', ')}`);
          }
          description.push(`**Match**: ${song.score}%`);
          if (song.release_date) {
            description.push(`**Release Date**: ${song.release_date}`);
          }
          if (song.timestamp) {
            description.push(`**Timestamp**: ${formatTime(song.timestamp)}`);
          }
          description.push(`**Title**: ${song.title}`);
          embed.setDescription(description.join('\n'));
        }

        {
          const urls: Array<string> = [];
          if (song.platforms.apple_music && song.platforms.apple_music.url) {
            urls.push(Markup.url('Apple Music', song.platforms.apple_music.url));
          }
          if (song.platforms.deezer && song.platforms.deezer.url) {
            urls.push(Markup.url('Deezer', song.platforms.deezer.url));
          }
          if (song.platforms.musicbrainz && song.platforms.musicbrainz.url) {
            urls.push(Markup.url('MusicBrainz', song.platforms.musicbrainz.url));
          }
          if (song.platforms.spotify && song.platforms.spotify.url) {
            urls.push(Markup.url('Spotify', song.platforms.spotify.url));
          }
          if (song.platforms.youtube && song.platforms.youtube.url) {
            urls.push(Markup.url('YouTube', song.platforms.youtube.url));
          }
          if (urls.length) {
            embed.addField('Platform Links', urls.join(', '));
          }
        }

        {
          const urls: Array<string> = [];
          if (song.platforms.apple_music && song.platforms.apple_music.preview_url) {
            urls.push(Markup.url('Apple Music', song.platforms.apple_music.preview_url));
          }
          if (song.platforms.deezer && song.platforms.deezer.preview_url) {
            urls.push(Markup.url('Deezer', song.platforms.deezer.preview_url));
          }
          if (song.platforms.spotify && song.platforms.spotify.preview_url) {
            urls.push(Markup.url('Spotify', song.platforms.spotify.preview_url));
          }
          if (urls.length) {
            embed.addField('Preview Links', urls.join(', '));
          }
        }

        return embed;
      },
    });
    return await paginator.start();
  }

  return editOrReply(context, {
    content: 'Couldn\'t identify any songs',
    flags: MessageFlags.EPHEMERAL,
  });
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
