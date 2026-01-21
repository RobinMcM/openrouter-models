export function ModelsShowcasePage() {
  return (
    <div className="models-showcase-page">
      <iframe
        src="http://134.209.184.66:8000/models-showcase"
        title="Models Showcase"
        style={{
          width: '100%',
          height: 'calc(100vh - 200px)',
          border: 'none',
          borderRadius: '8px',
        }}
      />
    </div>
  );
}
