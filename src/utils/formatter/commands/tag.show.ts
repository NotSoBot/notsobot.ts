import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentTypes, MessageFlags } from 'detritus-client/lib/constants';
import {
  Components,
  ComponentActionRow,
  ComponentButton,
  ComponentContainer,
  ComponentContext,
  ComponentSection,
  ComponentSelectMenu,
} from 'detritus-client/lib/utils';

import TagCustomCommandStore from '../../../stores/tagcustomcommands';

import { createTagUse, editTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import {
  Page,
  PageObject,
  Paginator,
  TagFormatter,
  checkNSFW,
  editOrReply,
  mediaReplyFromOptions,
} from '../../../utils';


export const COMMAND_ID = 'tag.show';

export interface CommandArgsBefore {
  arguments?: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  arguments?: string,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // parse it
  const { tag } = args;
  await increaseUsage(context, tag);

  context.metadata = Object.assign({}, context.metadata, {tag});
  const tagContent = (tag.reference_tag) ? tag.reference_tag.content : tag.content;
  const parsedTag = await TagFormatter.parse(context, tagContent, args.arguments);
  await maybeReplaceContent(context, tag);
  return await createTagMessage(context, parsedTag);
}


export async function createTagMessage(
  context: Command.Context | Interaction.InteractionContext,
  parsedTag: TagFormatter.TagResult,
  title?: string,
  componentContext?: ComponentContext,
) {
  context.metadata = Object.assign({}, context.metadata, {parsedTag});

  if (parsedTag.pages.length) {
    if (context instanceof ComponentContext) {
      throw new Error('TagScript does not support pages inside of components currently');
    }

    const pages = generatePages(context, parsedTag);
    const paginator = new Paginator(context, {pages});
    return await paginator.start();
  }

  let isComponentsV2 = false;

  const options: Command.EditOrReply = {};
  if (parsedTag.components) {
    const components = generateComponents(context, parsedTag);
    if (components) {
      options.components = components;
      isComponentsV2 = components.isV2;
    }
  }

  let content = parsedTag.text.trim().slice(0, 4000).trim();
  if (title) {
    content = [title + '\n', content].join('\n').slice(0, 4000).trim();
  }

  if (content) {
    if (isComponentsV2) {
      // add text display component
      if (options.components && options.components instanceof Components) {
        options.components.createTextDisplay({content});
        options.components.components.unshift(options.components.components.pop()!);
        if (40 < options.components.components.length) {
          options.components.components = options.components.components.slice(0, 40);
        }
      }
    } else {
      options.content = content.slice(0, 2000);
    }
  }

  if (parsedTag.embeds.length && !isComponentsV2) {
    // add checks for embed lengths
    options.embeds = parsedTag.embeds.slice(0, 10);
  }

  if (parsedTag.files.length) {
    options.files = parsedTag.files.slice(0, 10).map((file) => {
      if (file.waveform && !isComponentsV2) {
        options.flags = MessageFlags.IS_VOICE_MESSAGE;
      }
      return {
        description: file.description,
        durationSecs: file.durationSecs,
        filename: file.filename,
        hasSpoiler: file.spoiler,
        waveform: file.waveform,
        value: file.buffer,
      };
    });
  }

  await maybeCheckNSFW(context, options);
  if (
    !content.length &&
    (!parsedTag.components || !parsedTag.components.components.length) &&
    !parsedTag.embeds.length &&
    !parsedTag.files.length
  ) {
    options.content = 'Tag returned no content';
  }

  if (options.flags && (content.length || parsedTag.embeds.length || parsedTag.files.length !== 1 || parsedTag.components)) {
    options.flags = undefined;
  }

  const shouldDisplayMediaAsNative = !!(
    parsedTag.variables
    [TagFormatter.PrivateVariables.SETTINGS]
    [TagFormatter.TagSettings.DISPLAY_MEDIA_AS_NATIVE]
  );
  if (
    shouldDisplayMediaAsNative &&
    !options.flags &&
    !(!parsedTag.components || !parsedTag.components.components.length) &&
    !parsedTag.embeds.length &&
    parsedTag.files.length === 1
  ) {
    // todo: maybe store our fileresponse with the file object so we can refer back to it
    /*
    const file = parsedTag.files[0];
    return mediaReplyFromOptions(context, {
      content,
      context: componentContext,

      
      args?: boolean,
      content?: string,
      context?: ComponentContext,
      description?: string,
      extension?: string,
      filename?: string,
      framecount?: number,
      height?: number,
      mimetype?: string,
      reuploading?: ReuploadStatuses,
      size: number,
      spoiler?: boolean,
      storage?: null | RestResponsesRaw.FileResponseStorage,
      took?: number,
      width?: number,
    });
    */
  }

  return editOrReply(componentContext || context, options);
}


export function generateComponents(
  context: Command.Context | Interaction.InteractionContext,
  parsedTag: TagFormatter.TagResult,
): Components | null {
  if (!parsedTag.components || !parsedTag.components.components.length) {
    return null;
  }

  let isExecuting = false;

  const components = new Components({
    timeout: 1 * (60 * 1000),
    onError: (componentContext: ComponentContext, error: Error) => {
      return componentContext.editOrRespond(`TagScript error has occured: ${error}`);
    },
    onTimeout: async () => {
      if (parsedTag.components && parsedTag.components.onTimeout) {
        await TagFormatter.increaseComponentExecutions(parsedTag);
        const newParsedTag = await TagFormatter.parse(
          context,
          parsedTag.components.onTimeout,
          '',
          parsedTag.variables,
          parsedTag.context,
          parsedTag.limits,
          parsedTag.files,
        );
        return createTagMessage(context, newParsedTag);
      }

      let response: Structures.Message | null = null;
      if (context instanceof Command.Context) {
        const contextResponse = context.response;
        if (contextResponse && contextResponse.canEdit) {
          response = contextResponse;
        }
      } else if (context instanceof Interaction.InteractionContext) {
        response = context.response;
      }

      let components: any;
      if (response) {
        if (response.hasFlagComponentsV2) {
          const raw = JSON.parse(JSON.stringify(response.components));
          for (let component of raw) {
            switch (component.type) {
              case MessageComponentTypes.ACTION_ROW: {
                for (let x of component.components) {
                  switch (x.type) {
                    case MessageComponentTypes.BUTTON:
                    case MessageComponentTypes.SELECT_MENU: {
                      x.disabled = true;
                    }; break;
                  }
                }
              }; break;
              case MessageComponentTypes.CONTAINER: {
                for (let x of component.components) {
                  switch (x.type) {
                    case MessageComponentTypes.ACTION_ROW: {
                      for (let c of x.components) {
                        switch (c.type) {
                          case MessageComponentTypes.BUTTON:
                          case MessageComponentTypes.SELECT_MENU: {
                            c.disabled = true;
                          }; break;
                        }
                      }
                    }; break;
                    case MessageComponentTypes.FILE: {
                      const filename = x.file.url.split('?').shift()!.split('/').pop()!;
                      x.file.url = `attachment://${filename}`;
                    }; break;
                    case MessageComponentTypes.SECTION: {
                      if (x.accessory) {
                        switch (x.accessory.type) {
                          case MessageComponentTypes.BUTTON: {
                            x.accessory.disabled = true;
                          }; break;
                        }
                      }
                    }; break;
                  }
                }
              }; break;
              case MessageComponentTypes.FILE: {
                const filename = component.file.url.split('?').shift()!.split('/').pop()!;
                component.file.url = `attachment://${filename}`;
              }; break;
              case MessageComponentTypes.SECTION: {
                if (component.accessory) {
                  switch (component.accessory.type) {
                    case MessageComponentTypes.BUTTON: {
                      component.accessory.disabled = true;
                    }; break;
                  }
                }
              }; break;
            }
          }
          components = {toJSON: () => raw};
        } else {
          components = [];
        }

        if (context instanceof Command.Context) {
          return await response.edit({components});
        } else if (context instanceof Interaction.InteractionContext) {
          return editOrReply(context, {
            attachments: undefined,
            content: undefined,
            components,
            embeds: undefined,
          });
        }
      } else {
        // fall back to just clearing out all components and pray its not ComponentsV2
        if (context instanceof Interaction.InteractionContext) {
          return editOrReply(context, {
            attachments: undefined,
            content: undefined,
            components: [],
            embeds: undefined,
          });
        }
      }
    },
  });

  function injectRunIntoComponent(x: Record<string, any>): void {
    if (x.run || !x.url) {
      const runTagScript = x.run;
      x.run = async (componentContext: ComponentContext) => {
        if (!runTagScript) {
          // is not the tagscript executor or the button is a filler button
          await componentContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          return;
        }
        const shouldAllowEveryone = !!(
          parsedTag.variables
          [TagFormatter.PrivateVariables.SETTINGS]
          [TagFormatter.TagSettings.ALLOW_COMPONENT_EXECUTIONS_FROM_EVERYONE]
        );
        // problem is that the original user's context is still passed into the tag parsing, so {userid} will show the wrong id
        if (!shouldAllowEveryone && componentContext.userId !== context.userId) {
          await componentContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          return;
        }
        if (isExecuting) {
          return;
        }

        isExecuting = true;

        for (let x of components.components) {
          if (x instanceof ComponentActionRow) {
            for (let v of x.components) {
              if (v instanceof ComponentButton || v instanceof ComponentSelectMenu) {
                v.disabled = true;
              }
            }
          } else if (x instanceof ComponentContainer) {
            for (let v of x.components) {
              if (v instanceof ComponentActionRow) {
                for (let c of v.components) {
                  if (c instanceof ComponentButton || c instanceof ComponentSelectMenu) {
                    c.disabled = true;
                  }
                }
              } else if (v instanceof ComponentSection) {
                if (v.accessory instanceof ComponentButton) {
                  v.accessory.disabled = true;
                }
              }
            }
          } else if (x instanceof ComponentSection) {
            if (x.accessory instanceof ComponentButton) {
              x.accessory.disabled = true;
            }
          }
        }

        await componentContext.editOrRespond({
          attachments: undefined,
          content: undefined,
          components,
          embeds: undefined,
        });

        if (componentContext.data.values) {
          parsedTag.variables[TagFormatter.PrivateVariables.VALUES] = JSON.stringify(componentContext.data.values);
        }

        await TagFormatter.resetTagLimits(parsedTag);
        await TagFormatter.increaseComponentExecutions(parsedTag);
        const newParsedTag = await TagFormatter.parse(
          context,
          runTagScript,
          '',
          parsedTag.variables,
          parsedTag.context,
          parsedTag.limits,
          parsedTag.files,
        );
        return createTagMessage(context, newParsedTag, '', componentContext);
      };
    }
  }

  for (let x of parsedTag.components.components) {
    switch (x.type) {
      case MessageComponentTypes.ACTION_ROW: {
        for (let v of x.components) {
          switch (v.type) {
            case MessageComponentTypes.BUTTON:
            case MessageComponentTypes.SELECT_MENU: {
              injectRunIntoComponent(v);
            }; break;
          }
        }
        components.createActionRow(x);
      }; break;
      case MessageComponentTypes.BUTTON: {
        injectRunIntoComponent(x);
        components.createButton(x);
      }; break;
      case MessageComponentTypes.CONTAINER: {
        for (let v of x.components) {
          switch (v.type) {
            case MessageComponentTypes.ACTION_ROW: {
              for (let c of v.components) {
                switch (c.type) {
                  case MessageComponentTypes.BUTTON:
                  case MessageComponentTypes.SELECT_MENU: {
                    injectRunIntoComponent(c);
                  }; break;
                }
              }
            }; break;
            case MessageComponentTypes.SECTION: {
              if (v.accessory) {
                switch (v.accessory.type) {
                  case MessageComponentTypes.BUTTON: {
                    injectRunIntoComponent(v.accessory);
                  }; break;
                }
              }
            }; break;
          }
        }
        components.createContainer(x);
      }; break;
      case MessageComponentTypes.FILE: components.createFile(x); break;
      case MessageComponentTypes.MEDIA_GALLERY: components.createMediaGallery(x); break;
      case MessageComponentTypes.SECTION: {
        if (x.accessory) {
          switch (x.accessory.type) {
            case MessageComponentTypes.BUTTON: {
              injectRunIntoComponent(x.accessory);
            }; break;
          }
        }
        components.createSection(x);
      }; break;
      case MessageComponentTypes.SELECT_MENU: {
        injectRunIntoComponent(x);
        components.createSelectMenu(x);
      }; break;
      case MessageComponentTypes.SEPARATOR: components.createSeparator(x); break;
      case MessageComponentTypes.TEXT_DISPLAY: components.createTextDisplay(x); break;
      default: {
        throw new Error(`Unknown Component Type: ${x.type}`);
      };
    }
  }

  return components;
}


export function generatePages(
  context: Command.Context | Interaction.InteractionContext,
  parsedTag: TagFormatter.TagResult,
): Array<Page> {
  const pages = parsedTag.pages;
  if (parsedTag.files.length) {
    const used = new Set<string>();
    const files: Record<string, any> = {};
    for (let file of parsedTag.files.slice(0, 10)) {
      files[file.filename] = {
        description: file.description,
        durationSecs: file.durationSecs,
        filename: file.filename,
        hasSpoiler: file.spoiler,
        value: file.buffer,
      };
    }

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if ((!page.filenames || !page.filenames.length) && (!page.embeds || !page.embeds[0])) {
        continue;
      }

      if (page.embeds && page.embeds.length) {
        const embed = page.embeds[0];
        if (!Array.isArray(page.files)) {
          page.files = [];
        }
  
        if (embed.author && embed.author.iconUrl && embed.author.iconUrl.startsWith('attachment://')) {
          const filename = embed.author.iconUrl.split('attachment://')[1]!;
          if (filename in files) {
            page.files.push(files[filename]);
            used.add(filename);
          }
        }
        if (embed.footer && embed.footer.iconUrl && embed.footer.iconUrl.startsWith('attachment://')) {
          const filename = embed.footer.iconUrl.split('attachment://')[1]!;
          if (filename in files) {
            page.files.push(files[filename]);
            used.add(filename);
          }
        }
        if (embed.thumbnail && embed.thumbnail.url.startsWith('attachment://')) {
          const filename = embed.thumbnail.url.split('attachment://')[1]!;
          if (filename in files) {
            page.files.push(files[filename]);
            used.add(filename);
          }
        }
        if (embed.image && embed.image.url.startsWith('attachment://')) {
          const filename = embed.image.url.split('attachment://')[1]!;
          if (filename in files) {
            page.files.push(files[filename]);
            used.add(filename);
          }
        }
      }
      if (page.filenames && page.filenames.length) {
        if (!Array.isArray(page.files)) {
          page.files = [];
        }
        for (let filename of page.filenames) {
          if (filename.startsWith('attachment://')) {
            filename = filename.split('attachment://')[1]!;
          }
          if (filename in files) {
            page.files.push(files[filename]);
            used.add(filename);
          }
        }
      }
    }

    for (let filename in files) {
      if (!used.has(filename)) {
        for (let page of pages) {
          if (!Array.isArray(page.files)) {
            page.files = [];
          }
          page.files.push(files[filename]);
        }
      }
    }
  }

  return pages;
}


