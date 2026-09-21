'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { apiGet } from '../../lib/api'

const JobsContext = createContext({ jobs: [], refreshJobs: () => {} })

export function JobsProvider({ children }) {
  const [jobs, setJobs] = useState([])

  const refreshJobs = useCallback(async () => {
    const res = await apiGet('/api/jobs')
    if (!res.error) setJobs(res.jobs || [])
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
  useEffect(() => { refreshJobs() }, [refreshJobs])

  return (
    <JobsContext.Provider value={{ jobs, refreshJobs }}>
      {children}
    </JobsContext.Provider>
  )
}

export function useJobsContext() {
  return useContext(JobsContext)
}
