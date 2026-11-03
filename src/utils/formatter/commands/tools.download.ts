import { Command, Interaction } from 'detritus-client';

import { utilitiesFetchMedia } from '../../../api';
import { DiscordSkuIds } from '../../../constants';
import { DefaultParameters, jobReply, linkPremiumSkuName } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.download';


export interface CommandArgs {
  locale?: string,
  mediaFormat?: string,
  mediaPosition?: number,
  quality?: string,
  spoiler?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await utilitiesFetchMedia(context, {
    downloadQuality: args.quality,
    locale: args.locale,
    mediaFormat: args.mediaFormat,
    mediaPosition: args.mediaPosition,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
  const { translate } = await getTranslator(context);
  return jobReply(context, job, {
    // the api only says when the cap picked the quality, so they don't have the tier that gets `best` (1440p is plus)
    describe: (response) => {
      if (!response.download_quality) {
        return undefined;
      }
      const { best, capped, tier } = response.download_quality;
      if (tier === 'premium_plus') {
        const text = translate('tools_download.quality_upsell_plus', {best, quality: capped});
        return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM_PLUS)}`;
      }
      const text = translate('tools_download.quality_upsell', {best, quality: capped});
      return `-# ${linkPremiumSkuName(context, text, DiscordSkuIds.USER_NOTSOPREMIUM)}`;
    },
    spoiler: args.spoiler,
  });
}
