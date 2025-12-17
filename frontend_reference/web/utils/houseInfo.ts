export interface HouseInfo {
  name: string;
  desc: string;
}

export const houseInfo: Record<number, HouseInfo> = {
  1: { name: 'Tanu', desc: 'body, identity, vitality, outlook' },
  2: { name: 'Dhana', desc: 'money, assets, speech, values, family' },
  3: { name: 'Sahaja', desc: 'siblings, courage, effort, skills, short trips' },
  4: { name: 'Sukha', desc: 'home, mother, property, emotional comfort' },
  5: { name: 'Putra', desc: 'children, creativity, studies, romance, merit' },
  6: { name: 'Roga', desc: 'illness, debts, rivals, service, daily grind' },
  7: { name: 'Yuvati', desc: 'spouse/partners, contracts, public dealings' },
  8: { name: 'Randhra', desc: 'longevity, crises, inheritance, occult, rebirth' },
  9: { name: 'Dharma', desc: 'luck, dharma, higher learning, father/guru, ethics' },
  10: { name: 'Karma', desc: 'work, status, authority, reputation, actions' },
  11: { name: 'Labha', desc: 'income, gains, networks, aspirations, fulfillment' },
  12: { name: 'Vyaya', desc: 'expenses, losses, isolation, retreats, foreign, moksha' },
};

