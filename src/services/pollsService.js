import { supabase } from '../supabaseClient'

// Local storage keys
const LOCAL_POLLS_KEY = 'aravali_cached_polls'
const LOCAL_VOTES_KEY = 'aravali_user_votes'
export const ENTRY_NO_KEY = 'aravali_user_entry_no'
export const DEVICE_ID_KEY = 'aravali_device_id'

export function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// Sample initial poll for instant preview / fallback
const SEED_POLLS = [
  {
    id: 'sofa-poll-demo',
    title: 'New Sofa Set for Common Room',
    description: 'We are procuring a 3-seater sofa set for the Aravali Ground Floor Common Room. Vote for your preferred style and material!',
    status: 'active',
    created_at: new Date().toISOString(),
    options: [
      {
        id: 'opt-1',
        text: 'Option A: Modern Navy Blue Fabric Sofa',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'opt-2',
        text: 'Option B: Minimalist Grey L-Shaped Sectional',
        image_url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'opt-3',
        text: 'Option C: Tan Leatherette Classic Lounge',
        image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
]

// Helper for local mock votes/polls
function getLocalPolls() {
  try {
    const raw = localStorage.getItem(LOCAL_POLLS_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_POLLS_KEY, JSON.stringify(SEED_POLLS))
      return SEED_POLLS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_POLLS
  }
}

function saveLocalPolls(polls) {
  try {
    localStorage.setItem(LOCAL_POLLS_KEY, JSON.stringify(polls))
  } catch (e) {
    console.error(e)
  }
}

export function getSavedEntryNo() {
  return localStorage.getItem(ENTRY_NO_KEY) || ''
}

export function saveEntryNo(entryNo) {
  if (entryNo) {
    localStorage.setItem(ENTRY_NO_KEY, entryNo.trim().toUpperCase())
  }
}

export function getLocalUserVote(pollId) {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY)
    const votes = raw ? JSON.parse(raw) : {}
    return votes[pollId] || null
  } catch {
    return null
  }
}

export function recordLocalUserVote(pollId, optionId, entryNo) {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY)
    const votes = raw ? JSON.parse(raw) : {}
    votes[pollId] = { optionId, entryNo, votedAt: new Date().toISOString() }
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes))
  } catch (e) {
    console.error(e)
  }
}

export async function fetchAllPolls() {
  try {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })

    if (pollsError) throw pollsError

    // Fetch vote tallies for these polls
    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select('poll_id, option_id')

    const tallies = {}
    if (!votesError && votes) {
      for (const v of votes) {
        if (!tallies[v.poll_id]) tallies[v.poll_id] = {}
        tallies[v.poll_id][v.option_id] = (tallies[v.poll_id][v.option_id] || 0) + 1
      }
    }

    return (polls || []).map((poll) => {
      const pVotes = tallies[poll.id] || {}
      const totalVotes = Object.values(pVotes).reduce((a, b) => a + b, 0)
      return {
        ...poll,
        voteCounts: pVotes,
        totalVotes,
      }
    })
  } catch (err) {
    console.warn('Supabase fetchAllPolls failed, using local fallback:', err)
    // Fallback to local
    const polls = getLocalPolls()
    const votesRaw = localStorage.getItem('aravali_mock_vote_counts')
    const tallies = votesRaw ? JSON.parse(votesRaw) : { 'sofa-poll-demo': { 'opt-1': 14, 'opt-2': 28, 'opt-3': 9 } }

    return polls.map((poll) => {
      const pVotes = tallies[poll.id] || {}
      const totalVotes = Object.values(pVotes).reduce((a, b) => a + b, 0)
      return {
        ...poll,
        voteCounts: pVotes,
        totalVotes,
      }
    })
  }
}

