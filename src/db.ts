import Database from "better-sqlite3";
import path from "path";

// プロジェクトルートに'bot.sqlite'というファイルを作成して接続
const dbPath = path.resolve(process.cwd(), "bot.sqlite");
const db = new Database(dbPath);

// パフォーマンスと安全性を高める推奨設定（WALモード）
db.pragma("journal_mode = WAL");

/**
 * データベースの初期セットアップ（テーブルが存在しなければ自動作成）
 */
export function initDatabase(): void {
  // 1. ユーザー戦績・所持金テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      coins INTEGER DEFAULT 0,
      quest_clears INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    `);

  // 2. セキュリティ検知ログテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS security logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'INVITE_LINK' や 'NEW_ACCOUNT'　など
      detail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    `);

  console.log("🗄️ SQLite データベースを初期化しました:", dbPath);
}

// =================================================================
// ユーザーデータ操作用関数
// =================================================================

export interface UserRecord {
  user_id: string;
  username: string;
  coins: number;
  quest_clears: number;
}

/**
 * ユーザーのコインやクリア回数を加算する（初回は自動登録 = UPSERT処理）
 */
export function addUserReward(
  userId: string,
  username: string,
  addCoins: number,
  addClears: number = 0,
): UserRecord {
  // SQLiteの協力な構文「ON　CONFLICT  DO　UPDATE（なければ新規作成、あれば加算更新）」
  const stmt = db.prepare(`
    INSERT INTO users (user_id, username, coins, quest_clears, updated_at)
    VALUES (?, ?, ?, ?, datetime('now', '+9 hours'))
    ON CONFLICT(user_id) DO UPDATE SET
      username =  excluded.username,
      coins = users.coins + excluded.coins,
      quest_clears = users.quest_clears + excluded.quest_clears,
      updated_at = datetime('now', '+9 hours')
  `);

  stmt.run(userId, username, addCoins, addClears);

  return getUserStatus(userId)!;
}

/**
 * ユーザーの現在ステータスを取得する
 */
export function getUserStatus(userId: string): UserRecord | undefined {
  const stmt = db.prepare(
    "SELECT user_id, username, coins, quest_clears FROM users WHERE user_id = ?",
  );
  return stmt.get(userId) as UserRecord | undefined;
}

// =================================================================
// セキュリティログ操作用関数
// =================================================================

/**
 * セキュリティイベントをDBに記録する
 */
export function logSecurityEvent(
  userId: string,
  username: string,
  eventType: string,
  detail: string,
): void {
  const stmt = db.prepare(`
    INSERT INTO security_logs (user_id, username, event_type, detail, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '+9 hours'))
    `);
  stmt.run(userId, username, eventType, detail);
}

/**
 * 累計のセキュリティ検知件数を取得する（定期レポート用）
 */
export function getSecurityStats(): {
  total: number;
  inviteBlocks: number;
  newAccountWarns: number;
} {
  const total = (
    db.prepare("SELECT COUNT(+)  as count FROM security_logs").get() as {
      count: number;
    }
  ).count;
  const inviteBlocks = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'INVITE_LINK'",
      )
      .get() as { count: number }
  ).count;
  const newAccountWarns = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'NEW_ACCOUNT'",
      )
      .get() as { count: number }
  ).count;

  return { total, inviteBlocks, newAccountWarns };
}
