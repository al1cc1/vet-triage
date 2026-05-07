export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 20,
    }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>🐾 VetTriage</div>
      <span style={{
        width: 40, height: 40,
        border: '4px solid var(--accent-light)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
