import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { Command } from "../types.js";

export const quest: Command = {
  data: new SlashCommandBuilder()
    .setName("quest")
    .setDescription("ダンジョン探索イベントを開始します　🎲"),
  async execute(interaction) {
    // 最初の選択画面
    const startEmbed = new EmbedBuilder()
      .setTitle("🚪 ダンジョンの分かれ道")
      .setDescription(
        "薄暗い通路の先に、怪しげな光を放つ **宝箱** と、奥へ続く **鉄の重い扉** があります。\nどう行動しますか？",
      )
      .setColor(0x34495e);

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("chest")
        .setLabel("🧰 宝箱を開ける（罠解除 60%）")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("door")
        .setLabel("🚪 鉄扉をこじ開ける（筋力 50%）")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("run")
        .setLabel("🏃 逃げる")
        .setStyle(ButtonStyle.Secondary),
    );

    const response = await interaction.reply({
      embeds: [startEmbed],
      components: [buttons],
    });

    // このメッセージ上のボタン操作を６０秒間だけ監視するコレクター
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on("collect", async (btnInteraction) => {
      // コマンドを実行した本人以外のクリックを弾く
      if (btnInteraction.user.id !== interaction.user.id) {
        await btnInteraction.reply({
          content: "⚠️ 他の探索者のイベントには介入できません。",
          ephemeral: true,
        });
        return;
      }

      // 「逃げる」を選んだ場合
      if (btnInteraction.customId === "run") {
        const runEmbed = new EmbedBuilder()
          .setTitle("💨 探索終了")
          .setDescription(
            `${interaction.user.displayName} は慎重に撤退した。命あっての物種だ。`,
          )
          .setColor(0x95a5a6);

        await btnInteraction.update({ embeds: [runEmbed], components: [] });
        collector.stop();
        return;
      }

      // 1d100 ダイスロール
      const dice = Math.floor(Math.random() * 100) + 1;
      const targetRate = btnInteraction.customId === "chest" ? 60 : 50;
      const actionName =
        btnInteraction.customId === "chest" ? "罠解除" : "扉のこじ開け";

      let title = "";
      let desc = "";
      let color = 0x5866f2;

      // TRPG判定ルール
      if (dice <= 5) {
        title = "🌟 決定的成功（クリティカル）!!";
        color = 0xffd700;
        desc = `出目： **${dice}** / 目標値: **${targetRate}**\n奇跡な身のこなし！罠を完璧に解除し、幻の魔道書を手に入れた！`;
      } else if (dice >= 96) {
        title = "💀 致命的失敗（ファンブル）!!";
        color = 0xed4245;
        desc = `出目： **${dice}** / 目標値: **${targetRate}**\n大失敗！仕掛けが暴発し、毒針を喰らってほうほうの身体で逃げ出した...`;
      } else if (dice <= targetRate) {
        title = "🎯 成功！";
        color = 0x57f287;
        desc = `出目： **${dice}** / 目標値: **${targetRate}**\n見事に ${actionName} に成功！金貨 100枚 を獲得した。`;
      } else {
        title = "❌ 失敗…";
        color = 0xe67e22;
        desc = `出目： **${dice}** / 目標値: **${targetRate}**\n${actionName} は失敗に終わった。物音に気づいたモンスターが迫ってきたため撤退した。`;
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(color)
        .setFooter({ text: `ダイス判定: 1d100 <= ${targetRate}` })
        .setTimestamp();

      // 画面上のEmbedとボタンを結果画面に上書き更新する
      await btnInteraction.update({ embeds: [resultEmbed], components: [] });
      collector.stop();
    });

    // タイムアウト時の後処理
    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⌛ 時間切れ")
          .setDescription(
            "一定時間操作がなかったため、通路の奥から暗闇が満ちてきた…",
          )
          .setColor(0x7f8c8d);

        await interaction
          .editReply({ embeds: [timeoutEmbed], components: [] })
          .catch(() => {});
      }
    });
  },
};
