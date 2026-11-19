import { Collections, Interaction, InteractionCommandClient, Structures } from 'detritus-client';
import {
  ApplicationCommandTypes,
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  ClientEvents,
  InteractionCallbackTypes,
  InteractionContextTypes,
  LOCAL_GUILD_ID,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import GuildSettingsStore from '../../stores/guildsettings';
import CommandResponsesStore from '../../stores/commandresponses';
import { getServerPremiumUsers } from '../../stores/premiumservers';
import ServerSettingsStore from '../../stores/serversettings';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import { createUserCommand } from '../../api';
import {
  CommandResults,
  afterJobRuns,
  getCommandGate,
  getCommandGateMessage,
  getRecordedCommandResult,
  setCommandGate,
  setCommandResult,
} from '../../commandresults';
import {
  CommandCategories,
  CommandRatelimits,
  CommandTypes,
  DiscordSkuIds,
  GuildFeatures,
  UserFlags,
  UserPremiumTypes,
  UserSettingsApplicationCommandResponseTypes,
} from '../../constants';
import { captureCommandError, captureError } from '../../sentry';
import { DefaultParameters, FindMediaUrlOptions, I18n, Parameters, getCommandIdFromInvoker } from '../../utils';
import { fillApplicationCommandPermissions } from '../../utils/commandpermissions';

import {
  createArgumentErrorPayload,
  createRunErrorPayload,
  formatPermissions,
  replyError,
  replyWarning as replyErrorWarning,
  warning,
} from '../errors';


export interface InteractionCommandMetadata {
  // optional: defaults to the prefixed command with the same id, then SLASH_COMMAND_CATEGORY_FALLBACKS
  category?: CommandCategories,
  id: string,
  nsfw?: boolean,
  premium?: boolean,
  premiumPlus?: boolean,
  premiumServer?: boolean,
};

// `error` is the english label ('Slash', 'User Context Menu') shown at the start of error messages
export function translateErrorLabel(error: string, translate: I18n.Translator['translate']): string {
  switch (error) {
    case 'Command': return translate('errors.label.command');
    case 'Message Context Menu': return translate('errors.label.message_context_menu');
    case 'Slash': return translate('errors.label.slash');
    case 'User Context Menu': return translate('errors.label.user_context_menu');
  }
  return error;
}


// interaction errors are always ephemeral
function replyWarning(context: Interaction.InteractionContext, content: string) {
  return replyErrorWarning(context, content, {ephemeral: true});
}


// shared by the url media options when no url was found, `notFound` is the error for an empty channel
async function replyMediaUrlNotFound(
  context: Interaction.InteractionContext,
  url: null | undefined,
  notFound: I18n.TranslationKey,
) {
  const { translate } = await I18n.getTranslator(context);
  if (url === null) {
    return replyWarning(context, translate('errors.invalid_user_or_url'));
  }
  if (!context.isBotPresent) {
    return replyWarning(context, translate('errors.no_channel_history'));
  }
  return replyWarning(context, translate(notFound));
}


// the application command ids (global and this server's) of a prefixed command's slash version, for its overrides in
// the server's discord command permissions. none (a prefix-only command like `ocr`) leaves only the app-wide ones
export function getSlashCommandIds(
  interactionCommandClient: InteractionCommandClient | null | undefined,
  commandId: string,
  guildId: string,
): Array<string> {
  const interactionCommand = interactionCommandClient && interactionCommandClient.commands.find((x): x is BaseInteractionCommand => {
    return x instanceof BaseInteractionCommand && x.commandIds.has(commandId);
  });
  if (!interactionCommand) {
    return [];
  }
  return [interactionCommand.ids.get(LOCAL_GUILD_ID), interactionCommand.ids.get(guildId)].filter(Boolean) as Array<string>;
}

// followups don't take the response's ephemeral flag, so a second message (`displayReply` followUp, a paginator's
// page prompt) or a response swapped for a followup (`replaceInteractionResponse`) went public after a private defer
export function keepFollowUpsPrivate(context: Interaction.InteractionContext): void {
  const createMessage = context.createMessage.bind(context);
  context.createMessage = (options: RequestTypes.ExecuteWebhook | string = {}) => {
    const data: RequestTypes.ExecuteWebhook = (typeof(options) === 'string') ? {content: options} : {...options};
    data.flags = (data.flags || 0) | MessageFlags.EPHEMERAL;
    return createMessage(data);
  };
}

// how long a slash run waits for the server's command permissions on their first load, the interaction has to be
// answered within 3 seconds. too slow counts as allowed (a public reply)
const COMMAND_PERMISSIONS_WAIT = 1500;

// a run through the member's own install, in a server that has the bot but turned NotSoBot (or this command) off in
// this channel with its discord command permissions. discord only applies those to the server install, so the bot
// answers privately there instead. cached on the context, the tag writes ask too
export async function isBlockedUserInstallRun(context: Interaction.InteractionContext): Promise<boolean> {
  const contextMetadata = context.metadata = context.metadata || {};
  if (typeof(contextMetadata.blockedUserInstallRun) === 'boolean') {
    return contextMetadata.blockedUserInstallRun;
  }
  let blocked = false;
  const { channel, guildId, member } = context;
  if (
    guildId && channel && member &&
    !context.isFromGuildInstall &&
    context.isBotPresent &&
    !context.user.isClientOwner
  ) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      fillApplicationCommandPermissions(context, guildId).catch(() => null),
      new Promise((resolve) => timeout = setTimeout(resolve, COMMAND_PERMISSIONS_WAIT)),
    ]);
    if (timeout) {
      clearTimeout(timeout);
    }
    const data = context.interaction.data as Structures.InteractionDataApplicationCommand | undefined;
    const applicationCommandIds = (data && data.id) ? [data.id] : [];
    blocked = !context.client.applicationCommandPermissions.isAllowed(guildId, applicationCommandIds, channel, member);
  }
  return contextMetadata.blockedUserInstallRun = blocked;
}


