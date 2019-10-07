import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { BaseStructure, BaseStructureData } from './basestructure';
import { MessageEmbedFooter, MessageEmbedThumbnail } from './messageembed';
/**
 * Application News Structure
 * @category Structure
 */
export declare class ApplicationNews extends BaseStructure {
    readonly _keys: BaseSet<string>;
    applicationId: string;
    category: null;
    description: string;
    flags: number;
    footer?: MessageEmbedFooter;
    gameId: string;
    id: string;
    thumbnail?: MessageEmbedThumbnail;
    timestamp: Date;
    title: string;
    type: string;
    constructor(client: ShardClient, data: BaseStructureData);
    mergeValue(key: string, value: any): void;
}
