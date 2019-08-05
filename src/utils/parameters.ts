import {
  Command,
  Constants,
  Structures,
  Utils,
} from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';

const {
  DiscordRegexNames,
} = Constants;

import { findMembers } from './tools';


export async function getImageUrl(
  value: string,
  context: Command.Context,
): Promise<null | string | undefined> {
  value = value.trim();
  let match = (
    Utils.regex(DiscordRegexNames.MENTION_USER, value) ||
    Utils.regex(DiscordRegexNames.TEXT_SNOWFLAKE, value)
  );
  if (match) {
    const { id, text } = match;
    const userId = <string> (id || text);
    let user = context.users.get(userId);
    if (!user) {
      try {
        user = await context.rest.fetchUser(userId);
      } catch(error) {
        return null;
      }
    }
    return user.avatarUrlFormat(null, {size: 1024});
  }
  match = Utils.regex(DiscordRegexNames.EMOJI, value);
  if (match) {
    const { animated, id } = match;
    let format = 'png';
    if (animated) {
      format = 'gif';
    }
    return Endpoints.CDN.URL + Endpoints.CDN.EMOJI(id, format);
  }
  match = Utils.regex(DiscordRegexNames.TEXT_URL, value);
  if (match) {
    const { text } = match;
    return <string> text;
  }
  if (value) {
    // find user from guild member chunk
    const parts = value.split('#');
    const username = (<string> parts.shift()).toLowerCase();
    let discriminator: null | string = null;
    if (parts.length) {
      discriminator = (<string> parts.shift()).padStart(4, '0');
    }
    if (context.guildId) {
      try {
        const { members } = await findMembers(context, username);
        const found = members.find((member: Structures.Member) => {
          if (discriminator) {
            return member.discriminator === discriminator;
          }
          return true;
        });
        if (found) {
          return found.avatarUrlFormat(null, {size: 1024});
        }
      } catch(error) {
        return null;
      }
    } else {
      const user = context.users.find((user) => {
        if (user.username.toLowerCase().startsWith(username)) {
          if (discriminator) {
            return user.discriminator === discriminator;
          }
          return true;
        }
        return false;
      });
      if (user) {
        return user.avatarUrlFormat(null, {size: 1024});
      }
    }
    return null;
  } else {
    if (context.message.attachments.length) {
      const attachment = context.message.attachments.find((attachment) => attachment.isImage);
      if (attachment) {
        return attachment.proxyUrl;
      }
    }
  }
  return undefined;
}
