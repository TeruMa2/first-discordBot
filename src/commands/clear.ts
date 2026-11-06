import { SlashCommandBuilder } from "discord.js";
import { Command } from "../types.js";

export const clear: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("指定した件数のメッセージを一括削除します 🧹")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("削除する件数（1~100）")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger("amount", true);

    if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
      await interaction.reply({
        content: "⚠️ このチャンネルでは一括削除を実行できません。",
        ephemeral: true,
      });
      return;
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        content: `🧹 **${deleted.size}件** のメッセージを削除しました。`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ 削除に失敗しました（権限を確認してください）。",
        ephemeral: true,
      });
    }
  },
};
