const legacyAppUrl = `/legacy-app.html?v=${Date.now()}`;

export default function App() {
  return (
    <iframe
      title="Coupe AVEREO Reno Pro"
      src={legacyAppUrl}
      style={{
        width: '100%',
        height: '100vh',
        border: 0,
        display: 'block',
      }}
    />
  );
}
