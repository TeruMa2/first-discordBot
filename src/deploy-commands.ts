import "dotenv/config";
import { REST, Routes } from "discord.js";
import { ping } from "./commands/ping.js";
import { clear } from "./commands/clear.js";
import { rule } from "./commands/rule.js";
import { apply } from "./commands/apply.js";

const commandList = [ping, clear, rule, apply];
const commands = commandList.map((cmd) => cmd.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

async function deploy() {
  try {
    console.log("🔄 スラッシュコマンドを登録中...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!,
      ),
      { body: commands },
    );
    console.log("✅ コマンドの登録に成功しました！");
  } catch (error) {
    console.error("❌ コマンド登録エラー:", error);
  }
}

deploy();
