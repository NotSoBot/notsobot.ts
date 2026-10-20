import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { putTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'tag.edit';

export interface CommandArgsBefore {
  content: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  content: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const serverId = context.guildId || context.channelId!;

  const { reference_tag: referenceTag } = args.tag;
  if (!referenceTag) {
    const tag = await putTag(context, {content: args.content, name: args.tag.name, serverId});
    return displayReply(context, {description: translate('tag_edit.successfully_edited_tag', {name: Markup.codestring(tag.name)})});
  }

  // editing an alias with content turns it into a regular tag, so ask if they meant to edit the tag it points to
  const name = Markup.codestring(args.tag.name);
  const name2 = Markup.codestring(referenceTag.name);
  const canEditOriginal = (
    referenceTag.user.id === context.userId &&
    !!referenceTag.server_id &&
    !referenceTag.locked
  );

  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('tag_edit.request_expired_tag_was_not_edited', {name})});
      } catch(error) {

      }
    },
  });

  if (canEditOriginal) {
    components.createButton({
      label: translate('tag_edit.edit_original'),
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const tag = await putTag(context, {content: args.content, name: referenceTag.name, serverId: referenceTag.server_id!});
        await displayReply(context, {
          description: translate('tag_edit.successfully_edited_tag', {name: Markup.codestring(tag.name)}),
        }, {replyTo: ctx});
      },
    });
  }

  components.createButton({
    label: translate('tag_edit.replace_alias'),
    style: (canEditOriginal) ? MessageComponentButtonStyles.SECONDARY : MessageComponentButtonStyles.PRIMARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      const tag = await putTag(context, {content: args.content, name: args.tag.name, serverId});
      await displayReply(context, {
        description: translate('tag_edit.successfully_edited_tag', {name: Markup.codestring(tag.name)}),
      }, {replyTo: ctx});
    },
  });

  components.createButton({
    label: translate('tag_edit.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      await displayReply(context, {description: translate('tag_edit.canceled_editing_tag', {name})}, {replyTo: ctx});
    },
  });

  const description = (canEditOriginal) ? (
    translate('tag_edit.tag_is_an_alias_of', {name, name2})
  ) : (
    translate('tag_edit.tag_is_an_alias_of_cannot_edit_original', {name, name2})
  );
  return displayReply(context, {components, description: `${StatusEmojis.WARNING} ${description}`});
}
