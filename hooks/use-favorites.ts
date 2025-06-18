import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from './use-user'
import { Database } from '@/lib/database.types'

type SavedProfile = Database['public']['Tables']['saved_profiles']['Row'] & {
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    professional_role: string | null
    bio: string | null
    country: string | null
    skills: string[] | null
  }
}

type LikedListing = Database['public']['Tables']['liked_listings']['Row'] & {
  listing: {
    id: string
    title: string
    description: string
    listing_type: string
    location_city: string | null
    location_country: string
    sector: string | null
    funding_stage: string | null
    compensation_type: string | null
    compensation_value: any
    amount: string | null
    created_at: string
    user_id: string
  }
  listing_profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    professional_role: string | null
  }
}

export function useFavorites() {
  const { user } = useUser()
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])
  const [likedListings, setLikedListings] = useState<LikedListing[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch saved profiles with separate query to avoid relationship ambiguity
      const { data: savedProfilesData, error: savedProfilesError } = await supabase
        .from('saved_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (savedProfilesError) throw savedProfilesError

      // Fetch profile details for saved profiles
      const savedProfilesWithDetails = await Promise.all(
        (savedProfilesData || []).map(async (saved) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, professional_role, bio, country, skills')
            .eq('id', saved.profile_id)
            .single()

          if (profileError) throw profileError

          return {
            ...saved,
            profile: profileData
          }
        })
      )

      // Fetch liked listings with separate query to avoid relationship ambiguity
      const { data: likedListingsData, error: likedListingsError } = await supabase
        .from('liked_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (likedListingsError) throw likedListingsError

      // Fetch listing and profile details for liked listings
      const likedListingsWithDetails = await Promise.all(
        (likedListingsData || []).map(async (liked) => {
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('id, title, description, listing_type, location_city, location_country, sector, funding_stage, compensation_type, compensation_value, amount, created_at, user_id')
            .eq('id', liked.listing_id)
            .single()

          if (listingError) throw listingError

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, professional_role')
            .eq('id', listingData.user_id)
            .single()

          if (profileError) throw profileError

          return {
            ...liked,
            listing: listingData,
            listing_profile: profileData
          }
        })
      )

      setSavedProfiles(savedProfilesWithDetails)
      setLikedListings(likedListingsWithDetails)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const saveProfile = async (profileId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_profiles')
        .insert({
          user_id: user.id,
          profile_id: profileId
        })

      if (error) throw error

      // Refresh favorites
      await fetchFavorites()
    } catch (error) {
      console.error('Error saving profile:', error)
      throw error
    }
  }

  const unsaveProfile = async (profileId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('profile_id', profileId)

      if (error) throw error

      // Refresh favorites
      await fetchFavorites()
    } catch (error) {
      console.error('Error unsaving profile:', error)
      throw error
    }
  }

  const likeListing = async (listingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('liked_listings')
        .insert({
          user_id: user.id,
          listing_id: listingId
        })

      if (error) throw error

      // Refresh favorites
      await fetchFavorites()
    } catch (error) {
      console.error('Error liking listing:', error)
      throw error
    }
  }

  const unlikeListing = async (listingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('liked_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (error) throw error

      // Refresh favorites
      await fetchFavorites()
    } catch (error) {
      console.error('Error unliking listing:', error)
      throw error
    }
  }

  const isProfileSaved = (profileId: string) => {
    return savedProfiles.some(saved => saved.profile_id === profileId)
  }

  const isListingLiked = (listingId: string) => {
    return likedListings.some(liked => liked.listing_id === listingId)
  }

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    savedProfiles,
    likedListings,
    loading,
    saveProfile,
    unsaveProfile,
    likeListing,
    unlikeListing,
    isProfileSaved,
    isListingLiked,
    refreshFavorites: fetchFavorites
  }
} 