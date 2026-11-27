import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../types.js";
import { getUserStatus } from "../db.js";

export const status: Command = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("現在の所持コインと冒険の戦績を確認します　📊"),
  async execute(interaction) {
    const record = getUserStatus(interaction.user.id);

    const coins = record?.coins ?? 0;
    const clears = record?.quest_clears ?? 0;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${interaction.user.displayName} の冒険者ステータス`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "💰 所持ゴールド", value: `**${coins} G**`, inline: true },
        { name: "🏆 クエスト達成数", value: `**${clears} 回**`, inline: true },
      )
      .setColor(0x3498db)
      .setFooter({ text: "/omikuji や /quest で報酬を獲得できます" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