export async function fetchPollById(id) {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single()

    if (pollError) throw pollError

    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select('option_id, entry_no')
      .eq('poll_id', id)

    const voteCounts = {}
    let totalVotes = 0
    if (!votesError && votes) {
      for (const v of votes) {
        voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1
        totalVotes++
      }
    }

    return {
      ...poll,
      votes: votes || [],
      voteCounts,
      totalVotes,
    }
  } catch (err) {
    console.warn('Supabase fetchPollById failed, using local fallback:', err)
    const polls = getLocalPolls()
    const poll = polls.find((p) => p.id === id)
    if (!poll) throw new Error('Poll not found')

    const votesRaw = localStorage.getItem('aravali_mock_vote_counts')
    const allTallies = votesRaw ? JSON.parse(votesRaw) : { 'sofa-poll-demo': { 'opt-1': 14, 'opt-2': 28, 'opt-3': 9 } }
    const voteCounts = allTallies[id] || {}
    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)

    return {
      ...poll,
      votes: [],
      voteCounts,
      totalVotes,
    }
  }
}

export async function createPoll({ title, description, options, startImmediately = true, require_entry_no = false }) {
  const pollData = {
    title: title.trim(),
    description: description?.trim() || null,
    status: startImmediately ? 'active' : 'ended',
    options,
    require_entry_no: !!require_entry_no,
  }

  try {
    const { data, error } = await supabase
      .from('polls')
      .insert(pollData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Supabase createPoll failed, saving to local fallback:', err)
    const newPoll = {
      id: 'poll-' + Date.now(),
      created_at: new Date().toISOString(),
      ...pollData,
    }
    const current = getLocalPolls()
    saveLocalPolls([newPoll, ...current])
    return newPoll
  }
}

export async function updatePollStatus(id, newStatus) {
  const patch = {
    status: newStatus,
    ended_at: newStatus === 'ended' ? new Date().toISOString() : null,
  }

  try {
    const { data, error } = await supabase
      .from('polls')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Supabase updatePollStatus failed, updating local fallback:', err)
    const current = getLocalPolls()
    const updated = current.map((p) => (p.id === id ? { ...p, ...patch } : p))
    saveLocalPolls(updated)
    return { id, ...patch }
  }
}

export async function deletePoll(id) {
  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.warn('Supabase deletePoll failed, removing from local fallback:', err)
    const current = getLocalPolls()
    saveLocalPolls(current.filter((p) => p.id !== id))
    return true
  }
}

export async function castVote(pollId, optionId, entryNo = '') {
  const hasEntry = entryNo && entryNo.trim().length > 0
  const cleanEntry = hasEntry
    ? entryNo.trim().toUpperCase()
    : 'anon_' + getOrCreateDeviceId()

  // First check if already voted in localStorage
  const existingLocal = getLocalUserVote(pollId)
  if (existingLocal) {
    const who = existingLocal.entryNo && !existingLocal.entryNo.startsWith('anon_')
      ? `(${existingLocal.entryNo})`
      : 'from this device'
    throw new Error(`You have already voted for this poll ${who}.`)
  }

  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        entry_no: cleanEntry,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          hasEntry
            ? 'This entry number has already voted in this poll.'
            : 'A vote has already been recorded from this browser.'
        )
      }
      throw error
    }

    recordLocalUserVote(pollId, optionId, cleanEntry)
    if (hasEntry) saveEntryNo(cleanEntry)
    return data
  } catch (err) {
    if (err.message?.includes('already voted')) {
      throw err
    }
    console.warn('Supabase castVote failed, falling back to local recording:', err)
    // Update local tallies
    const votesRaw = localStorage.getItem('aravali_mock_vote_counts')
    const allTallies = votesRaw ? JSON.parse(votesRaw) : { 'sofa-poll-demo': { 'opt-1': 14, 'opt-2': 28, 'opt-3': 9 } }
    if (!allTallies[pollId]) allTallies[pollId] = {}
    allTallies[pollId][optionId] = (allTallies[pollId][optionId] || 0) + 1
    localStorage.setItem('aravali_mock_vote_counts', JSON.stringify(allTallies))

    recordLocalUserVote(pollId, optionId, cleanEntry)
    if (hasEntry) saveEntryNo(cleanEntry)
    return { poll_id: pollId, option_id: optionId, entry_no: cleanEntry }
  }
}
