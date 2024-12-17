// pages/api/fetchData.js
import { getSession } from 'next-auth/react'
import dbConnect from '../../lib/db'
import Leaderboard from '../../models/Leaderboard'

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const accessToken = session.accessToken
  // Adjust username extraction if needed. Some sessions have `session.user.login`.
  const username = session.user.name || session.user.login 

  // Fetch public repos
  const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=100&visibility=public`, {
    headers: {
      Authorization: `token ${accessToken}`
    }
  })
  const repos = await reposResponse.json()

  let totalCommits = 0
  let totalStars = 0
  const repoDataList = []

  for (const repo of repos) {
    const { name, owner, stargazers_count } = repo
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner.login}/${name}/commits?author=${username}&per_page=100`, {
      headers: { Authorization: `token ${accessToken}` }
    })
    const commits = await commitsResponse.json()

    const commitCount = Array.isArray(commits) ? commits.length : 0
    if (commitCount > 0) {
      totalCommits += commitCount
      totalStars += stargazers_count
      repoDataList.push({
        repoName: name,
        commits: commitCount,
        stars: stargazers_count
      })
    }
  }

  const rating = totalCommits * totalStars

  // Connect to MongoDB and upsert the user's rating
  await dbConnect()
  await Leaderboard.findOneAndUpdate(
    { username },
    { username, rating },
    { upsert: true, new: true }
  )

  return res.status(200).json({ rating, totalCommits, totalStars, repos: repoDataList })
}
