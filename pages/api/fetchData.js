// pages/api/fetchData.js
import dbConnect from '../../lib/db'
import Leaderboard from '../../models/Leaderboard'

export default async function handler(req, res) {
  const { username } = req.query
  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  // Fetch user's public repos (5 per page, limit to a few pages if needed)
  const perPage = 5
  let page = 1
  const maxPages = 5
  const allRepos = []

  for (; page <= maxPages; page++) {
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`)
    if (!reposResponse.ok) {
      // If failed to fetch repos, return error
      return res.status(reposResponse.status).json({ error: 'Failed to fetch user repos' })
    }

    const repos = await reposResponse.json()
    if (!Array.isArray(repos) || repos.length === 0) {
      // No more repos
      break
    }

    allRepos.push(...repos)
    // If fewer than perPage repos were returned, no more results
    if (repos.length < perPage) {
      break
    }
  }

  // Fetch commits for all repos in parallel
  const commitPromises = allRepos.map(async repo => {
    const { name, owner, stargazers_count } = repo
    const commitsRes = await fetch(`https://api.github.com/repos/${owner.login}/${name}/commits?author=${username}&per_page=100`)
    if (!commitsRes.ok) {
      return { repoName: name, commits: 0, stars: stargazers_count || 0 }
    }

    const commits = await commitsRes.json()
    const commitCount = Array.isArray(commits) ? commits.length : 0
    return {
      repoName: name,
      commits: commitCount,
      stars: stargazers_count || 0
    }
  })

  const repoResults = await Promise.all(commitPromises)

  let totalRating = 0
  let totalCommits = 0
  let totalStars = 0
  const repoDataList = []

  for (const { repoName, commits, stars } of repoResults) {
    if (commits > 0) {
      totalCommits += commits
      totalStars += stars
      const contribution = stars > 0 ? commits * stars : commits
      totalRating += contribution
      repoDataList.push({ repoName, commits, stars })
    }
  }

  // Save or update rating in MongoDB
  await dbConnect()
  await Leaderboard.findOneAndUpdate(
    { username },
    { username, rating: totalRating },
    { upsert: true, new: true }
  )

  return res.status(200).json({ rating: totalRating, totalCommits, totalStars, repos: repoDataList })
}
