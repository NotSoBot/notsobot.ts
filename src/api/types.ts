import { Collections } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import {
  GoogleCardTypes,
  GoogleImageVideoTypes,
  GoogleLocales,
  GuildLoggerTypes,
  GuildReportTypes,
  GuildRuleActions,
  GuildRuleTargetTypes,
  GuildSettingsResponseDisplayTypes,
  MeasurementUnits,
  MediaAudioBitcrushModes,
  MediaAudioMultiPitchEngines,
  MediaEyeTypes,
  MediaMemeFonts,
  MediaPixelSortFunctions,
  MediaPixelSortIntervals,
  MediaQuadartTypes,
  MediaSongSounds,
  MusicLoopModes,
  MusicStatsPeriods,
  MusicStatsSorts,
  RedditSortTypes,
  RedditTimeTypes,
  ReportStatuses,
  ReportTypes,
  TagBlobStorageTypes,
  TagDirectoryCategories,
  TagDirectoryVerificationStates,
  TagVariableStorageTypes,
  UserSettingsApplicationCommandResponseTypes,
  UserSettingsFallbacksMediaImageTypes,
  UserSettingsResponseDisplayTypes,
  UserSettingsSearchProviders,
  UserSettingsUploadThresholdTypes,
  UserSettingsUploadTypes,
  YoutubeResultTypes,
} from '../constants';

import { GoogleSearchImageResult } from './structures/googlesearchimageresult';
import {
  GuildSettings,
  GuildSettingsLogger,
  GuildSettingsPrefix,
} from './structures/guildsettings';
import { ServerSettings } from './structures/serversettings';
import { User, UserFull } from './structures/user';


