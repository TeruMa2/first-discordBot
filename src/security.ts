import {
  Client,
  Events,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { logSecurityEvent } from "./db.js";

/**
 * サーバーのセキュリティ監視（イベントリスナー）を登録する関数
 * @param client ログイン済みのDiscordクライアント
 */

export function startSecurityMonitor(client: Client): void {
  const adminChannelId = process.env.ADMIN_CHANNEL_ID;

  if (!adminChannelId) {
    console.warn(
      "⚠️ ADMIN_CHANNEL_ID が未設定のため、セキュリティ通知が無効です。",
    );
    return;
  }

  // =================================================================
  // 監視1: 新規メンバー参加時の「捨てアカ（新規作成アカウント）」検知
  // =================================================================
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      // アカウントが作成されてから何日経過しているかを計算
      const now = Date.now();
      const createdTimestamp = member.user.createdTimestamp;
      const accountAgeDays = Math.floor(
        (now - createdTimestamp) / (1000 * 60 * 60 * 24),
      );

      // 警戒ライン（例：作成から７日未満のアカウントはスパム・荒らし予備軍の可能性）
      const SUSPICIOUS_DAYS = 7;

      const adminChannel = client.channels.cache.get(
        adminChannelId,
      ) as TextChannel;
      if (!adminChannel) return;

      if (accountAgeDays < SUSPICIOUS_DAYS) {
        logSecurityEvent(
          member.id,
          member.user.tag,
          "NEW_ACCOUNT",
          `アカウント作成から${accountAgeDays}日で参加`,
        );
        // 黄色アラート：作成されたばかりのアカウント
        const warnEmbed = new EmbedBuilder()
          .setTitle("⚠️ 新規作成アカウントの参加を検知")
          .setDescription(
            `作成から **${accountAgeDays}日** しか経っていないアカウントが参加しました。スパムや荒らし行為に注意してください。`,
          )
          .addFields(
            {
              name: "ユーザー",
              value: `${member.user.tag} (<@${member.id}>)`,
              inline: true,
            },
            { name: "ユーザーID", value: `\`${member.id}\``, inline: true },
            {
              name: "アカウント作成日",
              value: member.user.createdAt.toLocaleDateString("ja-JP"),
              inline: true,
            },
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setColor(0xfee75c)
          .setTimestamp();

        await adminChannel.send({ embeds: [warnEmbed] });
      } else {
        // 通常参加ログ（情報として記録）
        console.log(
          `👤 新規参加: ${member.user.tag} (アカウント歴: ${accountAgeDays}日)`,
        );
      }
    } catch (error) {
      console.error("❌ [Security] GuildMemberAdd 処理中にエラー:", error);
    }
  });

  // =================================================================
  // 監視2: 外部Discordサーバーへの無断招待リンク検知＆自動削除
  // =================================================================
  // discord.gg/xxxx や discord.com/invite/xxxx に一致する正規表現
  const inviteRegex =
    /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-zA-Z0-9]/i;

  client.on(Events.MessageCreate, async (message) => {
    try {
      // 1. DM (ダイレクトメッセージ)やBot自身の発言は無視
      if (!message.guild || message.author.bot) return;

      // 2. サーバー管理者権限を持つ人の発言は許可（誤爆防止）
      if (message.member?.permissions.has(PermissionFlagsBits.Administrator))
        return;

      // 3.　メッセージ本文に招待リンクが含まれているかチェック
      if (inviteRegex.test(message.content)) {
        // 証拠保全のため、削除前にメッセージ内容を控えておく
        const deletedContent = message.content;
        const channelName = (message.channel as TextChannel).name;

        logSecurityEvent(
          message.author.id,
          message.author.tag,
          "INVITE_LINK",
          `#${channelName} で招待リンク投稿: ${deletedContent.slice(0, 100)}`,
        );
        // 表のチャンネルから即座にメッセージを削除
        await message.delete();

        // 投稿者本人に注意メッセージを送信（数秒後に自動消去してチャンネルを汚さない）
        const warningMsg = await (message.channel as TextChannel).send(
          `🚫 <@${message.author.id}> 外部サーバーの招待リンク投稿は禁止されています。`,
        );
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

        // 管理者チャンネルに証拠ログを保全送信
        const adminChannel = client.channels.cache.get(
          adminChannelId,
        ) as TextChannel;
        if (adminChannel) {
          const alertEmbed = new EmbedBuilder()
            .setTitle("🛡️ 禁止リンク（招待URL）を自動削除しました")
            .addFields(
              {
                name: "投稿者",
                value: `${message.author.tag} (\`${message.author.id}\`)`,
                inline: true,
              },
              {
                name: "発生チャンネル",
                value: `#${channelName}`,
                inline: true,
              },
              {
                name: "削除された内容（証拠保全）",
                value: `\`\`\`\n${deletedContent.slice(0, 1000)}\n\`\`\``,
              },
            )
            .setColor(0xed4245)
            .setTimestamp();

          await adminChannel.send({ embeds: [alertEmbed] });
        }
      }
    } catch (error) {
      // 権限不足（Botに「メッセージの管理」権限がない等）で削除に失敗した場合もここでキャッチ
      console.error("❌ [Security] MessageCreate 処理中にエラー:", error);
    }
  });

  console.log("🛡️ セキュリティ監視モジュールを起動しました。");
}
