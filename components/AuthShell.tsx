export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-art">
        <div className="logo">🧳 Trip Vault</div>
        <h1>Every ticket, booking and memory — in one place.</h1>
        <ul><li>📁 Keep tickets, hotels and IDs together</li><li>✅ Tick off your itinerary day by day</li><li>✨ Let AI draft or fix your plan</li><li>📸 Save photos in a memory album</li></ul>
      </div>
      <div className="auth-form">{children}</div>
    </div>
  );
}
