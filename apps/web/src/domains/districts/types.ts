export type District = {
  id: number
  name: string
  adminOkrug: string | null
}

export type DistrictSummary = {
  totalListings: number
  avgPricePerSqm: number | null
  minPricePerSqm: number | null
  maxPricePerSqm: number | null
}

export type RoomStat = {
  rooms: number
  listings: number
  avgPricePerSqm: number | null
  minPricePerSqm: number | null
  maxPricePerSqm: number | null
}

export type ListingStat = {
  id: number
  url: string
  price: number
  rooms: number
  floor: number
  pricePerSqm: number
  area: number | null
  kitchenArea: number | null
  address: string
  street: string
  house: string
  timeSourceUpdated: string | null
  sourceId: number | null
  sourceName: string | null
}

export type DistrictStatsResponse = {
  district: District
  summary: DistrictSummary
  roomStats: RoomStat[]
  cheapestListings: ListingStat[]
  averageListings: ListingStat[]
}
