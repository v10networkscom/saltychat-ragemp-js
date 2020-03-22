/// <reference types="@types/ragemp-s" />
/// <reference path="VoiceManager.ts" />

class SaltyRadioChannel {
    public Name: string;
    public Members: SaltyRadioChannelMember[];

    constructor(name: string, members: SaltyRadioChannelMember[]) {
        this.Name = name;
        if (members == undefined)
            this.Members = [];
        else
            this.Members = members;
    }

    IsMember(voiceClient: SaltyVoiceClient) {
        let same = false;
        this.Members.forEach(x => {
            if (x.VoiceClient.Player.id == voiceClient.Player.id) {
                same = true;
            }
        });
        return same;
    }

    AddMember(voiceClient: SaltyVoiceClient) {
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

    RemoveMember(voiceClient: SaltyVoiceClient) {
        let member = this.Members.find(x => x.VoiceClient == voiceClient);
        if (member == null)
            return;
        if (member.IsSending) {
            if (member.VoiceClient.RadioSpeaker) {
                Object.keys(VoiceClients).forEach(key => {
                    let client = VoiceClients[parseInt(key)];
                    client.Player.call(SaltyEvent.SaltyChat_IsSendingRelayed, [client.Player.id, false, true, false, "{}"]);
                });
            } else {
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

    Send(voiceClient: SaltyVoiceClient, isSending: boolean) {
        if (!this.IsMember(voiceClient))
            return;
        let radioChannelMember = this.Members.find(x => x.VoiceClient == voiceClient);

        let stateChanged = radioChannelMember.IsSending != isSending;
        radioChannelMember.IsSending = isSending;

        let channelMembers = this.Members;
        let onSpeaker: SaltyRadioChannelMember[] = [];
        let speakerNames: string[] = [];
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
        } else {
            channelMembers.forEach(member => {
                member.VoiceClient.Player.call(SaltyEvent.SaltyChat_IsSending, [voiceClient.Player.id, this.Name, isSending, stateChanged, voiceClient.Player.position]);
            });
        }


    }
}

class SaltyRadioChannelMember {
    RadioChannel: SaltyRadioChannel;
    VoiceClient: SaltyVoiceClient;
    IsSending: boolean;

    constructor(radioChannel: SaltyRadioChannel, voiceClient: SaltyVoiceClient) {
        this.RadioChannel = radioChannel;
        this.VoiceClient = voiceClient;
    }
}