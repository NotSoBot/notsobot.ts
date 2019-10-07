export declare function normalize(object: {
    [key: string]: any;
}): Readonly<{
    [key: string]: any;
}>;
export declare function guildIdToShardId(guildId: string, shardCount?: number): number;
export declare type URIEncodeWrapFunc = (...args: Array<any>) => string;
export declare type URIEncodeWrapped = {
    [key: string]: any;
};
export declare function URIEncodeWrap(unsafe: URIEncodeWrapped): URIEncodeWrapped;
