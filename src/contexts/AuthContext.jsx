import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      setLoading(true)

      // Fetch from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setLoading(false)
        return
      }

      if (data) {
        // Profile exists in database
        setProfile(data)
        localStorage.setItem('userProfile', JSON.stringify(data))
        setLoading(false)
      } else {
        // No profile exists, try to create one
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser?.user_metadata) {
          const newProfile = {
            id: userId,
            email: authUser.email,
            full_name: authUser.user_metadata.full_name || authUser.email?.split('@')[0],
            role: authUser.user_metadata.role || 'buyer',
          }

          // Try to insert, if it fails due to duplicate, fetch existing
          const { data: insertedProfile, error: insertError } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single()

          if (insertError) {
            if (insertError.code === '23505') {
              // Duplicate - fetch by id instead
              const { data: existingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

              if (existingProfile) {
                setProfile(existingProfile)
                localStorage.setItem('userProfile', JSON.stringify(existingProfile))
              }
            } else {
              console.error('Error creating profile:', insertError)
            }
          } else if (insertedProfile) {
            setProfile(insertedProfile)
            localStorage.setItem('userProfile', JSON.stringify(insertedProfile))
          }
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        localStorage.removeItem('userProfile')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = useCallback(async (email, password, fullName, role = 'buyer') => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      // Try to create profile, handle duplicates gracefully
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: role,
          },
        ])
        .select()
        .single()

      if (profileError) {
        if (profileError.code === '23505') {
          // Profile already exists (duplicate email or id)
          console.log('Profile already exists, fetching existing profile')
          // Fetch the existing profile
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (existingProfile) {
            setProfile(existingProfile)
            localStorage.setItem('userProfile', JSON.stringify(existingProfile))
            toast.success('Account created successfully!')
            return { data: authData, error: null }
          }
        }
        console.error('Profile creation error:', profileError)
        toast.error('Account created but profile setup incomplete')
      } else {
        setProfile(profileData)
        localStorage.setItem('userProfile', JSON.stringify(profileData))
        toast.success('Account created successfully!')
      }

      return { data: authData, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to create account')
      return { data: null, error }
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Profile will be fetched automatically by onAuthStateChange
      toast.success('Signed in successfully!')

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      return { data: null, error }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Clear all local storage first
      localStorage.clear()
      sessionStorage.clear()

      // Clear state
      setProfile(null)
      setUser(null)

      // Sign out from Supabase with global scope to clear all sessions
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.warn('Sign out warning:', error)
      }

      toast.success('Signed out successfully')

      // Force navigation and reload
      window.location.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Ensure cleanup even on error
      localStorage.clear()
      sessionStorage.clear()
      setProfile(null)
      setUser(null)
      toast.success('Signed out successfully')
      window.location.replace('/')
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      localStorage.setItem('userProfile', JSON.stringify(data))
      toast.success('Profile updated successfully')

      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return { data: null, error }
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      isAdmin: profile?.role === 'admin',
      isSeller: profile?.role === 'seller' || profile?.role === 'admin',
      isBuyer: profile?.role === 'buyer' || profile?.role === 'admin',
      role: profile?.role || 'buyer',
      canManageUsers: profile?.role === 'admin',
      canManageProducts: profile?.role === 'admin',
      canViewAnalytics: profile?.role === 'admin',
      canManageSettings: profile?.role === 'admin',
    }),
    [user, profile, loading, signUp, signIn, signOut, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
