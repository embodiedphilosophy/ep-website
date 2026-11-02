'use client';
import { useEffect, useState } from 'react';

// Study pods on the Sādhana School dashboard: student-led study groups. Anyone with Sādhana School (a season or the full year) can join one;
// approved leaders open them; a pod begins at 4 people (the leader included) and holds up to 10. Rules: lib/pods/logic.js.
const post = body => fetch('/api/school/pods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export default function Pods() {
  const [data, setData] = useState(null);   // { pods, leader: { status }, min, max, liveRoomsUrl } | { error }
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);     // { ok } | { error }
  const [form, setForm] = useState(null);   // 'apply' | 'create' | null
  const [f, setF] = useState({ note: '', topic: '', description: '', schedule: '' });

  const load = async () => {
    const res = await fetch('/api/school/pods').catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setData(res?.ok ? j : { error: j?.error || 'We couldn’t load the study pods. Please try again in a moment.' });
  };
  useEffect(() => { load(); }, []);

  const act = async (key, body, ok) => {
    setBusy(key); setMsg(null);
    const res = await post(body).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy('');
    if (!res?.ok) { setMsg({ error: j?.error || 'Something went wrong. Please try again.' }); return false; }
    setData(j); setMsg({ ok: typeof ok === 'function' ? ok(j) : ok }); return true;
  };
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }));

  if (!data) return <p className="sch-empty">Loading the study pods…</p>;
  if (data.error) return <p className="sch-empty">{data.error}</p>;
  const mine = data.pods.filter(p => p.mine), others = data.pods.filter(p => !p.mine);
  const status = data.leader.status;

  return (
    <section aria-label="Study pods">
      <p className="sch-meta" style={{ margin: '0 0 16px', maxWidth: '62ch' }}>
        Study pods are small groups of students who study something together. Anyone in the school can join one. When {data.min} people have joined (the leader counts), a small group chat opens for the pod, and the group arranges its own meetings in Circle’s live rooms.
      </p>
      {msg?.error && <p className="sch-err" role="alert">{msg.error}</p>}
      {msg?.ok && <p className="sch-ok" role="status">{msg.ok}</p>}

      <div className="sch-composer" style={{ marginBottom: 18 }}>
        {status === 'approved' ? (<>
          <strong>You are a pod leader</strong>
          {form === 'create' ? (<>
            <label htmlFor="pod-topic">Topic</label>
            <input id="pod-topic" value={f.topic} maxLength={80} onChange={set('topic')} placeholder="e.g. Reading the Śiva Sūtras together" />
            <label htmlFor="pod-desc">What will the pod study?</label>
            <textarea id="pod-desc" rows={4} maxLength={1000} value={f.description} onChange={set('description')} placeholder="A sentence or two: what you will read or practise, and how you imagine the group working." />
            <label htmlFor="pod-sched">Rough schedule (optional)</label>
            <input id="pod-sched" value={f.schedule} maxLength={200} onChange={set('schedule')} placeholder="e.g. Thursdays, 7pm UK, every week" />
            <div className="sch-composer-row">
              <button type="button" className="sch-btn" disabled={busy === 'create'} onClick={async () => { if (await act('create', { action: 'create', topic: f.topic, description: f.description, schedule: f.schedule }, data.autoRooms ? 'Your pod is open, with its own meeting room. Students can join it now.' : 'Your pod is open. Next, make its live room (the steps are on your pod). Students can join it now.')) { setForm(null); setF({ note: '', topic: '', description: '', schedule: '' }); } }}>{busy === 'create' ? 'Opening…' : 'Open the pod'}</button>
              <button type="button" className="sch-btn ghost" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </>) : <div><button type="button" className="sch-btn" onClick={() => { setForm('create'); setMsg(null); }}>Start a study pod</button></div>}
        </>) : status === 'applied' ? (
          <><strong>Your request to lead a pod is with us</strong><span className="sch-meta">We will let you know here once it has been looked at.</span></>
        ) : form === 'apply' ? (<>
          <strong>Lead a study pod</strong>
          <label htmlFor="pod-note">Tell us a little about why, and what you might like to lead</label>
          <textarea id="pod-note" rows={4} maxLength={800} value={f.note} onChange={set('note')} placeholder="Your experience with study groups, and a topic or two you have in mind." />
          <div className="sch-composer-row">
            <button type="button" className="sch-btn" disabled={busy === 'apply'} onClick={async () => { if (await act('apply', { action: 'apply', note: f.note }, 'Thank you. Your request has gone to the team.')) setForm(null); }}>{busy === 'apply' ? 'Sending…' : 'Send my request'}</button>
            <button type="button" className="sch-btn ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </>) : (<>
          <strong>{status === 'declined' ? 'Leading a pod' : 'Would you like to lead a pod?'}</strong>
          <span className="sch-meta">{status === 'declined' ? 'Your last request was not taken up this time. You are welcome to ask again.' : 'Students who lead a pod open a topic for the whole school. A member of the team approves each leader first.'}</span>
          <div><button type="button" className="sch-btn ghost" onClick={() => { setForm('apply'); setMsg(null); }}>{status === 'declined' ? 'Ask again' : 'Ask to lead a pod'}</button></div>
        </>)}
      </div>

      {mine.length > 0 && (<>
        <h2 className="sch-sub">Your pods</h2>
        <ul className="sch-list" style={{ marginBottom: 22 }}>{mine.map(p => <PodCard key={p.id} p={p} data={data} busy={busy} act={act} />)}</ul>
      </>)}
      <h2 className="sch-sub">{mine.length ? 'Other pods you can join' : 'Pods you can join'}</h2>
      {others.length === 0 ? <p className="sch-empty">No pods are open yet. Be the first to start one, or check back soon.</p>
        : <ul className="sch-list">{others.map(p => <PodCard key={p.id} p={p} data={data} busy={busy} act={act} />)}</ul>}
    </section>
  );
}

