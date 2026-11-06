import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  Collection,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "./types.js";
import { ping } from "./commands/ping.js";
import { clear } from "./commands/clear.js";
import { rule } from "./commands/rule.js";
import { apply } from "./commands/apply.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// コマンド一覧を保持するコレクション
const commands = new Collection<string, Command>();
[ping, clear, rule, apply].forEach((cmd) => {
  commands.set(cmd.data.name, cmd);
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // 1. スラッシュコマンドの自動ディスパッチ
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const replyOptions = {
        content: "❌ コマンド実行中にエラーが発生しました。",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
    return;
  }

  // 2. モーダル送信時の処理（データ連携）
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "apply_modal") {
      const name = interaction.fields.getTextInputValue("user_name");
      const reason = interaction.fields.getTextInputValue("user_reason");

      // 本人に応答
      await interaction.reply({
        content: `✅ 申請を受け付けました！管理者の確認をお待ちください。`,
        ephemeral: true,
      });

      // A. 管理者チャンネルへのEmbed通知
      const adminChannelId = process.env.ADMIN_CHANNEL_ID;
      if (adminChannelId) {
        const channel = await interaction.guild?.channels.fetch(adminChannelId);
        if (channel instanceof TextChannel) {
          const adminEmbed = new EmbedBuilder()
            .setTitle("📥 新規の参加申請が届きました")
            .setColor(0x00ff88)
            .addFields(
              {
                name: "アカウント",
                value: `<@${interaction.user.id}> (${interaction.user.tag})`,
                inline: true,
              },
              { name: "お名前", value: name, inline: true },
              { name: "参加理由", value: reason },
            )
            .setTimestamp();
          await channel.send({ embeds: [adminEmbed] });
        }
      }

      // B. Googleスプレッドシート（GAS）への送信
      const gasUrl = process.env.GAS_WEBHOOK_URL;
      if (gasUrl) {
        try {
          await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: interaction.user.id,
              userTag: interaction.user.tag,
              name: name,
              reason: reason,
            }),
          });
        } catch (gasError) {
          console.error("GAS送信エラー：", gasError);
        }
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
