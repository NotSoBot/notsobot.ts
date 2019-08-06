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
): Promise<boolean | null | string> {
  value = value.trim();

  if (value) {
    let match = Utils.regex(DiscordRegexNames.MENTION_USER, value);
    if (match) {
      const { id } = match;
      const userId = <string> id;
      if (context.users.has(userId)) {
        const user = <Structures.User> context.users.get(userId);
        return user.avatarUrlFormat(null, {size: 1024});
      } else {
        const user = <Structures.User> context.message.mentions.get(userId);
        return user.avatarUrlFormat(null, {size: 1024});
      }
    }

    match = Utils.regex(DiscordRegexNames.TEXT_SNOWFLAKE, value);
    if (match) {
      const { text } = match;
      const userId = <string> text;
      if (context.users.has(userId)) {
        const user = <Structures.User> context.users.get(userId);
        return user.avatarUrlFormat(null, {size: 1024});
      } else {
        try {
          const user = await context.rest.fetchUser(userId);
          return user.avatarUrlFormat(null, {size: 1024});
        } catch(error) {
          return null;
        }
      }
    }

    match = Utils.regex(DiscordRegexNames.EMOJI, value);
    if (match) {
      const { animated, id } = match;
      const format = (animated) ? 'gif' : 'png';
      return Endpoints.CDN.URL + Endpoints.CDN.EMOJI(id, format);
    }

    match = Utils.regex(DiscordRegexNames.TEXT_URL, value);
    if (match) {
      const { text } = match;
      return <string> text;
    }


    const nameParts = value.split('#');
    const username = (<string> nameParts.shift()).toLowerCase();
    let discriminator: null | string = null;
    if (nameParts.length) {
      discriminator = (<string> nameParts.shift()).padStart(4, '0');
    }
    if (context.guildId) {
      // members chunk
      try {
        const event = await findMembers(context, username);
        if (event && event.members) {
          const found = event.members.find((member: Structures.Member) => {
            return (discriminator) ? member.discriminator === discriminator : true;
          });
          if (found) {
            return found.avatarUrlFormat(null, {size: 1024});
          }
        }
      } catch(error) {}
    } else {
      // check our users cache since this is from a dm...
      const found = context.users.find((user) => {
        const name = user.username.toLowerCase();
        if (name.startsWith(username)) {
          return (discriminator) ? user.discriminator === discriminator : true;
        }
        return false;
      });
      if (found) {
        return found.avatarUrlFormat(null, {size: 1024});
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

  // this tells us that nothing was provided
  return false;
}


export async function memberOrUser(
  value: string,
  context: Command.Context,
): Promise<null | Structures.Member | Structures.User> {
  value = value.trim();

  if (value) {
    let match = Utils.regex(DiscordRegexNames.MENTION_USER, value);
    if (match) {
      const { id } = match;
      const userId = <string> id;
      return <Structures.Member | Structures.User> context.message.mentions.get(userId);
    }

    match = Utils.regex(DiscordRegexNames.TEXT_SNOWFLAKE, value);
    if (match) {
      const { text } = match;
      const userId = <string> text;
      if (context.guildId) {
        if (context.members.has(context.guildId, userId)) {
          return <Structures.Member> context.members.get(context.guildId, userId);
        } else {
          // fetch it?
        }
      } else {
        if (context.users.has(userId)) {
          return <Structures.User> context.users.get(userId);
        } else {
          try {
            return await context.rest.fetchUser(userId);
          } catch(error) {
            return null;
          }
        }
      }
    }

    // guild member chunk or search cache
    const nameParts = value.split('#');
    const username = (<string> nameParts.shift()).toLowerCase();
    let discriminator: null | string = null;
    if (nameParts.length) {
      discriminator = (<string> nameParts.shift()).padStart(4, '0');
    }
    if (context.guildId) {
      // members chunk
      try {
        const event = await findMembers(context, username);
        if (event && event.members) {
          const found = event.members.find((member: Structures.Member) => {
            return (discriminator) ? member.discriminator === discriminator : true;
          });
          if (found) {
            return found;
          }
        }
      } catch(error) {}
    } else {
      // check our users cache since this is from a dm...
      const found = context.users.find((user) => {
        const name = user.username.toLowerCase();
        if (name.startsWith(username)) {
          return (discriminator) ? user.discriminator === discriminator : true;
        }
        return false;
      });
      if (found) {
        return found;
      }
    }
    return null;
  }
  return context.member || context.user;
}