// The leader pastes the pod's meeting link here (a Google Meet or Zoom link; Circle live rooms can only be opened by staff), so members can join the calls from their pod
function RoomLink({ p, data, act, busy }) {
  const [v, setV] = useState(p.roomUrl || '');
  return (
    <div style={{ marginTop: 14 }}>
      <label className="sch-meta" htmlFor={`room-${p.id}`}><strong>{p.roomUrl ? 'Your pod’s live room' : 'Where will your pod meet?'}</strong></label>
      {p.roomUrl && data.autoRooms && <p className="sch-meta" style={{ margin: '4px 0 0', maxWidth: '62ch' }}>Your pod has its own Google Meet room. Anyone in the pod can open it any time, every week, from the “Join the pod’s live room” button.</p>}
      {!p.roomUrl && data.autoRooms && (
        <p style={{ margin: '6px 0 0' }}><button type="button" className="sch-btn" disabled={!!busy} onClick={() => act('autoroom' + p.id, { action: 'autoroom', id: p.id }, 'Your pod’s meeting room is ready. Your members now see a “Join the pod’s live room” button.')}>{busy === 'autoroom' + p.id ? 'Making it…' : 'Make our meeting room'}</button></p>
      )}
      <details open={!p.roomUrl && !data.autoRooms} style={{ margin: '6px 0 8px' }}>
        <summary className="sch-meta" style={{ cursor: 'pointer' }}>{data.autoRooms ? 'Or use a link of your own' : 'How to set up your pod’s meeting room'}</summary>
        <ol className="sch-meta" style={{ margin: '6px 0 0', paddingLeft: 20, display: 'grid', gap: 4, maxWidth: '62ch' }}>
          <li>Make a video meeting link you can use every week. The easiest way: go to <a href="https://meet.google.com" target="_blank" rel="noopener">meet.google.com</a>, choose “New meeting”, then “Create a meeting for later”, and copy the link. A Zoom link works too.</li>
          <li>Paste the link in the box below and press Save. Your members then see a “Join the pod’s live room” button on their pod.</li>
          <li>Tell your members the day and time in the pod chat, and use the same link each week.</li>
        </ol>
        <p className="sch-meta" style={{ margin: '6px 0 0', maxWidth: '62ch' }}>Would you rather meet in a Circle live room? Only staff can open those, so message Floss in Circle and she will set one up for your pod and add its link here.</p>
      </details>
      <div className="sch-composer-row"><input id={`room-${p.id}`} value={v} onChange={e => setV(e.target.value)} placeholder="Paste the meeting link here (https://…)" />
        <button type="button" className="sch-btn ghost" disabled={!!busy} onClick={() => act('room' + p.id, { action: 'room', id: p.id, url: v }, v ? 'Saved. Your members can now join the live room.' : 'The live room link was removed.')}>Save</button></div>
    </div>
  );
}