export class BaseInteractionCommand extends Interaction.InteractionCommand {
  _commandIds?: Collections.BaseSet<string>;
  blockedCommandShouldStillExecute = true;
  // the response is for everyone in the channel (like a game), so the user's ephemeral response setting doesn't apply
  ignoresEphemeralSetting = false;
  // commands that answer with a modal can't be deferred first (a deferred interaction can't open a modal)
  respondsWithModal = false;
  error = 'Command';

  get commandIds() {
    if (!this._commandIds) {
      this._commandIds = new Collections.BaseSet<string>();
      for (let invoker of this.invokers) {
        const commandId = getCommandIdFromInvoker(invoker);
        this.commandIds.add(commandId);
      }
    }
    return this._commandIds;
  }

  // an autocomplete answered after discord's 3 seconds (event loop lag, the user typing on) 404s with Unknown interaction,
  // kept as info to track how often (by command and cluster), it isn't a bug in the autocomplete itself. other http
  // errors were already seen by `captureRestResponse`
  onAutoCompleteError(context: Interaction.InteractionAutoCompleteContext, error: any) {
    if (error && error.response && error.response.statusCode === 404) {
      captureError(error, {context, fingerprint: ['autocomplete-unknown-interaction'], level: 'info', tags: {source: 'autocomplete'}});
      return;
    }
    captureCommandError(context, error, 'autocomplete');
  }

