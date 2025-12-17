import Card from '@/components/Card';

export default function TransitHighlights({
  prediction: rawPrediction,
}: {
  prediction: any | null;
}) {
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  if (!prediction) {
    return (
      <Card className="breathing-border">
        <p className="text-center">No transit data.</p>
      </Card>
    );
  }

  return (
    <Card className="breathing-border space-y-2 text-white">
      <h2 className="text-xl font-bold text-center text-accent">🚀 Transit Highlights</h2>
      <p className="text-sm whitespace-pre-wrap">
        {prediction.gochar || prediction.transit || '—'}
      </p>
    </Card>
  );
}