export namespace RestOptions {
  export interface CreateGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
    webhookId: string,
    webhookToken: string,
  }

  export interface CreateReminder {
    channelId?: string,
    content: string,
    guildId?: string,
    isAllDay?: boolean,
    messageId?: null | string,
    timestampEnd?: number,
    timestampStart: number,
  }

  export interface CreateReport {
    channelId?: string,
    content: string,
    guildId?: string,
    messageId?: null | string,
    // message reports of a tag's output
    tagId?: string,
    targetId?: string,
    type: ReportTypes,
  }

  export interface CreateReportMessage {
    content: string,
  }

  export interface CreateTagUse {
    serverId?: string,
    timestamp: number,
    userId: string,
  }

  export interface CreateUserCommand {
    channelId: string,
    commandType?: number,
    guildId?: string,
    // the NotSoAI response the reply holds, so replying to it continues the conversation
    llmResponseId?: string,
    messageResponseId?: string,
    messageTriggerId?: string,
    result?: string,
  }

  export interface CreateVoiceClone {
    file?: RequestFile,
    name?: string,
    url?: string,
  }


  export interface DeleteChannel {
    guildId: string,
  }

  export interface DeleteCommandsResponses {
    channelId?: string,
    triggerIds: Array<string>,
  }

  export interface DeleteGuildLogger {
    channelId: string,
    type: GuildLoggerTypes,
  }

  export interface DeleteTags {
    content?: string,
    name?: string,
    userId?: string,
  }

  export interface DeleteTagSearch {
    name: string,
    serverId?: string,
  }

  export interface DeleteTagVariable {
    name: string,
  }


  // a rule that already exists for the same action, target and command/category gets the new value instead
  export interface PutGuildRule {
    action: GuildRuleActions,
    // only changed on an existing rule when given, null follows the server's setting
    adminBypass?: boolean | null,
    category?: string | null,
    command?: string | null,
    targetId: string,
    targetType: GuildRuleTargetTypes,
    value: {allow: boolean, message?: string | null},
  }

  export interface EditGuildRule {
    // null follows the server's setting
    adminBypass?: boolean | null,
    value?: {allow: boolean, message?: string | null},
  }

  export interface EditGuildSettings {
    blocked?: boolean,
    blockedReason?: null | string,
    locale?: string | null,
    mlDiffusionModel?: string | null,
    mlLLMModel?: string | null,
    mlLLMPersonality?: string | null,
    prefixes?: Array<string>,
    responseDisplay?: GuildSettingsResponseDisplayTypes | null,
    // null resets it to on
    rulesAdminBypass?: boolean | null,
    searchProviderImages?: UserSettingsSearchProviders | null,
    searchProviderWeb?: UserSettingsSearchProviders | null,
    timezone?: string | null,
    // replaces the whole ladder, empty or null turns it off
    warningsActions?: Array<RestResponsesRaw.GuildWarningAction> | null,
    // seconds, null: warnings never expire
    warningsExpire?: number | null,
    // seconds, null resets it to 30 days
    warningsWindow?: number | null,
  }

  export interface EditServerSettings {
    blocked?: boolean,
    blockedReason?: null | string,
    mlDiffusionModel?: string,
    mlLLMModel?: string | null,
    mlLLMPersonality?: string | null,
    timezone?: string,
  }

  export interface EditReminder {
    channelId?: null | string,
    content?: string,
    guildId?: null | string,
    messageId?: null | string,
    timestampEnd?: null | number,
    timestampStart?: number,
  }

  export interface EditTag {
    content?: string,
    isCommand?: boolean,
    isUrlRefresh?: boolean,
    name?: string,
    referenceTagId?: string,
  }

  export interface EditTagsDirectoryTag {
    category?: TagDirectoryCategories,
    contentPublic?: boolean,
    description?: string,
    title?: string,
  }

  export interface EditUser {
    blocked?: boolean,
    blockedReason?: null | string,
    channelId?: null | string,
  }

  export interface CreateUserLLMMemory {
    content: string,
    // only for the server the request comes from
    server?: boolean,
  }

  export interface EditUserLLMMemory {
    content: string,
  }

  export interface EditUserSettings {
    applicationCommandResponseType?: null | UserSettingsApplicationCommandResponseTypes,
    downloadQuality?: null | string,
    fallbacksMediaImage?: null | UserSettingsFallbacksMediaImageTypes,
    fileUploadThreshold?: null | UserSettingsUploadThresholdTypes,
    fileUploadType?: null | UserSettingsUploadTypes,
    locale?: null | string,
    mlDiffusionModel?: null | string,
    mlLLMMemoryDisabled?: boolean,
    mlLLMModel?: null | string,
    mlLLMPersonality?: null | string,
    responseDisplay?: null | UserSettingsResponseDisplayTypes,
    searchProviderImages?: null | UserSettingsSearchProviders,
    searchProviderWeb?: null | UserSettingsSearchProviders,
    timezone?: null | string,
    ttsVoice?: null | string,
    units?: null | string,
    vanity?: null | string,
  }


  export interface FetchCommandsResponses {
    after?: string,
    before?: string,
    channelId?: string,
    limit?: number,
    responseIds?: Array<string>,
    triggerIds?: Array<string>,
    userId?: string,
  }

  export interface FetchCommandsUsage {
    after?: number | string,
    before?: number | string,
    channelId?: string,
    commandId?: string,
    commandType?: number,
    guildId?: string,
    limit?: number,
    since?: number,
    userId?: string,
  }

  export interface FetchReminders {
    after?: string,
    before?: string,
    guildId?: number | string,
    limit?: number,
    timestampMax?: number,
    timestampMin?: number,
    userId?: string,
  }

  export interface PutGuildTimedBans {
    moderatorId: string,
    timestampEnd: number,
    userIds: Array<string>,
  }

  export interface DeleteGuildTimedBan {
    // only delete it if it's still this one
    timedBanId?: string,
  }

  export interface DeleteGuildTimedBans {
    userIds: Array<string>,
  }

  export interface PutGuildWarnings {
    moderatorId: string,
    reason?: string | null,
    userIds: Array<string>,
  }

  export interface FetchGuildWarnings {
    // paging back from the newest
    before?: string,
    limit?: number,
    userId?: string,
  }

  export interface DeleteGuildWarnings {
    userIds: Array<string>,
  }

  export interface CreateGuildReport {
    reason: string,
    targetId: string,
    type: GuildReportTypes,
    // the reporter
    userId: string,
    // message reports only, with the message's text in case it gets deleted
    channelId?: string,
    messageContent?: string | null,
    messageId?: string,
  }

  export interface FetchGuildReports {
    // paging back from the newest
    before?: string,
    limit?: number,
    status?: ReportStatuses,
  }

  export interface CreateGuildReportMessage {
    // the moderator, or the reporter (the api only takes it on their own report)
    authorId: string,
    content: string,
    moderator: boolean,
  }

  export interface EditGuildReport {
    moderatorId: string,
    status: ReportStatuses,
  }

  export interface EditGuildReportLogMessages {
    messages: Array<RestResponsesRaw.GuildReportLogMessage>,
  }

  export interface FetchMusicSessions {
    shardCount: number,
    shardIds: Array<number>,
  }

  export interface PutGuildMusicSession {
    channelId: string,
    // the node's stacked live effects, kept for a restart
    effects?: Array<string>,
    // paused too long, we left (`paused` and `position` are where it stopped), joining again clears it
    held?: boolean,
    nodeId?: null | string,
    paused?: boolean,
    // milliseconds, where the track is right now
    position?: number,
    // the node's `speed` (the effects' and the tempo's together), the api's position estimate goes on at it
    speed?: number,
    // the node's tempo (percent, the pitch kept), kept for a restart
    tempo?: number,
    // the node's volume (percent), kept for a restart
    volume?: number,
  }

  // what played ends (`finishedId`, the queue's loop decides if it goes) and the next item becomes the playing one
  export interface PostGuildMusicNext {
    finishedId?: string,
    finishedReason?: 'failed' | 'finished' | 'skipped',
  }

  // the server's saved effects, volume or tempo while we're not playing (what the next session starts with)
  export interface EditGuildMusicSound {
    effects?: Array<string>,
    // percent, the pitch kept
    tempo?: number,
    // percent
    volume?: number,
  }

  export interface EditGuildMusicSession {
    channelId?: string,
    // the node's stacked live effects, kept for a restart
    effects?: Array<string>,
    nodeId?: null | string,
    paused?: boolean,
    // milliseconds, where the track is right now
    position?: number,
    // the node's `speed` (the effects' and the tempo's together), the api's position estimate goes on at it
    speed?: number,
    // the node's tempo (percent, the pitch kept), kept for a restart
    tempo?: number,
    // the node's volume (percent), kept for a restart
    volume?: number,
  }

  export interface PutGuildMusicQueue {
    // 1 is next, the end by default
    position?: number,
    // a `searchMusic` result as it came: an opus.rip `track` (and its service page as `url`), or only `url` for a link
    track?: RestResponsesRaw.MusicTrack | null,
    url?: null | string,
    userId: string,
  }

  export interface PutGuildMusicQueueBatch {
    // the album's/playlist's (`collection.name`)
    name?: null | string,
    // an album's/playlist's `searchMusic` results as they came
    tracks: Array<{track: RestResponsesRaw.MusicTrack, url: null | string}>,
    userId: string,
  }

  export interface EditGuildMusic {
    // seconds a track fades into the next, 0 off (it only fades on a premium server)
    crossfade?: number,
    // dj mode, controlling the music needs manage server or the dj role (on by default)
    djOnly?: boolean,
    // the dj role, null clears it (roles named "notsomusic" count then)
    djRoleId?: null | string,
    // taking turns between who queued (a server setting, it stays)
    fairQueue?: boolean,
    loop?: MusicLoopModes,
    // the longest track that can be queued (seconds), 0 for no limit
    maxDuration?: number,
    // no track queued twice at once
    noDuplicates?: boolean,
    // with 24/7, pausing when everyone else leaves the channel (off by default)
    pauseAlone?: boolean,
    // 24/7, staying in voice (on by default, it only does anything with premium)
    stay?: boolean,
    // pausing someone else's track is a vote
    votePause?: boolean,
    // resuming someone else's track is a vote
    voteResume?: boolean,
    // skipping someone else's track is a vote
    voteSkip?: boolean,
  }

  export interface FetchGuildMusicHistory {
    // older than this entry, for the next page
    before?: string,
    limit?: number,
  }

  export interface FetchGuildMusicStats {
    // per top list, up to 50 (10 by default)
    limit?: number,
    period?: MusicStatsPeriods,
    sort?: MusicStatsSorts,
  }

  export interface EditGuildMusicQueueItem {
    position: number,
  }

  export interface DeleteGuildMusicQueue {
    // only what was queued together (an album/playlist)
    batchId?: string,
    // only these, or only what this user queued, everything queued by default (never what's playing)
    itemIds?: Array<string>,
    userId?: string,
  }

  export interface FetchTimedBans {
    after?: string,
    before?: string,
    limit?: number,
    timestampMax?: number,
    timestampMin?: number,
  }

  export interface FetchReports {
    limit?: number,
    status?: ReportStatuses,
  }

  export interface PostTagsImport {
    canManage?: boolean,
    guildId?: string | null,
    // names from a previous import's conflicts to replace
    overwrite?: Array<string>,
    url: string,
  }

  export interface FetchTagsExport {
    content?: string,
    name?: string,
    userId?: string,
  }

  export interface FetchTagsDirectory {
    limit?: number,
    // title/description/name, or `id:<tag id>` / `user:<owner id>`
    query?: string,
  }

  export interface FetchTags{
    after?: string,
    before?: string,
    content?: string,
    limit?: number,
    name?: string,
    sortBy?: number,
    userId?: string,
  }

  export interface FetchTagBlobs {
    channelId: string,
    guildId?: string,
    userId: string,
  }

  export interface FetchTagSearch {
    name: string,
    serverId?: string,
  }

  export interface FetchTagSearchRandom {
    content?: string,
    name?: string,
    serverId?: string,
    userId?: string,
  }

  export interface FetchTagStorage {
    maxFileSize?: number,
    serverId?: string | null,
  }

  export interface FetchTagVariable {
    name: string,
  }

  export interface FetchTagVariables{
    channelId: string,
    guildId?: string,
    userId: string,
  }

  export interface FetchUserReminders {
    after?: string,
    before?: string,
    guildId?: number | string,
    limit?: number,
  }

  export interface FetchUserTags {
    after?: string,
    before?: string,
    content?: string,
    limit?: number,
    name?: string,
  }


  export interface FunAsciiArtFromImage extends MediaBaseOptions {
    size?: number,
  }

  export interface FunAsciiArtFromText {
    text: string,
  }

  export interface FunTextToSpeech extends MediaUploadBaseOptions {
    text: string,
    voice?: string,
    voiceId?: string,
  }

  
  export interface GenerateTag extends MediaBaseOptionsMultiple {
    // an `{ai}` call inside of NotSoAI's own reply, it doesn't count toward a server's NotSoAI messages again
    fromAI?: boolean,
    // send the user's memories along, never for `{ai}` inside of a user's tag
    memory?: boolean,
    model?: string,
    // the NotSoAI response in the message being replied to, its conversation is sent along as earlier turns
    parentId?: string,
    personality?: null | string,
    personalityPreference?: string,
    prompt: string,
  }

  export interface GoogleContentVisionBase {
    file?: RequestFile,
    url?: string,
  }

  export interface GoogleTranslate {
    from?: GoogleLocales,
    text: string,
    to?: GoogleLocales,
  }

  export interface MediaUploadBaseOptions {
    doNotError?: boolean,
    safe?: boolean,
    upload?: boolean,
    uploadExpiresIn?: number,
    // expires even for users whose uploads are permanent (the max time, or `uploadExpiresIn`)
    uploadTemporary?: boolean,
  }

  export interface MediaBaseOptions extends MediaUploadBaseOptions {
    file?: RequestFile,
    filename?: string,
    maxFileSize?: number,
    url?: string,
  }

  export interface MediaBaseOptionsMultiple extends MediaBaseOptions {
    files?: Array<RequestFile>,
    urls?: Array<string | {filename?: string, url: string}>,
  }

  export interface MediaACreateSong extends MediaUploadBaseOptions {
    bars?: number,
    bpm?: number,
    chords?: string,
    drums?: boolean,
    maxFileSize?: number,
    sound?: MediaSongSounds,
  }

  export interface MediaAIVManipulationADHD extends MediaBaseOptions {
    horizontal?: boolean,
  }

  export interface MediaAIVManipulationAndroid extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaAIVManipulationAudioPutBase extends MediaBaseOptionsMultiple {
    longest?: boolean,
    noloop?: boolean,
  }

  export interface MediaAIVManipulationConvert extends MediaBaseOptions {
    removeAudio?: boolean,
    size?: string,
    to?: string,
  }

  export interface MediaAIVManipulationFadeIn extends MediaBaseOptions {
    color?: string,
    duration?: number,
  }

  export interface MediaAIVManipulationFadeOut extends MediaAIVManipulationFadeIn {

  }

  export interface MediaAIVManipulationInterpolate extends MediaBaseOptionsMultiple {
    noloop?: boolean,
    segment?: number,
  }

  export interface MediaAIVManipulationJoin extends MediaBaseOptionsMultiple {
    noloop?: boolean,
    noresize?: boolean,
    vertical?: boolean,
  }

  export interface MediaAIVManipulationOverlay extends MediaBaseOptionsMultiple {
    blend?: number,
    color?: string,
    noloop?: boolean,
    opacity?: number,
    resize?: string,
    similarity?: number,
    x?: string,
    y?: string,
  }

  export interface MediaAIVManipulationReverse extends MediaBaseOptions {
    noaudio?: boolean,
  }

  export interface MediaAIVManipulationShuffle extends MediaBaseOptions {
    segment?: number,
  }

  export interface MediaAIVManipulationSpeed extends MediaBaseOptions {
    speed: number,
  }

  export interface MediaAIVManipulationVeg extends MediaBaseOptions {
    cutoff?: boolean,
    // the .veg as an upload or a url, one of them is needed
    vegFile?: RequestFile,
    vegUrl?: string,
  }

  export interface MediaAIVManipulationWlmp extends MediaBaseOptions {
    // the .wlmp as an upload or a url, one of them is needed
    wlmpFile?: RequestFile,
    wlmpUrl?: string,
  }

  export interface MediaAIVManipulationSnip extends MediaBaseOptions {
    audioOnly?: boolean,
    end?: number,
    start?: number,
  }

  export interface MediaAVManipulationAudioBitcrush extends MediaBaseOptions {
    bits?: number,
    mix?: number,
    mode?: MediaAudioBitcrushModes,
    samples?: number,
  }

  export interface MediaAVManipulationAudioCompress extends MediaBaseOptions {
    norevert?: boolean,
  }

  export interface MediaAVManipulationAudioDelay extends MediaBaseOptions {
    delay?: number,
    snip?: boolean,
  }

  export interface MediaAVManipulationAudioEqualizer extends MediaBaseOptions {
    air?: number,
    bass?: number,
    highMids?: number,
    lowMids?: number,
    mids?: number,
    subBass?: number,
    treble?: number,
  }

  export interface MediaAVManipulationAudioFlanger extends MediaBaseOptions {
    delay?: number,
    depth?: number,
    phase?: number,
    regen?: number,
    speed?: number,
    width?: number,
  }

  export interface MediaAVManipulationAudioMultiPitch extends MediaBaseOptions {
    engine?: MediaAudioMultiPitchEngines,
    normalize?: boolean,
    semitones?: string,
  }

  export interface MediaAVManipulationAudioNormalize extends MediaBaseOptions {
    strength?: number,
  }

  export interface MediaAVManipulationAudioPaulstretch extends MediaBaseOptions {
    resolution?: number,
    stretch?: number,
  }

  export interface MediaAVManipulationAudioPitch extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaAVManipulationAudioReverb extends MediaBaseOptions {
    decay?: number,
    delay?: number,
    volume?: number,
  }

  export interface MediaAVManipulationAudioTremolo extends MediaBaseOptions {
    depth?: number,
    frequency?: number,
  }

  export interface MediaAVManipulationAudioVibrato extends MediaBaseOptions {
    depth?: number,
    frequency?: number,
  }

  export interface MediaAVManipulationAudioVocoder extends MediaBaseOptionsMultiple {
    bands?: number,
    chord?: string,
    synth?: string,
  }

  export interface MediaAVManipulationAudioVolume extends MediaBaseOptions {
    volume?: number,
  }

  export interface MediaAVManipulationSetBitRate extends MediaBaseOptions {
    audio?: number,
    video?: number,
  }

  export interface MediaAVManipulationStammer extends MediaBaseOptionsMultiple {
    colorMode?: string,
    matcherMode?: string,
  }

  export interface MediaAVManipulationWaveform extends MediaBaseOptions {
    color?: string,
    split?: boolean,
  }

  export interface MediaAVToolsExtractAudio extends MediaBaseOptions {
    allowedMimetypes?: Array<string>,
    mimetype?: string,
    waveform?: boolean,
  }

  export interface MediaAVToolsIdentify extends MediaBaseOptions {
    start?: number,
  }

  export interface MediaICreateRetrowave {
    background?: number,
    line1?: string,
    line2?: string,
    line3?: string,
    safe?: boolean,
    textStyle?: number,
  }

  export interface MediaICreateHacker {
    safe?: boolean,
    template?: number,
    text: string,
  }

  export interface MediaICreatePresidential {
    date?: string,
    safe?: boolean,
    text: string,
    time?: string,
  }

  export interface MediaICreateText {
    safe?: boolean,
    text: string,
  }

  export interface MediaICreateTextLines extends MediaICreateText {
    text2?: string,
  }

  export interface MediaICreateFoggyWindow extends MediaICreateText {
    background?: number,
  }

  // a discord message drawn like discord does, `content` is its markdown
  // a member drawn like discord's member list, their name and badges over their username
  export interface MediaICreateQuoteMember {
    author: MediaICreateQuoteAuthor,
    light?: boolean,
    username: string,
  }

  export interface MediaICreateQuote {
    // image attachments under the content (discord's cdn only)
    attachments?: Array<string>,
    author: MediaICreateQuoteAuthor,
    compact?: boolean,
    components?: Array<MediaICreateQuoteComponent>,
    content?: string,
    edited?: boolean,
    embed?: null | {
      author?: null | string,
      color?: null | number,
      description?: null | string,
      fields?: Array<{inline?: boolean, name: string, value: string}>,
      footer?: null | string,
      imageUrl?: null | string,
      thumbnailUrl?: null | string,
      title?: null | string,
    },
    light?: boolean,
    // what `<@id>`, `<@&id>`, `<#id>` and `<t:...>` in the content show as, by the token
    mentions?: Record<string, string>,
    // the line above a reply: who it replied to and the start of what they said
    reply?: null | {
      // only files, `content` is `Click to see attachment`
      attachment?: boolean,
      author?: null | MediaICreateQuoteAuthor,
      content?: string,
      // it's gone, `content` says so
      deleted?: boolean,
    },
    safe?: boolean,
    // already formatted, like `Today at 3:41 PM`
    timestamp?: string,
  }

  // a message component, in discord's own shape (sent as is): buttons and selects in action rows, components v2
  export interface MediaICreateQuoteComponent {
    accent_color?: null | number,
    accessory?: null | MediaICreateQuoteComponent,
    components?: Array<MediaICreateQuoteComponent>,
    content?: string,
    disabled?: boolean,
    divider?: boolean,
    // a custom one as `<:name:id>`, a unicode one as is
    emoji?: null | string,
    filename?: string,
    items?: Array<{spoiler?: boolean, url: string}>,
    label?: string,
    placeholder?: string,
    spacing?: number,
    spoiler?: boolean,
    style?: number,
    type: number,
    url?: null | string,
  }

  export interface MediaICreateQuoteAuthor {
    avatarUrl?: null | string,
    bot?: boolean,
    color?: null | string,
    // the frame around their avatar
    decorationUrl?: null | string,
    // the server tag beside their name and its badge
    guildTag?: null | string,
    guildTagBadgeUrl?: null | string,
    name: string,
    // joined the server this week (discord's sprout badge)
    newMember?: boolean,
    // their top role's icon, an image or a unicode emoji
    roleIconEmoji?: null | string,
    roleIconUrl?: null | string,
    // a verified app, the checkmark in its APP tag
    verified?: boolean,
  }

  export interface MediaICreateTombstone {
    line1?: string,
    line2?: string,
    line3?: string,
    line4?: string,
    line5?: string,
    safe?: boolean,
  }

  export interface MediaICreateWordcloud {
    // `transparent`, a hex code, `r,g,b(,a)` or a color name
    background?: string,
    exclude?: Array<string>,
    height?: number,
    safe?: boolean,
    seed?: number,
    shape?: string,
    theme?: string,
    width?: number,
    // texts (one per message), each line is split into words on its own
    words: Array<string>,
  }

  // the words fill the image's shape (its white/transparent parts stay empty) and take its colors
  export interface MediaICreateWordcloudBackground extends MediaICreateWordcloud {
    maxFileSize?: number,
    url: string,
  }

  export interface MediaIVManipulationFaceAnime extends MediaBaseOptions {
    eyes?: string,
  }

  export interface MediaIVManipulationFaceFat extends MediaBaseOptions {
    size?: number,
  }

  export interface MediaIVManipulationFaceForehead extends MediaBaseOptions {
    size?: string,
  }

  export interface MediaIVManipulationFaceFeaturesExpressionMood extends MediaBaseOptions {
    level?: string,
    mood: string,
  }

  export interface MediaIVManipulationFaceFeaturesSwap extends MediaBaseOptionsMultiple {
    mode?: string,
    multiplier?: number,
    regions?: string,
  }

  export interface MediaIVManipulationFaceSwap extends MediaBaseOptionsMultiple {
    maxFaces?: number,
  }

  export interface MediaIVManipulationFaceSwapPreset extends MediaBaseOptions {
    maxFaces?: number,
  }

  export interface MediaIVManipulationAcid extends MediaBaseOptions {
    amount?: number,
    levels?: number,
    seed?: number,
  }

  export interface MediaIVManipulationAnimationDelay extends MediaBaseOptions {
    delay?: number,
  }

  export interface MediaIVManipulationAscii extends MediaBaseOptions {
    invert?: boolean,
    zoom?: boolean,
  }

  export interface MediaIVManipulationBackgroundRemoveOptions extends MediaBaseOptions {
    model?: string,
    trim?: boolean,
  }

  export interface MediaIVManipulationColorRemove extends MediaBaseOptions {
    blend?: number,
    color?: string,
    similarity?: number,
  }

  export interface MediaIVManipulationBlur extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationBounce extends MediaBaseOptions {
    axis?: string,
    bounces?: number,
    duration?: number,
    minimum?: number,
    style?: string,
  }

  export interface MediaIVManipulationFaceHalloweenHat extends MediaBaseOptions {
    hat?: string,
  }

  export interface MediaIVManipulationFaceXmasCap extends MediaBaseOptions {
    color?: string,
  }

  export interface MediaIVManipulationInstantCamera extends MediaBaseOptions {
    text?: string,
  }

  export interface MediaIVManipulationOldTV extends MediaBaseOptions {
    animated?: boolean,
    grayscale?: boolean,
  }

  export interface MediaIVManipulationOverlayAchievement extends MediaBaseOptions {
    gamerscore?: number,
    text: string,
  }

  export interface MediaIVManipulationDemotivate extends MediaBaseOptions {
    text?: string,
    title: string,
  }

  export interface MediaIVManipulationOverlayNews extends MediaBaseOptions {
    label?: string,
    text: string,
    ticker?: string,
  }

  export interface MediaIVManipulationOverlayNotification extends MediaBaseOptions {
    text: string,
    title?: string,
  }

  export interface MediaIVManipulationOverlaySubtitle extends MediaBaseOptions {
    text: string,
    yellow?: boolean,
  }

  export interface MediaIVManipulationOverlayTikTok extends MediaBaseOptions {
    dark?: boolean,
    position?: number,
    text: string,
  }

  export interface MediaIVManipulationOverlayYouTube extends MediaBaseOptions {
    channel?: string,
    text: string,
  }

  export interface MediaIVManipulationOverlaySnapchat extends MediaBaseOptions {
    position?: number,
    text: string,
  }

  export interface MediaIVManipulationOverlayWatchMojo extends MediaBaseOptions {
    text: string,
  }

  export interface MediaIVManipulationCaption extends MediaBaseOptions {
    bottom?: string,
    font?: MediaMemeFonts,
    top?: string,
  }

  export interface MediaIVManipulationCartoon extends MediaBaseOptions {
    amount?: number,
    brightness?: number,
    levels?: number,
    method?: string,
    pattern?: number,
    saturation?: number,
  }

  export interface MediaIVManipulationCharcoal extends MediaBaseOptions {
    radius?: number,
  }

  export interface MediaIVManipulationCircle extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationCrop extends MediaBaseOptions {
    height: string,
    width: string,
    x?: string,
    y?: string,
  }

  export interface MediaIVManipulationCropFace extends MediaBaseOptions {
    face?: number,
  }

  export interface MediaIVManipulationDance extends MediaBaseOptions {
    amount?: number,
    bpm?: number,
    model?: string,
  }

  export interface MediaIVManipulationDatamosh extends MediaBaseOptions {
    chance?: number,
    repeat?: number,
  }

  export interface MediaIVManipulationDeepfry extends MediaBaseOptions {
    keepTransparency?: boolean,
    scale?: number,
  }

  export interface MediaIVManipulationDice extends MediaBaseOptions {
    grid?: number,
    seed?: number,
  }

  export interface MediaIVManipulationDistort extends MediaBaseOptions {
    arguments?: Array<number>,
    method: string,
  }

  export interface MediaIVManipulationEdgeDetect extends MediaBaseOptions {
    invert?: boolean,
    method?: string,
    mix?: number,
    strength?: number,
  }

  export interface MediaIVManipulationEmboss extends MediaBaseOptions {
    azimuth?: number,
    compose?: string,
    elevation?: number,
    depth?: number,
    intensity?: number,
    gray?: number,
    method?: string,
  }

  export interface MediaIVManipulationEmojiMosaic extends MediaBaseOptions {
    size?: number,
  }

  export interface MediaIVManipulationExo extends MediaBaseOptions {
    rain?: boolean,
    swirl?: boolean,
  }

  export interface MediaIVManipulationExplode extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationEyes extends MediaBaseOptions {
    flipped?: boolean,
    type?: MediaEyeTypes,
  }

  export interface MediaIVManipulationGlitch extends MediaBaseOptions {
    amount?: number,
    iterations?: number,
    keepTransparency?: boolean,
    seed?: number,
  }

  export interface MediaIVManipulationGlobe extends MediaBaseOptions {
    tiled?: boolean,
  }

  export interface MediaIVManipulationGlow extends MediaBaseOptions {
    amount?: number,
  }

  export interface MediaIVManipulationGradientMap extends MediaBaseOptions {
    stops: string,
  }

  export interface MediaIVManipulationGrain extends MediaBaseOptions {
    flags?: string,
    strength?: number,
  }

  export interface MediaIVManipulationHidden extends MediaBaseOptions {
    share?: number,
    size?: number,
  }

  export interface MediaIVManipulationHueCurveRGBA extends MediaBaseOptions {
    all?: Array<[number, number]>,
    alpha?: Array<[number, number]>,
    blue?: Array<[number, number]>,
    green?: Array<[number, number]>,
    red?: Array<[number, number]>,
  }

  export interface MediaIVManipulationHueShiftCCS extends MediaBaseOptions {
    gain?: number,
    gamma?: number,
    hue?: number,
    offset?: number,
    saturation?: number,
  }

  export interface MediaIVManipulationHueShiftYIQ extends MediaBaseOptions {
    hue?: number,
  }

  export interface MediaIVManipulationHueShiftHSL extends MediaBaseOptions {
    hue?: number,
    lightness?: number,
    saturation?: number,
  }

  export interface MediaIVManipulationHueShiftHSV extends MediaBaseOptions {
    brightness?: number,
    hue?: number,
    saturation?: number,
  }

  export interface MediaIVManipulationHueShiftRGB extends MediaBaseOptions {
    blue?: number,
    green?: number,
    red?: number,
  }

  export interface MediaIVManipulationImplode extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationInvertLAB extends MediaBaseOptions {
    a?: number,
    b?: number,
    lightness?: number,
  }

  export interface MediaIVManipulationInvertRGBA extends MediaBaseOptions {
    alpha?: number,
    blue?: number,
    green?: number,
    red?: number,
  }

  export interface MediaIVManipulationJPEG extends MediaBaseOptions {
    keepTransparency?: boolean,
    quality?: number,
  }

  export interface MediaIVManipulationLegofy extends MediaBaseOptions {
    dither?: boolean,
    palette?: string,
    size?: number,
  }

  export interface MediaIVManipulationLUT extends MediaBaseOptions {
    // the .cube as an upload or a url, one of them is needed
    cubeFile?: RequestFile,
    cubeUrl?: string,
    interpolation?: string,
    strength?: number,
  }

  export interface MediaIVManipulationMagik extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationMagikAnimated extends MediaIVManipulationMagik {
    boomerang?: boolean,
  }

  export interface MediaIVManipulationMandalaScope extends MediaBaseOptions {
    amount?: number,
    rotation?: number,
    scale?: number,
    translation?: number,
    zoom?: number,
  }

  export interface MediaIVManipulationMeme extends MediaBaseOptions {
    bottom?: string,
    font?: MediaMemeFonts,
    top: string,
  }

  export interface MediaIVManipulationMotionBlur extends MediaBaseOptionsMultiple {
    strength?: number,
    vertical?: boolean,
  }

  export interface MediaIVManipulationMultiply extends MediaBaseOptions {
    grid?: number,
    rotate?: boolean,
    seed?: number,
  }

  export interface MediaIVManipulationObjectRemoveOptions extends MediaBaseOptions {
    object?: string,
  }

  export interface MediaIVManipulationOffset extends MediaBaseOptions {
    x?: string,
    y?: string,
  }

  export interface MediaIVManipulationOrb extends MediaBaseOptions {
    direction?: string,
  }

  export interface MediaIVManipulationOverlayFace extends MediaBaseOptionsMultiple {
    scale?: number,
  }

  export interface MediaIVManipulationOverlayFlies extends MediaBaseOptions {
    amount?: number,
    degrees?: number,
    flyImage?: string,
    speed?: number,
  }

  export interface MediaIVManipulationOverlayWatermark extends MediaBaseOptionsMultiple {
    margin?: number,
    opacity?: number,
    size?: number,
  }

  export interface MediaIVManipulationPaint extends MediaBaseOptions {
    radius?: number,
  }

  export interface MediaIVManipulationPhoSimp extends MediaBaseOptions {
    filters: Array<number>,
    gridx?: number,
    gridy?: number,
  }

  export interface MediaIVManipulationPinchPunch extends MediaBaseOptions {
    intensity?: number,
    x?: number,
    xScale?: number,
    y?: number,
    yScale?: number,
  }

  export interface MediaIVManipulationPix2Pix extends MediaBaseOptions {
    model: string,
  }

  export interface MediaIVManipulationPixelate extends MediaBaseOptions {
    noLines?: boolean,
    pixelWidth?: number,
  }

  export interface MediaIVManipulationPixelSort extends MediaBaseOptions {
    angle?: number,
    interval?: MediaPixelSortIntervals,
    length?: number,
    lower?: number,
    randomness?: number,
    reverse?: boolean,
    seed?: number,
    sortBy?: MediaPixelSortFunctions,
    upper?: number,
  }

  export interface MediaIVManipulationPopArt extends MediaBaseOptions {
    grid?: number,
  }

  export interface MediaIVManipulationPrism extends MediaBaseOptions {
    angle?: number,
    clockwise?: boolean,
    repeat?: boolean,
    still?: boolean,
    tilt?: number,
  }

  export interface MediaIVManipulationQuadart extends MediaBaseOptions {
    type?: MediaQuadartTypes,
  }

  // uncaption's `tolerance`, then caption's options
  export interface MediaIVManipulationRecaption extends MediaIVManipulationCaption {
    tolerance?: number,
  }

  export interface MediaIVManipulationResize extends MediaBaseOptions {
    kernel?: string,
    ratio?: boolean,
    scale?: number,
    size?: string,
  }

  export interface MediaIVManipulationRGBSplit extends MediaBaseOptions {
    offset?: number,
  }

  export interface MediaIVManipulationRipple extends MediaBaseOptions {
    amplitude?: number,
    offset?: number,
    power?: number,
    rmin?: number,
    type?: string,
    width?: number,
  }

  export interface MediaIVManipulationRotate extends MediaBaseOptions {
    crop?: boolean,
    degrees?: number,
  }

  export interface MediaIVManipulationRotate3d extends MediaBaseOptions {
    crop?: string,
    order?: string,
    pan?: number,
    roll?: number,
    tilt?: number,
    zoom?: number,
  }

  export interface MediaIVManipulationScramble extends MediaBaseOptions {
    grid?: number,
    norotate?: boolean,
    rotate?: boolean,
    seed?: number,
  }

  export interface MediaIVManipulationSetFPS extends MediaBaseOptions {
    fps: number,
  }

  export interface MediaIVManipulationSetFrameCount extends MediaBaseOptions {
    count: number,
  }

  export interface MediaIVManipulationShake extends MediaBaseOptions {
    horizontal?: number,
    randomize?: boolean,
    vertical?: number,
  }

  export interface MediaIVManipulationSharpen extends MediaBaseOptions {
    scale?: number,
  }

  export interface MediaIVManipulationSlide extends MediaBaseOptions {
    direction?: string,
    speed?: number,
  }

  export interface MediaIVManipulationSnipFrames extends MediaBaseOptions {
    end?: number,
    start?: number,
  }

  export interface MediaIVManipulationSpin extends MediaBaseOptions {
    circle?: boolean,
    clockwise?: boolean,
    crop?: boolean,
  }

  export interface MediaIVManipulationSpin3d extends MediaBaseOptions {
    clockwise?: boolean,
    tilt?: number,
    zoom?: number,
  }

  export interface MediaIVManipulationStretch extends MediaBaseOptions {
    crop?: boolean,
    height?: number,
    width?: number,
  }

  export interface MediaIVManipulationSwapRGBA extends MediaBaseOptions {
    channels?: string,
  }

  export interface MediaIVManipulationSwirl extends MediaBaseOptions {
    degrees?: number,
  }

  export interface MediaIVManipulationTimecodeVegas extends MediaBaseOptions {
    type?: string,
    x?: string,
    y?: string,
  }

  export interface MediaIVManipulationTrim extends MediaBaseOptions {
    margin?: number,
    threshold?: number,
  }

  export interface MediaIVManipulationTunnel extends MediaBaseOptions {
    spiral?: boolean,
  }

  export interface MediaIVManipulationTVSimulator extends MediaBaseOptions {
    detailZoom?: number,
    lineSync?: number,
    vertical?: boolean,
  }

  export interface MediaIVManipulationUncaption extends MediaBaseOptions {
    tolerance?: number,
  }

  export interface MediaIVManipulationUniverse extends MediaBaseOptions {
    space?: number,
  }

  export interface MediaIVManipulationVaporwave extends MediaBaseOptions {
    text?: string,
  }

  export interface MediaIVManipulationWatercolor extends MediaBaseOptions {
    contrast?: number,
    edge?: number,
    mixing?: number,
    smoothing?: number,
  }

  export interface MediaIVManipulationWave extends MediaBaseOptions {
    amplitude?: number,
    waveLength?: number,
  }

  export interface MediaIVManipulationWaveAnimated extends MediaIVManipulationWave {
    speed?: number,
  }

  export interface MediaIVManipulationWaveVegas extends MediaBaseOptions {
    xFrequency?: number,
    xIntensity?: number,
    xPhase?: number,
    xSpeed?: number,
    yFrequency?: number,
    yIntensity?: number,
    yPhase?: number,
    ySpeed?: number,
  }

  export interface MediaIVManipulationWiggle extends MediaBaseOptions {
    amount?: number,
    direction?: string,
    loop?: boolean,
    speed?: number,
    wavelengths?: number,
  }

  export interface MediaIVManipulationXyt extends MediaBaseOptions {
    // the .xyt as an upload or a url, one of them is needed
    xytFile?: RequestFile,
    xytUrl?: string,
  }

  export interface MediaIVManipulationZoom extends MediaBaseOptions {
    amount?: number,
  }

  export interface MediaIVManipulationZoomBlur extends MediaBaseOptions {
    amount?: number,
    expand?: boolean,
  }


  export interface ModerationSafetyScan extends MediaBaseOptionsMultiple {
    context?: ModerationTextContext,
    customCategory?: string,
    customInstruct?: string,
    customQuery?: string,
    customThreshold?: number,
    extractFrames?: boolean,
    logFlags?: boolean,
    safe?: boolean,
    sourceUrl?: string,
    text?: string,
  }

  export interface ModerationTextScan {
    context?: ModerationTextContext,
    safe?: boolean,
    text: string,
  }

  // where scanned text came from, so the scanner doesn't read tag games or dictionary definitions as someone's message
  export type ModerationTextContext = 'tag' | 'urban';


  export interface PutGeneratedTagError {
    error: string,
  }

  export interface PutGuildSettings {
    icon: null | string,
    name: string,
  }

  export interface PutInfoDiscordGuilds {
    guildIds: Array<string>,
    shardCount: number,
    shardId: number,
  }

  export interface PostInfoDiscordGuildsChanges {
    added: Array<{guildId: string, memberCount?: number, shardId: number}>,
    // guilds the bot left or was removed from
    removed: Array<string>,
    // guilds discord listed in READY that the bot had already left, deleted right after (no join/leave history)
    pruned: Array<string>,
    shardCount: number,
  }

  export interface PutInfoDiscord {
    clusterId: number,
    ramUsage: number,
    shardCount: number,
    shardsPerCluster: number,
    shards: Array<{
      shardId: number,
      status: string,
  
      applications?: number,
      channels?: number,
      channelThreads?: number,
      emojis?: number,
      events?: number,
      guilds?: number,
      guildScheduledEvents?: number,
      members?: number,
      memberCount?: number,
      messages?: number,
      permissionOverwrites?: number,
      presences?: number,
      presenceActivities?: number,
      roles?: number,
      stageInstances?: number,
      typings?: number,
      users?: number,
      voiceStates?: number,
    }>,
  }

  export interface PutInfoMetrics {
    clusterId: number,
    histograms: Array<{
      counts: Array<number>,
      labels: Record<string, string>,
      name: string,
      sum: number,
    }>,
    samples: Array<{
      labels: Record<string, string>,
      name: string,
      value: number,
    }>,
  }

  export interface PutServerSettings {

  }

  export interface PutTag {
    content?: string,
    name: string,
    referenceTagId?: string,
    serverId?: string,
  }

  export interface PutTagsDirectoryTag {
    category?: TagDirectoryCategories,
    description?: string,
    title?: string,
  }

  export interface PutTagBlobs {
    blobs: Array<{
      storageId: string,
      storageType: TagBlobStorageTypes,
      value: Buffer | string,
    }>,
    channelId: string,
    guildId?: string,
    userId: string,
  }

  export interface PutTagVariable {
    name: string,
    value: string,
  }

  export interface PutTagVariables {
    channelId: string,
    guildId?: string,
    userId: string,
    variables: Array<{
      name: string,
      storageId: string,
      storageType: TagVariableStorageTypes,
      value: string,
    }>,
  }

  export interface PutUser {
    avatar: null | string,
    bot: boolean,
    blocked?: boolean,
    blockedReason?: null | string,
    channelId?: null | string,
    discriminator: string,
    username: string,
  }


  export interface Search4Chan {
    board: string,
    safe?: boolean,
  }

  export interface Search4ChanRandom {
    nsfw: boolean,
  }

  export interface SearchBing {
    query: string,
    safe?: boolean,
  }

  export interface SearchBingImages {
    query: string,
    safe?: boolean,
  }

  export interface SearchDuckDuckGo {
    query: string,
    safe?: boolean,
  }

  export interface SearchDuckDuckGoImages {
    query: string,
    safe?: boolean,
  }

  export interface SearchE621 {
    max_results?: number,
    query: string,
  }

  export interface SearchE926 {
    max_results?: number,
    query: string,
  }

  export interface SearchGoogle {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
    showUnknown?: boolean | string,
  }

  export interface SearchGoogleImages {
    locale?: GoogleLocales,
    maxResults?: number,
    query: string,
    safe?: boolean | string,
  }

  export interface SearchGoogleReverseImages {
    url: string,
  }

  export interface SearchImgur {
    query: string,
  }


  export interface SearchOpenverse {
    query: string,
    safe?: boolean,
  }

  export interface SearchReddit {
    maxResults?: number,
    query: string,
    safe?: boolean | string,
    sort?: RedditSortTypes,
    subreddit?: string,
    time?: RedditTimeTypes,
  }

  export interface SearchRule34 {
    query: string,
  }

  export interface SearchRule34Paheal {
    query: string,
  }

  export interface SearchSteam {
    query: string,
    steamId?: string,
  }

  export interface SearchSteamEmojis {
    maxResults?: number,
    query: string,
  }

  export interface SearchSteamProfile {
    query: string,
  }

  export interface SearchUrban {
    query: string,
  }

  export interface SearchUrbanRandom {

  }

  export interface SearchWikihow {
    query: string,
  }

  export interface SearchWikihowRandom {

  }

  export interface SearchWolframAlpha {
    query: string,
  }

  export interface SearchYandex {
    query: string,
    safe?: boolean,
  }

  export interface SearchYandexImages {
    query: string,
    safe?: boolean,
  }

  export interface SearchYoutube {
    query: string,
    sp?: string,
  }


  // the commands page's before/after preview, a formatter command's `PREVIEW` (see `owner.upload.commands`). `inputs` are
  // the api's preview samples (`b1`, `face`, `voice`... see the api's `COMMAND_PREVIEW_SAMPLES`), the mediascript gets them as `FILE_1`, `FILE_2`... in order,
  // none for commands that make their media from nothing
  export interface CommandPreview {
    // what it shows, as typed without the prefix
    example: string,
    inputs: Array<'b1' | 'bordered' | 'captioned' | 'displacement' | 'face' | 'face2' | 'funface' | 'grade' | 'gradient' | 'greenscreen' | 'movie' | 'music' | 'photo' | 'preview1280' | 'qr' | 'quiet' | 'stereo' | 'video' | 'video2' | 'voice'>,
    script: string,
  }


  export interface UploadCommands {
    commands: Array<{
      aliases?: Array<string>,
      args?: Array<{
        aliases: Array<string>,
        choices?: Array<{description: string, description_localizations?: Record<string, string>, value: string}>,
        description?: string,
        // slash command options only, by language like `description_localizations`
        description_localizations?: Record<string, string>,
        name: string,
        name_localizations?: Record<string, string>,
        prefix: string,
        // slash command options only, prefixed args are all optional
        required?: boolean,
      }>,
      category: string,
      credits?: Array<{id?: string, name: string, url?: string}>,
      description?: string,
      // translations of `description` by language ('es', 'pt-BR'), for the site's commands page
      description_localizations?: Record<string, string>,
      dmable?: boolean,
      examples?: Array<string>,
      id: string,
      name: string,
      // slash/context menu commands only, the full name by language like `description_localizations`
      name_localizations?: Record<string, string>,
      ratelimits?: Array<{duration: number, key?: string, limit: number, type: string}>,
      type: number,
      usage: string,
    }>,
    previews?: Array<CommandPreview & {id: string}>,
  }


  export interface UtilitiesCodeRun extends MediaBaseOptionsMultiple {
    code: string,
    language: string,
    // a verified directory tag's code, it gets a premium user's time to run
    premiumLimits?: boolean,
    safe?: boolean,
    stdin?: string,
    urls?: Array<string | {filename?: string, url: string}>,
    version?: string,
  }

  export interface UtilitiesFetchMedia extends MediaUploadBaseOptions {
    downloadQuality?: string,
    locale?: string,
    maxFileSize?: number,
    mediaFormat?: string,
    mediaPosition?: number,
    url: string,
  }

  export interface UtilitiesFetchText {
    maxFileSize?: number,
    stripHtml?: boolean,
    url: string,
  }

  export interface UtilitiesLocations {
    limit?: number,
    query: string,
  }

  export interface UtilitiesMediascript extends MediaBaseOptionsMultiple {
    code: string,
    maxFileSize?: number,
    maxFileSizeStrict?: boolean,
    mlDiffusionModel?: string,
  }

  export interface UtilitiesMLEdit extends MediaBaseOptionsMultiple {
    expand?: boolean,
    model?: string,
    query: string,
    seed?: number,
    steps?: number,
    strength?: number,
  }

  export interface UtilitiesMLImagine extends MediaUploadBaseOptions {
    model?: string,
    query: string,
    seed?: number,
    steps?: number,
  }

  export interface UtilitiesMLMashup extends MediaBaseOptionsMultiple {
    model?: string,
    seed?: number,
    steps?: number,
    strength?: number,
  }

  export interface UtilitiesMLTone {
    text: string,
  }

  export interface UtilitiesProxyRequest {
    data?: Record<string, boolean | number | string>,
    dataJSON?: Record<string, any>,
    files?: Array<RequestFile>,
    headers?: Record<string, string>,
    method: string,
    query?: Record<string, string>,
    url: string,
  }

  export interface UtilitiesQrCreate {
    margin?: number,
    query: string,
    size?: number | string,
  }

  export interface UtilitiesQrScan {
    url: string,
  }

  export interface UtilitiesScreenshot extends MediaUploadBaseOptions {
    darkmode?: boolean,
    height?: number,
    timeout?: number,
    url: string,
    wait?: number,
    width?: number,
  }

  export interface UtilitiesUnicode {
    limit?: number,
    query: string,
  }

  export interface UtilitiesWeather {
    query?: string,
    units?: string,
  }

  export interface VoiceCloneAdd {
    file?: RequestFile,
    url?: string,
  }

  export interface VoiceCloneEdit {
    name: string,
  }
}