  onLoadingTrigger(context: Interaction.InteractionContext) {
    if (context.responded) {
      return;
    }

    const invoker = context.invoker as BaseInteractionCommand | BaseInteractionCommandOption;
    if (this.triggerLoadingAsEphemeral || invoker.triggerLoadingAsEphemeral) {
      return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
        flags: MessageFlags.EPHEMERAL,
      });
    }

    if (!invoker.ignoresEphemeralSetting && UserSettingsStore.has(context.userId)) {
      const settings = UserSettingsStore.get(context.userId)!;
      switch (settings.application_command_response_type) {
        case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
          return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
            flags: MessageFlags.EPHEMERAL,
          });
        };
      }
    }

    // check perms to maybe force as ephemeral, just in case
    return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
  }

  async onDmBlocked(context: Interaction.InteractionContext) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.dm_blocked', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }

  onBefore(context: Interaction.InteractionContext): Promise<boolean> | boolean {
    // an async iife instead of `new Promise(async ...)`, anything thrown in there (like the defer failing on an expired
    // interaction) never settled the promise and left the command hanging forever
    return (async () => {
      const respondsWithModal = !!(context.invoker as any).respondsWithModal || !!(context.command as any).respondsWithModal;
      const ignoresEphemeralSetting = !!(context.invoker as any).ignoresEphemeralSetting;
      // the server turned NotSoBot off here (see `isBlockedUserInstallRun`). the modal ones (reports) already answer
      // privately in every reply
      const blocked = !respondsWithModal && await isBlockedUserInstallRun(context);
      if (blocked && ignoresEphemeralSetting) {
        // for everyone in the channel (games), only the one that ran it would see it
        const { translate } = await I18n.getTranslator(context);
        const message = warning(translate('errors.channel_turned_off_public', {command: Markup.codestring(context.name)}));
        return setCommandGate(context, {kind: 'channel_turned_off', message});
      }
      if (!context.responded && !respondsWithModal) {
        let ephemeral = blocked;
        if (!ephemeral && !ignoresEphemeralSetting && UserSettingsStore.has(context.userId)) {
          const settings = UserSettingsStore.get(context.userId)!;
          ephemeral = settings.application_command_response_type === UserSettingsApplicationCommandResponseTypes.EPHEMERAL;
        }
        if (ephemeral) {
          await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
            flags: MessageFlags.EPHEMERAL,
          });
          keepFollowUpsPrivate(context);
        }
      }

      context.metadata = context.metadata || {};
      const { translate } = await I18n.getTranslator(context);
  
      const metadata = context.invoker.metadata;
      if (metadata) {
        if (metadata.nsfw) {
          const isNSFWAllowed = !!(context.inDm || (context.channel && (context.channel.isDm || context.channel.nsfw)));
          if (!isNSFWAllowed) {
            return setCommandGate(context, {kind: 'nsfw', message: warning(translate('errors.not_nsfw_channel'))});
          }
        }
        if (metadata.premium || metadata.premiumPlus || metadata.premiumServer) {
          let hasPremium: boolean = false;
          const user = await UserStore.getOrFetch(context, context.userId);
          if (user) {
            if (metadata.premiumPlus) {
              // same as the prefixed commands, MAX alone isn't plus
              hasPremium = user.isPremiumPlus || user.hasFlag(UserFlags.OWNER);
            } else {
              hasPremium = !!user.premiumType || user.hasFlag(UserFlags.OWNER);
            }
          }

          if (!hasPremium && metadata.premiumServer) {
            if (typeof(metadata.premiumServer) === 'string') {
              if (context.guildId) {
                const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
                if (settings && settings.features.has(metadata.premiumServer)) {
                  hasPremium = true;
                }
              } else if (context.inDm && context.channel && context.channel.ownerId) {
                // a group dm
                const settings = await ServerSettingsStore.getOrFetch(context, context.channelId!);
                if (settings && settings.features.has(metadata.premiumServer)) {
                  hasPremium = true;
                }
              }
            }

            if (!hasPremium) {
              // someone in here gave it one of their premium server slots (or owns it, for a group dm)
              const users = await getServerPremiumUsers(context);
              hasPremium = !!users.length;
            }
          }

          if (!hasPremium) {
            let message: string;
            if (metadata.premiumServer) {
              message = warning(translate('errors.premium_server_required', {command: Markup.codestring(context.name)}));
            } else if (metadata.premiumPlus) {
              message = warning(translate('errors.premium_plus_required', {command: Markup.codestring(context.name)}));
            } else {
              message = warning(translate('errors.premium_required', {command: Markup.codestring(context.name)}));
            }
            // a premium server gate passes with the user's own premium too, so that's the one to link
            const skuId = (metadata.premiumPlus) ? DiscordSkuIds.USER_NOTSOPREMIUM_PLUS : DiscordSkuIds.USER_NOTSOPREMIUM;
            return setCommandGate(context, {kind: 'premium', message, skuId});
          }
        }
      }
      return true;
    })();
  }

  onCancel(context: Interaction.InteractionContext) {
    const gate = getCommandGate(context);
    if (gate && gate.message) {
      // a link to the tier's store page, the gate already knows they don't have it
      const upsell = (gate.kind === 'premium') ? {skuId: gate.skuId} : null;
      return replyError(context, {description: gate.message, upsell}, {ephemeral: true});
    }
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }

  async onPermissionsFailClient(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.bot_missing_permissions', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translator.translate),
      permissions: formatPermissions(failed, translator),
    }));
  }

  async onPermissionsFail(context: Interaction.InteractionContext, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.user_missing_permissions', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translator.translate),
      permissions: formatPermissions(failed, translator),
    }));
  }

  // detritus checks ratelimits before the defer, every interaction has to get a response or discord shows it as failed
  async onRatelimit(
    context: Interaction.InteractionContext,
    ratelimits: Array<Interaction.CommandRatelimitInfo>,
    metadata: Interaction.CommandRatelimitMetadata,
  ) {
    const { language, translate } = await I18n.getTranslator(context);
    const { global } = metadata;
    // the longest wait, the shorter ones don't matter until it's over
    const { ratelimit, remaining } = ratelimits.reduce((x, y) => (x.remaining < y.remaining) ? y : x);

    const command = Markup.codestring(context.name);
    const seconds = (remaining / 1000).toLocaleString(language, {maximumFractionDigits: 1, minimumFractionDigits: 1});
    let content: string;
    switch (ratelimit.type) {
      case 'channel': {
        content = (global) ? translate('ratelimit.global.channel', {seconds}) : translate('ratelimit.command.channel', {command, seconds});
      }; break;
      case 'guild': {
        content = (global) ? translate('ratelimit.global.guild', {seconds}) : translate('ratelimit.command.guild', {command, seconds});
      }; break;
      case 'user': {
        content = (global) ? translate('ratelimit.global.user', {seconds}) : translate('ratelimit.command.user', {command, seconds});
      }; break;
      default: {
        content = (global) ? translate('ratelimit.global.default', {seconds}) : translate('ratelimit.command.default', {command, seconds});
      };
    }
    return replyWarning(context, content);
  }

  async onRunError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, error: any) {
    captureCommandError(context, error);
    // a modal response has no message to edit or follow up on (detritus beta.136+ throws instead of asking discord), the
    // error is only reported
    if (context.responseType === InteractionCallbackTypes.MODAL) {
      return;
    }
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.run_title', {label: translateErrorLabel(this.error, translator.translate)}));
    await replyError(context, await createRunErrorPayload(context, title, error, translator), {ephemeral: true});
  }

  // log every attempt (ran, errored, cancelled, ratelimited, etc..)
  async onFinally(context: Interaction.InteractionContext) {
    if (!context.invoker || !context.invoker.metadata) {
      return;
    }

    let commandType: null | number = null;
    switch (context.command.type) {
      case ApplicationCommandTypes.CHAT_INPUT: commandType = CommandTypes.APPLICATION_SLASH; break;
      case ApplicationCommandTypes.MESSAGE: commandType = CommandTypes.APPLICATION_MENU_MESSAGE; break;
      case ApplicationCommandTypes.USER: commandType = CommandTypes.APPLICATION_MENU_USER; break;
      default: commandType = null;
    }

    if (commandType !== null) {
      const metadata = context.invoker.metadata;
      const commandId = metadata.id || context.name.split(' ').join('.');
      // set by NotSoAI's command, which response its reply holds
      const llmResponseId: string | undefined = context.metadata && context.metadata.llmResponseId;
      if (llmResponseId && context.responseId) {
        CommandResponsesStore.insertLLMResponse(context.responseId, llmResponseId, context.userId);
      }
      // the response as it is now, like it always was (a components v2 result replaces it with a follow-up later)
      const messageResponseId = context.responseId;
      // a media job still polling (`run` returned with its thinking reply) counts once it ends, with how it ended
      const command = context.command;
      await afterJobRuns(context, () => createUserCommand(
        context,
        context.userId,
        commandId,
        {
          commandType,
          channelId: context.channelId!,
          guildId: context.guildId,
          llmResponseId,
          messageResponseId,
          messageTriggerId: context.interactionId,
          result: getRecordedCommandResult(context),
        },
      ), (error) => context.interactionCommandClient.emit(ClientEvents.COMMAND_ERROR, {command, context, error}));
    }
  }

  async onValueError(context: Interaction.InteractionContext, args: Interaction.ParsedArgs, errors: Interaction.ParsedErrors) {
    setCommandResult(context, CommandResults.ARGUMENT_ERROR);
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.argument_title', {label: translateErrorLabel(this.error, translator.translate)}));
    return replyError(context, createArgumentErrorPayload(title, errors, translator), {ephemeral: true});
  }
}


