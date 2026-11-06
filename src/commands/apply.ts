import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { Command } from "../types.js";

export const apply: Command = {
  data: new SlashCommandBuilder()
    .setName("apply")
    .setDescription("参加・面談の申請フォームを開きます 📝"),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("コミュニティ参加申請フォーム");

    const nameInput = new TextInputBuilder()
      .setCustomId("user_name")
      .setLabel("お名前（またはニックネーム）")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("user_reason")
      .setLabel("参加目的・自己紹介")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
    );

    await interaction.showModal(modal);
  },
};
