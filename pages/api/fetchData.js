// pages/api/fetchData.js
import dbConnect from '../../lib/db'
import Leaderboard from '../../models/Leaderboard'

export default async function handler(req, res) {
  const { username } = req.query
  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  const perPage = 5
  let page = 1
  const maxPages = 5
  const allRepos = []

  for (; page <= maxPages; page++) {
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`)
    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({ error: 'Failed to fetch user repos' })
    }

    const repos = await reposResponse.json()
    if (!Array.isArray(repos) || repos.length === 0) {
      break
    }

    allRepos.push(...repos)
    if (repos.length < perPage) {
      break
    }
  }

  // Define a function to fetch all commits with pagination for a single repo
  async function fetchAllCommitsForRepo(ownerLogin, repoName, username) {
    const commitsPerPage = 100
    let commitPage = 1
    const maxCommitPages = 3 // adjust as needed for performance
    let totalCommits = 0

    // Continue fetching until no more commits or we hit maxCommitPages
    while (commitPage <= maxCommitPages) {
      const commitsRes = await fetch(`https://api.github.com/repos/${ownerLogin}/${repoName}/commits?per_page=${commitsPerPage}&page=${commitPage}`)
      if (!commitsRes.ok) {
        // If failed to fetch commits, break early (could log an error)
        break
      }

      const commits = await commitsRes.json()
      if (!Array.isArray(commits) || commits.length === 0) {
        // No more commits on this repo
        break
      }

      for (const c of commits) {
        const commitAuthorLogin = c.author?.login
        const commitCommitterLogin = c.committer?.login
        // Count commit if username matches either author or committer
        if ((commitAuthorLogin && commitAuthorLogin.toLowerCase() === username.toLowerCase()) ||
            (commitCommitterLogin && commitCommitterLogin.toLowerCase() === username.toLowerCase())) {
          totalCommits++
        }
      }

      if (commits.length < commitsPerPage) {
        // No more pages if we got less than perPage
        break
      }

      commitPage++
    }

    return totalCommits
  }

  const commitPromises = allRepos.map(async (repo) => {
    const { name, owner, stargazers_count } = repo
    const commitCount = await fetchAllCommitsForRepo(owner.login, name, username)
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