export class BaseInteractionCommandOption extends Interaction.InteractionCommandOption {
  blockedCommandShouldStillExecute = true;
  error = 'Slash';
  // see `BaseInteractionCommand.ignoresEphemeralSetting`
  ignoresEphemeralSetting = false;
  // what it was built from (with the media bases' url/attachment options and ratelimits), see `BaseSlashCommandFromOption`
  optionData: Interaction.InteractionCommandOptionOptions;
  triggerLoadingAsEphemeral = false;
  type = ApplicationCommandOptionTypes.SUB_COMMAND;

  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super(data);
    this.optionData = data;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }
}


// tags are stored per server, so only let them be written in servers that added the bot (not through a user install)
// the bot user can be in the server without the server install of the slash commands (old invites), then the command
// comes through the user install. a channel where the server turned NotSoBot off is checked apart, see `isBlockedUserInstallRun`
export function canWriteServerTags(context: Interaction.InteractionContext): boolean {
  return !context.guildId || context.isFromGuildInstall || context.isBotPresent;
}

export class BaseInteractionTagWriteCommandOption extends BaseInteractionCommandOption {
  // replacing the group's `onBefore` skipped its early ephemeral defer (the user's response setting) and metadata gates
  async onBefore(context: Interaction.InteractionContext): Promise<boolean> {
    if (!canWriteServerTags(context)) {
      return false;
    }
    if (await isBlockedUserInstallRun(context)) {
      return false;
    }
    return BaseInteractionCommand.prototype.onBefore.call(this as any, context);
  }

