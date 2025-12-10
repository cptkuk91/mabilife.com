export type RuneGrade = 'mythic' | 'legendary' | 'epic' | 'normal';
export type RuneSlot = '무기' | '방어구' | '장신구' | '엠블럼' | '보석';

export interface Rune {
  id: string; // Unique identifier (can be the name for simplicity if unique)
  name: string;
  slot: RuneSlot;
  effect: string;
  grade: RuneGrade;
}

export const RUNE_DATABASE: Record<string, Rune> = {
  // --- Weapon Runes (Mythic) ---
  "man-gal-rae": { id: "man-gal-rae", slot: "무기", name: "만 갈래 물길", effect: "공격 시 물줄기가 갈라져 주변 적들에게 추가 피해를 입힙니다.", grade: 'mythic' },
  "crumbling-light": { id: "crumbling-light", slot: "무기", name: "바스러지는 빛", effect: "치명타 적중 시 빛의 파편이 폭발하여 실명 효과를 부여합니다.", grade: 'mythic' },
  "nameless-chaos": { id: "nameless-chaos", slot: "무기", name: "이름 없는 혼돈", effect: "스킬 사용 시 일정 확률로 무작위 상태이상을 겁니다.", grade: 'mythic' },
  "echoing-wrath": { id: "echoing-wrath", slot: "무기", name: "메아리치는 진노", effect: "피격 시 받은 피해의 일부를 적에게 되돌려줍니다.", grade: 'mythic' },
  "flame": { id: "flame", slot: "무기", name: "불길", effect: "공격 시 10% 확률로 화염 지대를 생성합니다.", grade: 'mythic' },
  "fighter-plus": { id: "fighter-plus", slot: "무기", name: "투사+", effect: "보스 몬스터와의 전투에서 공격력이 15% 증가합니다.", grade: 'mythic' },
  "crystal": { id: "crystal", slot: "무기", name: "결정", effect: "스킬 쿨타임이 5% 감소하고 마나 회복량이 증가합니다.", grade: 'mythic' },

  // --- Weapon Runes (Legendary) ---
  "thunder": { id: "thunder", slot: "무기", name: "뇌명", effect: "공격 시 일정 확률로 번개가 떨어져 기절시킵니다.", grade: 'legendary' },
  "viper-plus": { id: "viper-plus", slot: "무기", name: "독사+", effect: "중독 상태의 적에게 가하는 피해가 20% 증가합니다.", grade: 'legendary' },
  "beast-plus": { id: "beast-plus", slot: "무기", name: "야수+", effect: "생명력이 30% 이하일 때 공격 속도가 대폭 증가합니다.", grade: 'legendary' },
  "hero": { id: "hero", slot: "무기", name: "영웅", effect: "파티원 한 명당 자신의 모든 능력치가 1% 증가합니다.", grade: 'legendary' },
  "last-mercy": { id: "last-mercy", slot: "무기", name: "마지막 자비", effect: "적 처치 시 생명력을 10% 회복합니다.", grade: 'legendary' },
  "night-plus": { id: "night-plus", slot: "무기", name: "밤+", effect: "밤 시간대에 공격력과 이동 속도가 증가합니다.", grade: 'legendary' },

  // --- Weapon Runes (Other/Placeholder) - for other jobs potentially
  "destructive": { id: "destructive", slot: "무기", name: "파괴의 룬", effect: "치명타 피해량이 15% 증가합니다.", grade: 'legendary' },
  "gale": { id: "gale", slot: "무기", name: "질풍의 룬", effect: "스킬 사용 시 20% 확률로 쿨타임이 1초 감소합니다.", grade: 'legendary' },

  // --- Armor Runes (Mythic) ---
  "dark-halo": { id: "dark-halo", slot: "방어구", name: "검게 물든 후광", effect: "피격 시 10% 확률로 주변을 암흑화하여 적의 명중률을 감소시킵니다.", grade: 'mythic' },
  "shadow-corridor": { id: "shadow-corridor", slot: "방어구", name: "그림자로 엮은 회랑", effect: "그림자 속에서 회피율이 20% 증가합니다.", grade: 'mythic' },
  "closed-fate": { id: "closed-fate", slot: "방어구", name: "닫힌 운명", effect: "치명적인 피해를 입을 때 1회 생존하며 무적 상태가 됩니다.", grade: 'mythic' },
  "world-swallowing-malice": { id: "world-swallowing-malice", slot: "방어구", name: "세상을 삼키는 악의", effect: "주변 적의 방어력을 10% 깎는 오라를 발산합니다.", grade: 'mythic' },
  "pouring-stars": { id: "pouring-stars", slot: "방어구", name: "쏟아지는 별", effect: "피격 시 별똥별이 떨어져 주변 적에게 반격합니다.", grade: 'mythic' },

  // --- Armor Runes (Legendary) ---
  "wildfire": { id: "wildfire", slot: "방어구", name: "들불", effect: "피격 시 일정 확률로 공격자에게 화상 피해를 입힙니다.", grade: 'legendary' },
  "snowy-mountain": { id: "snowy-mountain", slot: "방어구", name: "설산", effect: "피격 시 일정 확률로 공격자를 동결시킵니다.", grade: 'legendary' },
  "blind-prophet": { id: "blind-prophet", slot: "방어구", name: "눈 먼 예언자", effect: "마법 공격에 대한 저항력이 15% 증가합니다.", grade: 'legendary' },
  "delicate-hands": { id: "delicate-hands", slot: "방어구", name: "섬세한 손놀림", effect: "장비 교체 속도가 빨라지고, 아이템 사용 대기시간이 감소합니다.", grade: 'legendary' },
  "overwhelming-power": { id: "overwhelming-power", slot: "방어구", name: "압도적인 힘", effect: "자신보다 레벨이 낮은 적에게 받는 피해가 감소합니다.", grade: 'legendary' },
  "claw-plus": { id: "claw-plus", slot: "방어구", name: "갈퀴발톱+", effect: "근접 물리 공격 반사 데미지를 10% 가합니다.", grade: 'legendary' },
  "immortal": { id: "immortal", slot: "방어구", name: "불사", effect: "사망 시 5초 동안 유령 상태로 전투를 지속할 수 있습니다.", grade: 'legendary' },
  "blue-giant-tree": { id: "blue-giant-tree", slot: "방어구", name: "푸른 거목", effect: "가만히 서 있을 때 생명력 회복 속도가 크게 증가합니다.", grade: 'legendary' },
  "prepared-one": { id: "prepared-one", slot: "방어구", name: "준비된 자", effect: "전투 시작 시 10초간 보호막을 획득합니다.", grade: 'legendary' },
  "sweeping-wind": { id: "sweeping-wind", slot: "방어구", name: "싹쓸 바람", effect: "이동 속도가 10% 증가하고 넉백 저항이 생깁니다.", grade: 'legendary' },
  "sun": { id: "sun", slot: "방어구", name: "태양", effect: "낮 시간대에 방어력과 생명력 재생이 증가합니다.", grade: 'legendary' },
  "elemental-harmony": { id: "elemental-harmony", slot: "방어구", name: "원소 조화", effect: "모든 속성 저항력이 5% 증가합니다.", grade: 'legendary' },
  "plunderer": { id: "plunderer", slot: "방어구", name: "약탈자", effect: "적 처치 시 골드 획득량이 증가합니다.", grade: 'legendary' },
  "charge-leader": { id: "charge-leader", slot: "방어구", name: "돌격 대장", effect: "파티원들의 이동 속도를 5% 증가시킵니다.", grade: 'legendary' },
  "ancient-guardian": { id: "ancient-guardian", slot: "방어구", name: "고대 수호자", effect: "방어력이 10% 증가하지만 이동 속도가 5% 감소합니다.", grade: 'legendary' },
  "illusion-plus": { id: "illusion-plus", slot: "방어구", name: "환영+", effect: "회피 성공 시 환영을 남겨 적을 교란합니다.", grade: 'legendary' },
  
  // --- Armor Runes (Others) ---
  "iron-wall": { id: "iron-wall", slot: "방어구", name: "철벽의 룬", effect: "받는 모든 피해가 5% 감소합니다.", grade: 'epic' },
  "berserker": { id: "berserker", slot: "방어구", name: "광전사의 룬", effect: "잃은 체력에 비례하여 공격력이 증가합니다.", grade: 'epic' },
  "evasion": { id: "evasion", slot: "방어구", name: "회피의 룬", effect: "회피 성공 시 3초간 공격력이 10% 증가합니다.", grade: 'epic' },


  // --- Accessory Runes (Legendary) ---
  "onslaught-plus": { id: "onslaught-plus", slot: "장신구", name: "맹공+", effect: "공격력이 5% 증가하고 스킬 피해량이 3% 증가합니다.", grade: 'legendary' },
  "collapse-plus": { id: "collapse-plus", slot: "장신구", name: "붕괴+", effect: "공격 시 적의 방어구를 파괴하여 방어력을 감소시킵니다.", grade: 'legendary' },
  "charge-plus": { id: "charge-plus", slot: "장신구", name: "돌격+", effect: "이동 중일 때 받는 피해가 감소하고 공격력이 증가합니다.", grade: 'legendary' },
  "pole-plus": { id: "pole-plus", slot: "장신구", name: "극점+", effect: "약점 공격 시 치명타 피해량이 30% 증가합니다.", grade: 'legendary' },
  "slash-plus": { id: "slash-plus", slot: "장신구", name: "참격+", effect: "베기 공격의 범위가 10% 증가합니다.", grade: 'legendary' },
  
  // --- Accessory Runes (Others) ---
  "swiftness": { id: "swiftness", slot: "장신구", name: "신속의 룬", effect: "공격 속도가 3% 증가하며, 이동 속도가 5% 증가합니다.", grade: 'epic' },
  "deadly": { id: "deadly", slot: "장신구", name: "치명적인 룬", effect: "치명타 확률이 5% 증가합니다.", grade: 'epic' },
  "precision": { id: "precision", slot: "장신구", name: "정밀의 룬", effect: "명중률이 10% 증가하고 방어 관통력이 5 증가합니다.", grade: 'epic' },


  // --- Emblem Runes (Mythic) ---
  "distant-light": { id: "distant-light", slot: "엠블럼", name: "아득한 빛", effect: "파티원 전체의 생명력 회복 속도를 증가시킵니다.", grade: 'mythic' },
  "mountain-lord": { id: "mountain-lord", slot: "엠블럼", name: "산맥 군주", effect: "받는 피해가 10% 감소하고 넉백 저항이 증가합니다.", grade: 'mythic' },
  
  // --- Emblem Runes (Legendary) ---
  "dazzling": { id: "dazzling", slot: "엠블럼", name: "현란함", effect: "스킬 사용 시 화려한 이펙트와 함께 적의 시선을 끕니다.", grade: 'legendary' },
  "cracked-earth": { id: "cracked-earth", slot: "엠블럼", name: "갈라진 땅", effect: "땅을 내려칠 때 충격파가 발생하여 추가 피해를 줍니다.", grade: 'legendary' },
  "ruthless-predator": { id: "ruthless-predator", slot: "엠블럼", name: "무자비한 포식자", effect: "적 처치 시 공격력이 일시적으로 상승합니다.", grade: 'legendary' },
  
  // --- Emblem Runes (Others) ---
  "bravery": { id: "bravery", slot: "엠블럼", name: "용맹의 엠블럼", effect: "주변 아군의 공격력이 3% 증가하는 오라를 생성합니다.", grade: 'epic' },
  "fighter-emblem": { id: "fighter-emblem", slot: "엠블럼", name: "투사의 엠블럼", effect: "보스 몬스터에게 주는 피해가 8% 증가합니다.", grade: 'epic' },
  "sword-emblem": { id: "sword-emblem", slot: "엠블럼", name: "검의 엠블럼", effect: "평타 공격 시 스택이 쌓이며 10스택 시 강력한 추가 피해를 줍니다.", grade: 'epic' },


  // --- Gems ---
  "red-diamond": { id: "red-diamond", slot: "보석", name: "붉은 금강석", effect: "힘 +20, 최대 생명력 +150", grade: 'normal' },
  "sharp-ruby": { id: "sharp-ruby", slot: "보석", name: "예리한 루비", effect: "힘 +30, 치명타 +10", grade: 'normal' },
  "agile-sapphire": { id: "agile-sapphire", slot: "보석", name: "민첩한 사파이어", effect: "민첩 +25, 회피 +15", grade: 'normal' },
};
