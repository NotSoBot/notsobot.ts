import { Command } from 'detritus-client';


export const TagFunctions = Object.freeze({
  ARGS: ['args'],
  ARGSLEN: ['argslen'],
  ATTACHMENT: ['attachment', 'attach', 'file'],
  ATTACHMENT_LAST: ['last_attachment', 'lattachment', 'lattach'],
  AVATAR: ['avatar'],
  CHANNEL: ['channel'],
  CHANNEL_ID: ['channelid'],
  CHANNEL_RANDOM: ['randchannel'],
  DOWNLOAD: ['download', 'text'],
  EVAL: ['eval'],
  GUILD: ['guild', 'server'],
  GUILD_COUNT: ['guildcount', 'membercount', 'servercount'],
  GUILD_ID: ['guildid', 'serverid', 'sid', 'gid'],
  HASTEBIN: ['hastebin', 'haste'],
  IMAGE: ['image', 'iscript'],
  IMAGESCRIPT: ['image2', 'iscript2', 'imagescript'],
  LOGICAL_GET: ['get'],
  LOGICAL_IF: ['if'],
  MATH: ['math'],
  NSFW: ['nsfw'],
  PREFIX: ['prefix'],
  RNG_CHOOSE: ['choose'],
  RNG_RANGE: ['range'],
  SET: ['set'],
  STRING_CODEBLOCK: ['code'],
  STRING_LENGTH: ['len', 'length'],
  STRING_LOWER: ['lower'],
  STRING_REPLACE: ['replace', 'replaceregex'],
  STRING_SUB: ['substring'],
  STRING_UPPER: ['upper'],
  STRING_URL_ENCODE: ['url'],
  USER_DISCRIMINATOR: ['discrim'],
  USER_MENTION: ['mention'],
  USER_NAME: ['name', 'user'],
  USER_NICK: ['nick'],
  USER_ID: ['id', 'userid'],
  USER_RANDOM: ['randuser'],
  USER_RANDOM_ID: ['randuserid'],
  USER_RANDOM_ONLINE: ['randonline'],
  USER_RANDOM_ONLINE_ID: ['randonlineid'],
});


export const TagSymbols = Object.freeze({
  BRACKET_LEFT: '{',
  BRACKET_RIGHT: '}',
  SPLITTER_ARGUMENT: '|',
  SPLITTER_FUNCTION: ':',
});



export interface TagResult {
  files: Array<{filename: string, value: Buffer}>,
  text: string,
  variables: Record<string, string>,
}

export async function parse(context: Command.Context, value: string): Promise<TagResult> {
  const tag: TagResult = {files: [], text: '', variables: {}};

  let depth = 0;
  while (value.length) {
    if (depth === 0) {
      // find next left bracket
      const nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT);
      if (nextLeftBracket === -1) {
        tag.text += value;
        value = '';
      } else {
        tag.text += value.slice(0, nextLeftBracket);
        value = value.slice(nextLeftBracket);
        depth++;
      }
      continue;
    }

    // add network checks
    let result = value.slice(0, 1);
    value = value.slice(1);

    switch (result) {
      case TagSymbols.BRACKET_LEFT: {
        // start of the script
        depth++;
      }; break;
      case TagSymbols.BRACKET_RIGHT: {
        // end of the script
        depth--;
        if (depth <= 0) {
          
        }
      }; break;
    }
  }
  return tag;
}
