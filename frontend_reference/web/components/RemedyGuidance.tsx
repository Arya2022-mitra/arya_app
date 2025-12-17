import Card from '@/components/Card';

export default function RemedyGuidance({
  prediction: rawPrediction,
}: {
  prediction: any | null;
}) {
  const prediction = (rawPrediction as any)?.data ?? rawPrediction ?? null;
  if (!prediction) {
    return (
      <Card className="breathing-border">
        <p className="text-center">No remedies available.</p>
      </Card>
    );
  }

  const remedyList = Array.isArray(prediction.remedy_list)
    ? prediction.remedy_list.join(', ')
    : prediction.remedy_list;

  return (
    <Card className="breathing-border space-y-2 text-white">
      <h2 className="text-xl font-bold text-center text-accent">🙏 Remedy Guidance</h2>
      <div className="text-sm space-y-1">
        {remedyList && <p><strong>Remedies:</strong> {remedyList}</p>}
        {prediction.temple_visit && (
          <p><strong>Temple Visit:</strong> {prediction.temple_visit}</p>
        )}
        {prediction.lucky_number && (
          <p><strong>Lucky Number:</strong> {prediction.lucky_number}</p>
        )}
      </div>
    </Card>
  );
}
