import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from './use-user'
import { Database } from '@/lib/database.types'

type PostComment = {
  id: string
  content: string
  created_at: string
  author: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

type Post = Database['public']['Tables']['posts']['Row'] & {
  author: {
    id: string
    full_name: string | null
    avatar_url: string | null
    professional_role: string | null
  }
  likes_count: number
  comments_count: number
  has_liked: boolean
  has_saved: boolean
  comments: PostComment[]
}

export function usePosts() {
  const { user } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey (
            id,
            full_name,
            avatar_url,
            professional_role
          ),
          likes_count:post_likes(count),
          comments:comments(
            id,
            content,
            created_at,
            author:profiles!comments_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Get likes and saves for current user
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)

        const { data: savesData } = await supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id)

        const likedPostIds = new Set(likesData?.map(like => like.post_id))
        const savedPostIds = new Set(savesData?.map(save => save.post_id))

        const postsWithMetadata = postsData?.map(post => ({
          ...post,
          likes_count: post.likes_count?.[0]?.count || 0,
          comments_count: post.comments?.length || 0,
          has_liked: likedPostIds.has(post.id),
          has_saved: savedPostIds.has(post.id),
          comments: post.comments || []
        }))

        setPosts(postsWithMetadata || [])
      } else {
        const postsWithMetadata = postsData?.map(post => ({
          ...post,
          likes_count: post.likes_count?.[0]?.count || 0,
          comments_count: post.comments?.length || 0,
          has_liked: false,
          has_saved: false,
          comments: post.comments || []
        }))

        setPosts(postsWithMetadata || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createPost = async (content: string, media_urls: string[] = [], tags: string[] = []) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_urls,
          tags
        })
        .select()
        .single()

      if (error) throw error

      await fetchPosts()
      return data
    } catch (error) {
      console.error('Error creating post:', error)
      return null
    }
  }

  const likePost = async (postId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (error) throw error

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count + 1, has_liked: true }
            : post
        )
      )
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const unlikePost = async (postId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count - 1, has_liked: false }
            : post
        )
      )
    } catch (error) {
      console.error('Error unliking post:', error)
    }
  }

  const savePost = async (postId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_posts')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (error) throw error

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, has_saved: true }
            : post
        )
      )
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const unsavePost = async (postId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, has_saved: false }
            : post
        )
      )
    } catch (error) {
      console.error('Error unsaving post:', error)
    }
  }

  const addComment = async (postId: string, content: string) => {
    if (!user) return null

    try {
      type CommentResponse = {
        id: string
        content: string
        created_at: string
        author: {
          id: string
          full_name: string | null
          avatar_url: string | null
        }
      }

      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        })
        .select(`
          id,
          content,
          created_at,
          author:profiles!comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single<CommentResponse>()

      if (error) throw error

      const newComment: PostComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        author: {
          id: commentData.author.id,
          full_name: commentData.author.full_name,
          avatar_url: commentData.author.avatar_url
        }
      }

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, newComment],
                comments_count: post.comments_count + 1
              }
            : post
        )
      )

      return newComment
    } catch (error) {
      console.error('Error adding comment:', error)
      return null
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    createPost,
    likePost,
    unlikePost,
    savePost,
    unsavePost,
    addComment
  }
} 