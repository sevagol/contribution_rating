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
  const username = session.user.login || session.user.name // Adjust if needed

  // Fetch public repos
  const reposResponse = await fetch(`https://api.github.com/user/repos?per_page=100&visibility=public`, {
    headers: {
      Authorization: `token ${accessToken}`
    }
  })

  if (!reposResponse.ok) {
    return res.status(reposResponse.status).json({ error: 'Failed to fetch repos from GitHub' })
  }

  const repos = await reposResponse.json()
  if (!Array.isArray(repos)) {
    return res.status(500).json({ error: 'Unexpected response format from GitHub' })
  }

  // Fetch commits for all repos in parallel
  const commitFetches = repos.map(repo => {
    const { name, owner } = repo
    return fetch(`https://api.github.com/repos/${owner.login}/${name}/commits?author=${username}&per_page=100`, {
      headers: { Authorization: `token ${accessToken}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(commits => {
        const commitCount = Array.isArray(commits) ? commits.length : 0
        return {
          repoName: name,
          commitCount,
          stars: repo.stargazers_count || 0
        }
      })
      .catch(() => ({ repoName: name, commitCount: 0, stars: 0 }))
  })

  const results = await Promise.all(commitFetches)

  let totalCommits = 0
  let totalStars = 0
  const repoDataList = []

  for (const result of results) {
    const { repoName, commitCount, stars } = result
    if (commitCount > 0) {
      totalCommits += commitCount
      totalStars += stars
      repoDataList.push({ repoName, commits: commitCount, stars })
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
