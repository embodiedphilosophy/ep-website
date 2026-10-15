'use client';

// Opens Ether (the chat bubble from ep-support-agent's widget.js); falls back to the Help Centre
export default function AskEther({ className = 'btn btn-ghost', children = 'Ask Ether a question' }) {
  function open() {
    const btn = document.getElementById('ep-chat')?.shadowRoot?.querySelector('.btn');
    if (btn) btn.click();
    else window.location.href = '/help';
  }
  return <button type="button" className={className} onClick={open}>{children}</button>;
}
