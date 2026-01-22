export function ModelsShowcasePage() {
  return (
    <div className="models-showcase-page">
      <iframe
        src="https://usageflows.info/models-showcase"
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