// Joining opens a small box to write to the leader (optional). The note goes to the leader as a Circle message and shows on their pod.
function joinedText(r, leader) {
  const begun = r.started ? ' The pod has begun, and its group chat is on the way.' : '';
  if (!r.noted) return `You are in this pod.${begun}`;
  return (r.messaged ? `You are in, and your message has gone to ${leader} in your Circle messages.` : `You are in. ${leader} will see your note on the pod.`) + begun;
}

function PodCard({ p, data, busy, act }) {
  const [joining, setJoining] = useState(false);
  const [note, setNote] = useState('');
  const first = String(p.leader || '').split(' ')[0] || 'the leader';
  const progress = p.started ? `${p.count} of ${data.max} places taken · this pod has begun` : `${p.count} of ${data.min} to begin · ${p.needs} more needed`;
  return (
    <li className="sch-card hub sch-pod">
      <div className="sch-card-main">
        <h2>{p.topic}{p.started && <span className="sch-tag">Begun</span>}</h2>
        <p className="sch-meta">Led by {p.leader}{p.schedule ? ` · ${p.schedule}` : ''}</p>
        <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{p.description}</p>
        <p className="sch-meta" aria-label="Progress">{progress}</p>
        {p.mine && p.names.length > 0 && <p className="sch-meta">In this pod: {p.names.join(', ')}</p>}
        {p.mine && p.started && (p.chatUrl
          ? <p style={{ margin: '10px 0 0' }}><a className="sch-btn" href={p.chatUrl} target="_top">Open the pod chat</a></p>
          : <p className="sch-meta" style={{ marginTop: 8 }}>Your pod has begun. Its group chat is being set up and its link will appear here soon.</p>)}
        {p.mine && (p.roomUrl || data.liveRoomsUrl) && <p style={{ margin: '10px 0 0' }}><a className="sch-btn ghost" href={p.roomUrl || data.liveRoomsUrl} target="_top">{p.roomUrl ? 'Join the pod’s live room' : 'Circle live rooms'}</a></p>}
        {p.canSetRoom && <RoomLink p={p} data={data} act={act} busy={busy} />}
        {p.mine && !p.started && <p className="sch-meta" style={{ marginTop: 8 }}>You are in. The group chat opens as soon as {p.needs} more {p.needs === 1 ? 'person joins' : 'people join'}.</p>}
        {p.isLeader && p.notes?.length > 0 && (<>
          <p className="sch-meta" style={{ margin: '12px 0 0' }}><strong>Notes from people who joined</strong></p>
          <ul className="sch-pod-notes">{p.notes.map((n, i) => <li key={i}><b>{n.name}</b>{n.note}</li>)}</ul>
        </>)}
        {joining && (
          <div className="sch-pod-join">
            <label htmlFor={`join-${p.id}`}>Send {first} a message (optional)</label>
            <textarea id={`join-${p.id}`} rows={3} maxLength={600} value={note} onChange={e => setNote(e.target.value)} placeholder={`Say hello, and a word about what draws you to this pod. ${first} gets it in Circle messages.`} />
            <div className="sch-composer-row">
              <button type="button" className="sch-btn" disabled={!!busy} onClick={async () => { if (await act('join' + p.id, { action: 'join', id: p.id, message: note }, r => joinedText(r, first))) { setJoining(false); setNote(''); } }}>{busy === 'join' + p.id ? 'Joining…' : note.trim() ? 'Join and send' : 'Join the pod'}</button>
              <button type="button" className="sch-btn ghost" onClick={() => { setJoining(false); setNote(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <div>
        {p.canJoin && !joining && <button type="button" className="sch-btn" disabled={!!busy} onClick={() => setJoining(true)}>Join this pod</button>}
        {!p.mine && !p.canJoin && <span className="sch-meta">Full</span>}
        {p.canLeave && <button type="button" className="sch-btn ghost" disabled={!!busy} onClick={() => confirm('Leave this pod?') && act('leave' + p.id, { action: 'leave', id: p.id }, 'You have left the pod.')}>Leave</button>}
        {p.canCancel && <button type="button" className="sch-btn ghost" disabled={!!busy} onClick={() => confirm('Cancel this pod? Everyone who joined will no longer see it.') && act('cancel' + p.id, { action: 'cancel', id: p.id }, 'The pod has been cancelled.')}>Cancel the pod</button>}
      </div>
    </li>
  );
}