export namespace RestResponses {
  export type CreateGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type CreateGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;

  export type DeleteChannel = null;
  export type DeleteCommandsResponses = RestResponsesRaw.DeleteCommandsResponses;
  export type DeleteGuildLogger = Collections.BaseCollection<string, GuildSettingsLogger>;
  export type DeleteGuildPrefix = Collections.BaseCollection<string, GuildSettingsPrefix>;
  export type DeleteGuildRules = GuildSettings;
  export type DeleteVoice = null;

  export type EditGuildRule = GuildSettings;
  export type EditGuildSettings = GuildSettings;
  export type EditServerSettings = ServerSettings;
  export type EditUser = UserFull;

  export type FetchGuildSettings = GuildSettings;
  export type FetchServerSettings = ServerSettings;
  export type FetchUser = UserFull;

  export type SearchGoogleImages = Array<GoogleSearchImageResult>;

  export type PutGuildRules = GuildSettings;
  export type PutGuildSettings = GuildSettings;
  export type PutInfoDiscord = null;
  export type PutInfoMetrics = null;
  export type PutInfoDiscordGuilds = null;
  export type PostInfoDiscordGuildsChanges = null;
  export type PutServerSettings = ServerSettings;
  export type PutUser = UserFull;
}


export namespace RestResponsesRaw {
  export interface AddGuildFeature {
    features: Array<string>,
    id: string,
  }

