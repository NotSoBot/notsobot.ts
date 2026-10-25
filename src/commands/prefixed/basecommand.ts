import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import CommandResponsesStore from '../../stores/commandresponses';
import GuildSettingsStore from '../../stores/guildsettings';
import { getServerPremiumUsers } from '../../stores/premiumservers';
import UserStore from '../../stores/users';

import { createUserCommand } from '../../api';
import { CommandResults, getCommandResult, setCommandResult } from '../../commandresults';
import {
  CommandCategories,
  DiscordReactionEmojis,
  DiscordSkuIds,
  GuildFeatures,
  RatelimitKeys,
  UserFlags,
} from '../../constants';
import { captureCommandError } from '../../sentry';
import { CommandRunCancelledError, I18n, Parameters, displayReply, findMediaUrlInMessages } from '../../utils';

import {
  createArgumentErrorPayload,
  createRunErrorPayload,
  formatPermissions,
  replyError,
  replyWarning,
  warning,
} from '../errors';


function commandNameForError(context: Command.Context, translator: I18n.Translator): string {
  if (context.command) {
    return Markup.codestring(context.command.fullName);
  }
  return translator.translate('errors.this_command');
}


// people who made a command (or the program behind it), shown in its help and on the site
// `id` is their discord user, leave it out for people we only know from their `url`
export interface CommandCredit {
  id?: string,
  name: string,
  // their page for the thing being credited (store page, repo, etc.)
  url?: string,
}

// description and usage shouldnt be optional, temporary for now
export interface CommandMetadata {
  category: CommandCategories,
  credits?: Array<CommandCredit>,
  description?: string,
  examples?: Array<string>,
  id?: string,
  nsfw?: boolean,
  // overrides the category check in `.pipe` (see PIPEABLE_COMMAND_CATEGORIES)
  pipeable?: boolean,
  premium?: boolean,
  premiumPlus?: boolean,
  premiumServer?: GuildFeatures | boolean,
  usage?: string,
}

