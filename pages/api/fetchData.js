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
  const username = session.user.login || session.user.name

  // We'll fetch repos 5 at a time and page through results
  const perPage = 5
  let page = 1
  const allRepos = []

  // Limit pages to avoid long runs (e.g., 5 pages => max 25 repos)
  const maxPages = 5

  for (; page <= maxPages; page++) {
    const reposResponse = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&visibility=public&page=${page}`,
      {
        headers: { Authorization: `token ${accessToken}` }
      }
    )

    if (!reposResponse.ok) {
      // If a page fails to fetch, just break early
      break
    }

    const repos = await reposResponse.json()
    if (!Array.isArray(repos) || repos.length === 0) {
      // No more repos to fetch
      break
    }

    allRepos.push(...repos)

    // If less than perPage returned, no more repos
    if (repos.length < perPage) {
      break
    }
  }

  // Now we have a combined list of all repos fetched in batches of 5
  // Fetch commits for all repos in parallel
  const headers = { Authorization: `token ${accessToken}` }

  const commitPromises = allRepos.map(async repo => {
    const { name, owner, stargazers_count } = repo
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner.login}/${name}/commits?author=${username}&per_page=100`,
      { headers }
    )
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
  
  for (const result of repoResults) {
    const { repoName, commits, stars } = result
  
    if (commits > 0) {
      totalCommits += commits
      totalStars += stars
  
      // New rating calculation
      if (stars > 0) {
        totalRating += commits * stars
      } else {
        totalRating += commits
      }
    }
  }

  return res.status(200).json({ rating: totalRating, totalCommits, totalStars, repos: repoResults })
}