  export interface FileResponse {
    arguments: null | Record<string, any>,
    file: {
      filename: string,
      filename_base: string,
      filename_safe: string,
      filename_safe_base: string,
      metadata: {
        duration: number,
        extension: string,
        framecount: number,
        height: number,
        mimetype: string,
        size: number,
        // its frames aren't all the same size (bouncing webms), width/height are the first one's
        variable_frame_sizes?: boolean,
        width: number,
      },
      has_nsfw: boolean,
      value: null | string,
    },
    // null when nothing was edited (a code run's output)
    file_old: null | {
      metadata: {
        duration: number,
        extension: string,
        framecount: number,
        height: number,
        mimetype: string,
        size: number,
        width: number,
      },
    },
    storage: null | FileResponseStorage,
    took: number,
  }

  export interface FileResponseStorage {
    expires_at: null | string,
    filename: string,
    filename_base: string,
    filename_safe: string,
    filename_safe_base: string,
    id: string,
    metadata: {
      duration: number,
      extension: string,
      framecount: number,
      height: number,
      mimetype: string,
      size: number,
      width: number,
    },
    temporary: boolean,
    urls: {
      cdn: string,
      delete?: string,
      vanity: string,
    },
    user: Record<string, any>,
    vanity: string,
  }

  export interface JobResponse {
    id: string,
    result: {
      error: string | null,
      // the same code and metadata the api would've errored with if it ran outside of a job
      error_code?: number | null,
      error_metadata?: Record<string, unknown>,
      response: FileResponse | null,
    },
    // while queued: how many jobs are ahead of it (0 is next), and which premium tier's queue it's in
    position?: number,
    queue?: 'free' | 'premium' | 'premium_server' | null,
    // while running (and `time_limit` while queued too): what it's doing, and the seconds it gets
    stage?: 'downloading' | 'processing' | null,
    time_limit?: number | null,
    status: string,
    user_id: string,
  }

