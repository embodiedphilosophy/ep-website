export default async function SignIn({ searchParams }) {
  const { why } = await searchParams;
  return (
    <main className="sch-center">
      <script dangerouslySetInnerHTML={{ __html: "if (window.parent !== window) { document.documentElement.classList.add('sch-reconnect'); window.parent.postMessage({ ep: 'need-signin' }, 'https://ss.embodiedphilosophy.com'); }" }} />
      {/* Inside Circle the loader reconnects by itself, so members see "Reconnecting" first; the help text only appears if that
          has not worked after a few seconds. */}
      <style>{`.sch-wait{display:none}.sch-reconnect .sch-wait{display:block;text-align:center;animation:schHide 0s 8s both}.sch-reconnect .sch-help{animation:schShow 0s 8s both}@keyframes schHide{to{visibility:hidden;height:0;margin:0;overflow:hidden}}@keyframes schShow{from{visibility:hidden;height:0;overflow:hidden}to{visibility:visible}}`}</style>
      <p className="sch-wait" role="status">Reconnecting to Circle…</p>
      <div className="sch-help">
      <p className="sch-eyebrow">Sādhana School</p>
      <h1>Open your season from Circle</h1>
      <p>Your season pages use your Circle sign-in. Open Sādhana School in Circle and choose your season from the sidebar. If you are already there and still see this, sign out of Circle and back in, then try again.</p>
      {why && <p className="sch-err" role="alert">Circle said: {String(why).slice(0, 120)}</p>}
      <a className="sch-btn" href="https://ss.embodiedphilosophy.com" target="_top">Go to Circle</a>
      </div>
    </main>
  );
}
