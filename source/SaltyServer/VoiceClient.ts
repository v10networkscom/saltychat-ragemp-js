/// <reference types="@types/ragemp-s" />

class SaltyVoiceClient {
    Player: PlayerMp;
    TeamSpeakName: string;
    VoiceRange: number;
    PhoneSpeaker: boolean;
    RadioSpeaker: boolean;

    constructor(player: PlayerMp, teamSpeakName: string, voiceRange: number) {
        this.Player = player;
        this.TeamSpeakName = teamSpeakName;
        this.VoiceRange = voiceRange;
    }
}