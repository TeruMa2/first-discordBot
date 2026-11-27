import cron from "node-cron";
import { Client, EmbedBuilder, TextChannel } from "discord.js";

/**
 * 定期実行タスク（スケジューラー）を初期化して起動する関数
 * @param client Discordクライアント
 */
export function startScheduler(client: Client): void {
  // 通知を送るチャンネルID（今回は既存の管理者チャンネルを流用）
  const targetChannelId = process.env.ADMIN_CHANNEL_ID;

  if (!targetChannelId) {
    console.warn(
      "⚠️ ADMIN_CHANNEL_ID が未設定のため、定期通知をスキップします。",
    );
    return;
  }

  // =================================================================
  // タスク1: 動作確認用のテスト通知（毎分0秒に実行）
  // ※ 動作確認ができたら、下の「毎日朝9時」の書き方に書き換えます
  // =================================================================
  cron.schedule(
    "0 9 * * *", // Cron式：　「毎分０秒」を意味する
    async () => {
      try {
        console.log("⏰ [Cron] 定時タスクを実行します...");

        // キャッシュから送信先のチャンネルオブジェクトを取得
        const channel = client.channels.cache.get(targetChannelId);

        // チャンネルが存在し、かつ「テキスト送信可能なチャンネル」が型チェック
        if (!channel || !channel.isTextBased()) {
          console.error(
            "❌ 指定されたチャンネルが見つからないか、テキスト送信不可です。",
          );
          return;
        }

        // 通知用のEmbedを作成
        const embed = new EmbedBuilder()
          .setTitle("⏰ 定時システムヘルスチェック")
          .setDescription("Botは正常に稼働しています。")
          .addFields(
            // process.uptime()はBotが起動してからの秒数
            {
              name: "連続稼働時間",
              value: `${Math.floor(process.uptime())} 秒`,
              inline: true,
            },
            {
              name: "サーバー時刻",
              value: new Date().toLocaleString("ja-JP"),
              inline: true,
            },
          )
          .setColor(0x57f287) // 緑色
          .setTimestamp();

        // メッセージを送信（TextChannel型として扱う）
        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error) {
        // 定期実行の中でエラーが起きてもBot全体が落ちないように必ずcatchする
        console.error(
          "❌ [Cron] 定時タスクの実行中にエラーが発生しました:",
          error,
        );
      }
    },
    {
      // 重要：　サーバーがUTC設定でも確実に「日本時間」で動かすための指定
      timezone: "Asia/Tokyo",
    },
  );

  console.log("📅 スケジューラー（定期実行タスク）を登録しました。");
}