export class BaseCommand<ParsedArgsFinished = Command.ParsedArgs> extends Command.Command<ParsedArgsFinished> {
  permissionsIgnoreClientOwner = true;
  triggerTypingAfter = 2000;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        {duration: 5000, limit: 10, type: 'guild'},
        {duration: 500, limit: 1, type: 'channel'},
      ],
    }, options));
  }

  get commandDescription(): string {
    const metadata = this.metadata as CommandMetadata;
    if (typeof(metadata.usage) === 'string') {
      return `${this.fullName} ${metadata.usage}`.trim();
    }
    return '';
  }

  onBefore(context: Command.Context): Promise<boolean> | boolean {
    // an async iife instead of `new Promise(async ...)`, anything thrown in there never settled the promise and left the
    // command hanging forever, now it rejects and detritus emits it as a COMMAND_ERROR
    return (async () => {
      const contextMetadata = context.metadata = context.metadata || {};
      const { translate } = await I18n.getTranslator(context);
  
      const metadata = (context.command || {}).metadata;
      if (metadata) {
        if (metadata.nsfw) {
          const isNSFWAllowed = !!(context.inDm || (context.channel && (context.channel.isDm || context.channel.nsfw)));
          if (!isNSFWAllowed) {
            contextMetadata.reason = warning(translate('errors.not_nsfw_channel'));
            return isNSFWAllowed;
          }
        }
        if (metadata.premium || metadata.premiumPlus || metadata.premiumServer) {
          let hasPremium: boolean = false;
          const user = await UserStore.getOrFetch(context, context.userId);
          if (user) {
            if (metadata.premiumPlus) {
              // PLUS_AI subscribers were locked out of plus commands
              hasPremium = user.isPremiumPlus || user.hasFlag(UserFlags.OWNER);
            } else {
              hasPremium = !!user.premiumType || user.hasFlag(UserFlags.OWNER);
            }
          }
  
          if (!hasPremium && metadata.premiumServer) {
            if (context.guildId && typeof(metadata.premiumServer) === 'string') {
              const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
              if (settings && settings.features.has(metadata.premiumServer)) {
                hasPremium = true;
              }
            }

            if (!hasPremium) {
              // someone in here gave it one of their premium server slots (or owns it, for a group dm)
              const users = await getServerPremiumUsers(context);
              hasPremium = !!users.length;
            }
          }
  
          if (!hasPremium) {
            context.metadata = context.metadata || {};
            if (metadata.premiumServer) {
              context.metadata.reason = warning(translate('errors.premium_server_required', {command: Markup.codestring(this.fullName)}));
            } else if (metadata.premiumPlus) {
              context.metadata.reason = warning(translate('errors.premium_plus_required', {command: Markup.codestring(this.fullName)}));
            } else {
              context.metadata.reason = warning(translate('errors.premium_required', {command: Markup.codestring(this.fullName)}));
            }
            context.metadata.reasonIsPremiumRequired = true;
            return hasPremium;
          }
        }
      }
      return true;
    })();
  }

  onCancel(context: Command.Context) {
    const contextMetadata = context.metadata = context.metadata || {};
    if (contextMetadata.reason) {
      if (contextMetadata.reasonIsPremiumRequired) {
        const storePageUrl = (
          Endpoints.Routes.URL +
          Endpoints.Routes.APPLICATION_DIRECTORY_STORE(context.applicationId, DiscordSkuIds.USER_NOTSOPREMIUM)
        );

        contextMetadata.reason = [
          contextMetadata.reason,
          //`Buy it here: ${storePageUrl}`,
        ].join('\n').trim();
  
        /*
        components = new Components();
        components.createButton({
          skuId: DiscordSkuIds.USER_NOTSOPREMIUM,
          style: MessageComponentButtonStyles.PREMIUM,
        });
        */
      }
      return replyError(context, {description: contextMetadata.reason});
    }
  }

  async onCancelRun(context: Command.Context, args: unknown) {
    const description = this.commandDescription;
    if (description) {
      return displayReply(context, {description: Markup.codeblock(`${context.prefix}${description}`)});
    }
    const { translate } = await I18n.getTranslator(context);
    return replyWarning(context, translate('errors.usage_unknown'));
  }

  async onPermissionsFailClient(context: Command.Context, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.prefix_bot_missing_permissions', {
      command: commandNameForError(context, translator),
      permissions: formatPermissions(failed, translator),
    }));
  }

  async onPermissionsFail(context: Command.Context, failed: Array<bigint>) {
    const translator = await I18n.getTranslator(context);
    return replyWarning(context, translator.translate('errors.prefix_user_missing_permissions', {
      command: commandNameForError(context, translator),
      permissions: formatPermissions(failed, translator),
    }));
  }

  async onRatelimit(
    context: Command.Context,
    ratelimits: Array<Command.CommandRatelimitInfo>,
    metadata: Command.CommandRatelimitMetadata,
  ) {
    const { message } = context;
    if (!message.canReply && !message.canReact) {
      return;
    }
    const { global } = metadata;
    const { language, translate } = await I18n.getTranslator(context);
  
    let replied: boolean = false;
    for (const {item, ratelimit, remaining} of ratelimits) {
      if ((remaining < 1000 && !replied && !item.replied) || !message.canReply) {
        const { message } = context;
        if (!message.deleted && message.canReact && !message.reactions.has(DiscordReactionEmojis.WAIT.id)) {
          await message.react(`${DiscordReactionEmojis.WAIT.name}:${DiscordReactionEmojis.WAIT.id}`);
        }
        replied = item.replied = true;
        continue;
      }
  
      if (remaining < 1000 || replied || item.replied) {
        // skip replying
        item.replied = true;
        continue;
      }
      replied = item.replied = true;
  
      // full sentences per type, since the verb changes with who is being ratelimited
      const command = this.fullName;
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
  
      try {
        const reply = await context.reply(content);
        await Timers.sleep(Math.max(remaining / 2, 2000));
        item.replied = false;
        if (!reply.deleted) {
          await reply.delete();
        }
      } catch(e) {
        item.replied = false;
      }
    }
  }

  async onRunError(context: Command.Context, args: ParsedArgsFinished, error: any) {
    // its trigger was edited or deleted, the newer run (if any) owns the reply
    if (error instanceof CommandRunCancelledError) {
      return;
    }
    captureCommandError(context, error);
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.prefix_run_title'));
    return replyError(context, await createRunErrorPayload(context, title, error, translator));
  }

  // log every attempt, `context.response` is whatever reply the command flow stored (result, error, cancel, etc..)
  async onFinally(context: Command.Context) {
    if (!context.command) {
      return;
    }
    // the trigger got deleted while we were still running, so the COMMAND_DELETE cleanup never saw this reply
    const response = context.response;
    if (context.message.deleted && response && !response.deleted) {
      try {
        await response.delete();
      } catch(error) {

      }
    }
    const metadata = context.command.metadata;
    const commandId = metadata.id || context.command.fullName.split(' ').join('.');
    // the api only stores it when there's a response, the message delete listener and the reply-to-ai check look here
    // before asking it
    // set by NotSoAI's command, which response its reply holds
    const llmResponseId: string | undefined = context.metadata && context.metadata.llmResponseId;
    if (context.response) {
      CommandResponsesStore.insert(context.messageId, context.response.id, commandId);
      if (llmResponseId) {
        CommandResponsesStore.insertLLMResponse(context.response.id, llmResponseId, context.userId);
      }
    }
    await createUserCommand(
      context,
      context.userId,
      commandId,
      {
        channelId: context.channelId,
        guildId: context.guildId,
        llmResponseId,
        messageResponseId: (context.response) ? context.response.id : undefined,
        messageTriggerId: context.messageId,
        result: getCommandResult(context),
      },
    );
  }

  async onTypeError(context: Command.Context, args: ParsedArgsFinished, errors: Command.ParsedErrors) {
    setCommandResult(context, CommandResults.ARGUMENT_ERROR);
    const translator = await I18n.getTranslator(context);
    const title = warning(translator.translate('errors.prefix_argument_title'));
    return replyError(context, createArgumentErrorPayload(title, errors, translator));
  }
}


