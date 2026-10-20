import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { fetchTag, fetchTagsDirectory, putTag } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis, TagDirectoryVerificationStates } from '../../../constants';
import { displayReply } from '../../../utils';
import { slashCommandMention } from '../../tools';


// `tag get`: adds a tag from the tag directory or your DMs (as an alias) to this server/DM
// keeps its old id from when it was `tag add`, so existing rules for it still apply
export const COMMAND_ID = 'tag.add';

export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;

export interface CommandArgsBefore {
  name: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  name: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const tagName = args.name || args.tag.name;

  if (isFromInteraction && !context.isFromGuildInstall && context.guildId && context.guildPartial) {
    // create server in database
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  }

  const serverId = context.guildId || context.channelId;
  if (args.tag.server_id === serverId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.tag_is_already_here')}`});
  }

  try {
    const oldTag = await fetchTag(context, {name: tagName, serverId});
    if (oldTag.user.id !== context.userId) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.tag_already_exists_in_this_server_and')}`});
    }
    if (oldTag.content) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.cannot_edit_a_regular_tag_to_be')}`})
    }
  } catch(error) {
    
  }

  // someone else's listing that staff haven't verified has to be confirmed first, like the website's add dialog
  const verified = await fetchDirectoryVerification(context, args.tag);
  if (verified === TagDirectoryVerificationStates.UNVERIFIED || verified === TagDirectoryVerificationStates.PENDING_VERIFICATION) {
    return confirmAddTag(context, args, tagName, serverId, verified);
  }
  return displayReply(context, {description: await addTag(context, args, tagName, serverId)});
}


async function confirmAddTag(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  tagName: string,
  serverId: string | undefined,
  verified: TagDirectoryVerificationStates,
) {
  const { translate, translateMaybe } = await getTranslator(context);
  const tagText = Markup.codestring(args.tag.name);

  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('tag_get.canceled_due_to_timeout', {tag: tagText})});
      } catch(e) {

      }
    },
  });

  components.createButton({
    label: translate('tag_get.add_anyway'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      let description: string;
      try {
        description = await addTag(context, args, tagName, serverId);
      } catch(error) {
        // the name got taken (or the tag left the directory) while it waited, show why instead of leaving the buttons up
        const apiError = await getApiError(error);
        if (!apiError) {
          throw error;
        }
        const key = getApiErrorTranslationKey(apiError.code);
        description = `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`;
      }
      await displayReply(context, {description}, {replyTo: ctx});
    },
  });

  components.createButton({
    label: translate('tag_get.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      await displayReply(context, {description: translate('tag_get.ok_did_not_add', {tag: tagText})}, {replyTo: ctx});
    },
  });

  const warning = (verified === TagDirectoryVerificationStates.PENDING_VERIFICATION) ?
    translate('tag_get.warning_tag_is_pending_verification', {tag: tagText}) :
    translate('tag_get.warning_tag_is_unverified', {tag: tagText});
  const description = [
    `${StatusEmojis.WARNING} ${warning}`,
    translate('tag_get.warning_owner_can_change'),
    translate('tag_get.confirm_add', {tag: tagText}),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}


// adds the alias and returns the message saying where it went
async function addTag(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  tagName: string,
  serverId: string | undefined,
): Promise<string> {
  const { translate } = await getTranslator(context);
  const tag = await putTag(context, {
    name: tagName,
    referenceTagId: args.tag.id,
    serverId,
  });

  let message = (args.tag.is_on_directory) ?
    translate('tag_get.ok_added_tag_from_the_tag_directory', {name: Markup.codestring(args.tag.name)}) :
    translate('tag_get.ok_added_tag_from_your_dms', {name: Markup.codestring(args.tag.name)});
  if (args.tag.name !== tag.name) {
    message = `${message} as ${Markup.codestring(tag.name)}`;
  }

  let added: string;
  if (context.guildId) {
    added = translate('tag_get.to_this_server', {message});
  } else {
    const user = await UserStore.getOrFetch(context, context.userId);
    added = (user && user.channelId === context.channelId) ?
      translate('tag_get.to_your_dms', {message}) :
      translate('tag_get.to_this_channel', {message});
  }
  const usage = translate('tag_get.use_it_with', {command: slashCommandMention(context, 'tag show')});
  return `${added}\n${usage}`;
}


// the listing's verification state, or null for your own tags and tags that aren't listed (or when the lookup fails,
// a missing warning shouldn't stop the tag from being added)
async function fetchDirectoryVerification(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
): Promise<TagDirectoryVerificationStates | null> {
  if (!tag.is_on_directory || tag.user.id === context.userId) {
    return null;
  }
  try {
    const { items } = await fetchTagsDirectory(context, {query: `id:${tag.id}`, limit: 1});
    const item = items.find((x) => x.id === tag.id);
    return (item) ? item.verified : null;
  } catch(error) {
    return null;
  }
}
