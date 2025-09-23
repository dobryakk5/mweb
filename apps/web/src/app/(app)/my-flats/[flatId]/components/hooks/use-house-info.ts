import { useState, useEffect } from 'react'

interface HouseInfo {
  house_id: number
  address: string
  house_type: string
  house_type_id: number | null
}

interface UseHouseInfoOptions {
  houseId: number | null
  enabled?: boolean
}

interface UseHouseInfoReturn {
  houseInfo: HouseInfo | null
  loading: boolean
  error: string | null
}

export const useHouseInfo = ({
  houseId,
  enabled = true,
}: UseHouseInfoOptions): UseHouseInfoReturn => {
  const [houseInfo, setHouseInfo] = useState<HouseInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !houseId) {
      setHouseInfo(null)
      setError(null)
      setLoading(false)
      return
    }

    const fetchHouseInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/map/house-info/${houseId}`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setHouseInfo(data)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch house info'
        setError(errorMessage)
        console.error('Error fetching house info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHouseInfo()
  }, [houseId, enabled])

  return {
    houseInfo,
    loading,
    error,
  }
}

export type { HouseInfo, UseHouseInfoOptions, UseHouseInfoReturn }
