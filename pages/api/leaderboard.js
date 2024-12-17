import db from '../../lib/db'

export default function handler(req, res) {
  const rows = db.prepare(`SELECT username, rating FROM leaderboard ORDER BY rating DESC LIMIT 10`).all()
  res.status(200).json(rows)
}
