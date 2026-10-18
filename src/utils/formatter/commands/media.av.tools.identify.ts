import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsIdentify } from '../../../api';
import { DateMomentLogFormat, EmbedBrands, EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  createTimestampMomentFromGuild,
  createUserString,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayLinks,
  displayReply,
  fetchMemberOrUserById,
  formatTime,
} from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'media.av.tools.identify';

export interface CommandArgs {
  isEphemeral?: boolean,
  start?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const songs = await mediaAVToolsIdentify(context, {
    start: (args.start) ? args.start * 1000 : args.start,
    url: args.url,
  });

  if (songs.length) {
    const pageLimit = songs.length || 1;
    const paginator = new Paginator(context, {
      isEphemeral: args.isEphemeral,
      pageLimit,
      onPage: (page) => {
        const song = songs[page - 1];

        const payload: DisplayPayload = {};
        payload.color = EmbedColors.DEFAULT;
        payload.title = translate('media.identify.title', {artist: song.artists[0]!.name, title: song.title});

        {
          let footer: string;
          if (pageLimit === 1) {
            footer = translate('media.identify.footer');
          } else {
            footer = translate('media.identify.footer_paged', {page, total: pageLimit});
          }
          payload.footer = footer;
          payload.footerIconUrl = EmbedBrands.NOTSOBOT;
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
          payload.thumbnail = thumbnail;
        }

        // the artist and song are already the title
        const lines: Array<string> = [];
        lines.push(displayDetailsLine([
          displayDetail(translate('activity.album'), song.album.name),
          displayDetail(translate('media.identify.duration'), formatTime(song.duration)),
          displayDetail(translate('media.identify.match'), `${song.score}%`),
          (song.timestamp) && displayDetail(translate('media.identify.timestamp'), formatTime(song.timestamp)),
        ]));
        lines.push(displayDetailsLine([
          (song.genres.length) && displayDetail(translate('media.identify.genres'), song.genres.join(', ')),
          (song.label) && displayDetail(translate('media.identify.label'), song.label),
          (song.release_date) && displayDetail(translate('media.identify.release_date'), song.release_date),
        ]));

        {
          const { apple_music, deezer, musicbrainz, spotify, youtube } = song.platforms;
          const links = displayLinks([
            ['Apple Music', apple_music && apple_music.url],
            ['Deezer', deezer && deezer.url],
            ['MusicBrainz', musicbrainz && musicbrainz.url],
            ['Spotify', spotify && spotify.url],
            ['YouTube', youtube && youtube.url],
          ]);
          if (links) {
            lines.push(links.replace('-# ', `-# ${translate('media.identify.platform_links')}: `));
          }
          const previews = displayLinks([
            ['Apple Music', apple_music && apple_music.preview_url],
            ['Deezer', deezer && deezer.preview_url],
            ['Spotify', spotify && spotify.preview_url],
          ]);
          if (previews) {
            lines.push(previews.replace('-# ', `-# ${translate('media.identify.preview_links')}: `));
          }
        }
        payload.description = displayDetails(lines);

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  return displayReply(context, {description: translate('media.identify.not_found'), ephemeral: true});
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
