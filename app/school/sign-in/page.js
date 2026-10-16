export default async function SignIn({ searchParams }) {
  const { why } = await searchParams;
  return (
    <main className="sch-center">
      <p className="sch-eyebrow">Sādhana School</p>
      <h1>Open your season from Circle</h1>
      <p>Your season pages use your Circle sign-in. Open Sādhana School in Circle and choose your season from the sidebar. If you are already there and still see this, sign out of Circle and back in, then try again.</p>
      {why && <p className="sch-err" role="alert">Circle said: {String(why).slice(0, 120)}</p>}
      <a className="sch-btn" href="https://ss.embodiedphilosophy.com">Go to Circle</a>
    </main>
  );
}
