import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [username, setUsername] = useState('')
  const [ratingData, setRatingData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFetchData = (e) => {
    e.preventDefault()
    if (!username) {
      setError('Please enter a GitHub username')
      return
    }

    setIsLoading(true)
    setError(null)
    setRatingData(null)

    fetch(`/api/fetchData?username=${encodeURIComponent(username)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch data')
        }
        return res.json()
      })
      .then(data => {
        setRatingData(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
            <div className="bg-blue-500 h-full w-1/3 animate-pulse"></div>
          </div>
        )}
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          GitHub Rating
        </h1>

        {!ratingData && !isLoading && (
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              This app calculates your GitHub rating by taking the total commits across your public repositories and combining it with the number of stars they have.
              <br />
              If a repo has no stars, each commit counts as 1 point. If it has stars, commits are multiplied by the star count.
            </p>
            <form onSubmit={handleFetchData} className="mb-4">
              <input
                type="text"
                placeholder="Enter GitHub username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full mb-2 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
              >
                Fetch Rating
              </button>
            </form>
            {error && (
              <p className="text-red-600">{error}</p>
            )}
          </div>
        )}

        {ratingData && !isLoading && (
          <>
            <p className="text-lg text-gray-700 mb-2 text-center">
              Results for: {username}
            </p>
            <p className="text-xl font-bold text-gray-800 mb-4 text-center">
              Your Rating: {ratingData.rating}
            </p>

            <div className="text-sm text-gray-600 mb-6 text-center">
              Commits: <span className="font-semibold">{ratingData.totalCommits}</span> | Stars: <span className="font-semibold">{ratingData.totalStars}</span>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-2">Repos you contributed to:</h2>
            {ratingData.repos && ratingData.repos.length > 0 ? (
              <div className="mb-4 overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden bg-white text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 font-medium text-gray-700 text-left whitespace-nowrap">Repository</th>
                      <th className="py-2 px-4 font-medium text-gray-700 text-left whitespace-nowrap">Commits</th>
                      <th className="py-2 px-4 font-medium text-gray-700 text-left whitespace-nowrap">Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratingData.repos.map(repo => (
                      <tr key={repo.repoName} className="border-t border-gray-200">
                        <td className="py-2 px-4 text-gray-800">{repo.repoName}</td>
                        <td className="py-2 px-4 text-gray-600">{repo.commits}</td>
                        <td className="py-2 px-4 text-gray-600">{repo.stars}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mb-4 text-gray-600">
                No commits found in user&apos;s public repositories.
              </p>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setRatingData(null)
                  setUsername('')
                  setError(null)
                }}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
              >
                New Search
              </button>
              <Link href="/leaderboard" className="text-blue-600 hover:underline">
                View Leaderboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