export async function increaseUsage(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
) {
  let timestamp: number;
  if (context instanceof Interaction.InteractionContext) {
    timestamp = context.interaction.createdAtUnix;
  } else {
    timestamp = context.message.editedAtUnix || context.message.createdAtUnix;
  }

  try {
    const response = await createTagUse(context, tag.id, {
      serverId: context.guildId || context.channelId,
      timestamp,
      userId: context.userId,
    });
    tag.last_used = response.last_used;
    // update TagCustomCommandStore using server_id or user.id, problem is that its only for this cluster
  } catch(e) {

  }
}


export async function maybeCheckNSFW(
  context: Command.Context | Interaction.InteractionContext,
  options: Command.EditOrReply,
): Promise<void> {
  if (options.content) {
    if (150 <= (options.content.match(/\r\n|\r|\n/g) || []).length) {
      options.content = 'i love cats';
    }
    const [ isAwfulNSFW ] = await checkNSFW(context, options.content);
    if (isAwfulNSFW) {
      options.content = 'i love cats';
    }
  }
}


export async function maybeReplaceContent(
  context: Command.Context | Interaction.InteractionContext,
  tag: RestResponsesRaw.Tag,
) {
  const tagId = (tag.reference_tag) ? tag.reference_tag.id : tag.id;

  const replacementContent = context?.metadata?.parsedTag?.replacement;
  if (replacementContent) {
    try {
      // update tag without updating the edit time
      await editTag(context, tagId, {
        content: replacementContent,
        isUrlRefresh: true,
      });
    } catch(e) {
  
    }
  }
}
