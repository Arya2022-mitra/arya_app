import Card from './Card';
import StrengthBadge from './StrengthBadge';
import DomainChip from './DomainChip';

interface Labels {
  why?: string;
  gives?: string;
  watch?: string;
  nowNext?: string;
}

interface Props {
  name: string;
  strength: string;
  why: string;
  gives: string;
  watch: string;
  domains: string[];
  nowNext?: string;
  labels?: Labels;
}

export default function InsightCard({
  name,
  strength,
  why,
  gives,
  watch,
  domains,
  nowNext,
  labels = {},
}: Props) {
  const {
    why: whyLabel = 'Why it exists',
    gives: givesLabel = 'What it gives',
    watch: watchLabel = 'What to watch',
    nowNext: nowNextLabel = 'Now & Next',
  } = labels;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-rajdhani text-lg">{name}</h3>
        <StrengthBadge>{strength}</StrengthBadge>
      </div>
      <div>
        <h4 className="font-rajdhani text-sm text-accent mb-1">{whyLabel}</h4>
        <p className="text-sm">{why}</p>
      </div>
      <div>
        <h4 className="font-rajdhani text-sm text-accent mb-1">{givesLabel}</h4>
        <p className="text-sm">{gives}</p>
      </div>
      <div>
        <h4 className="font-rajdhani text-sm text-accent mb-1">{watchLabel}</h4>
        <p className="text-sm">{watch}</p>
      </div>
      {domains.length > 0 && (
        <div className="flex flex-wrap">
          {domains.map((d) => (
            <DomainChip key={d}>{d}</DomainChip>
          ))}
        </div>
      )}
      {nowNext && (
        <div>
          <h4 className="font-rajdhani text-sm text-accent mb-1">{nowNextLabel}</h4>
          <p className="text-sm">{nowNext}</p>
        </div>
      )}
    </Card>
  );
}
