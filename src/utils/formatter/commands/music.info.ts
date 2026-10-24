import { Command, Interaction } from 'detritus-client';

import { Paginator, displayReply } from '../../../utils';
import { TranslationKey, getTranslator } from '../../i18n';

import { MusicPageOptions, createMusicPage } from './music.controls';
import { musicNothingPlayingText } from './music.shared';


export const COMMAND_ID = 'music.info';

export interface MusicPaginatorOptions extends Pick<MusicPageOptions, 'addedItemId'> {
  invokerKey?: TranslationKey,
  // shown on the first render only (`music play`'s held track carrying on first)
  note?: null | string,
  // the track to start on, what's playing otherwise
  itemId?: null | string,
}

// what's playing and the queue a track per page, the page number is its position (#1 is what's playing). Each page is
// fetched when it's shown, so a page turn or a click on the controls shows the queue as it is now (the pages follow it
// as it shrinks or grows). null when nothing's playing or queued
export async function createMusicPaginator(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string,
  options: MusicPaginatorOptions = {},
): Promise<Paginator | null> {
  const translator = await getTranslator(context);
  const pageOptions = {addedItemId: options.addedItemId};

  let first = await createMusicPage(context, translator, guildId, {...pageOptions, itemId: options.itemId});
  if (!first) {
    return null;
  }
  let note = options.note || null;

  const paginator: Paginator = new Paginator(context, {
    page: first.page,
    pageLimit: first.pageLimit,
    onPage: async (pageNumber) => {
      // the start page was just fetched
      let page = (first && first.page === pageNumber) ? first : await createMusicPage(context, translator, guildId, {...pageOptions, page: pageNumber});
      first = null;
      if (!page) {
        return {display: {description: musicNothingPlayingText(translator.translate, guildId)}};
      }
      paginator.page = page.page;
      paginator.pageLimit = page.pageLimit;

      const display = {...page.display, invokerKey: options.invokerKey, note};
      note = null;
      return {display};
    },
  });
  return paginator;
}


export async function createMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  const paginator = (guildId) ? await createMusicPaginator(context, guildId) : null;
  if (!paginator) {
    return displayReply(context, {description: musicNothingPlayingText(translate, guildId)});
  }
  return await paginator.start();
}
