import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../types.js";

interface FortuneResult {
  rank: string;
  weight: number; // 確率の重み
  color: number; // 16進数のカラーコード
  comment: string;
}

const FORTUNES: FortuneResult[] = [
  {
    rank: "🎉 大吉",
    weight: 5,
    color: 0xffd700,
    comment: "最高の運勢！何をやってもうまくいきそうです。",
  },
  {
    rank: "✨ 吉",
    weight: 20,
    color: 0x57f287,
    comment: "堅実な進展が期待できます。新しい挑戦に吉。",
  },
  {
    rank: "🌿 中吉",
    weight: 35,
    color: 0x5865f2,
    comment: "穏やかな一日。普段通りのペースを保ちましょう。",
  },
  {
    rank: "🍵 小吉",
    weight: 25,
    color: 0x95a5a6,
    comment: "焦らず一歩ずつ。小さな幸運を見逃さないように。",
  },
  {
    rank: "⚡ 凶",
    weight: 15,
    color: 0xed4245,
    comment: "油断は禁物。バックアップと体調管理を念入りに。",
  },
];

function drawFortune(): FortuneResult {
  const totalWeight = FORTUNES.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of FORTUNES) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return FORTUNES[FORTUNES.length - 1]!;
}

export const omikuji: Command = {
  data: new SlashCommandBuilder()
    .setName("omikuji")
    .setDescription("今日の運勢を占います　⛩️"),
  async execute(interaction) {
    const result = drawFortune();

    const embed = new EmbedBuilder()
      .setTitle(`⛩️ ${interaction.user.displayName} さんの本日の運勢`)
      .setColor(result.color)
      .setDescription(`## 【 ${result.rank} 】\n${result.comment}`)
      .setFooter({ text: "運勢は毎日変わります" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
