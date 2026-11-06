import { SlashCommandBuilder } from "discord.js";
import { Command } from "../types.js";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Botの応答速度を確認します　🏓"),
  async execute(interaction) {
    const ping = Date.now() - interaction.createdTimestamp;
    await interaction.reply({
      content: `🏓 Pong! (応答: ${ping}ms / API遅延: ${interaction.client.ws.ping}ms)`,
    });
  },
};
