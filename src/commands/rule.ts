import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../types.js";

export const rule: Command = {
  data: new SlashCommandBuilder()
    .setName("rule")
    .setDescription("サーバーの利用ガイドラインをEmbed形式で表示します 📖"),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("📖 サーバー利用ガイドライン")
      .setDescription(
        "コミュニティへようこそ！快適な利用のためルールをご確認ください。",
      )
      .setColor(0x5865f2)
      .addFields(
        {
          name: "1. リスペクトを持った発言",
          value: "過度な煽り・誹謗中傷は禁止です。",
        },
        {
          name: "2. スパム・無許可の宣伝禁止",
          value: "関連性のないURL宣伝はご遠慮ください。",
        },
        {
          name: "3. チャンネルの用途遵守",
          value: "話題に応じたチャンネルへの投稿をお願いします。",
        },
      )
      .setFooter({ text: "運営チーム" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
