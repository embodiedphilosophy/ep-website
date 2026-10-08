'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const post = async body => {
  const res = await fetch('/api/ops/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const j = await res?.json().catch(() => ({}));
  return res?.ok ? j : { error: j?.error || 'Couldn’t save. Try again.' };
};

// Events page: add an event to the schedule (it shows up everywhere once saved)
export function AddEvent({ tracks }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ date: '', track: '', name: '', time: '', teachers: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  if (!open) return <button className="chip" onClick={() => setOpen(true)}>+ Add event</button>;
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    const j = await post({ action: 'add', ...f });
    setBusy(false);
    if (j.error) return setErr(j.error);
    router.push(`/ops/events?all=1&event=${j.key}`); router.refresh(); setOpen(false);
  };
  return (
    <form className="ops-edit ops-add" onSubmit={save}>
      <p className="ops-edit-title">New event</p>
      <div className="row"><label htmlFor="a-date">Date</label><input id="a-date" type="date" value={f.date} onChange={set('date')} required /></div>
      <div className="row"><label htmlFor="a-track">Track</label>
        <select id="a-track" value={f.track} onChange={set('track')} required><option value="">Choose…</option>{tracks.map(t => <option key={t}>{t}</option>)}</select></div>
      <div className="row"><label htmlFor="a-name">Name</label><input id="a-name" value={f.name} onChange={set('name')} placeholder="e.g. Living Room Lecture: Rasa" required /></div>
      <div className="row"><label htmlFor="a-time">Time</label><input id="a-time" value={f.time} onChange={set('time')} placeholder="e.g. 7pm ET (blank: track default)" /></div>
      <div className="row"><label htmlFor="a-teachers">Teachers</label><input id="a-teachers" value={f.teachers} onChange={set('teachers')} placeholder="Names, comma-separated" /></div>
      <div className="bar">
        <button className="chip primary" disabled={busy}>{busy ? 'Adding…' : 'Add to the schedule'}</button>
        <button type="button" className="chip" onClick={() => setOpen(false)}>Cancel</button>
        {err && <span className="hint">{err}</span>}
      </div>
    </form>
  );
}

const nice = d => d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';

// Drawer (inside Edit details): move one session to a new date, or cancel it
export function SessionActions({ id, date }) {
  const router = useRouter();
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async (body, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true); setMsg('');
    const j = await post(body);
    setBusy(false); setMsg(j.error || j.message);
    if (!j.error) {
      if (body.action === 'cancel') router.push('/ops/events?show=cancelled');
      else if (j.key) router.push(`/ops/events?all=1&event=${j.key}`);
      router.refresh();
    }
  };
  return (
    <fieldset className="ops-sess-acts">
      <legend>Move or cancel</legend>
      <div className="row"><label htmlFor="m-date">Move to</label>
        <div className="inline">
          <input id="m-date" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <button type="button" className="chip" disabled={busy || !to || to === date} onClick={() => run({ action: 'move', id, date: to }, `Move this session from ${date} to ${to}? Its open tasks move too.`)}>Move</button>
        </div>
        <span className="hint">{to && to === date ? `This session is already on ${nice(date)}. Pick a different date to move it.` : `Now on ${nice(date)}.`}</span>
      </div>
      <div className="row"><span />
        <button type="button" className="chip danger" disabled={busy} onClick={() => run({ action: 'cancel', id }, 'Cancel this session? It comes off the website, reminders and the newsletter, and its open tasks are closed. You can restore it from Events → Cancelled.')}>Cancel this session</button>
      </div>
      {msg && <p className="hint">{msg}</p>}
    </fieldset>
  );
}

// Events → Cancelled: bring one back
export function Restore({ id }) {
  const router = useRouter();
  const [state, setState] = useState('');
  return state === 'done' ? <span className="hint">Restored</span> : (
    <button className="chip" disabled={state === 'busy'} onClick={async () => { setState('busy'); const j = await post({ action: 'restore', id }); setState(j.error ? '' : 'done'); if (j.error) alert(j.error); else router.refresh(); }}>Restore</button>
  );
}
