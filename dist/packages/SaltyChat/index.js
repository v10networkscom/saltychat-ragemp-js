class SaltyEvent {
}
SaltyEvent.SaltyChat_Initialize = "SaltyChat_Initialize";
SaltyEvent.SaltyChat_CheckVersion = "SaltyChat_CheckVersion";
SaltyEvent.SaltyChat_UpdateClient = "SaltyChat_UpdateClient";
SaltyEvent.SaltyChat_Disconnected = "SaltyChat_Disconnected";
SaltyEvent.SaltyChat_PlayerDied = "SaltyChat_PlayerDied";
SaltyEvent.SaltyChat_PlayerRevived = "SaltyChat_PlayerRevived";
SaltyEvent.SaltyChat_IsTalking = "SaltyChat_IsTalking";
SaltyEvent.SaltyChat_SetVoiceRange = "SaltyChat_SetVoiceRange";
SaltyEvent.SaltyChat_EstablishedCall = "SaltyChat_EstablishedCall";
SaltyEvent.SaltyChat_EstablishedCallRelayed = "SaltyChat_EstablishedCallRelayed";
SaltyEvent.SaltyChat_EndCall = "SaltyChat_EndCall";
SaltyEvent.SaltyChat_SetRadioChannel = "SaltyChat_SetRadioChannel";
SaltyEvent.SaltyChat_IsSending = "SaltyChat_IsSending";
SaltyEvent.SaltyChat_IsSendingRelayed = "SaltyChat_IsSendingRelayed";
SaltyEvent.SaltyChat_UpdateRadioTowers = "SaltyChat_UpdateRadioTowers";
class SaltySharedData {
}
SaltySharedData.VoiceRanges = [3.0, 8.0, 15.0, 32.0];
const ServerUniqueIdentifier = "<serverUid>";
const RequiredUpdateBranch = "Stable";
const MinimumPluginVersion = "0.5.0";
const SoundPack = "default";
const IngameChannnel = "<channelId>";
const IngameChannelPassword = "";
let RadioTowers = [
    new mp.Vector3(552.8169, -27.8083, 94.87936),
    new mp.Vector3(758.5276, 1273.74, 360.2965),
    new mp.Vector3(1857.389, 3694.529, 38.9618),
    new mp.Vector3(-448.2019, 6019.807, 36.62916)
];
let VoiceClients = {};
let RadioChannels = [];
function playerJoinHandler(player) {
    let voiceClient = new SaltyVoiceClient(player, "Ingame-Player-" + player.id, SaltySharedData.VoiceRanges[1]);
    VoiceClients[player.id] = voiceClient;
    player.call(SaltyEvent.SaltyChat_Initialize, [voiceClient.TeamSpeakName, ServerUniqueIdentifier, SoundPack, IngameChannnel, IngameChannelPassword]);
}
function JoinVoice(player, teamSpeakname) {
    let voiceClient = new SaltyVoiceClient(player, teamSpeakname, SaltySharedData.VoiceRanges[1]);
    VoiceClients[player.id] = voiceClient;
    player.call(SaltyEvent.SaltyChat_Initialize, [voiceClient.TeamSpeakName, ServerUniqueIdentifier, SoundPack, IngameChannnel, IngameChannelPassword]);
}
function playerQuitHandler(player, exitType, reason) {
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
function OnCheckVersion(player, branch, version) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    if (!IsVersionAccepted(branch, version)) {
        player.kick(`[Salty Chat] Required Branch: ${RequiredUpdateBranch} | Required Version: ${MinimumPluginVersion}"`);
        return;
    }
    Object.keys(VoiceClients).forEach(key => {
        let cl = VoiceClients[parseInt(key)];
        player.call(SaltyEvent.SaltyChat_UpdateClient, [cl.Player.id, cl.TeamSpeakName, cl.VoiceRange]);
        cl.Player.call(SaltyEvent.SaltyChat_UpdateClient, [voiceClient.Player.id, voiceClient.TeamSpeakName, voiceClient.VoiceRange]);
    });
    player.call(SaltyEvent.SaltyChat_UpdateRadioTowers, [JSON.stringify(RadioTowers)]);
    player.notify(`<C>VersionCheck</C>~n~Version: ${version}~n~Branch: ${branch}`);
}
mp.events.add(SaltyEvent.SaltyChat_CheckVersion, OnCheckVersion);
function OnIsTalking(player, isTalking) {
    if (!(player.id in VoiceClients))
        return;
    Object.keys(VoiceClients).forEach(key => {
        VoiceClients[parseInt(key)].Player.call(SaltyEvent.SaltyChat_IsTalking, [player.id, isTalking]);
    });
}
mp.events.add(SaltyEvent.SaltyChat_IsTalking, OnIsTalking);
function OnSetVoiceRange(player, voiceRange) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    if (SaltySharedData.VoiceRanges.indexOf(voiceRange) >= 0) {
        voiceClient.VoiceRange = voiceRange;
    }
    Object.keys(VoiceClients).forEach(key => {
        VoiceClients[parseInt(key)].Player.call(SaltyEvent.SaltyChat_UpdateClient, [player.id, voiceClient.TeamSpeakName, voiceClient.VoiceRange]);
    });
    player.notify(`<C>VoiceRange:</C> ~y~${voiceRange}`);
}
mp.events.add(SaltyEvent.SaltyChat_SetVoiceRange, OnSetVoiceRange);
function OnSendingOnRadio(player, radioChannelName, isSending) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    let radioChannel = GetRadioChannel(radioChannelName, false);
    if (radioChannel == null || !radioChannel.IsMember(voiceClient))
        return;
    radioChannel.Send(voiceClient, isSending);
    player.notify(`<C>RadioBroadcast:</C>~n~Channel: ${radioChannelName}~n~IsSending: ${isSending}`);
}
mp.events.add(SaltyEvent.SaltyChat_IsSending, OnSendingOnRadio);
function IsVersionAccepted(branch, version) {
    return true;
}
function GetRadioChannel(name, create) {
    let radioChannel = RadioChannels.find(x => x.Name == name);
    if (radioChannel == null && create) {
        radioChannel = new SaltyRadioChannel(name, []);
        RadioChannels.push(radioChannel);
    }
    return radioChannel;
}
function SetRadioSpeaker(player, toggle) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    voiceClient.RadioSpeaker = toggle;
}
mp.events.add("salty:setRadioSpeaker", SetRadioSpeaker);
function JoinRadioChannel(player, radioChannelName) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    RadioChannels.forEach(channel => {
        if (channel.IsMember(voiceClient))
            return;
    });
    GetRadioChannel(radioChannelName, true).AddMember(voiceClient);
    player.notify(`<C>Radio ~g~AN~w~~n~Channel: ${radioChannelName}</C>`);
}
mp.events.add("salty:joinRadioChannel", JoinRadioChannel);
function LeaveAllRadioChannels(player) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    RadioChannels.forEach(channel => {
        if (channel.IsMember(voiceClient))
            channel.RemoveMember(voiceClient);
    });
}
mp.events.add("salty:leaveAllRadioChannel", LeaveAllRadioChannels);
function LeaveRadioChannel(player, radioChannelName) {
    if (!(player.id in VoiceClients))
        return;
    let voiceClient = VoiceClients[player.id];
    let radioChannel = GetRadioChannel(radioChannelName, false);
    if (radioChannel == null)
        return;
    if (!radioChannel.IsMember(voiceClient))
        return;
    radioChannel.RemoveMember(voiceClient);
    player.notify(`<C>Radio ~r~AUS~w~~n~Channel: ${radioChannelName}</C>`);
}
mp.events.add("salty:leaveRadioChannel", LeaveRadioChannel);
function StartPhoneCall(player, targetPlayer) {
    player.call(SaltyEvent.SaltyChat_EstablishedCall, [targetPlayer.id]);
    targetPlayer.call(SaltyEvent.SaltyChat_EstablishedCall, [player.id]);
}
mp.events.add("salty:startPhoneCall", StartPhoneCall);
function EndCall(player, targetPlayer) {
    player.call(SaltyEvent.SaltyChat_EndCall, [targetPlayer.id]);
    targetPlayer.call(SaltyEvent.SaltyChat_EndCall, [player.id]);
}
mp.events.add("salty:endPhoneCall", EndCall);
function OnPlayerDeath(player) {
    player.call(SaltyEvent.SaltyChat_PlayerDied, [player.id]);
}
mp.events.add("salty:playerDeath", OnPlayerDeath);
function OnPlayerRevived(player) {
    player.call(SaltyEvent.SaltyChat_PlayerRevived, [player.id]);
}
mp.events.add("salty:playerRevived", OnPlayerRevived);
class SaltyRadioChannel {
    constructor(name, members) {
        this.Name = name;
        if (members == undefined)
            this.Members = [];
        else
            this.Members = members;
    }
    IsMember(voiceClient) {
        let same = false;
        this.Members.forEach(x => {
            if (x.VoiceClient.Player.id == voiceClient.Player.id) {
                same = true;
            }
        });
        return same;
    }
    AddMember(voiceClient) {
        if (this.IsMember(voiceClient))
            return;
        this.Members.push(new SaltyRadioChannelMember(this, voiceClient));
        voiceClient.Player.call(SaltyEvent.SaltyChat_SetRadioChannel, [this.Name]);
        this.Members.forEach(member => {
            if (member.IsSending) {
                voiceClient.Player.call(SaltyEvent.SaltyChat_IsSending, [member.VoiceClient.Player.id, true]);
            }
        });
    }
    RemoveMember(voiceClient) {
        let member = this.Members.find(x => x.VoiceClient == voiceClient);
        if (member == null)
            return;
        if (member.IsSending) {
            if (member.VoiceClient.RadioSpeaker) {
                Object.keys(VoiceClients).forEach(key => {
                    let client = VoiceClients[parseInt(key)];
                    client.Player.call(SaltyEvent.SaltyChat_IsSendingRelayed, [client.Player.id, false, true, false, "{}"]);
                });
            }
            else {
                this.Members.forEach(channelMember => {
                    channelMember.VoiceClient.Player.call(SaltyEvent.SaltyChat_IsSending, [voiceClient.Player.id, false]);
                });
            }
        }
        const index = this.Members.indexOf(member);
        if (index > -1) {
            this.Members.splice(index, 1);
        }
        voiceClient.Player.call(SaltyEvent.SaltyChat_SetRadioChannel, [""]);
        this.Members.forEach(channelMemnber => {
            if (channelMemnber.IsSending) {
                voiceClient.Player.call(SaltyEvent.SaltyChat_IsSending, [channelMemnber.VoiceClient.Player.id, false]);
            }
        });
    }
    Send(voiceClient, isSending) {
        if (!this.IsMember(voiceClient))
            return;
        let radioChannelMember = this.Members.find(x => x.VoiceClient == voiceClient);
        let stateChanged = radioChannelMember.IsSending != isSending;
        radioChannelMember.IsSending = isSending;
        let channelMembers = this.Members;
        let onSpeaker = [];
        let speakerNames = [];
        this.Members.forEach(member => {
            if (member.VoiceClient.RadioSpeaker && member.VoiceClient != voiceClient) {
                onSpeaker.push(member);
                speakerNames.push(member.VoiceClient.TeamSpeakName);
            }
        });
        if (onSpeaker.length > 0) {
            Object.keys(VoiceClients).forEach(key => {
                let remoteClient = VoiceClients[parseInt(key)];
                remoteClient.Player.call(SaltyEvent.SaltyChat_IsSendingRelayed, [voiceClient.Player.id, isSending, stateChanged, this.IsMember(remoteClient), JSON.stringify(speakerNames)]);
            });
        }
        else {
            channelMembers.forEach(member => {
                member.VoiceClient.Player.call(SaltyEvent.SaltyChat_IsSending, [voiceClient.Player.id, this.Name, isSending, stateChanged, voiceClient.Player.position]);
            });
        }
    }
}
class SaltyRadioChannelMember {
    constructor(radioChannel, voiceClient) {
        this.RadioChannel = radioChannel;
        this.VoiceClient = voiceClient;
    }
}
class SaltyVoiceClient {
    constructor(player, teamSpeakName, voiceRange) {
        this.Player = player;
        this.TeamSpeakName = teamSpeakName;
        this.VoiceRange = voiceRange;
    }
}