  export interface MediaAVToolsIdentifySong {
    album: {name: string},
    artists: Array<{
      langs?: Array<{name: string, code: string}>,
      name: string,
      roles?: Array<string>,
    }>,
    duration: number,
    exids: string | null,
    genres: Array<string>,
    ids: {acrid: string, isrc: string, upc: string},
    label: string,
    platforms: {
      apple_music: MediaAVToolsIdentifySongPlatform | null,
      deezer: MediaAVToolsIdentifySongPlatform | null,
      musicbrainz: MediaAVToolsIdentifySongPlatformPartial | null,
      spotify: MediaAVToolsIdentifySongPlatform | null,
      youtube: MediaAVToolsIdentifySongPlatformPartial | null,
      raw: any,
    },
    release_date: string,
    result_from: number,
    score: number,
    timestamp: number,
    title: string,
  }

  export interface MediaAVToolsIdentifySongPlatform {
    album: {
      cover_url: string | null,
      id: string,
      name: string,
    },
    artist: {
      cover_url?: string | null,
      id: string,
      name: string,
    },
    bpm: number,
    disc: number,
    duration: number,
    genres: Array<string>,
    id: string,
    isrc: string,
    metadata: {
      audio_locale?: string,
      audio_traits?: Array<string>,
      has_lyrics?: boolean,
      has_time_synced_lyrics?: boolean,
      is_mastered_for_itunes?: boolean,
    },
    preview_url: string | null,
    release_date: string | null,
    title: string,
    track: number,
    url: string,
  }

  export interface MediaAVToolsIdentifySongPlatformPartial {
    id: string,
    url: string,
  }

  export type MediaAVToolsIdentify = Array<MediaAVToolsIdentifySong>;

  export interface MediaAVToolsTranscribe {
    chunks: Array<{
      language: string | null,
      text: string,
      timestamp: [number | null, number | null],
    }>,
    duration: number,
    languages: Array<string>,
    text: string,
  }

  export type CreateGuildLogger = Array<GuildLogger>;
  export type CreateGuildPrefix = Array<GuildPrefix>;

  export type CreateReminder = Reminder;

  export type CreateReport = Report;

  export type CreateReportMessage = ReportMessage;

  export interface CreateTagUse {
    // the content it runs (an alias' reference tag) is a verified directory listing, see `TagContext.directoryVerified`
    directory_verified: boolean,
    last_used: string,
  }

  export type CreateTagsDirectoryTagVerification = TagDirectory;

  export interface CreateUserCommand {
    
  }

  export type CreateVoiceClone = Voice;

  export type DeleteChannel = null;
  export interface DeleteCommandsResponses {
    deleted: number,
  }
  export type DeleteGuildLogger = Array<GuildLogger>;
  export type DeleteGuildPrefix = Array<GuildPrefix>;
  export type DeleteGuildRules = Array<GuildRule>;

  export type DeleteReminder = null;

  export type EditReminder = Reminder;

  export type DeleteTagSearch = null;
  export type DeleteTagsDirectoryTagVerification = TagDirectory;
  export type DeleteTagVariable = null;

  export type EditGuildRule = Array<GuildRule>;
  export type EditGuildSettings = GuildSettings;
  export type EditServerSettings = ServerSettings;
  export type EditTag = Tag;
  export type EditTagsDirectoryTag = TagDirectory;
  export type EditUser = User;
  export type EditUserSettings = UserSettings;

  export interface FetchCommandsResponses {
    count: number,
    results: Array<{
      channel_id: string,
      command_id: string | null,
      last_touched: string,
      llm_response_id: string | null,
      message_response_id: string,
      message_trigger_id: string,
      message_trigger_type: number,
      tag_id: string | null,
      user_id: string,
    }>,
  }

  export interface FetchCommandsUsage {
    results: Array<CommandUsage>,
    total: {count: number, since: number},
  }

  export type FetchGuildSettings = GuildSettings;

  export interface FetchGuildTagsCommands {
    count: number,
    tags: Array<Tag>,
  }

  export interface FetchReminders {
    count: number,
    reminders: Array<Reminder>,
  }

  export interface PutGuildTimedBans {
    timed_bans: Array<TimedBan>,
  }

  export type DeleteGuildTimedBan = null;

  export interface DeleteGuildTimedBans {
    timed_bans: Array<TimedBan>,
  }

  export interface GuildMusicQueueItem {
    // the album/playlist it was queued with, its tracks share it (each time it's queued). Its name is only shown, two can
    // have the same one
    batch_id: null | string,
    batch_name: null | string,
    // when it was queued (unix milliseconds)
    created: number,
    guild_id: string,
    id: string,
    // 1 is next, the playing item is 0
    position: number,
    source: 'opus' | 'url',
    // an opus.rip track's id (`MusicTrack.id`), null for a link. Older api versions leave it out
    source_id?: null | string,
    status: 'converting' | 'playing' | 'queued' | 'ready',
    // an opus.rip track's from its search result, a link's once it's converted (when it's next). `url` is the converted
    // file's cdn.nsb.gg link, opus.rip's cdn urls are never given out
    track: null | {
      album: null | string,
      artist: null | string,
      duration: number,
      isrc: null | string,
      thumbnail: null | string,
      title: string,
      url: null | string,
    },
    // the link it came from (an opus.rip track's service page, can be empty)
    url: string,
    user_id: string,
  }

  // a music node (notsobot.voice), owners manage them on the dashboard
  export interface MusicNode {
    created: string,
    enabled: boolean,
    id: string,
    name: string,
    // its `VOICE_PASSWORD`
    password: string,
    // `http://host:2333`
    url: string,
  }

  export interface FetchMusicNodes {
    nodes: Array<MusicNode>,
  }

  // a server the bot is playing music in, kept by the api so a restart (of the bot and its node) can carry on
  export interface MusicSession {
    channel_id: string,
    // the node's stacked live effects, put back on when a restart rejoins
    effects: Array<string>,
    // the playing track would have ended by now
    finished: boolean,
    guild_id: string,
    // paused too long, we left. a restart doesn't rejoin it, the next `music play` carries on from `position`
    held: boolean,
    node_id: null | string,
    paused: boolean,
    // milliseconds, where the track is about now
    position: number,
    // how fast it plays with the effects and the tempo, 1 for neither
    speed: number,
    // 24/7, rejoined even with nobody listening
    stay: boolean,
    // the node's tempo (percent, the pitch kept), put back when a restart rejoins
    tempo: number,
    // the node's volume (percent), put back when a restart rejoins
    volume: number,
  }

  export interface FetchMusicSessions {
    sessions: Array<MusicSession>,
  }

  // an opus.rip track from a search, sent back as it is to queue it
  export interface MusicTrack {
    album: null | {id: string, image: null | string, name: string},
    artist: string,
    // milliseconds
    duration: number,
    id: string,
    isrc: Array<string>,
    thumbnail: null | string,
    title: string,
  }

  export interface MusicSearchResult {
    // null for a link (`url`), downloaded and converted when it's next
    track: MusicTrack | null,
    url: null | string,
  }

  export interface SearchMusic {
    // an album/playlist: its name, how many tracks it has (`results` are the ones found, at most 50) and its link
    collection?: {name: null | string, total: number, url: string},
    results: Array<MusicSearchResult>,
    // `search` for text (results to pick from), `resolve` for a spotify/deezer/tidal/apple music/youtube music track
    // link, `collection` for an album/playlist link, `url` for any other link (youtube links error)
    type: 'collection' | 'resolve' | 'search' | 'url',
  }

  export interface FetchGuildMusic {
    // seconds a track fades into the next (0 off), it only fades with `premium`
    crossfade: number,
    current: GuildMusicQueueItem | null,
    // dj mode (on by default): controlling the music needs manage server or the dj role, no votes
    dj_only: boolean,
    // the dj role the server picked, null when it hasn't (roles named "notsomusic" count then)
    dj_role_id: null | string,
    // the queue takes turns between who queued (a server setting)
    fair_queue: boolean,
    // paused too long and we left, `current` carries on from here (milliseconds) once we join again
    held_position: null | number,
    // back to off when the bot leaves or the queue runs out
    loop: MusicLoopModes,
    // queue rules: the longest track that can be queued (seconds, null for no limit), no track queued twice at once
    max_duration: null | number,
    no_duplicates: boolean,
    // with 24/7: paused while nobody else is in the channel, carrying on when someone comes back (off by default)
    pause_alone: boolean,
    // music's premium perks (24/7, the bigger `queue_limit`): a premium server, or `MUSIC_ACCESS`
    premium: boolean,
    queue: Array<GuildMusicQueueItem>,
    queue_limit: number,
    // the saved effects, volume and tempo (percents), what our next session starts with (with `premium`) until someone
    // changes them
    sound: {effects: Array<string>, tempo: number, volume: number},
    // 24/7 (on by default), it only stays with `premium`
    stay: boolean,
    // pausing someone else's track is a vote
    vote_pause: boolean,
    // resuming someone else's track is a vote
    vote_resume: boolean,
    // skipping someone else's track is a vote
    vote_skip: boolean,
  }

  // a track the server's music played, a copy of its queue item's (`track.url` is always null, it expired)
  export interface GuildMusicHistoryItem {
    guild_id: string,
    id: string,
    // when the last of its `plays` started (unix milliseconds), the same as `played` for one play
    last_played: number,
    // when it started playing (unix milliseconds)
    played: number,
    // how many times it played in a row (the track loop), it looped for about this many times its duration
    plays: number,
    queue_item_id: string,
    source: 'opus' | 'url',
    source_id: null | string,
    track: GuildMusicQueueItem['track'],
    url: string,
    user_id: string,
  }

  export interface FetchGuildMusicHistory {
    // newest first
    items: Array<GuildMusicHistoryItem>,
  }

  // a top list's entry, `plays` only counts a queue item once (finished, or 30 seconds before a skip), loops and early
  // skips only add `played_ms`
  export interface GuildMusicStatsCounts {
    played_ms: number,
    plays: number,
    // a loop playing a song again after its counted play, not in `plays`
    repeats: number,
  }

