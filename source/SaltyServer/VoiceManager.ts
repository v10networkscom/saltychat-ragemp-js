/// <reference types="@types/ragemp-s" />
/// <reference path="Radio.ts" />
/// <reference path="SharedEvent.ts" />
/// <reference path="SharedData.ts" />

const ServerUniqueIdentifier: string = "<serverUid>";
const RequiredUpdateBranch: string = "Stable";
const MinimumPluginVersion: string = "0.5.0";
const SoundPack: string = "default";
const IngameChannnel: string = "<channelId>";
const IngameChannelPassword: string = "";

let RadioTowers: Vector3Mp[] = [
    new mp.Vector3(552.8169, -27.8083, 94.87936),
    new mp.Vector3(758.5276, 1273.74, 360.2965),
    new mp.Vector3(1857.389, 3694.529, 38.9618),
    new mp.Vector3(-448.2019, 6019.807, 36.62916)
];

let VoiceClients: { [id: number]: SaltyVoiceClient } = {};
let RadioChannels: SaltyRadioChannel[] = [];

function playerJoinHandler(player: PlayerMp) {
    let voiceClient = new SaltyVoiceClient(player, "Ingame-Player-" + player.id, SaltySharedData.VoiceRanges[1]);
    VoiceClients[player.id] = voiceClient;
    player.call(SaltyEvent.SaltyChat_Initialize, [voiceClient.TeamSpeakName, ServerUniqueIdentifier, SoundPack, IngameChannnel, IngameChannelPassword]);
}

function JoinVoice(player: PlayerMp, teamSpeakname: string) {
    let voiceClient = new SaltyVoiceClient(player, teamSpeakname, SaltySharedData.VoiceRanges[1]);
    VoiceClients[player.id] = voiceClient;
    player.call(SaltyEvent.SaltyChat_Initialize, [voiceClient.TeamSpeakName, ServerUniqueIdentifier, SoundPack, IngameChannnel, IngameChannelPassword]);
}

function playerQuitHandler(player: PlayerMp, exitType: string, reason: string) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    delete VoiceClients[player.id];
    RadioChannels.forEach(channel => {
        if (channel.IsMember(voiceClient))
            channel.RemoveMember(voiceClient);
    });

    Object.keys(VoiceClients).forEach(key => {
        VoiceClients[parseInt(key)].Player.call(SaltyEvent.SaltyChat_Disconnected, [voiceClient.Player.id]);
    });
}
mp.events.add("salty:joinVoice", JoinVoice);
mp.events.add("playerJoin", playerJoinHandler);
mp.events.add("playerQuit", playerQuitHandler);


// ============= Salty Events ===============

function OnCheckVersion(player: PlayerMp, branch: string, version: string) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    if (!IsVersionAccepted(branch, version)) {
        player.kick(`[Salty Chat] Required Branch: ${RequiredUpdateBranch} | Required Version: ${MinimumPluginVersion}"`);
        return;
    }

    Object.keys(VoiceClients).forEach(key => {
        let cl = VoiceClients[parseInt(key)];
        player.call(SaltyEvent.SaltyChat_UpdateClient, [cl.Player.id, cl.TeamSpeakName, cl.VoiceRange])
        cl.Player.call(SaltyEvent.SaltyChat_UpdateClient, [voiceClient.Player.id, voiceClient.TeamSpeakName, voiceClient.VoiceRange]);
    });
    player.call(SaltyEvent.SaltyChat_UpdateRadioTowers, [JSON.stringify(RadioTowers)])
    player.notify(`<C>VersionCheck</C>~n~Version: ${version}~n~Branch: ${branch}`);
}
mp.events.add(SaltyEvent.SaltyChat_CheckVersion, OnCheckVersion);

function OnIsTalking(player: PlayerMp, isTalking: boolean) {
    if (!(player.id in VoiceClients))
        return;
    Object.keys(VoiceClients).forEach(key => {
        VoiceClients[parseInt(key)].Player.call(SaltyEvent.SaltyChat_IsTalking, [player.id, isTalking]);
    });
}
mp.events.add(SaltyEvent.SaltyChat_IsTalking, OnIsTalking);

