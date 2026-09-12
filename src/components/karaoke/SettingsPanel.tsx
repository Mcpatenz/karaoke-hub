"use client";

import { DEFAULT_SETTINGS, type HostSettings } from "@/lib/roomSettings";

export { DEFAULT_SETTINGS, type HostSettings };

interface SettingsPanelProps {
  settings: HostSettings;
  onChange: (settings: HostSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const update = (patch: Partial<HostSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <h2 className="text-base font-semibold text-white">Host Settings</h2>
        <p className="mt-0.5 text-xs text-text-tertiary">Control how guests join and play</p>
      </div>

      <section aria-label="Guest controls">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
          Guest Controls
        </p>
        <ToggleRow
          label="Allow guests to control their own playback"
          description="Guests can play, pause and skip their own queue"
          checked={settings.allowGuestControl}
          onChange={(v) => update({ allowGuestControl: v })}
        />
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0 pr-2">
            <p className="text-sm font-medium text-white">Queue Limit / Guest</p>
            <p className="mt-0.5 text-xs text-text-tertiary">Max songs one guest can have queued</p>
          </div>
          <select
            aria-label="Guest queue limit"
            value={settings.guestQueueLimit}
            onChange={(e) => update({ guestQueueLimit: Number(e.target.value) })}
            className="h-11 rounded-[var(--radius-xs)] border border-border-default bg-[#181818] px-3 text-sm font-medium text-white transition-colors hover:border-gray-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {[1, 2, 3, 5, 10, 0].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "∞" : n}
              </option>
            ))}
          </select>
        </div>
        <ToggleRow
          label="Enable Karaoke Scoring"
          description="Score each singer's mic performance and show results after their song ends"
          checked={settings.enableScoring}
          onChange={(v) => update({ enableScoring: v })}
        />
        <ToggleRow
          label="Allow Duplicates"
          description="Let guests re-add songs from queue or history"
          checked={settings.allowDuplicates}
          onChange={(v) => update({ allowDuplicates: v })}
        />
        <ToggleRow
          label="Auto-Play Next"
          description="Automatically start next song when current ends"
          checked={settings.autoplayNext}
          onChange={(v) => update({ autoplayNext: v })}
        />
        <ToggleRow
          label="Room Locker"
          description={
            settings.roomOpen
              ? "Room is open — anyone with the code can join"
              : "Room is locked — new guests must be approved by the host"
          }
          checked={settings.roomOpen}
          onChange={(v) => update({ roomOpen: v })}
        />
        <ToggleRow
          label="Cheering"
          description="Let guests send animated emoji cheers onto this screen"
          checked={settings.cheering}
          onChange={(v) => update({ cheering: v })}
        />
        <ToggleRow
          label="Phone Mic to Main Speaker"
          description="Stream the current singer's phone mic live to this device's speakers"
          checked={settings.phoneMicToSpeaker}
          onChange={(v) => update({ phoneMicToSpeaker: v })}
        />
        <ToggleRow
          label="Hear Voice"
          description="Allow the room to hear the singer's microphone audio"
          checked={settings.hearVoice}
          onChange={(v) => update({ hearVoice: v })}
        />
        <ToggleRow
          label="TV Remote Mode"
          description="Bigger focus highlights and D-pad navigation — turn on when casting to a TV"
          checked={settings.tvRemoteMode}
          onChange={(v) => update({ tvRemoteMode: v })}
        />
      </section>

      <section aria-label="Current rules" className="border-t border-border-default pt-3">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
          Current Rules
        </p>
        <div className="mt-2 flex flex-col divide-y divide-border-default rounded-[var(--radius-sm)] border border-border-default bg-surface-strong/40">
          <SummaryRow label="Guest controls" value={onOff(settings.allowGuestControl)} />
          <SummaryRow label="Queue limit" value={`${settings.guestQueueLimit || "∞"} per guest`} />
          <SummaryRow label="Scoring" value={onOff(settings.enableScoring)} />
          <SummaryRow label="Duplicates" value={settings.allowDuplicates ? "Allowed" : "Blocked"} />
          <SummaryRow label="Auto-play" value={onOff(settings.autoplayNext)} />
          <SummaryRow label="Room" value={settings.roomOpen ? "Open" : "Locked"} />
          <SummaryRow label="Hear voice" value={onOff(settings.hearVoice)} />
          <SummaryRow label="Cheering" value={onOff(settings.cheering)} />
          <SummaryRow
            label="Phone mic to speaker"
            value={onOff(settings.phoneMicToSpeaker)}
            last
          />
        </div>
      </section>
    </div>
  );
}

function onOff(value: boolean): string {
  return value ? "ON" : "OFF";
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 ${
        last ? "py-2.5" : "border-b border-border-default py-2.5"
      }`}
    >
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 pr-2">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        style={{ backgroundColor: checked ? "var(--color-accent)" : "var(--color-surface-strong)" }}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