  // a track as it last played (`track.url` is always null)
  export interface GuildMusicStatsTrack extends GuildMusicStatsCounts {
    source: 'opus' | 'url',
    track: GuildMusicQueueItem['track'],
    url: string,
  }

  export interface FetchGuildMusicStats {
    artists: Array<GuildMusicStatsCounts & {name: string}>,
    period: MusicStatsPeriods,
    sort: MusicStatsSorts,
    totals: GuildMusicStatsCounts & {
      // the oldest play in the period (unix milliseconds), null with none
      first_played: null | number,
      tracks: number,
      users: number,
    },
    tracks: Array<GuildMusicStatsTrack>,
    // who queued them
    users: Array<GuildMusicStatsCounts & {user_id: string}>,
  }

  export type EditGuildMusic = FetchGuildMusic;

  export type PutGuildMusicQueue = GuildMusicQueueItem;

  export interface PutGuildMusicQueueBatch {
    batch_id: string,
    items: Array<GuildMusicQueueItem>,
    // `server` when the queue being full left some of `skipped` out
    limit: 'server' | null,
    // left out by the server's queue rules (too long, already queued)
    ruled_out: number,
    skipped: number,
  }
  export type EditGuildMusicQueueItem = GuildMusicQueueItem;

  // the item playing now, `ready: false` while a link's still converting (it stays queued)
  export interface PostGuildMusicNext {
    error: null | {code: number, message: string},
    item: GuildMusicQueueItem | null,
    ready: boolean,
  }
  export type DeleteGuildMusicQueueItem = null;
  export type DeleteGuildMusic = null;

  export interface DeleteGuildMusicQueue {
    deleted: number,
  }

  export interface FetchGuildTimedBans {
    count: number,
    timed_bans: Array<TimedBan>,
  }

  export interface FetchTimedBans {
    count: number,
    timed_bans: Array<TimedBan>,
  }

  export interface TimedBan {
    guild_id: string,
    id: string,
    moderator_id: string,
    timestamp_end: string,
    user_id: string,
  }

  export interface GuildWarning {
    created: string,
    guild_id: string,
    id: string,
    moderator_id: string,
    reason: string | null,
    user_id: string,
  }

  // a member's warnings that haven't expired (`total`), and the ones within the server's window (`active`)
  export interface GuildWarningCounts {
    active: number,
    total: number,
  }

  // a step of a server's warning ladder, once a warning brings a member's active warnings to exactly `threshold`
  export interface GuildWarningAction {
    action: 'ban' | 'kick' | 'mute',
    // seconds of their messages to delete (kick/ban), 0: none
    clean: number,
    // seconds, how long a mute is or until a ban is lifted (null: permanent), always null for kicks
    duration: number | null,
    threshold: number,
  }

  export interface PutGuildWarnings {
    // the ladder steps the new warnings reached, by user id (only the ones that reached one)
    actions: Record<string, GuildWarningAction>,
    // by user id, counting the new ones
    counts: Record<string, GuildWarningCounts>,
    warnings: Array<GuildWarning>,
    window: number,
  }

  // `count`/`active` are for every warning that matched, not only this page
  export interface FetchGuildWarnings {
    active: number,
    count: number,
    warnings: Array<GuildWarning>,
    window: number,
  }

  export type DeleteGuildWarning = GuildWarning;

  export interface DeleteGuildWarnings {
    // how many each user had, by user id
    deleted: Record<string, number>,
  }

  // a member's report to their server's moderators
  export interface GuildReport {
    // message reports only
    channel_id: string | null,
    created: string,
    guild_id: string,
    // who last resolved or dismissed it, cleared when it's reopened
    handled_at: string | null,
    handled_by: string | null,
    id: string,
    message_content: string | null,
    // the text was cleared 30 days after the report (not a message that never had any)
    message_content_deleted: boolean,
    // when the text gets cleared, while there's still text
    message_content_expires_at: string | null,
    message_id: string | null,
    // an image of the reported message is kept (drawn like `quote`), cleared with the text
    message_quote: boolean,
    reason: string,
    status: ReportStatuses,
    // the reported member, a message report's is the message's author
    target_id: string,
    type: GuildReportTypes,
    // the reporter
    user_id: string,
    // the reporter turned off the bot's DMs about it
    reporter_muted?: boolean,
    // replies between the reporter and the moderators (not status changes), and who sent the last one
    last_reply?: {author: 'moderator' | 'reporter', created: string} | null,
    replies?: number,
  }

  // false when the image wasn't kept (the report already has one, or it's too old). a message report's quote also comes
  // back as `image` (a base64 png) with the report as it is now, for its logger messages
  export interface PutGuildReportQuote {
    image?: null | string,
    log_messages?: Array<GuildReportLogMessage>,
    report?: GuildReport,
    stored: boolean,
  }

  // `PATCH /guilds/<guild_id>/reports/<report_id>`, `changed` is false when it already had that status
  export interface EditGuildReport extends GuildReport {
    changed: boolean,
  }

  // a reply on a member's report, or a status change (`status` set, no `content`). `author_id` is left out of the
  // reporter's side
  export interface GuildReportMessage {
    author: 'moderator' | 'reporter',
    author_id?: string,
    content: null | string,
    created: string,
    id: string,
    status: null | ReportStatuses,
  }

  // one of the bot's messages for a report in a reports logger
  export interface GuildReportLogMessage {
    channel_id: string,
    message_id: string,
    webhook_id: string,
  }

  // `count` is every report with that status, not only this page
  export interface FetchGuildReports {
    count: number,
    reports: Array<GuildReport>,
  }

  export type FetchReminderPositional = Reminder;

  // every call that changes a memory returns the list the request's server sees afterwards
  export interface FetchUserLLMMemories {
    count: number,
    memories: Array<LLMMemory>,
  }

  export interface CreateUserLLMMemory extends FetchUserLLMMemories {
    // false when the same memory was already there
    created: boolean,
  }

  export type EditUserLLMMemory = FetchUserLLMMemories;
  export type DeleteUserLLMMemory = FetchUserLLMMemories;

  export interface PremiumServer {
    created: string,
    // when it can be taken off, servers are locked for a while after getting someone's premium
    removable_at: string,
    server_id: string,
    // how many of the user's slots are on it, plus ai subscribers can stack them to raise its NotSoAI limit
    slots: number,
    user_id: string,
  }

  // every call that changes a premium server returns the user's list afterwards
  export interface FetchUserPremiumServers {
    // the servers only get anything while the user has premium plus
    active: boolean,
    items: Array<PremiumServer>,
    // slots, not servers. null for owners, they can give as many as they want
    limit: null | number,
    // slots in use, stacked ones included
    used: number,
  }

  export interface PutUserPremiumServer extends FetchUserPremiumServers {
    // false when the server already had it and another slot wouldn't give it more (no plus ai to stack)
    created: boolean,
  }

  export type DeleteUserPremiumServer = FetchUserPremiumServers;

  export interface FetchPremiumServers {
    items: Array<{server_id: string, user_id: string}>,
  }

  // everyone with any premium (owners included), the ones that can have personal custom commands
  export interface FetchPremiumUsers {
    user_ids: Array<string>,
  }

  export interface DeleteUserLLMMemories {
    count: number,
  }

  export interface FetchReports {
    count: number,
    // the api leaves out the staff-only `notes` and `reviewed_by`
    reports: Array<Omit<Report, 'notes' | 'reviewed_by'>>,
  }

  export type FetchServerSettings = ServerSettings;

  export interface FetchTags {
    count: number,
    tags: Array<Tag>,
  }

  export interface PostTagsImport {
    conflicts: Array<{can_overwrite: boolean, name: string}>,
    imported: number,
    overwritten: number,
    skipped: {invalid: number, limit: number, missing_reference: number, not_yours: number},
    total: number,
  }

  // `export` is the file's contents, signed by the api (`signature`) so imports can tell it wasn't edited
  export interface FetchTagsExport {
    count: number,
    export: Record<string, any>,
    filename: string,
  }

  export interface FetchTagsDirectory {
    count: number,
    items: Array<TagDirectory>,
  }

  export type FetchTagId = Tag;
  export type FetchTagSearch = Tag;
  export type FetchTagSearchRandom = Tag;

  export type FetchTagBlobs = Record<TagBlobStorageTypes, string>;

  export type FetchTagStorage = FileResponse;

  export interface FetchTagVariable {
    name: string,
    storage_id: string,
    storage_type: number,
    value: string,
  }

  export type FetchTagVariables = Record<TagVariableStorageTypes, Record<string, string>>;

  export type FetchUser = User;
  export type FetchUserSettings = UserSettings;

  export interface FetchUserTags {
    count: number,
    tags: Array<Tag>,
  }

  export interface FetchUserTagsCommands {
    count: number,
    tags: Array<Tag>,
  }

  export interface FetchUserVoices {
    count: number,
    voices: Array<Voice>,
  }

  export type PutGuildRules = Array<GuildRule>;
  export type PutTag = Tag;
  export type PutTagsDirectoryTag = TagDirectory;
  export type PutTagBlobs = FetchTagBlobs;
  export type PutTagVariable = FetchTagVariable;
  export type PutTagVariables = FetchTagVariables;
  export type PutUser = User;


  export interface CommandUsage {
    channel_id: string,
    command_id: string,
    command_type: number,
    guild_id: null | string,
    timestamp: number,
    user_id: string,
  }

  export interface FunAsciiArtFromImage {
    text: string,
  }

  export interface GenerateTag {
    // problems the static check still found in `text` (after the repair attempt, if there was one)
    check_errors?: Array<string>,
    external_id: string,
    id?: string,
    model: string,
    // `answer`, `tagscript`, `mixed` or `legacy` (the model ignored the block format)
    output_kind?: string,
    prompt_complexity_level: number,
    // problems the first reply had, which triggered the repair attempt
    repair_errors?: Array<string>,
    repaired?: boolean,
    // the tagscript to run, plain answers are already escaped so they show as is
    text: string,
    // the plain text when the reply is only an answer, for showing it without running it
    text_answer?: null | string,
    text_full: string,
    usage: {
      input_tokens: number,
      input_tokens_cached: number,
      input_tokens_cached_created: number,
      output_tokens: number,
      output_tokens_reasoning: number,
    },
  }

  export interface GoogleContentVisionLabels {
    label_annotations: Array<{
      description: string,
      mid: string,
      score: number,
      topicality: number,
    }>,
  }

  export interface GoogleContentVisionOCR {
    annotation: null | {description: string, locale: GoogleLocales},
  }

  export interface GoogleContentVisionSafeSearch {
    safe_search_annotation: {
      adult: string,
      spoof: string,
      medical: string,
      violence: string,
      racy: string,
    },
  }

  export interface GoogleContentVisionWebDetection {
    bestGuessLabels: Array<{label: string}>,
    fullMatchingImages?: Array<{url: string}>,
    pagesWithMatchingImages?: Array<{
      pageTitle: string,
      partialMatchingImages: Array<{url: string}>,
      url: string,
    }>,
    partialMatchingImages?: Array<{url: string}>,
    visuallySimilarImages?: Array<{url: string}>,
    webEntities: Array<{
      description: string,
      entityId: string,
      score: number,
    }>,
  }

  export interface GoogleTranslate {
    from_language: GoogleLocales,
    from_text: string,
    translated_language: GoogleLocales,
    translated_text: string,
    untranslated: boolean,
  }

  export interface GuildSettings {
    blocked: boolean,
    blocked_reason: string | null,
    icon: string | null,
    id: string,
    locale: string | null,
    name: string,
    prefixes: Array<GuildPrefix>,
    rules: Array<GuildRule>,
    settings: {
      ml_diffusion_model: string | null,
      ml_llm_model: string | null,
      ml_llm_personality: string | null,
      response_display: number | null,
      rules_admin_bypass: boolean,
      search_provider_images: number | null,
      search_provider_web: number | null,
      warnings_actions: Array<GuildWarningAction>,
      warnings_expire: number | null,
      warnings_window: number,
    },
    timezone: string | null,
  }

  // matches GuildRule.to_dict() on the api
  export interface GuildRule {
    action: string,
    added: string,
    admin_bypass: boolean | null,
    category: string | null,
    command: string | null,
    id: string,
    target_id: string,
    target_type: string,
    user_id: string | null,
    value: {allow: boolean, message: string | null},
  }

  // matches GuildLogger.to_dict() on the api
  export interface GuildLogger {
    added: string,
    channel_id: string,
    disabled_events: number,
    guild_id: string,
    type: number,
    user_id: string | null,
    webhook_id?: string,
    webhook_token?: string,
  }

  export interface GuildPrefix {
    added: string,
    guild_id: string,
    prefix: string,
    user_id: string,
  }

