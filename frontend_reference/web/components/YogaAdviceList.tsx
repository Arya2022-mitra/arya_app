import Card from './Card';

interface Item {
  name: string;
  tags: string[];
  sector_bias: string[];
  caution_notes: string[];
}
interface Props {
  items?: Item[];
}

export default function YogaAdviceList({ items = [] }: Props) {
  if (items.length === 0) {
    return <Card>No active wealth yogas</Card>;
  }
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <Card key={i.name}>
          <h4 className="font-semibold">{i.name}</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {i.tags.map((t) => (
              <span key={t} className="text-xs bg-gray-200 dark:bg-gray-700 rounded px-1">
                {t}
              </span>
            ))}
          </div>
          {i.sector_bias.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {i.sector_bias.map((s) => (
                <span key={s} className="text-xs border rounded px-1">
                  {s}
                </span>
              ))}
            </div>
          )}
          {i.caution_notes.length > 0 && (
            <ul className="mt-1 list-disc ml-4 text-sm">
              {i.caution_notes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
