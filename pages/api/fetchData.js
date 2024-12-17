import { getSession } from 'next-auth/react'
import db from '../../lib/db'

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const accessToken = session.accessToken
  const username = session.user.login || session.user.name // Adjust as needed

  // Fetch user repos & calculate rating (same logic as before)
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

  // Store / update rating in the database
  const upsert = db.prepare(`
    INSERT INTO leaderboard (username, rating) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET rating=excluded.rating
  `)
  upsert.run(username, rating)

  return res.status(200).json({ rating, totalCommits, totalStars, repos: repoDataList })
}