  export interface RemoveGuildFeature {
    features: Array<string>,
    id: string,
  }

  export interface MediaAIVToolsAnalyze {
    image?: {mimetype: string, value: string},
    interrogation: string,
    labels: Array<{
      name: string,
      score: number,
      topicality: number,
    }>,
    ocr: string,
    songs: Array<{
      album: string,
      artists: Array<string>,
      duration: number,
      match: number,
      timestamp: number,
      title: string,
    }>,
    transcription: Array<{
      l: string,
      t: [number, number],
      txt: string,
    }>,
  }

  export interface MediaAIVToolsExif {
    channels: {
      audio: Array<{
        bit_rate: number,
        channels: number,
        codec: string,
        codec_description: string,
        codec_tag: string,
        duration: number,
        frames: number,
        sample_rate: number,
      }>,
      image: Array<{
        bands: number,
        delay: Array<number>,
        format: string,
        frames: number,
        height: number,
        interpretation: string,
        loop: boolean,
        mimetype: string,
        size: number,
        width: number,
        _data: {
          bands: number,
          coding: string,
          filename: string,
          format: string,
          'gif-comment'?: string,
          interpretation: string,
          height: number,
          'vips-loader': string,
          width: number,
          xoffset: number,
          xres: number,
          yoffset: number,
          yres: number,
          [key: string]: any,
        },
      }>,
      video: Array<{
        bit_rate: number,
        codec: string,
        codec_description: string,
        codec_tag: string,
        duration: number,
        frames: number,
        frames_per_second: number,
        height: number,
        pixel_format: string,
        rotate: number,
        width: number,
      }>,
    },
    exif: Array<{
      bytes: number,
      description: null | string,
      components: number,
      name: string,
      raw: string,
      type: string,
      value: string,
    }>,
    metadata: {
      duration: number,
      frames: number,
      height: number,
      mimetype: string,
      size: number,
      width: number,
    },
    url: null | string,
    _raw?: any,
  }


  export interface ModerationSafetyScanResult {
    identification: {
      // nudenet boxes per frame, null where it didn't run
      detections_frames?: Array<null | Array<{box: [number, number, number, number], class: string, score: number}>>,
      flagged: Array<string>,
      child_safety: boolean,
      needs_human_review: boolean,
      flagged_frames: Array<number>,
      frames: number,
      scores: Record<string, number>,
    },
    unsafe: boolean,
    zip?: null | {mimetype: string, value: string},
  }

  export interface ModerationSafetyScan {
    media: null | ModerationSafetyScanResult,
    text: null | ModerationSafetyScanResult,
  }

  export interface ModerationTextScan {
    flagged: Array<string>,
    flagged_for_review: Array<string>,
    needs_human_review: boolean,
    scores: Record<string, number>,
    unsafe: boolean,
  }


  export interface Search4ChanMedia {
    deleted: boolean,
    extension: string,
    height: number,
    md5: string,
    mobile_optimized: boolean,
    name: string,
    size: number,
    spoiler: boolean,
    spoiler_id: null | number,
    tag: null | string,
    thumbnail: string,
    url: string,
    width: number,
  }

  export interface Search4ChanThread {
    closed: boolean,
    comment: string,
    created_at: number,
    created_at_text: string,
    edited_at: null | number,
    id: number,
    images: number,
    limited: {
      bump: boolean,
      images: boolean,
    },
    media: Search4ChanMedia | null,
    omitted: {
      images: number,
      posts: number,
    },
    posts: Array<{
      comment: string,
      created_at: number,
      created_at_text: string,
      id: number,
      media: Search4ChanMedia,
      reply_id: null | number,
      url: string,
      user: Search4ChanUser,
    }>,
    replies: number,
    sticky: boolean,
    sticky_cap: number | null,
    tail_size: number | null,
    title: string,
    unique_ips: number | null,
    url: string,
    url_semantic: string | null,
    user: Search4ChanUser,
  }

  export interface Search4ChanUser {
    badge: null | string,
    country: null | {code: string, name: string},
    id: null | string,
    name: string,
    since4pass: null | number,
    trip: null | string,
  }

  export interface Search4Chan {
    board: string,
    nsfw: boolean,
    threads: Array<Search4ChanThread>,
    url: string,
  }

  export interface SearchDuckDuckGoImages {
    amount: number,
    results: Array<{
      created: null | string,
      header: string,
      footer: string,
      id: string,
      image: {
        extension: null | string,
        height: number,
        token: string,
        trusted: boolean,
        url: string,
        width: number,
      },
      proxy_url: string,
      thumbnail: {
        height: number,
        token: string,
        trusted: boolean,
        url: string,
        width: number,
      },
      url: string,
    }>,
  }

  export interface SearchGoogle {
    cards: Array<SearchGoogleCard>,
    results: Array<SearchGoogleResult>,
    suggestion: null | {text: string, url: string},
    total_result_count: number,
  }

  export interface SearchGoogleReverseImages {
    related_search: {
      results: Array<SearchGoogleResult>,
      text: string,
      url: null | string,
    },
    similar_images: {
      results: Array<{search_url: null | string, url: string}>,
      url: null | string,
    },
    // google lens' visual matches, `thumbnail` is the matched image and `footer` the site's name
    similar_results: Array<SearchGoogleResult>,
    thumbnail: null | string,
    total_result_count: number,
    // a lens search anyone can open, only when the image came in as a link
    url: null | string,
  }

  export interface SearchGoogleImages {
    results: Array<SearchGoogleImage>,
  }

  export interface SearchGoogleCard {
    description: null | string,
    fields: Array<{name: string, value: string}>,
    footer: null | string,
    header: null | string,
    image: null | string,
    sections: Array<{
      description: string,
      fields: Array<{name: string, title?: string, value: null | string, values?: Array<string>}>,
      title: string,
    }>,
    thumbnail: null | string,
    title: string,
    type: GoogleCardTypes,
    url: null | string,
  }

  export interface SearchGoogleImage {
    color: number,
    created: null | string,
    description: string,
    header: string,
    footer: string,
    id: string,
    image: {
      extension: null | string,
      height: number,
      proxy_url: string,
      trusted: boolean,
      url: string,
      width: number,
    },
    metadata: {
      license: null | {
        about: string,
        licensable: boolean,
        text: string,
        url: string,
      },
      product: null | {
        brand: null | string,
        currency: null | string,
        description: string,
        in_stock: null | boolean,
        price: null | number,
        stars: null | number,
        stars_amount: null | number,
        title: string,
      },
      recipe: null | {
        description: string,
        duration: null | string,
        duration_milliseconds: null | number,
        ingredients: Array<string>,
        servings: null | string,
        stars: null | number,
        stars_amount: null | number,
        title: string,
      },
      video: null | {
        channel: null | string,
        comments: null | number,
        description: string,
        duration: null | string,
        duration_seconds: null | number,
        likes: null | number,
        title: string,
        type: GoogleImageVideoTypes,
        uploaded_at: null | number,
        views: null | number,
      },
    },
    thumbnail: {
      height: number,
      proxy_url: string,
      trusted: boolean,
      url: string,
      width: number,
    },
    url: string,
  }

  export interface SearchGoogleResult {
    description: string,
    cite: string,
    fields: Array<{name: string, url: string, value: string}>,
    footer: string,
    suggestions: Array<{text: string, url: string}>,
    thumbnail: {
      description: string,
      height: number,
      proxy_url: string | null,
      reference_url: string | null,
      url: string | null,
      width: number,
    } | null,
    title: string,
    url: string,
    urls: Array<{text: string, url: string}>,
  }

  export interface SearchImgurResult {
    dislikes: number,
    id: string,
    likes: number,
    points: number,
    thumbnail: string | null,
    title: string,
    type: string,
    url: string | null,
    views: number,
  }

  export interface SearchImgur {
    amount: number,
    results: Array<SearchImgurResult>,
  }

  export type SearchRule34 = Array<SearchRule34Result>;
  export interface SearchRule34Result {
    created_at: string,
    creator_id: string,
    file_url: string,
    has_comments: boolean,
    has_notes: boolean,
    id: string,
    is_video: boolean,
    rating: string,
    score: number,
    source: string | null,
    status: string,
    tags: Array<string>,
    thumbnail_url: string,
    url: string,
  }

  export type SearchRule34Paheal = Array<SearchRule34PahealResult>;
  export interface SearchRule34PahealResult {
    author: {
      id: string,
      url: string,
    } | null,
    created_at: string,
    file_name: string,
    file_url: string,
    id: string,
    is_video: boolean,
    rating: string,
    score: number,
    source: string | null,
    tags: Array<string>,
    thumbnail_url: string,
    url: string,
  }


  export interface SearchReddit {
    results: Array<SearchRedditResult>,
  }

  export interface SearchRedditResult {
    all_awards: Array<any>,
    allow_live_comments: boolean,
    approved_at_utc: number | null,
    approved_by: string | null,
    archived: boolean,
    author: string,
    author_flair_background_color: null | any,
    author_flair_css_class: string | null,
    author_flair_richtext: Array<any>,
    author_flair_template_id: string,
    author_flair_text: string,
    author_flair_text_color: string,
    author_flair_type: string,
    author_fullname: string,
    author_patreon_flair: boolean,
    author_premium: boolean,
    awarders: Array<any>,
    banned_at_utc: number | null,
    banned_by: string | null,
    can_gild: boolean,
    can_mod_post: boolean,
    category: null | any,
    clicked: boolean,
    content_categories: null | any,
    contest_mode: boolean,
    created: number,
    created_utc: number,
    discussion_type: null | any,
    distinguished: null | any,
    domain: string,
    downs: number,
    edited: boolean,
    gilded: number,
    gildings: {},
    hidden: boolean,
    hide_score: boolean,
    id: string,
    is_crosspostable: boolean,
    is_meta: boolean,
    is_original_content: boolean,
    is_reddit_media_domain: boolean,
    is_robot_indexable: boolean,
    is_self: boolean,
    is_video: boolean,
    likes: null | any,
    link_flair_background_color: string,
    link_flair_css_class: string,
    link_flair_richtext: Array<any>,
    link_flair_text: string,
    link_flair_text_color: string,
    link_flair_type: string,
    locked: boolean,
    media: any,
    media_embed: {},
    media_only: boolean,
    mod_note: null | any,
    mod_reason_by: null | any,
    mod_reason_title: null | any,
    mod_reports: Array<any>,
    name: string,
    no_follow: boolean,
    num_comments: number,
    num_crossposts: number,
    num_reports: null | any,
    over_18: boolean,
    parent_whitelist_status: string,
    permalink: string,
    pinned: boolean,
    post_hint: string,
    preview: {
      enabled: boolean,
      images: Array<{
        id: string,
        resolutions: Array<{
          height: number,
          url: string,
          width: number,
        }>,
        source: {
          height: number,
          url: string,
          width: number,
        },
        variants: {},
      }>,
    },
    pwls: number,
    quarantine: boolean,
    removal_reason: null | any,
    removed_by: null | any,
    removed_by_category: null | any,
    report_reasons: null | any,
    saved: boolean,
    score: number,
    secure_media: null | any,
    secure_media_embed: {},
    selftext: string,
    selftext_html: string | null,
    send_replies: boolean,
    spoiler: boolean,
    stickied: boolean,
    subreddit: string,
    subreddit_id: string,
    subreddit_name_prefixed: string,
    subreddit_subscribers: number,
    subreddit_type: string,
    suggested_sort: null | any,
    thumbnail: string,
    thumbnail_height: number,
    thumbnail_width: number,
    title: string,
    top_awarded_type: null | any,
    total_awards_received: number,
    treatment_tags: Array<any>,
    ups: number,
    upvote_ratio: number,
    url: string,
    url_overridden_by_dest: string,
    user_reports: Array<any>,
    view_count: null | any,
    visited: boolean,
    whitelist_status: string,
    wls: number,
  }


  export interface SearchSteam {
    count: number,
    results: Array<SearchSteamResult>,
  }

  export interface SearchSteamResult {
    avatar_url: string,
    country: string | null,
    country_flag_url: string | null,
    custom_url: string | null,
    in_common: Array<string>,
    past_names: Array<string>,
    real_name: string | null,
    steam_id: string | null,
    steam_id_64: string | null,
    url: string,
    username: string,
  }

  export interface SearchSteamEmoji {
    description: string,
    image: {
      data: string,
      details: {
        extension: string,
        filename: string,
        height: number,
        mimetype: string,
        width: number,
      },
      url: string,
    },
    name: string,
  }

  export interface SearchSteamEmojis {
    count: number,
    results: Array<{
      app: {
        id: number,
        icon: string,
        name: string,
      },
      icon: string,
      icon_hash: string,
      id: string,
      name: string,
      metadata: {
        background_color: string,
        class_id: string,
        commodity: boolean,
        instance_id: string,
        name_color: string,
        tradable: boolean,
        type: string,
      },
      sale_price_text: string,
      sell_listings: string,
      sell_price: string,
      sell_price_text: string,
      url: string,
    }>,
  }