export class BaseMediaCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  errorNotFound: I18n.TranslationKey = 'errors.no_media_found';
  triggerTypingAfter = 250;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      label: 'url',
      name: '',
      permissionsClient: [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.IMAGE, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.IMAGE, type: 'channel'},
      ],
      type: options.type || Parameters.lastMediaUrl(),
      ...options,
    });
  }

  onBeforeRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url) {
      context.metadata = Object.assign({}, context.metadata, {contentUrl: args.url});
    }
    return !!args.url;
  }

  async onCancelRun(context: Command.Context, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      return replyWarning(context, translate(this.errorNotFound));
    } else if (args.url === null) {
      return replyWarning(context, translate('errors.invalid_user_or_url'));
    }
    return super.onCancelRun(context, args);
  }

  onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    if (context.response) {
      const responseUrl = findMediaUrlInMessages([context.response], {audio: false, video: false});
      if (responseUrl) {
        context.metadata = Object.assign({}, context.metadata, {responseUrl});
      }
    }
  }
}


export class BaseMediasCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  errorNotEnough: I18n.TranslationKey = 'errors.not_enough_media_found';
  errorNotFound: I18n.TranslationKey = 'errors.no_media_found';
  errorTooMany: I18n.TranslationKey = 'errors.too_many_media_found';
  maxAmount = 2;
  minAmount = 0;
  triggerTypingAfter = 250;

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      label: 'urls',
      name: '',
      permissionsClient: [Permissions.ATTACH_FILES, Permissions.EMBED_LINKS],
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.IMAGE, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.IMAGE, type: 'channel'},
      ],
      type: options.type || Parameters.mediaUrls({
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }

  onBeforeRun(context: Command.Context, args: {urls: Array<string>}) {
    return !!args.urls.length && args.urls.length <= this.maxAmount && this.minAmount <= args.urls.length;
  }

  async onCancelRun(context: Command.Context, args: {urls: Array<string>}) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.urls.length) {
      return replyWarning(context, translate(this.errorNotFound));
    } else if (args.urls.length < this.minAmount) {
      return replyWarning(context, translate(this.errorNotEnough, {amount: this.minAmount}));
    } else if (this.maxAmount < args.urls.length) {
      // never should happen
      return replyWarning(context, translate(this.errorTooMany));
    }
    return super.onCancelRun(context, args);
  }

  onSuccess(context: Command.Context, args: ParsedArgsFinished) {
    if (context.response) {
      const responseUrl = findMediaUrlInMessages([context.response], {audio: false, video: false});
      if (responseUrl) {
        context.metadata = Object.assign({}, context.metadata, {responseUrl});
      }
    }
  }
}


export class BaseAudioOrVideoCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  errorNotFound: I18n.TranslationKey = 'errors.no_audio_video_found';

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({image: false}),
      ...options,
    });
  }
}


export class BaseAudioOrVideosCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediasCommand<ParsedArgsFinished> {
  errorNotEnough: I18n.TranslationKey = 'errors.not_enough_audio_video_found';
  errorNotFound: I18n.TranslationKey = 'errors.no_audio_video_found';
  errorTooMany: I18n.TranslationKey = 'errors.too_many_audio_video_found';

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      type: options.type || Parameters.mediaUrls({
        audio: true,
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
        image: false,
        video: true,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }
}


export class BaseImageCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  errorNotFound: I18n.TranslationKey = 'errors.no_images_found';

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({audio: false, video: false}),
      ...options,
    });
  }
}


export class BaseImageOrVideoCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediaCommand<ParsedArgsFinished> {
  errorNotFound: I18n.TranslationKey = 'errors.no_images_videos_found';

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      type: options.type || Parameters.lastMediaUrl({audio: false}),
      ...options,
    });
  }
}


export class BaseImageOrVideosCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseMediasCommand<ParsedArgsFinished> {
  errorNotEnough: I18n.TranslationKey = 'errors.not_enough_image_video_found';
  errorNotFound: I18n.TranslationKey = 'errors.no_images_videos_found';
  errorTooMany: I18n.TranslationKey = 'errors.too_many_image_video_found';

  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions> & {maxAmount?: number, minAmount?: number}) {
    super(commandClient, {
      type: options.type || Parameters.mediaUrls({
        audio: false,
        maxAmount: options.maxAmount,
        minAmount: options.minAmount,
        image: true,
        video: true,
      }),
      ...options,
    });
    this.maxAmount = options.maxAmount || this.maxAmount;
    this.minAmount = options.minAmount || this.minAmount;
  }
}


export class BaseSearchCommand<ParsedArgsFinished = Command.ParsedArgs> extends BaseCommand<ParsedArgsFinished> {
  constructor(commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, {
      label: 'query',
      ratelimits: [
        {duration: 5000, limit: 5, key: RatelimitKeys.SEARCH, type: 'guild'},
        {duration: 1000, limit: 1, key: RatelimitKeys.SEARCH, type: 'channel'},
      ],
      ...options,
    });
  }

  onBeforeRun(context: Command.Context, args: {query: string}) {
    return !!args.query;
  }
}