function OnSetVoiceRange(player: PlayerMp, voiceRange: number) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    if (SaltySharedData.VoiceRanges.indexOf(voiceRange) >= 0) {
        voiceClient.VoiceRange = voiceRange;

    }

    Object.keys(VoiceClients).forEach(key => {
        VoiceClients[parseInt(key)].Player.call(SaltyEvent.SaltyChat_UpdateClient, [player.id, voiceClient.TeamSpeakName, voiceClient.VoiceRange]);
    });
    player.notify(`<C>VoiceRange:</C> ~y~${voiceRange}`);
}
mp.events.add(SaltyEvent.SaltyChat_SetVoiceRange, OnSetVoiceRange);

function OnSendingOnRadio(player: PlayerMp, radioChannelName: string, isSending: boolean) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    let radioChannel: SaltyRadioChannel = GetRadioChannel(radioChannelName, false);
    if (radioChannel == null || !radioChannel.IsMember(voiceClient))
        return;
    radioChannel.Send(voiceClient, isSending);
    player.notify(`<C>RadioBroadcast:</C>~n~Channel: ${radioChannelName}~n~IsSending: ${isSending}`);
}
mp.events.add(SaltyEvent.SaltyChat_IsSending, OnSendingOnRadio);

// =============== Helper ===================
function IsVersionAccepted(branch: string, version: string): boolean {
    // TODO Version Check
    return true;
}

function GetRadioChannel(name: string, create: boolean): SaltyRadioChannel {
    let radioChannel: SaltyRadioChannel = RadioChannels.find(x => x.Name == name);
    if (radioChannel == null && create) {
        radioChannel = new SaltyRadioChannel(name, []);
        RadioChannels.push(radioChannel);
    }
    return radioChannel;
}

// Public Radio Functions

function SetRadioSpeaker(player: PlayerMp, toggle: boolean) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    voiceClient.RadioSpeaker = toggle;
}
mp.events.add("salty:setRadioSpeaker", SetRadioSpeaker);

function JoinRadioChannel(player: PlayerMp, radioChannelName: string) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    RadioChannels.forEach(channel => {
        if (channel.IsMember(voiceClient))
            return;
    });
    GetRadioChannel(radioChannelName, true).AddMember(voiceClient);
    player.notify(`<C>Radio ~g~AN~w~~n~Channel: ${radioChannelName}</C>`);
}
mp.events.add("salty:joinRadioChannel", JoinRadioChannel);

function LeaveAllRadioChannels(player: PlayerMp) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    RadioChannels.forEach(channel => {
        if (channel.IsMember(voiceClient))
            channel.RemoveMember(voiceClient);
    });
}
mp.events.add("salty:leaveAllRadioChannel", LeaveAllRadioChannels);

function LeaveRadioChannel(player: PlayerMp, radioChannelName: string) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient: SaltyVoiceClient = VoiceClients[player.id];
    let radioChannel = GetRadioChannel(radioChannelName, false);
    if (radioChannel == null)
        return;
    if (!radioChannel.IsMember(voiceClient))
        return;
    radioChannel.RemoveMember(voiceClient);
    player.notify(`<C>Radio ~r~AUS~w~~n~Channel: ${radioChannelName}</C>`);
}
mp.events.add("salty:leaveRadioChannel", LeaveRadioChannel);

// Public Phone Methods
function StartPhoneCall(player: PlayerMp, targetPlayer: PlayerMp) {
    player.call(SaltyEvent.SaltyChat_EstablishedCall, [targetPlayer.id]);
    targetPlayer.call(SaltyEvent.SaltyChat_EstablishedCall, [player.id]);
}
mp.events.add("salty:startPhoneCall", StartPhoneCall);

function EndCall(player: PlayerMp, targetPlayer: PlayerMp) {
    player.call(SaltyEvent.SaltyChat_EndCall, [targetPlayer.id]);
    targetPlayer.call(SaltyEvent.SaltyChat_EndCall, [player.id]);
}
mp.events.add("salty:endPhoneCall", EndCall);

// Other Methods

function OnPlayerDeath(player: PlayerMp) {
    player.call(SaltyEvent.SaltyChat_PlayerDied, [player.id]);
}
mp.events.add("salty:playerDeath", OnPlayerDeath);

function OnPlayerRevived(player: PlayerMp) {
    player.call(SaltyEvent.SaltyChat_PlayerRevived, [player.id]);
}
mp.events.add("salty:playerRevived", OnPlayerRevived);