export interface HostSettings {
  allowGuestControl: boolean;
  guestQueueLimit: number;
  enableScoring: boolean;
  allowDuplicates: boolean;
  autoplayNext: boolean;
  roomOpen: boolean;
  cheering: boolean;
  phoneMicToSpeaker: boolean;
  hearVoice: boolean;
  tvRemoteMode: boolean;
  showLyrics: boolean;
}

export const DEFAULT_SETTINGS: HostSettings = {
  allowGuestControl: true,
  guestQueueLimit: 10,
  enableScoring: true,
  allowDuplicates: true,
  autoplayNext: true,
  roomOpen: false,
  cheering: true,
  phoneMicToSpeaker: true,
  hearVoice: false,
  tvRemoteMode: false,
  showLyrics: true,
};