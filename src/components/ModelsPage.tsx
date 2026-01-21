export function ModelsPage() {
  return (
    <div className="models-page">
      <iframe
        src="http://134.209.184.66:8000/models"
        title="OpenRouter Models"
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
