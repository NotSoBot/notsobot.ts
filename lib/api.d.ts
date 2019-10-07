import { Command } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';
import { Response } from 'detritus-rest';
export declare const API_URL = "https://beta.notsobot.com/api";
export interface ApiRequestOptions extends RequestTypes.RequestOptions {
    userId?: string;
}
export declare function request(context: Command.Context, options: ApiRequestOptions): Promise<any>;
export interface GoogleContentVisionOCR {
    url: string;
}
export declare function googleContentVisionOCR(context: Command.Context, options: GoogleContentVisionOCR): Promise<any>;
export interface GoogleSearch {
    locale?: string;
    maxResults?: number;
    query: string;
    safe?: boolean | string;
    showUnknown?: boolean | string;
}
export declare function googleSearch(context: Command.Context, options: GoogleSearch): Promise<any>;
export interface GoogleSearchImages {
    locale?: string;
    maxResults?: number;
    query: string;
    safe?: boolean | string;
}
export declare function googleSearchImages(context: Command.Context, options: GoogleSearchImages): Promise<any>;
export interface GoogleSearchYoutube {
    query: string;
}
export declare function googleSearchYoutube(context: Command.Context, options: GoogleSearchYoutube): Promise<any>;
export interface GoogleTranslate {
    from?: string;
    text: string;
    to?: string;
}
export declare function googleTranslate(context: Command.Context, options: GoogleTranslate): Promise<any>;
export interface ImageResize {
    convert?: string;
    scale?: number;
    size?: string;
    url: string;
}
export declare function imageResize(context: Command.Context, options: ImageResize): Promise<Response>;
export interface SearchDuckDuckGo {
    query: string;
}
export declare function searchDuckDuckGo(context: Command.Context, options: SearchDuckDuckGo): Promise<any>;
export interface SearchDuckDuckGoImages {
    query: string;
}
export declare function searchDuckDuckGoImages(context: Command.Context, options: SearchDuckDuckGoImages): Promise<any>;
export interface SearchUrban {
    query: string;
}
export declare function searchUrban(context: Command.Context, options: SearchUrban): Promise<any>;
export interface SearchUrbanRandom {
}
export declare function searchUrbanRandom(context: Command.Context, options?: SearchUrbanRandom): Promise<any>;
export interface SearchWolframAlpha {
    query: string;
}
export declare function searchWolframAlpha(context: Command.Context, options: SearchWolframAlpha): Promise<any>;
