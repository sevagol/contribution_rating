import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session } = useSession()
  const [ratingData, setRatingData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      setIsLoading(true)
      fetch('/api/fetchData')
        .then(res => res.json())
        .then(data => {
          setRatingData(data)
          setIsLoading(false)
        })
        .catch(() => {
          // In case of an error, hide the loader
          setIsLoading(false)
        })
    }
  }, [session])

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        
        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
            {/* A pulsating bar indicating loading */}
            <div className="bg-blue-500 h-full w-1/3 animate-pulse"></div>
          </div>
        )}
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">GitHub Rating</h1>

        {!session && (
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              This app calculates your GitHub rating by multiplying the total number of your commits
              across your public repositories by the total number of stars those repositories have.
            </p>
            <button
              onClick={() => signIn('github')}
              className="w-full flex items-center justify-center bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
            >
              <img src="/github-mark.svg" alt="GitHub logo" className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </button>
          </div>
        )}

        {session && ratingData && !isLoading && (
          <>
            <p className="text-lg text-gray-700 mb-2 text-center">Welcome, {session.user.name}</p>
            <p className="text-xl font-bold text-gray-800 mb-4 text-center">Your Rating: {ratingData.rating}</p>

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
              <p className="mb-4 text-gray-600">No commits found in your public repositories.</p>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => signOut()}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
              >
                Sign Out
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
