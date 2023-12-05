import { Command, Interaction, Structures, Utils } from 'detritus-client';


export type OnErrorCallback = (error: any, confirmer: Confirmer) => Promise<any> | any;
export type OnExpireCallback = (confirmer: Confirmer) => Promise<any> | any;
export type OnCancelCallback = (payload: any) => Promise<Utils.Embed> | Utils.Embed;
export type OnConfirmationCallback = (payload: any) => Promise<Utils.Embed> | Utils.Embed;
export type OnConfirmationSuccessCallback = () => Promise<Utils.Embed> | Utils.Embed;


export class Confirmer {
  readonly context: Command.Context | Interaction.InteractionContext | Structures.Message;

  constructor(context: Command.Context | Interaction.InteractionContext | Structures.Message) {
    this.context = context;
  }

  get channelId(): string {
    return this.context.channelId!;
  }
}