  async onCancel(context: Interaction.InteractionContext) {
    if (getCommandGateMessage(context)) {
      return BaseInteractionCommand.prototype.onCancel.call(this as any, context);
    }
    const { translate } = await I18n.getTranslator(context);
    if (context.metadata && context.metadata.blockedUserInstallRun) {
      return replyWarning(context, translate('tag.channel_turned_off'));
    }
    return replyWarning(context, translate('tag.server_not_installed'));
  }
}


export class BaseInteractionAudioOrVideoCommandOption extends BaseInteractionCommandOption {
  // `skipFiles` leaves out attachments that aren't the media (a `.mid`)
  constructor(data: Interaction.InteractionCommandOptionOptions = {}, mediaSearchOptions: FindMediaUrlOptions = {}) {
    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), label: 'url', default: DefaultParameters.lastMediaUrl({...mediaSearchOptions, image: false}), value: Parameters.lastMediaUrl({...mediaSearchOptions, image: false})},
        {name: 'attachment', description: 'Audio/Video File', ...I18n.optionLocalizations('commands.options.audio_video.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_audio_video_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionImageCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {
          name: 'url',
          description: 'Emoji/Image URL/User',
          ...I18n.optionLocalizations('commands.options.image.url'),
          default: DefaultParameters.lastMediaUrl({audio: false, video: false}),
          value: Parameters.lastMediaUrl({audio: false, video: false}),
        },
        {
          name: 'attachment',
          description: 'Image File',
          ...I18n.optionLocalizations('commands.options.image.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_images_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionImageOrVideoCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}, mediaSearchOptions: FindMediaUrlOptions = {}) {
    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl({...mediaSearchOptions, audio: false}), value: Parameters.lastMediaUrl({...mediaSearchOptions, audio: false})},
        {name: 'attachment', description: 'Media File', ...I18n.optionLocalizations('commands.options.media.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_images_videos_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionMediaCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}, mediaSearchOptions: FindMediaUrlOptions = {}) {
    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl(mediaSearchOptions), value: Parameters.lastMediaUrl(mediaSearchOptions)},
        {name: 'attachment', description: 'Media File', ...I18n.optionLocalizations('commands.options.media.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_media_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionMediasCommandOption extends BaseInteractionCommandOption {
  maxAmount = 2;
  minAmount = 0;

  constructor(data: Partial<Interaction.InteractionCommandOptionOptions> & {maxAmount?: number, minAmount?: number}) {
    const mediaUrls = Parameters.mediaUrls({
      maxAmount: data.maxAmount,
      minAmount: data.minAmount,
    });

    // numbered attachments, so the localized names get the number too (`archivo-1`)
    const { nameLocalizations, ...attachmentLocalizations } = I18n.optionLocalizations('commands.options.media.attachment');
    const attachmentOptions = Array.from({length: data.maxAmount || 2}).map((x, key) => {
      return {
        name: `attachment-${key + 1}`,
        ...(nameLocalizations) ? {
          nameLocalizations: Object.fromEntries(Object.entries(nameLocalizations).map(([locale, name]) => [locale, `${name}-${key + 1}`])),
        } : {},
        description: 'Media File',
        ...attachmentLocalizations,
        type: ApplicationCommandOptionTypes.ATTACHMENT,
      };
    });

    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {
          name: 'urls',
          description: 'Emoji/Media URLs/Users',
          ...I18n.optionLocalizations('commands.options.medias.urls'),
          default: (context: Interaction.InteractionContext) => mediaUrls('', context),
          value: mediaUrls,
        },
        ...attachmentOptions,
      ],
    });

    this.maxAmount = data.maxAmount || this.maxAmount;
    this.minAmount = data.minAmount || this.minAmount;
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {urls: Array<string>}) {
    return !!args.urls.length && args.urls.length <= this.maxAmount && this.minAmount <= args.urls.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: {urls: Array<string>}) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.urls.length) {
      if (!context.isBotPresent) {
        return replyWarning(context, translate('errors.no_channel_history'));
      }
      return replyWarning(context, translate('errors.no_media_found'));
    } else if (args.urls.length < this.minAmount) {
      if (!context.isBotPresent) {
        return replyWarning(context, translate('errors.no_channel_history_amount', {amount: this.minAmount}));
      }
      return replyWarning(context, translate('errors.not_enough_media_found', {amount: this.minAmount}));
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return replyWarning(context, translate('errors.too_many_media_found'));
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionVideoCommandOption extends BaseInteractionCommandOption {
  constructor(data: Interaction.InteractionCommandOptionOptions = {}) {
    super({
      ratelimits: CommandRatelimits.MEDIA,
      ...data,
      options: [
        ...(data.options || []),
        {name: 'url', description: 'Emoji/Media URL/User', ...I18n.optionLocalizations('commands.options.media.url'), default: DefaultParameters.lastMediaUrl({audio: false, image: false}), value: Parameters.lastMediaUrl({audio: false, image: false})},
        {name: 'attachment', description: 'Video File', ...I18n.optionLocalizations('commands.options.video.attachment'), type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined || args.url === null) {
      return replyMediaUrlNotFound(context, args.url, 'errors.no_videos_found');
    }
    return super.onCancelRun(context, args);
  }
}


export class BaseInteractionCommandOptionGroup extends Interaction.InteractionCommandOption {
  error = 'Slash';
  type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;

  async onCancelRun(context: Interaction.InteractionContext, args: Record<string, any>) {
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.cancel_run', {
      command: Markup.codestring(context.name),
      label: translateErrorLabel(this.error, translate),
    }));
  }
}



export class BaseSlashCommand extends BaseInteractionCommand {
  error = 'Slash';
  permissionsIgnoreClientOwner = true;
  type = ApplicationCommandTypes.CHAT_INPUT;

  triggerLoadingAfter = 1000;
}


// detritus' hooks. an option only has its own ones (`run`, the media bases' `onBeforeRun`/`onCancelRun`) until a group
// hands it the rest
const OPTION_HOOK_NAMES = [
  'onAutoComplete',
  'onAutoCompleteError',
  'onBefore',
  'onBeforeRun',
  'onCancel',
  'onCancelRun',
  'onDmBlocked',
  'onError',
  'onFinally',
  'onLoadingTrigger',
  'onPermissionsFail',
  'onPermissionsFailClient',
  'onRatelimit',
  'onRunError',
  'onSuccess',
  'onValueError',
  'run',
] as const;

// a subcommand moved out of its group to be a top-level command (`/tools translate` is `/translate`), so the option class
// stays the one place with its options, checks and `run`. detritus fixes a built option's parent for good, so the command
// is built again from the data the option was made with. the option's own hooks win and the rest are the slash command's,
// like the group used to hand down. the id stays the option's, so its usage, server rules and prefix tips follow it
export class BaseSlashCommandFromOption extends BaseSlashCommand {
  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  // `data` is what the group gave all of its subcommands (like `permissions`)
  constructor(option: BaseInteractionCommandOption, data: Interaction.InteractionCommandOptions = {}) {
    const hooks: Record<string, Function> = {};
    for (let name of OPTION_HOOK_NAMES) {
      const hook = (option as any)[name];
      if (typeof(hook) === 'function') {
        hooks[name] = hook.bind(option);
      }
    }
    const { options, permissions, permissionsClient, ratelimits } = option.optionData;
    super({...hooks, metadata: option.metadata, options, permissions, permissionsClient, ratelimits, ...data} as Interaction.InteractionCommandOptions);
    this.name = option.name;
    this.nameLocalizations = option.nameLocalizations;
    this.description = option.description;
    this.descriptionLocalizations = option.descriptionLocalizations;
    this.ignoresEphemeralSetting = option.ignoresEphemeralSetting;
    this.respondsWithModal = !!(option as any).respondsWithModal;
    this.triggerLoadingAsEphemeral = option.triggerLoadingAsEphemeral;
  }
}


// context menus are user installable so they're global by default, but when scoped to `guildIds` they must not also be
// global or they get registered twice and show up as duplicates in those guilds' Apps menu
// (a `global = true` class field used to override detritus' `global = false` for commands with `guildIds`)
function isContextMenuGlobal(data: Interaction.InteractionCommandOptions): boolean {
  if (data.global !== undefined) {
    return !!data.global;
  }
  return !(data.guildIds && data.guildIds.length);
}


export interface ContextMenuMessageArgs {
  message: Structures.Message,
}

export class BaseContextMenuMessageCommand extends BaseInteractionCommand {
  error = 'Message Context Menu';
  type = ApplicationCommandTypes.MESSAGE;

  permissionsIgnoreClientOwner = true;
  triggerLoadingAfter = 1000;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(data);
    this.global = isContextMenuGlobal(data);
  }
}


export interface ContextMenuUserArgs {
  member?: Structures.Member,
  user: Structures.User,
}

export class BaseContextMenuUserCommand extends BaseInteractionCommand {
  error = 'User Context Menu';
  type = ApplicationCommandTypes.USER;

  permissionsIgnoreClientOwner = true;
  // same as message/slash commands, defer before discord's 3s window runs out on slow api calls
  triggerLoadingAfter = 1000;
  triggerLoadingAsEphemeral = true;

  constructor(data: Interaction.InteractionCommandOptions = {}) {
    super(data);
    this.global = isContextMenuGlobal(data);
  }
}
