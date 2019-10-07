import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { BaseStructure, BaseStructureData } from './basestructure';
/**
 * Voice Region Structure
 * @category Structure
 */
export declare class VoiceRegion extends BaseStructure {
    readonly _keys: BaseSet<string>;
    custom: boolean;
    deprecated: boolean;
    id: string;
    name: string;
    optimal: boolean;
    vip: boolean;
    constructor(client: ShardClient, data: BaseStructureData);
    toString(): string;
}
