'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { admin } from '@/content/th/admin';

import styles from './admin.module.css';
import { send } from './send';

export interface EventValues {
  festival: string;
  name: string;
  start: string;
  end: string;
  time: string;
  place: string;
}

/** One booth's dates, time and place (BRIEF §11). Separate from which booth is live. */
function EventForm({ event }: { event: EventValues }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMessage({ text: admin.events.saving });
    const r = await send(`/api/admin/events/${event.festival}`, 'PUT', {
      start: String(f.get('start') ?? ''),
      end: String(f.get('end') ?? ''),
      time: String(f.get('time') ?? ''),
      place: String(f.get('place') ?? ''),
    });
    setBusy(false);
    if (r.ok) {
      setMessage({ text: r.data?.singleDay ? `${admin.events.saved} · ${admin.events.single}` : admin.events.saved });
      router.refresh();
    } else {
      setMessage({ text: admin.events.failed, bad: true });
    }
  }

  const id = `ev-${event.festival}`;
  return (
    <form className={styles.event} onSubmit={submit} aria-labelledby={`${id}-name`}>
      <div className={styles.eventName} id={`${id}-name`}>
        {event.name}
      </div>
      <div className={styles.eventFields}>
        <label className={styles.field}>
          {admin.events.start}
          <input className={styles.input} type="date" name="start" defaultValue={event.start} required />
        </label>
        <label className={styles.field}>
          {admin.events.end}
          <input className={styles.input} type="date" name="end" defaultValue={event.end} required />
        </label>
        <label className={styles.field}>
          {admin.events.time}
          <input className={styles.input} name="time" defaultValue={event.time} maxLength={60} />
        </label>
        <label className={styles.field}>
          {admin.events.place}
          <input className={styles.input} name="place" defaultValue={event.place} maxLength={60} />
        </label>
        <button className={styles.button} type="submit" disabled={busy}>
          {admin.events.save}
        </button>
      </div>
      <p className={`${styles.msg} ${message?.bad ? styles.bad : styles.ok}`} role="status" style={{ margin: 0 }}>
        {message?.text}
      </p>
    </form>
  );
}

export function EventForms({ events }: { events: EventValues[] }) {
  return (
    <section className={styles.card} aria-labelledby="events-h">
      <h2 id="events-h">{admin.events.heading}</h2>
      <p className={styles.hint}>{admin.events.hint}</p>
      <div className={styles.eventList}>
        {events.map((e) => (
          <EventForm key={e.festival} event={e} />
        ))}
      </div>
    </section>
  );
}
