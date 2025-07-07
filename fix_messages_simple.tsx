// Simple fix for message queries
// Apply these changes to app/dashboard/messages/page.tsx

// 1. Replace the fetchAllMessages query with this:
const { data: messages, error } = await supabase
    .from('messages')
    .select(`
        *,
        attachments:message_attachments(*)
    `)
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order('created_at', { ascending: true });

// 2. Replace the handleSendMessage query with this:
const { data: newMessage, error } = await supabase
    .from('messages')
    .insert({
        sender_id: currentUserId,
        receiver_id: selectedConversation,
        content: messageInput.trim(),
        read: false
    })
    .select('*')
    .single();

// 3. Replace the completeMessage query with this:
const { data: completeMessage, error: fetchError } = await supabase
    .from('messages')
    .select(`
        *,
        attachments:message_attachments(*)
    `)
    .eq('id', newMessage.id)
    .single();

// 4. Remove all other profile queries for now - use usernames from metadata 