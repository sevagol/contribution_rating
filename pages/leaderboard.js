// pages/leaderboard.js
import { useState, useEffect } from 'react'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaders(data))
  }, [])

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Leaderboard</h1>
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 font-medium text-gray-700">Username</th>
            <th className="py-2 px-4 font-medium text-gray-700">Rating</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader, i) => (
            <tr key={i} className="border-t border-gray-200">
              <td className="py-2 px-4 text-gray-800">{leader.username}</td>
              <td className="py-2 px-4 text-gray-600">{leader.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}