// models/Leaderboard.js
import mongoose from 'mongoose'

const LeaderboardSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  rating: { type: Number, required: true }
})

export default mongoose.models.Leaderboard || mongoose.model('Leaderboard', LeaderboardSchema)
