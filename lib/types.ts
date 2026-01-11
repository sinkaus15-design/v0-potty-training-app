export interface Profile {
  id: string
  child_name: string
  child_age: number | null
  caregiver_passcode: string
  total_points: number
  created_at: string
  updated_at: string
}

export interface Child {
  id: string
  user_id: string
  child_name: string
  child_age: number | null
  total_points: number
  created_at: string
  updated_at: string
}

export interface Caregiver {
  id: string
  profile_id: string
  name: string
  email: string | null
  phone: string | null
  receive_notifications: boolean
  push_subscription: object | null
  created_at: string
}

export interface BathroomRequest {
  id: string
  profile_id?: string // Legacy support
  child_id?: string // New multi-child support
  request_type: "pee" | "poop"
  status: "pending" | "completed" | "cancelled"
  points_awarded: number
  completed_by: string | null
  created_at: string
  completed_at: string | null
}

export interface Reward {
  id: string
  profile_id?: string // Legacy support
  child_id?: string // New multi-child support
  name: string
  description: string | null
  points_cost: number
  icon: string
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface RedeemedReward {
  id: string
  profile_id?: string // Legacy support
  child_id?: string // New multi-child support
  reward_id: string
  points_spent: number
  redeemed_at: string
}
