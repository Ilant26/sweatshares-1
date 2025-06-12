import { supabase } from '../lib/supabase'

async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
        console.error('❌ Authentication error:', error.message)
        return
    }

    if (!user) {
        console.log('❌ Not authenticated. Please log in first.')
        return
    }

    console.log('✅ Authenticated as:', user.email)
    console.log('User ID:', user.id)
}

checkAuth().catch(console.error) 