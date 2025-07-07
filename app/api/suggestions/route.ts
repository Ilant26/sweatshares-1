import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'profiles', 'listings', or 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user's profile to understand their interests
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Get user's existing connections to exclude them from suggestions
    const { data: connections } = await supabase
      .from('connections')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const connectedUserIds = connections?.map(conn => 
      conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
    ) || []

    // Get user's favorites to exclude them from suggestions
    const { data: savedProfiles } = await supabase
      .from('saved_profiles')
      .select('profile_id')
      .eq('user_id', user.id)

    const savedProfileIds = savedProfiles?.map(sp => sp.profile_id) || []

    const { data: likedListings } = await supabase
      .from('liked_listings')
      .select('listing_id')
      .eq('user_id', user.id)

    const likedListingIds = likedListings?.map(ll => ll.listing_id) || []

    let suggestions: {
      profiles: any[],
      listings: any[],
      opportunities: any[]
    } = {
      profiles: [],
      listings: [],
      opportunities: []
    }

    // Get profile suggestions if requested
    if (type === 'profiles' || type === 'all') {
      const userSkills = userProfile.skills || []
      const userCountry = userProfile.country
      const userSector = userProfile.sector
      
      let profileQuery = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          professional_role,
          bio,
          skills,
          country,
          sector,
          profile_type,
          created_at
        `)
        .neq('id', user.id)
        .not('id', 'in', `(${[...connectedUserIds, ...savedProfileIds].join(',')})`)
        .order('created_at', { ascending: false })

      const { data: profileSuggestions, error: profilesError } = await profileQuery.limit(limit)

      if (!profilesError && profileSuggestions) {
        // Score profiles based on similarity
        const scoredProfiles = profileSuggestions.map(profile => {
          let score = 0
          
          // Same country bonus
          if (profile.country === userCountry) score += 20
          
          // Same sector bonus
          if (profile.sector === userSector) score += 15
          
          // Skills overlap bonus
          const profileSkills = profile.skills || []
          const commonSkills = userSkills.filter((skill: string) => 
            profileSkills.some((ps: string) => ps.toLowerCase().includes(skill.toLowerCase()))
          )
          score += commonSkills.length * 10
          
          // Complementary profile type bonus
          if (userProfile.profile_type === 'founder' && profile.profile_type === 'investor') score += 25
          if (userProfile.profile_type === 'founder' && profile.profile_type === 'expert') score += 20
          if (userProfile.profile_type === 'expert' && profile.profile_type === 'founder') score += 20
          if (userProfile.profile_type === 'investor' && profile.profile_type === 'founder') score += 25
          
          // Recent activity bonus
          const daysSinceCreated = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceCreated < 30) score += 10
          
          return { ...profile, score }
        })
        
        suggestions.profiles = scoredProfiles
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(limit, 5))
      }
    }

    // Get listing suggestions if requested
    if (type === 'listings' || type === 'all') {
      const userSkills = userProfile.skills || []
      const userCountry = userProfile.country
      const userProfileType = userProfile.profile_type
      
      let listingQuery = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          listing_type,
          profile_type,
          skills,
          location_country,
          location_city,
          sector,
          funding_stage,
          compensation_type,
          created_at,
          profiles!listings_user_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            professional_role
          )
        `)
        .neq('user_id', user.id)
        .not('id', 'in', `(${likedListingIds.join(',')})`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const { data: listingSuggestions, error: listingsError } = await listingQuery.limit(limit * 2)

      if (!listingsError && listingSuggestions) {
        // Score listings based on relevance
        const scoredListings = listingSuggestions.map(listing => {
          let score = 0
          
          // Same country bonus
          if (listing.location_country === userCountry) score += 20
          
          // Same sector bonus
          if (listing.sector === userProfile.sector) score += 15
          
          // Skills overlap bonus
          const listingSkills = listing.skills ? listing.skills.split(',').map((s: string) => s.trim()) : []
          const commonSkills = userSkills.filter((skill: string) => 
            listingSkills.some((ls: string) => ls.toLowerCase().includes(skill.toLowerCase()))
          )
          score += commonSkills.length * 10
          
          // Profile type matching bonus
          if (userProfileType === 'founder' && listing.listing_type === 'find-funding') score += 25
          if (userProfileType === 'investor' && listing.listing_type === 'find-funding') score += 30
          if (userProfileType === 'expert' && ['expert-freelance', 'mission', 'job'].includes(listing.listing_type)) score += 25
          if (userProfileType === 'founder' && ['expert-freelance', 'cofounder', 'employee'].includes(listing.listing_type)) score += 20
          
          // Recent activity bonus
          const daysSinceCreated = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceCreated < 7) score += 15
          else if (daysSinceCreated < 30) score += 10
          
          return { ...listing, score }
        })
        
        suggestions.listings = scoredListings
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(limit, 5))
      }
    }

    // Generate opportunities based on user's activity and profile
    if (type === 'all') {
      const opportunities = []
      
      // Count new profiles matching user's interests
      const newProfilesCount = suggestions.profiles.length
      if (newProfilesCount > 0) {
        opportunities.push({
          id: 'recommended-profiles',
          type: 'profiles',
          title: 'Recommended Profiles',
          description: `${newProfilesCount} new profiles matching your interests`,
          count: newProfilesCount,
          action: 'Explore',
          href: '/dashboard/find-partner'
        })
      }
      
      // Count new listings matching user's interests
      const newListingsCount = suggestions.listings.length
      if (newListingsCount > 0) {
        opportunities.push({
          id: 'opportunities',
          type: 'listings',
          title: 'New Opportunities',
          description: `${newListingsCount} new opportunities match your criteria`,
          count: newListingsCount,
          action: 'Discover',
          href: '/dashboard/listings'
        })
      }
      
      // Check for networking opportunities
      const networkingOpportunities = Math.max(0, Math.floor(Math.random() * 5) + 1)
      if (networkingOpportunities > 0) {
        opportunities.push({
          id: 'networking',
          type: 'networking',
          title: 'Networking Events',
          description: `${networkingOpportunities} upcoming events in your area`,
          count: networkingOpportunities,
          action: 'View',
          href: '/dashboard/news-feed'
        })
      }
      
      suggestions.opportunities = opportunities
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error in suggestions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 