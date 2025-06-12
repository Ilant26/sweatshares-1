import { supabase } from '../lib/supabase'
import { sendFriendRequest, acceptFriendRequest, getFriends, getPendingFriendRequests } from '../lib/friends'
import { sendMessage, getMessages, subscribeToMessages } from '../lib/messages'

async function testFriendSystem() {
    console.log('🧪 Testing Friend System...')

    // 1. Test sending friend request
    try {
        console.log('\n1. Testing friend request...')
        const friendRequest = await sendFriendRequest('test-friend-id')
        console.log('✅ Friend request sent successfully:', friendRequest)
    } catch (error) {
        console.error('❌ Error sending friend request:', error)
    }

    // 2. Test getting pending requests
    try {
        console.log('\n2. Testing get pending requests...')
        const pendingRequests = await getPendingFriendRequests()
        console.log('✅ Pending requests retrieved:', pendingRequests)
    } catch (error) {
        console.error('❌ Error getting pending requests:', error)
    }

    // 3. Test accepting friend request
    try {
        console.log('\n3. Testing accept friend request...')
        const acceptedRequest = await acceptFriendRequest('test-friendship-id')
        console.log('✅ Friend request accepted:', acceptedRequest)
    } catch (error) {
        console.error('❌ Error accepting friend request:', error)
    }

    // 4. Test getting friends list
    try {
        console.log('\n4. Testing get friends list...')
        const friends = await getFriends()
        console.log('✅ Friends list retrieved:', friends)
    } catch (error) {
        console.error('❌ Error getting friends list:', error)
    }
}

async function testMessagingSystem() {
    console.log('\n🧪 Testing Messaging System...')

    // 1. Test sending message
    try {
        console.log('\n1. Testing send message...')
        const message = await sendMessage('test-receiver-id', 'Hello, this is a test message!')
        console.log('✅ Message sent successfully:', message)
    } catch (error) {
        console.error('❌ Error sending message:', error)
    }

    // 2. Test getting messages
    try {
        console.log('\n2. Testing get messages...')
        const messages = await getMessages('test-user-id')
        console.log('✅ Messages retrieved:', messages)
    } catch (error) {
        console.error('❌ Error getting messages:', error)
    }

    // 3. Test real-time subscription
    try {
        console.log('\n3. Testing real-time subscription...')
        const subscription = subscribeToMessages((message) => {
            console.log('✅ New message received:', message)
        })
        console.log('✅ Real-time subscription set up successfully')
        
        // Clean up subscription after 5 seconds
        setTimeout(() => {
            subscription.unsubscribe()
            console.log('✅ Real-time subscription cleaned up')
        }, 5000)
    } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error)
    }
}

async function runTests() {
    console.log('🚀 Starting tests...\n')

    // First, ensure we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('❌ Authentication error:', authError)
        return
    }
    console.log('✅ Authenticated as:', user.email)

    // Run the tests
    await testFriendSystem()
    await testMessagingSystem()

    console.log('\n✨ Tests completed!')
}

// Run the tests
runTests().catch(console.error) 