  export interface SearchSteamProfile {
    avatar: {
      full: string,
      icon: string,
      medium: string,
    },
    custom_url: string | null,
    groups: Array<{
      avatar: {
        full: string | null,
        icon: string | null,
        medium: string | null,
      },
      headline: string | null,
      id_64: string,
      is_primary: boolean,
      member_count: number,
      members_in_chat: number,
      members_in_game: number,
      members_online: number,
      name: string | null,
      summary: string,
      url: string | null,
    }>,
    id: string,
    id_64: string,
    in_game: {
      join_link: string | null,
      icon: string,
      logo: string,
      name: string,
      url: string,
    } | null,
    in_game_ip: string | null,
    is_limited_account: boolean,
    is_vac_banned: boolean,
    location: string | null,
    member_since: string,
    most_played_games: Array<{
      hours_played_last_2_weeks: number,
      hours_played: number,
      icon: string,
      logo: string,
      name: string,
      url: string,
    }>,
    past_names: Array<{name: string, timestamp: string}>,
    privacy: string,
    real_name: string | null,
    state: string,
    state_message: string,
    steam_rating: null,
    summary: string | null,
    trade_ban_state: string,
    url: string,
    username: string,
    visibility_state: number,
  }


  export type SearchUrbanDictionary = Array<SearchUrbanDictionaryResult>;
  export interface SearchUrbanDictionaryResult {
    author: string,
    current_vote: string,
    defid: number,
    definition: string,
    example: string,
    permalink: string,
    sound_urls: Array<string>,
    thumbs_down: number,
    thumbs_up: number,
    word: string,
    written_on: string,
  }

  export type SearchWikihow = Array<SearchWikihowResult>;
  export interface SearchWikihowResult {
    badge: null | string,
    id: number,
    id_vanity: string,
    thumbnail: null | string,
    title: string,
    updated: string,
    url: string,
    views: number,
  }

  export interface SearchWikihowRandom {
    author: null | {
      avatar: {
        height: number,
        url: string,
        width: number,
      },
      name: string,
      type: string,
    },
    contributor: null | {
      name: string,
      type: string,
    },
    created: string,
    description: string,
    image: null | {
      height: number,
      url: string,
      width: number,
    },
    methods: Array<{
      steps: Array<{
        image: string,
        text: string,
        url: string,
      }>,
      title: string,
    }>,
    rating: {
      best: number,
      count: number,
      value: number,
    },
    title: string,
    updated: null | string,
    url: string,
    video: null | {
      description: string,
      thumbnail: string,
      uploaded: string,
      url: string,
    },
  }

  export interface SearchBing {
    _error?: string,
    amount: number,
    results: Array<{
      cite: string,
      description: string,
      site: string,
      title: string,
      url: string,
    }>,
  }

  export interface SearchBingImages {
    _error?: string,
    amount: number,
    results: Array<{
      footer: string,
      header: string,
      image: {
        extension: null | string,
        height: number,
        trusted: boolean,
        url: string,
        width: number,
      },
      proxy_url: string,
      thumbnail: {
        height: number,
        trusted: boolean,
        url: null | string,
        width: number,
      },
      url: string,
    }>,
  }

  export interface SearchOpenverse {
    _error?: string,
    amount: number,
    results: Array<{
      footer: string,
      header: string,
      image: {
        extension: null | string,
        height: number,
        trusted: boolean,
        url: string,
        width: number,
      },
      proxy_url: string,
      thumbnail: {
        height: number,
        trusted: boolean,
        url: null | string,
        width: number,
      },
      url: string,
    }>,
  }

  export interface SearchYandex {
    _error?: string,
    amount: number,
    results: Array<{
      cite: string,
      description: string,
      site: string,
      title: string,
      url: string,
    }>,
  }

  export interface SearchYandexImages {
    _error?: string,
    amount: number,
    results: Array<{
      footer: string,
      header: string,
      image: {
        extension: null | string,
        height: number,
        trusted: boolean,
        url: string,
        width: number,
      },
      proxy_url: string,
      thumbnail: {
        height: number,
        trusted: boolean,
        url: null | string,
        width: number,
      },
      url: string,
    }>,
  }

  export interface SearchYoutube {
    _body: any,
    results: Array<SearchYoutubeResult>,
    suggestions: Array<string>,
    total_result_count: number,
  }

  export type SearchYoutubeResult =
    SearchYoutubeResultChannel |
    SearchYoutubeResultMovie |
    SearchYoutubeResultPlaylist |
    SearchYoutubeResultVideo;

  export interface SearchYoutubeResultBase {
    description: string,
    thumbnail: {
      height: number,
      url: string,
      width: number,
    },
    title: string,
    url: string,
  }

  export interface SearchYoutubeResultChannel extends SearchYoutubeResultBase {
    metadata: {
      badges: Array<string>,
      id: string,
      is_show: boolean,
      subscriber_count: number,
      url: string,
      vanity: null | string,
      video_count: number,
    },
    type: YoutubeResultTypes.CHANNEL,
  }

  export interface SearchYoutubeResultMovie extends SearchYoutubeResultBase {
    metadata: {
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        url: string,
        vanity: null | string,
      },
      duration: number,
      fields: Array<{name: string, value: string}>,
      genre: string,
      id: string,
      price: string,
    },
    type: YoutubeResultTypes.MOVIE,
  }

  export interface SearchYoutubeResultPlaylist extends SearchYoutubeResultBase {
    metadata: {
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        url: string,
        vanity: null | string,
      },
      id: string,
      updated: null | string,
      video_count: number,
      videos: Array<{
        duration: number,
        id: string,
        title: string,
        url: string,
      }>,
    },
    type: YoutubeResultTypes.PLAYLIST;
  }

  export interface SearchYoutubeResultVideo extends SearchYoutubeResultBase {
    metadata: {
      badges: Array<string>,
      channel: {
        badges: Array<string>,
        id: string,
        name: string,
        thumbnail: {
          height: number,
          url: string,
          width: number,
        } | null,
        url: string,
        vanity: null | string,
      },
      duration: number,
      id: string,
      published: string,
      streamed: boolean,
      view_count: number,
    },
    type: YoutubeResultTypes.VIDEO,
  }

  export interface ServerSettings {
    blocked: boolean,
    blocked_reason: string | null,
    id: string,
    settings: {
      ml_diffusion_model: string | null,
      ml_llm_model: string | null,
      ml_llm_personality: string | null,
    },
    timezone: string | null,
  }

  export interface UtilitiesCodeRun {
    language: {
      extension: string,
      default_version: string,
      id: string,
      language: string,
      versions: Array<string>,
    },
    result: {
      error: string,
      // `file.filename` is the output's own name
      files: Array<FileResponse>,
      output: string,
    },
    took: number,
    version: string,
  }

  export interface UtilitiesLocations {
    count: number,
    results: Array<{
      address: {
        city: string | null,
        continent: string | null,
        country: string | null,
        country_code: string | null,
        county: string | null,
        full: string,
        state: string | null,
        state_district: string | null,
        suburb: string | null,
        zipcode: string | null,
        'ISO3166-2-lvl4': string | null,
      },
      latitude: number,
      longitude: number,
      name: string,
      name_official: string,
      urls: {place: string, search: string},
    }>
  }

  export interface UtilitiesMLInterrogate {
    prompt: string,
  }

  export interface UtilitiesMLTone {
    // 0-1 per attribute (toxicity, severe_toxicity, obscene, identity_attack, insult, threat, sexual_explicit)
    scores: Record<string, number>,
    tokens: number,
    // only the first 512 tokens were scored
    truncated: boolean,
  }

  export interface UtilitiesProxyRequest {
    cookies: Record<string, string>,
    data: any,
    data_is_bytes: boolean,
    headers: Record<string, string>,
    status: number,
    url: string,
  }

  export interface UtilitiesQrScan {
    results: Array<{
      data: string,
      type: string,
    }>,
    url?: string,
  }

  export interface UtilitiesUnicode {
    characters: Array<{
      category: string,
      character: string,
      code_point: number,
      // characters without a name get a label like `<control-000A>`
      name: string,
    }>,
    count: number,
    version: string,
  }

  export interface UtilitiesWeather {
    location: {
      address: {
        city: string | null,
        continent: string | null,
        country: string | null,
        country_code: string | null,
        county: string | null,
        full: string,
        state: string | null,
        state_district: string | null,
        suburb: string | null,
        zipcode: string | null,
        'ISO3166-2-lvl4': string | null,
      },
      latitude: number,
      longitude: number,
      name: string,
      name_official: string,
      urls: {place: string, search: string},
    },
    timezone: string,
    thumbnail: null | {url: string},
    weather: {
      current: {
        clouds: number,
        conditions: Array<{
          description: string,
          title: string,
        }>,
        dew_point: number,
        feels_like: number,
        humidity: number,
        pressure: number,
        sunrise: number,
        sunset: number,
        temperature: number,
        uv_index: number,
        visibility: number,
        wind: {
          direction: number,
          gust: number,
          speed: number,
        },
      },
      daily: Array<{
        clouds: number,
        conditions: Array<{
          description: string,
          title: string,
        }>,
        dew_point: number,
        feels_like: {
          day: number,
          evening: number,
          morning: number,
          night: number,
        },
        humidity: number,
        moonphase: number,
        moonrise: number,
        moonset: number,
        pressure: number,
        sunrise: number,
        sunset: number,
        temperature: {
          day: number,
          evening: number,
          max: number,
          min: number,
          morning: number,
          night: number,
        },
        timestamp: number,
        uv_index: number,
        visibility: number,
        wind: {
          direction: number,
          gust: number,
          speed: number,
        },
      }>,
      units: MeasurementUnits,
    },
  }

  export type VoiceCloneAdd = Voice;
  export type VoiceCloneEdit = Voice;



  export interface LLMMemory {
    content: string,
    created: string,
    // null for a global one
    guild_id: null | string,
    id: string,
    position: number,
  }

  export interface Reminder {
    channel_id: string | null,
    channel_id_backup: string | null,
    content: string,
    guild_id: string | null,
    id: string,
    is_all_day: boolean,
    message_id: string | null,
    position: number,
    timestamp_end: string | null,
    timestamp_start: string,
    user: User,
  }

  // a reply or a status change on a report, the reporter's shape (staff are NotSoAdmin)
  export interface ReportMessage {
    author: 'reporter' | 'staff',
    content: null | string,
    created: string,
    id: string,
    status: null | number,
  }

  export interface Report {
    channel_id: string | null,
    content: string,
    created: string,
    guild_id: string | null,
    id: string,
    message_id: string | null,
    notes: string | null,
    reviewed_at: string | null,
    reviewed_by: string | null,
    status: ReportStatuses,
    tag_id: string | null,
    target_id: string | null,
    type: ReportTypes,
    user: User,
  }

  export interface Tag {
    content: string,
    created: string,
    edited: string | null,
    global: boolean,
    guild_id: string | null,
    id: string,
    is_command: boolean,
    is_on_directory: boolean,
    last_used: string | null,
    locked: boolean,
    name: string,
    nsfw: boolean,
    reference_tag: Tag | null,
    server_id: string | null,
    user: User,
    uses: number,
  }

  export interface TagDirectory {
    assets: Array<{
      // todo: fill this in
    }>,
    category: TagDirectoryCategories,
    // the owner shows `tag.content` on the public directory, it's '' otherwise
    content_public: boolean,
    created: string,
    description: string,
    edited: string | null,
    id: string,
    server_count: number,
    tag: Tag,
    title: string,
    verified: TagDirectoryVerificationStates,
  }

  export interface User {
    avatar: null | string,
    blocked: boolean,
    blocked_reason: null | string,
    bot: boolean,
    channel_id?: null | string,
    discriminator: string,
    flags: number,
    id: string,
    premium_type?: number,
    username: string,
  }

  export interface UserSettings {
    application_command_response_type: number,
    download_quality: string | null,
    fallbacks_media_image: number,
    file_upload_name: string | null,
    file_upload_threshold: number,
    file_upload_type: number,
    file_upload_vanity: string | null,
    locale: string | null,
    ml_diffusion_model: string | null,
    ml_llm_memory_disabled: boolean,
    ml_llm_model: string | null,
    ml_llm_personality: string | null,
    response_display: number | null,
    search_provider_images: number | null,
    search_provider_web: number | null,
    timezone: string | null,
    tts_voice: string | null,
    units: string | null,
  }

  export interface Voice {
    id: string,
    name: string,
    platform_id: string,
    platform_type: number,
    user: User,
  }
}
