// pages/api/leaderboard.js
import dbConnect from '../../lib/db'
import Leaderboard from '../../models/Leaderboard'

export default async function handler(req, res) {
  await dbConnect()
  const leaders = await Leaderboard.find().sort({ rating: -1 }).limit(10).lean()
  return res.status(200).json(leaders)
}
